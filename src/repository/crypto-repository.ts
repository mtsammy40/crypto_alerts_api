import DbConfig from "../config/db.config";
import BaseRepository from "./BaseRepository";
import Ajv from "ajv";

export default class CryptoRepository extends BaseRepository {
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
}
