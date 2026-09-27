const firebaseService = require('../server/firebaseService.cjs');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { date, view } = req.query;
    const stats = await firebaseService.getStats({ date, view });
    return res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error('stats error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
