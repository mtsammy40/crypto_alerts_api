import express from 'express';
const router = express.Router();

router.get<{}, any[]>('/', (req, res) => {
    console.log('GET /routes/v1/alerts', req.query);
});