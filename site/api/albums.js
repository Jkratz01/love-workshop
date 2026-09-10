import { readConfig, writeConfig } from './_config.js';

function bad(res, msg) {
  res.status(400).json({ error: msg });
}

export default async function handler(req, res) {
  const key = (req.query && req.query.key) || req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.setHeader('cache-control', 'no-store');
  try {
    if (req.method === 'GET') {
      res.status(200).json(await readConfig());
      return;
    }
    if (req.method === 'POST') {
      const cfg = req.body;
      if (!cfg || typeof cfg !== 'object') return bad(res, 'no config');
      if (!Array.isArray(cfg.albums) || !cfg.albums.length) return bad(res, 'albums required');
      if (cfg.albums.length > 50) return bad(res, 'too many albums');
      for (const a of cfg.albums) {
        if (!a.id || typeof a.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(a.id)) return bad(res, 'bad album id');
        if (typeof a.title !== 'string' || !a.title.trim() || a.title.length > 120) return bad(res, 'bad album title');
        if (!Array.isArray(a.tracks) || a.tracks.length > 100) return bad(res, 'bad tracks');
        for (const t of a.tracks) {
          if (typeof t.title !== 'string' || !t.title.trim() || t.title.length > 120) return bad(res, 'bad track title');
          if (typeof t.src !== 'string' || t.src.length > 500) return bad(res, 'bad track src');
          if (!(t.src.startsWith('/') || t.src.startsWith('https://'))) return bad(res, 'bad track src url');
        }
      }
      const ids = cfg.albums.map((a) => a.id);
      if (new Set(ids).size !== ids.length) return bad(res, 'duplicate album ids');
      if (!ids.includes(cfg.activeId)) return bad(res, 'activeId must be an existing album');
      await writeConfig({ activeId: cfg.activeId, albums: cfg.albums });
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
