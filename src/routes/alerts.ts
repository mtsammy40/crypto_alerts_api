import express from 'express';
import CreateAlertDtoModel from '../interfaces/create-alert-dto.model';
import AlertsService from '../services/alerts.service';

const alertService = new AlertsService();

const router = express.Router();

type AlertsResponse = { 
  content: any[]
};

router.get<{}, AlertsResponse>('/', (req, res) => {
  console.log('GET /routes/v1/alerts', req.query);
  res.json({ content: [] });
});

router.post<CreateAlertDtoModel, {}>('/', (req, res) => {
  console.log('POST /routes/v1/alerts', req.body);
  alertService.create(req.body)
    .then(() => {
      console.log('AlertModel created');
      res.status(201).end();
    })
    .catch((e) => {
      console.error('Error creating alert', e);
      res.status(500).json({ error: 'Error creating alert' });
    });
});

export default router;
