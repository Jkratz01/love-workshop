import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const key = (req.query && req.query.key) || req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    let cursor;
    const paths = [];
    do {
      const r = await list({ prefix: 'events/', cursor, limit: 1000 });
      for (const b of r.blobs) paths.push(b.pathname);
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);

    const totals = { visit: 0, play: 0, download: 0, donate: 0 };
    const tracks = {};
    const donate = {};
    const days = {};
    for (const p of paths) {
      const parts = p.split('/');
      if (parts.length < 3) continue;
      const day = parts[1];
      const [type, detail] = parts[2].split('__');
      if (!(type in totals)) continue;
      totals[type]++;
      if (!days[day]) days[day] = { visit: 0, play: 0, download: 0, donate: 0, tracks: {}, donateDetail: {} };
      days[day][type]++;
      if (type === 'play') {
        tracks[detail] = (tracks[detail] || 0) + 1;
        days[day].tracks[detail] = (days[day].tracks[detail] || 0) + 1;
      }
      if (type === 'donate') {
        donate[detail] = (donate[detail] || 0) + 1;
        days[day].donateDetail[detail] = (days[day].donateDetail[detail] || 0) + 1;
      }
    }
    res.setHeader('cache-control', 'no-store');
    res.status(200).json({ totals, tracks, donate, days, events: paths.length, since: '2026-09-10' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
