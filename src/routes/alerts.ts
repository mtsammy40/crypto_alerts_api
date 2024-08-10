import express from 'express';
import CreateAlertDtoModel from '../interfaces/create-alert-dto.model';
import AlertsService from '../services/alerts.service';

const alertService = new AlertsService();

const router = express.Router();

type AlertsResponse = { 
  content: any[]
  error?: string
};

router.get<{}, AlertsResponse>('/', (req, res) => {
  console.log('GET /routes/v1/alerts', req.query);
  alertService.list()
      .then((alerts) => {
            res.json({ content: alerts });
      }).catch((e) => {
          console.error('Error listing alerts', e);
          res.status(500).json({ error: 'Error listing alerts', content: []});
      });
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

router.delete<{ id: string }, {}>('/:id', (req, res) => {
  console.log('DELETE /routes/v1/alerts/:id', req.params);
  alertService.delete(req.params.id)
    .then(() => {
      console.log('AlertModel deleted');
      res.status(204).end();
    })
    .catch((e: any) => {
      console.error('Error deleting alert', e);
      res.status(500).json({ error: 'Error deleting alert' });
    });
});

export default router;
