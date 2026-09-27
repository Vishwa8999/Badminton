const firebaseService = require('../../server/firebaseService.cjs');

// Handles: DELETE /api/members/[id]
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing member id' });
    const result = await firebaseService.deleteMember(id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('delete member error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
