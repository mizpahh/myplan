import { put, head, get } from '@vercel/blob';

const BLOB_KEY = 'myplan-tasks.json';

async function readTasks() {
  try {
    const existing = await head(BLOB_KEY).catch(() => null);
    if (!existing) return [];
    const res = await fetch(existing.url);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeTasks(tasks) {
  await put(BLOB_KEY, JSON.stringify(tasks), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const tasks = await readTasks();
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const tasks = await readTasks();
    const task = { id: Date.now().toString(), ...req.body };
    tasks.push(task);
    await writeTasks(tasks);
    return res.status(201).json(task);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    let tasks = await readTasks();
    tasks = tasks.filter(t => t.id !== id);
    await writeTasks(tasks);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
