import { MongoClient, Db as DbConn } from 'mongodb';
import env from './env.config';
import {wait} from '../utils/funcs.utils';

// todo - need a cleaner implementation that does not sacrifice performance
export default class DbConfig {
  private static _instance: DbConfig;

  private _connecting = false;

  _client: DbConn | undefined;

  private async connect() {
    this._connecting = true;
    return new Promise<DbConn>((resolve, reject) => {
      const mongoUri = env.mongo_uri;
      console.log('Connecting to mongo', mongoUri);
      const mongoClient = new MongoClient(mongoUri);

      mongoClient.connect()
          .then((openClient) => {
            console.log('Connected to mongo');
            this._connecting = false;
            let connection = openClient.db('crypto-alerts');
            resolve(connection);
          })
          .catch((e) => { reject(`Unable to connect to mongo: ${e}`); });
    });
  }

  async dbClient() {
    if (!this._client) {
      if (!this._connecting) {
        this._client = await this.connect();
      } else {
        for (let retries = 0; retries < 10; retries++) {
          console.log('Trying for db connection...');
          if (this._client) {
            console.log('Connected to db');
            break;
          }
          await wait(1000)
          retries++;
        }
      }
      return this._client;
    } else {
      return this._client;
    }
  }

  static getInstance(): DbConfig {
    if (!DbConfig._instance) {
      DbConfig._instance = new DbConfig();
    }
    return DbConfig._instance;
  }
}
