import CreateAlertDto from '../interfaces/CreateAlertDto';
import Alert from '../interfaces/alert';
import AlertRepository from '../repository/alert-repository';
import Ajv from "ajv";
import create_alert_dto_schema from "../schemas/create-alert-dto.schema";
import RedisConfig from "../config/redis.config";
import Constants from "../constants/constants";

export default class AlertsService {
    _alertsRepository = new AlertRepository();

    _validator = new Ajv().compile(create_alert_dto_schema);

    _publisher = RedisConfig.getInstance().getPublisher();

    _subscriber = RedisConfig.getInstance().getSubscriber();

    constructor() {
        this.startSubscribers()
            .then(() => console.log('AlertsService subscribers started successfully'))
            .catch(console.error);
    }

    async startSubscribers() {
        console.log('Starting alert-service subscribers');
        (await this._subscriber).subscribe(Constants.channels.update_alert_triggered, this.updateAsTriggered)
    }


    async create(createAlertDto: CreateAlertDto) {
        if (!this._validator(createAlertDto)) {
            console.log('Invalid alert schema: ', this._validator.errors);
            throw new Error('Invalid alert schema');
        }
        const alert: Alert = {
            ...createAlertDto,
            status: 'active',
            triggerInfo: {
                last_triggered_at: null,
                first_triggered_at: null,
            },
            created_at: new Date().toISOString(),
        };
        await this._alertsRepository.insert(alert);

        (await this._publisher).publish(Constants.channels.add_alert_listener, JSON.stringify(alert));
    }

    async updateAsTriggered(message: string) {
        const alert: Alert = JSON.parse(message);
        alert.status = 'triggered';
        await this._alertsRepository.update(alert);
    }
}

