import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import * as middlewares from './middlewares';
import api from './routes';
import MessageResponseModel from './interfaces/message-response.model';
import AlertRepository from "./repository/alert-repository";
import RedisConfig from "./config/redis.config";
import Constants from "./constants/constants";
import PriceListenerWorker from './workers/price-listener.worker';
import AlertDispatcherWorker from "./workers/alert-dispatcher.worker";


const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<{}, MessageResponseModel>('/', (req, res) => {
    res.json({
        message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
    });
});

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// start price listener worker
PriceListenerWorker.getInstance();

// start notification dispatcher worker
AlertDispatcherWorker.getInstance();

// Send initial symbols to listener
const alertsRepository = new AlertRepository();
const redis = RedisConfig.getInstance().getPublisher();
alertsRepository.listActiveAlertSymbols()
    .then(alerts => {
        console.log('Alerts to watch: ', alerts.map(alert => alert.pair).join(', '));
        redis
            .then(client => {
                alerts.forEach(alert => {
                    client.publish(Constants.channels.add_alert_listener, JSON.stringify(alert))
                        .then(() => console.log(`Alert ${alert._id} sent to listener`))
                        .catch(e => console.error(`Error sending alert ${alert._id} to listener`, e));
                });
            })
            .catch(e => console.error('Error connecting to redis', e));
    })
    .catch(e => console.error('Error listing alerts: (start script)', e));

export default app;
