import BaseRepository from "./BaseRepository";
import Ajv from "ajv";
import {ObjectId} from "mongodb";

export type Currency = {
    _id: string;
    pair: string;
    displayName: string;
}

export default class CurrencyRepository extends BaseRepository {
    _collectionName = 'currencies';

    validate = new Ajv().compile({
        type: 'object',
        properties: {
            _id: {type: 'string'},
            pair: {type: 'string'},
            displayName: {type: 'string'},
            additionalProperties: false,
        },
    });

    async list() {
        try {
            return (await this.getCollection())
                .find()
                .map(doc => {
                    return {
                        _id: doc._id,
                        pair: doc.pair,
                        displayName: doc.displayName,
                    };
                })
                .toArray();
        } catch (e) {
            console.error('Error listing currencies', e);
            throw new Error('Error listing currencies');
        }
    }

    async addOrUpdate(currency: Currency): Promise<void> {
        try {
            const result = await (await this.getCollection())
                .updateOne({_id: currency._id ? new ObjectId(currency._id) : undefined }, currency, {upsert: true});
            if(result.upsertedId) {
                console.log(`Currency added: ${result.upsertedId}`);
            } else {
                console.log(`Currency updated: ${currency._id}`);
            }
        } catch (e) {
            console.error('Error adding currency', e);
            throw new Error('Error adding currency');
        }
    }

    async updateAll(currencies: Currency[]): Promise<void> {
        try {
            await (await this.getCollection()).deleteMany({});
            await (await this.getCollection()).insertMany(currencies.map(currency => {
                return {
                    pair: currency.pair,
                    displayName: currency.displayName,
                };
            }));
            console.log('All currencies updated');
        } catch (e) {
            console.error('Error updating currencies', e);
            throw new Error('Error updating currencies');
        }
    }
}
