/**
 * GET /api/game-state?id=<game_id>
 * Public endpoint — no auth required.
 *
 * Returns: { game, moves, white, black }
 */
const sb = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const gameId = req.query?.id;
  if (!gameId) return res.status(400).json({ error: 'id query param is required' });

  // Load game with player usernames
  const { data: game, error } = await sb.from('games')
    .select(`
      *,
      white:white_player_id(id, username, wins, losses, draws),
      black:black_player_id(id, username, wins, losses, draws)
    `)
    .eq('id', gameId)
    .single();

  if (error || !game) return res.status(404).json({ error: 'Game not found' });

  // Load all moves
  const { data: moves } = await sb.from('moves')
    .select('*')
    .eq('game_id', gameId)
    .order('move_number', { ascending: true });

  return res.status(200).json({
    game,
    moves:  moves || [],
    white:  game.white,
    black:  game.black
  });
};
