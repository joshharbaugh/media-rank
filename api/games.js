export default async function handler(req, res) {
  const { query } = req.query;

  try {
    const response = await fetch(
      `${process.env.VITE_GAMES_API_BASE_URL}/v1/Games/ByGameName?apikey=${process.env.VITE_GAMES_API_KEY}&name=${query}&fields=overview&include=boxart`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
}
