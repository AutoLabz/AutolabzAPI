// indexCars.js
import { Client } from '@elastic/elasticsearch';
import cars from './carData.js';
import 'dotenv/config';

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  },
  ssl: {
    ca: process.env.ELASTICSEARCH_CA,
    rejectUnauthorized: false
  }
});

async function indexData() {
  for (const car of cars) {
    await client.index({
      index: 'cars',
      body: car
    });
  }
  await client.indices.refresh({ index: 'cars' });
  console.log('Car data indexed successfully');
}

indexData().catch(console.error);