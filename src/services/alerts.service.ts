import CreateAlertDtoModel from '../interfaces/create-alert-dto.model';
import AlertModel from '../interfaces/alert.model';
import AlertRepository from '../repository/alert-repository';
import Ajv from "ajv";
import create_alert_dto_schema from "../schemas/create-alert-dto.schema";
import RedisConfig from "../config/redis.config";
import Constants from "../constants/constants";
import {WithId} from "mongodb";

export default class AlertsService {
    _alertsRepository = new AlertRepository();

    _validator = new Ajv().compile(create_alert_dto_schema);

    _publisher = RedisConfig.getInstance().getPublisher();

    _subscriber = RedisConfig.getInstance().getSubscriber();

    constructor() {
        // todo - move this to a worker
        this.startSubscribers()
            .then(() => console.log('AlertsService subscribers started successfully'))
            .catch(console.error);
    }

    async startSubscribers() {
        console.log('Starting alert-service subscribers');
        (await this._subscriber).subscribe(Constants.channels.update_alert_triggered, message => this.updateAsTriggered(message))
    }


    async create(createAlertDto: CreateAlertDtoModel) {
        if (!this._validator(createAlertDto)) {
            console.log('Invalid alert schema: ', this._validator.errors);
            throw new Error('Invalid alert schema');
        }
        const alert: AlertModel = {
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

    async list(): Promise<any[]> {
        return new Promise(async (resolve, reject) => {
            this._alertsRepository.list()
                .then((alerts) => {
                    if(alerts) {
                        resolve(alerts);
                    } else {
                        reject('No alerts found');
                    }
                })
                .catch((e) => reject(e));
        });
    }

    async delete(id: string) {
        this._alertsRepository
            .delete(id)
            .then(async (doc) => {
                if(!doc) {
                    console.error('Alert not found');
                    throw new Error('Alert not found');
                }
                console.log('Alert deleted ', doc._id);
                (await this._publisher).publish(Constants.channels.delete_alert_listener, JSON.stringify(doc));
            })
            .catch((e: any) => {
                console.error('Error deleting alert', e);
                throw new Error('Error deleting alert');
            });
    }

    async updateAsTriggered(message: string) {
        console.debug('Updating alert as triggered ', message);
        const alert: AlertModel = JSON.parse(message);
        alert.status = 'triggered';
        console.log('Updating alert as triggered (updated)', alert._id);
        try {
            const updateResult = await this._alertsRepository.update(alert);
            console.log(`Alert update result `, updateResult);
            console.log(`Alert ${alert._id} updated as triggered `, alert);
        } catch (e) {
            console.error(`Error updating alert ${alert._id} as triggered `, e);
        }
    }
}

