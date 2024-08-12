import express from 'express';
import CurrencyService from "../services/currency.service";
import withCaching from "../middlewares/RedisCacheMiddleware";
const router = express.Router();
const currenciesService = new CurrencyService();

router.get<{}, any>('/refresh', (req, res) => {
    console.log('GET /routes/v1/currencies/refresh', req.query);
    currenciesService.refreshCurrencies()
        .then(() => {
            res.status(200).end();
        })
        .catch((e) => {
            console.error('Error refreshing currencies', e);
            res.status(500).json({ error: 'Error refreshing currencies' });
        });
});

router.get<{}, any>('/', withCaching('currencies',{EX: 21600}), (req, res) => {
    console.log('GET /routes/v1/currencies', req.query);
    currenciesService.list()
        .then((currencies) => {
            res.json(currencies);
        })
        .catch((e) => {
            console.error('Error listing currencies', e);
            res.status(500).json({ error: 'Error listing currencies', content: [] });
        });
});

export default router;