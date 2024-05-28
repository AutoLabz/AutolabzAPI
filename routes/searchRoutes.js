// routes/searchRoutes.js
import express from 'express';
import { search } from '../controllers/searchController.js';
import validateQuery from '../middleware/validateQuery.js';

const router = express.Router();

router.post('/search', validateQuery, search);

export default router;
