import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      token: process.env.BLOB_MEDIA_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let key = '';
        try {
          key = JSON.parse(clientPayload || '{}').key || '';
        } catch {}
        if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
          throw new Error('unauthorized');
        }
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac',
            'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/flac', 'audio/ogg', 'audio/webm',
            'image/jpeg', 'image/png', 'image/webp',
          ],
          maximumSizeInBytes: 300 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: '',
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(jsonResponse);
  } catch (e) {
    res.status(400).json({ error: String((e && e.message) || e) });
  }
}
