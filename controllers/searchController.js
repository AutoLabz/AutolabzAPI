// controllers/searchController.js
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });

export const search = async (req, res) => {
  const { query } = req.body;

  try {
    const result = await client.search({
      index: 'cars',
      body: {
        query: {
          multi_match: {
            query: query,
            fields: ['make', 'model', 'year', 'color', 'description']
          }
        }
      }
    });

    res.json(result.hits.hits);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


/**
 * Test code to see if request is hitting endpoint properly.
 * controllers/searchController.js
import { Client } from '@elastic/elasticsearch';

// Create a mock client for testing purposes (remove this in production)
const client = new Client({ node: 'http://localhost:9200' });

export const search = async (req, res) => {
  const { query } = req.body;
  console.log('Received query:', query); // Log the received query to the console

  // Mock response to check if the controller is being hit
  res.json({ message: 'Search endpoint hit successfully', query: query });
};

 */