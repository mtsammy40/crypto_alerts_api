import DbConfig from '../config/db.config';
import AlertModel from '../interfaces/alert.model';
import Ajv from "ajv";
import AppError from "../errors/app.error";
import {ObjectId} from "mongodb";
import BaseRepository from "./BaseRepository";
import alertSchema from "../schemas/alert.schema";

export default class AlertRepository extends BaseRepository {
    _collectionName = 'alerts';

    validate = new Ajv().compile(alertSchema);


    async list() {
        try {
            return await (await this.client())
                .collection(this._collectionName)
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
                .collection(this._collectionName)
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