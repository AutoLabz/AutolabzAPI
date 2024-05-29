// indexCars.js
import { Client } from '@elastic/elasticsearch';
import cars from './carData.js';

const client = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'Z3HRiTPiIHJnGqA3Wh9G'
  },
  ssl: {
    ca: '/Users/saurabhkhanal/downloads/elasticsearch-8.13.4/config/certs/http_ca.crt',
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
