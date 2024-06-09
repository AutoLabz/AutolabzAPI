// server.js
import express from 'express';
import bodyParser from 'body-parser';
import searchRoutes from './routes/searchRoutes.js';

const app = express();
const port = process.env.PORT || 5004;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.use('/cars', searchRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

