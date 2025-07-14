export default async function handler(req, res) {
  console.log('Checking Elasticsearch health...');
  // TODO: Check if Elasticsearch is available
  try {
    const response = await fetch(
      `${process.env.VITE_ELASTICSEARCH_URL}/_cluster/health`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Elasticsearch health', details: error.message });
  }
}
