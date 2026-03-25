/**
 * POST /api/join-game
 * Body: { invite_code: string }
 * Auth: Bearer <supabase-access-token>
 *
 * Returns: { game }
 */
const sb = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await sb.from('users').select('id').eq('auth_id', user.id).single();
  if (!profile) return res.status(400).json({ error: 'Profile not found' });

  const code = (req.body?.invite_code || '').toLowerCase().trim();
  if (!code) return res.status(400).json({ error: 'invite_code is required' });

  // Find game
  const { data: game } = await sb.from('games')
    .select('*').eq('invite_code', code).single();

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'waiting') return res.status(409).json({ error: 'Game is not open for joining' });

  // Don't let the creator join as opponent
  if (game.white_player_id === profile.id || game.black_player_id === profile.id) {
    return res.status(409).json({ error: 'You are already in this game' });
  }

  const updateObj = {};
  if (!game.white_player_id) updateObj.white_player_id = profile.id;
  else if (!game.black_player_id) updateObj.black_player_id = profile.id;
  else return res.status(409).json({ error: 'Game is full' });

  updateObj.status = 'active';

  const { data: updated, error: upErr } = await sb.from('games')
    .update(updateObj).eq('id', game.id).select().single();

  if (upErr) return res.status(500).json({ error: upErr.message });

  return res.status(200).json({ game: updated });
};
