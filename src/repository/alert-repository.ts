import DbConfig from '../config/db.config';
import AlertModel from '../interfaces/alert.model';
import Ajv from "ajv";
import AppError from "../errors/app.error";
import {ObjectId} from "mongodb";

export default class AlertRepository {
    _collectionName = 'alerts';

    _db = DbConfig.getInstance();

    validate = new Ajv().compile({
        type: 'object',
        properties: {
            _id: {type: 'string'},
            pair: {type: 'string'},
            type: {type: 'string', enum: ['gt_price']},
            price: {
                type: 'object',
                properties: {
                    currency: {type: 'integer'},
                    value: {type: 'integer'},
                },
            },
            notification: {
                type: 'object',
                properties: {
                    channel: {type: 'string', enum: ['email']},
                    address: {type: 'string'},
                },
            },
            // required: ['pair','type','price','notification'],
            additionalProperties: false,
        },
    });

    private async client() {
        try {
            const client =  await this._db.dbClient();
            if (!client) {
                throw new Error('DB Client not found');
            }
            return client;
        } catch (e) {
            console.error('Error connecting to DB', e);
            throw new AppError('Error connecting to DB');
        }
    }

    async list() {
        try {
            return await (await this.client())
                .collection('alerts')
                .find()
                .map(doc => {
                    return {
                        _id: doc._id,
                        pair: doc.pair,
                        type: doc.type,
                        status: doc.status,
                        price: doc.price,
                        notification: doc.notification,
                        triggerInfo: doc.triggerInfo,
                        created_at: doc.created_at,
                    } as AlertModel;
                })
                .toArray();
        } catch (e) {
            console.error('Error listing alerts', e);
            throw new AppError('Error listing alerts');
        }
    }

    async listActiveAlertSymbols() {
        try {
            return await (await this.client())
                .collection('alerts')
                .find({'status': 'active'})
                .toArray();
        } catch (e) {
            console.error('Error listing listActiveAlertSymbols', e);
            throw new AppError('Error listActiveAlertSymbols');
        }
    }

    async insert(alert: AlertModel) {
        if (!this.validate(alert)) {
            console.log('Invalid alert schema: ', this.validate.errors);
            throw new AppError('Invalid alert schema', 400);
        }
        try {
            return await (await this.client())
                .collection(this._collectionName)
                .insertOne(alert);
        } catch (e) {
            console.error('Error saving alert', e);
            throw new AppError('Error saving alert');
        }
    }

    async update(alert: AlertModel) {
        if (!this.validate(alert)) {
            console.log('Invalid alert schema: ', this.validate.errors);
            throw new AppError('Invalid alert schema', 400);
        }
        const id = new ObjectId(alert._id);
        delete alert._id;
        try {
            return await (await this.client())
                .collection(this._collectionName)
                .updateOne({_id: id}, {$set: alert});
        } catch (e) {
            console.error('Error updating alert', e);
            throw new AppError('Error updating alert');
        }
    }

    async delete(id: string) {
        try {
            return await (await this.client())
                .collection(this._collectionName)
                .findOneAndDelete({_id: new ObjectId(id)});
        } catch (e) {
            console.error('Error deleting alert', e);
            throw new AppError('Error deleting alert');
        }
    }
}