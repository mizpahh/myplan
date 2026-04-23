import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const { blobs } = await list({ prefix: 'myplan-tasks.json' });
    const putResult = await put('myplan-debug.json', JSON.stringify({ ok: true, ts: Date.now() }), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    res.json({ tokenExists: !!token, tokenPrefix: token?.slice(0, 20), blobs: blobs.length, putUrl: putResult.url });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
