import RedisConfig from "../config/redis.config";
import AlertModel from "../interfaces/alert.model";
import AppError from "../errors/app.error";
import NotificationService from "../services/notification.service";
import Constants from "../constants/constants";

export default class AlertDispatcherWorker {
    private static _instance: AlertDispatcherWorker;

    _subscriber = RedisConfig.getInstance().getSubscriber();

    _notificationService = new NotificationService();

    private constructor() {
        console.log('AlertDispatcherWorker started...');
        this.startSubscribers()
            .then(() => console.log('Alert Dispatcher Subscribers started successfully'));
    }

    static getInstance(): AlertDispatcherWorker {
        if (!AlertDispatcherWorker._instance) {
            AlertDispatcherWorker._instance = new AlertDispatcherWorker();
        }
        return AlertDispatcherWorker._instance;
    }

    async startSubscribers() {
        console.log('Starting alert subscribers');
        try {
            await (await this._subscriber).subscribe(Constants.channels.pending_notifications, (message) => this.dispatchAlert(message))
        } catch (e) {
            console.error('Error starting alert subscribers', e);
            throw new AppError('Error starting alert subscribers');
        }
    }

    async dispatchAlert(message: string) {
        console.log('Dispatching alert', message);
        const alert: AlertModel = JSON.parse(message);
        console.log('Sending to notification service', alert);
        await this._notificationService.sendNotification(alert)
        // todo - update alert with notification response.
    }
}