import { put, list } from '@vercel/blob';

const PATHNAME = 'myplan-tasks.json';

async function readTasks() {
  try {
    const { blobs } = await list({ prefix: PATHNAME });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    console.error('readTasks error:', e);
    return [];
  }
}

async function writeTasks(tasks) {
  await put(PATHNAME, JSON.stringify(tasks), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await readTasks());
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const tasks = await readTasks();
      const task = { id: Date.now().toString(), ...body };
      tasks.push(task);
      await writeTasks(tasks);
      return res.status(201).json(task);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const tasks = (await readTasks()).filter(t => t.id !== id);
      await writeTasks(tasks);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('handler error:', err);
    res.status(500).json({ error: err.message, name: err.name });
  }
}
