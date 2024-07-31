// server.js
import express from 'express';
import bodyParser from 'body-parser';
import searchRoutes from './routes/searchRoutes.js';
import winston from 'winston';

const app = express();
const port = process.env.PORT || 5004;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.use('/cars', searchRoutes);

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});