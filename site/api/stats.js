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

    const stats = {
      totals: { visit: 0, play: 0, download: 0, donate: 0 },
      tracks: {},
      donate: {},
      daily: {},
      events: paths.length,
    };
    for (const p of paths) {
      const parts = p.split('/');
      if (parts.length < 3) continue;
      const day = parts[1];
      const [type, detail] = parts[2].split('__');
      if (!(type in stats.totals)) continue;
      stats.totals[type]++;
      if (!stats.daily[day]) stats.daily[day] = { visit: 0, play: 0, download: 0, donate: 0 };
      stats.daily[day][type]++;
      if (type === 'play') stats.tracks[detail] = (stats.tracks[detail] || 0) + 1;
      if (type === 'donate') stats.donate[detail] = (stats.donate[detail] || 0) + 1;
    }
    res.setHeader('cache-control', 'no-store');
    res.status(200).json(stats);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
