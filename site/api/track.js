import { put } from '@vercel/blob';

const TYPES = ['visit', 'play', 'download', 'donate'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const { type, detail } = req.body || {};
    if (!TYPES.includes(type)) {
      res.status(400).json({ error: 'bad type' });
      return;
    }
    const d = String(detail || 'none').toLowerCase().replace(/[^a-z0-9$-]/g, '').slice(0, 40) || 'none';
    const now = new Date();
    const day = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const path = `events/${day}/${type}__${d}__${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const opts = { addRandomSuffix: false, contentType: 'text/plain' };
    try {
      await put(path, '1', { ...opts, access: 'public' });
    } catch {
      await put(path, '1', { ...opts, access: 'private' });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
