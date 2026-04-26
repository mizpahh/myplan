const GH_TOKEN = process.env.GH_TOKEN;
const GIST_ID = process.env.EVENTS_GIST_ID;
const FILENAME = 'events.json';

async function readEvents() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  const data = await res.json();
  return JSON.parse(data.files[FILENAME].content || '[]');
}

async function writeEvents(events) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: { Authorization: `token ${GH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [FILENAME]: { content: JSON.stringify(events) } } }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await readEvents());
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const events = await readEvents();
      const event = { id: Date.now().toString(), ...body, g: 0, al: body.al ?? 0, cal: body.cal || 'user' };
      events.push(event);
      await writeEvents(events);
      return res.status(201).json(event);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const events = (await readEvents()).filter(e => e.id !== id);
      await writeEvents(events);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
