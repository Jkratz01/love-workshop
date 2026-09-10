import { list, put, del } from '@vercel/blob';

const TOKEN = () => process.env.BLOB_MEDIA_TOKEN;

export const DEFAULT_CONFIG = {
  activeId: 'love-workshop',
  albums: [
    {
      id: 'love-workshop',
      title: 'Love Workshop',
      artist: 'Tim and Ari',
      byline: 'by Tim and Ari',
      bio: 'Timothy Hintz aka OTT and Ari Perlman aka LoBo_301, Came together to create this incredible jazz filled hip hop album. No samples outside of the album were used. This entire album is made from scratch with the help of artists such as OneTakeTimmy, Bomani X, Pat Dimitri, Popafidi, and LoBo_301.',
      credits: ['OneTakeTimmy', 'Bomani X', 'Pat Dimitri', 'Popafidi', 'LoBo_301'],
      coverCredit: 'Album Cover Created by Mo Runda',
      cover: '/cover.jpg',
      zip: '/download/love-workshop.zip',
      tracks: [
        { title: 'Love Workshop (Intro)', sub: 'Intro', slug: 'love-workshop-intro', src: '/audio/love-workshop-intro.m4a', dur: 79 },
        { title: 'Phone', slug: 'phone', src: '/audio/phone.m4a', dur: 230 },
        { title: 'Broken Record', slug: 'broken-record', src: '/audio/broken-record.m4a', dur: 256 },
        { title: 'She A Dime', slug: 'she-a-dime', src: '/audio/she-a-dime.m4a', dur: 259 },
        { title: 'Cook So Well (Interlude)', sub: 'Interlude', slug: 'cook-so-well-interlude', src: '/audio/cook-so-well-interlude.m4a', dur: 130 },
        { title: 'Undercover Lover', slug: 'undercover-lover', src: '/audio/undercover-lover.m4a', dur: 197 },
        { title: 'Barely Lovin (Thought It Was)', slug: 'barely-lovin-thought-it-was', src: '/audio/barely-lovin-thought-it-was.m4a', dur: 238 },
        { title: 'Miss You Anymore', slug: 'miss-you-anymore', src: '/audio/miss-you-anymore.m4a', dur: 221 },
        { title: "All's Fair", slug: 'alls-fair', src: '/audio/alls-fair.m4a', dur: 278 },
      ],
    },
  ],
};

export async function readConfig() {
  const r = await list({ prefix: 'config/albums-', limit: 1000, token: TOKEN() });
  if (!r.blobs.length) return DEFAULT_CONFIG;
  const latest = r.blobs.reduce((a, b) => (a.pathname > b.pathname ? a : b));
  const res = await fetch(latest.url, { cache: 'no-store' });
  if (!res.ok) throw new Error('config fetch failed: ' + res.status);
  return res.json();
}

export async function writeConfig(config) {
  const path = `config/albums-${String(Date.now()).padStart(15, '0')}.json`;
  await put(path, JSON.stringify(config), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: TOKEN(),
  });
  try {
    const r = await list({ prefix: 'config/albums-', limit: 1000, token: TOKEN() });
    const sorted = r.blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const stale = sorted.slice(8).map((b) => b.url);
    if (stale.length) await del(stale, { token: TOKEN() });
  } catch {}
}
