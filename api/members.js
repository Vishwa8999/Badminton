const firebaseService = require('../server/firebaseService.cjs');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET /api/members
    if (req.method === 'GET') {
      const members = await firebaseService.getMembers();
      return res.status(200).json({ success: true, members });
    }

    // POST /api/members  — body: { name } or { playerNames, sync: true }
    if (req.method === 'POST') {
      const body = req.body || {};

      // Sync multiple players
      if (body.sync && Array.isArray(body.playerNames)) {
        const members = await firebaseService.syncMembers(body.playerNames);
        return res.status(200).json({ success: true, members });
      }

      // Add single member
      if (body.name) {
        const member = await firebaseService.addMember(body.name);
        return res.status(200).json({ success: true, member });
      }

      return res.status(400).json({ error: 'Missing name or playerNames' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('members error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
