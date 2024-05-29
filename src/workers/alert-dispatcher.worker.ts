import RedisConfig from "../config/redis.config";
import Alert from "../interfaces/alert";
import AppError from "../errors/app.error";

export default class AlertDispatcherWorker {
    _redis = RedisConfig.getInstance().getPublisher();

    constructor() {
        console.log('AlertDispatcherWorker started');
        this.startSubscribers()
            .then(() => console.log('Subscribers started successfully'));
    }

    async startSubscribers() {
        console.log('Starting alert subscribers');
        try {
            await (await this._redis).subscribe('pending-alerts', this.dispatchAlert)
        } catch (e) {
            console.error('Error starting alert subscribers', e);
            throw new AppError('Error starting alert subscribers');
        }
    }

    async dispatchAlert(message: string) {
        console.log('Dispatching alert', message);
        const alert: Alert = JSON.parse(message);
        console.log('Sending to notification service', alert);
        // todo - create notification request and send to notification service
        // todo - update alert with notification response.
    }
}