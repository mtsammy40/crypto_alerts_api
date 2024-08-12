import DbConfig from "../config/db.config";
import AppError from "../errors/app.error";

export default class BaseRepository {
    protected _collectionName = '';
    protected _db = DbConfig.getInstance();

    protected async client() {
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

    protected async getCollection() {
        return (await this.client()).collection(this._collectionName);
    }
}