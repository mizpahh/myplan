const GH_TOKEN = process.env.GH_TOKEN;
const GIST_ID = process.env.TASKS_GIST_ID;
const FILENAME = 'tasks.json';

async function readTasks() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  const data = await res.json();
  return JSON.parse(data.files[FILENAME].content || '[]');
}

async function writeTasks(tasks) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: { Authorization: `token ${GH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [FILENAME]: { content: JSON.stringify(tasks) } } }),
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
    res.status(500).json({ error: err.message });
  }
}
