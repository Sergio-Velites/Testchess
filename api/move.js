/**
 * POST /api/move
 * Body: { game_id, move_san, move_uci, fen_after, status }
 * Auth: Bearer <supabase-access-token>
 *
 * Validates it's the correct player's turn,
 * persists the move, updates game state.
 *
 * Returns: { move, game }
 */
const sb = require('./_supabase');

const VALID_STATUSES = ['active','check','checkmate','draw'];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await sb.from('users').select('id').eq('auth_id', user.id).single();
  if (!profile) return res.status(400).json({ error: 'Profile not found' });

  const { game_id, move_san, move_uci, fen_after, status } = req.body || {};
  if (!game_id || !move_san || !move_uci || !fen_after) {
    return res.status(400).json({ error: 'game_id, move_san, move_uci and fen_after are required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  // Load game
  const { data: game } = await sb.from('games').select('*').eq('id', game_id).single();
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (!['active','check'].includes(game.status)) {
    return res.status(409).json({ error: `Cannot move — game status is '${game.status}'` });
  }

  // Verify it's this player's turn
  // FEN active color: 'w' or 'b' (second field)
  const fenColor = game.current_fen.split(' ')[1]; // 'w' or 'b'
  const isWhite  = game.white_player_id === profile.id;
  const isBlack  = game.black_player_id === profile.id;
  if (fenColor === 'w' && !isWhite) return res.status(403).json({ error: 'Not your turn (white to move)' });
  if (fenColor === 'b' && !isBlack) return res.status(403).json({ error: 'Not your turn (black to move)' });

  // Count existing moves
  const { count } = await sb.from('moves')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game_id);

  const moveNumber = (count || 0) + 1;

  // Insert move
  const { data: move, error: mvErr } = await sb.from('moves').insert({
    game_id,
    player_id:   profile.id,
    move_san,
    move_uci,
    fen_after,
    move_number: moveNumber
  }).select().single();

  if (mvErr) return res.status(500).json({ error: mvErr.message });

  // Update game
  const updateObj = { current_fen: fen_after, status: status || 'active' };
  if ((status === 'checkmate') && profile.id) {
    updateObj.winner_id = profile.id;
    // Update stats
    const loserId = isWhite ? game.black_player_id : game.white_player_id;
    await Promise.all([
      sb.from('users').update({ wins:   sb.rpc('increment', { row_id: profile.id, col: 'wins' }) }).eq('id', profile.id),
      sb.from('users').update({ losses: sb.rpc('increment', { row_id: loserId,    col: 'losses' }) }).eq('id', loserId)
    ]).catch(() => {}); // stats failure is non-critical
  }
  if (status === 'draw') {
    await Promise.all([
      sb.from('users').rpc('increment_draws', { uid: game.white_player_id }),
      sb.from('users').rpc('increment_draws', { uid: game.black_player_id })
    ]).catch(() => {});
  }

  const { data: updatedGame, error: upErr } = await sb.from('games')
    .update(updateObj).eq('id', game_id).select().single();

  if (upErr) return res.status(500).json({ error: upErr.message });

  return res.status(200).json({ move, game: updatedGame });
};
