import express from 'express';

import MessageResponseModel from '../interfaces/message-response.model';
import emojis from './emojis';
import alerts from './alerts';

const router = express.Router();

router.get<{}, MessageResponseModel>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/alerts', alerts);

export default router;
