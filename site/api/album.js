import { readConfig, DEFAULT_CONFIG } from './_config.js';

export default async function handler(req, res) {
  try {
    const cfg = await readConfig();
    const album =
      (cfg.albums || []).find((a) => a.id === cfg.activeId) ||
      (cfg.albums || [])[0] ||
      DEFAULT_CONFIG.albums[0];
    res.setHeader('cache-control', 'no-store');
    res.status(200).json(album);
  } catch (e) {
    res.setHeader('cache-control', 'no-store');
    res.status(200).json(DEFAULT_CONFIG.albums[0]);
  }
}
