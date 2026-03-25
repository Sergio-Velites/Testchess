/**
 * POST /api/create-game
 * Body: { color: 'white' | 'black' | 'random' }
 * Auth: Bearer <supabase-access-token>
 *
 * Returns: { game }
 */
const sb = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Authenticate caller
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // Fetch profile
  const { data: profile } = await sb.from('users').select('id').eq('auth_id', user.id).single();
  if (!profile) return res.status(400).json({ error: 'Profile not found — create one first' });

  const color = req.body?.color || 'random';
  const coin  = Math.random() < 0.5;

  let whiteId = null, blackId = null;
  if (color === 'white' || (color === 'random' && coin)) whiteId = profile.id;
  else blackId = profile.id;

  const { data: game, error } = await sb.from('games')
    .insert({ white_player_id: whiteId, black_player_id: blackId, status: 'waiting' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ game });
};
