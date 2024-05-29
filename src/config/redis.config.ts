import AppError from "../errors/app.error";
import envMap from "./env.config";
import {createClient} from 'redis';
import {wait} from "../utils/funcs.utils";

// todo - need a cleaner implementation that does not sacrifice performance
export default class RedisConfig {
    private static _instance: RedisConfig;

    private _connecting = false;

    private _subscriber: ReturnType<typeof createClient> | undefined;

    private _publisher: ReturnType<typeof createClient> | undefined;

    private async connect() {
        this._connecting = true;
        console.log('Connecting to Redis...');
        const subscriber = createClient(
            {url: envMap.redis_uri}
        );

        const publisher = subscriber.duplicate()

        try {
            await subscriber.connect();
            await publisher.connect()
            this._subscriber = subscriber;
            this._publisher = publisher;
        } catch (e) {
            console.error('Error connecting to Redis', e);
            throw new AppError('Error connecting to Redis');
        }
        this._connecting = false;
    }

    static getInstance(): RedisConfig {
        if (!RedisConfig._instance) {
            RedisConfig._instance = new RedisConfig();
        }
        return RedisConfig._instance;
    }

    async getPublisherIfPresent(): Promise<ReturnType<typeof createClient> | undefined> {
        const client = this._publisher;
        if (!client) {
            if (!this._connecting) {
                await this.connect();
            } else {
                let retries = 0;
                while (!this._publisher && retries < 10) {
                    console.log('Trying for redis connection...');
                    await wait(1000)
                    retries++;
                }
            }
        }
        return this._publisher;
    }

    async getSubscriberIfPresent(): Promise<ReturnType<typeof createClient> | undefined> {
        const client = this._subscriber;
        if (!client) {
            if (!this._connecting) {
                await this.connect();
            } else {
                let retries = 0;
                while (!this._subscriber && retries < 10) {
                    console.log('Trying for redis connection...');
                    await wait(1000)
                    retries++;
                }
            }
        }
        return this._subscriber;
    }

    async getPublisher(): Promise<ReturnType<typeof createClient>> {
        const client = await this.getPublisherIfPresent();
        if (!client) {
            throw new AppError('Redis publisher not found');
        }
        return client;
    }

    async getSubscriber(): Promise<ReturnType<typeof createClient>> {
        const client = await this.getSubscriberIfPresent();
        if (!client) {
            throw new AppError('Redis subscriber not found');
        }
        return client;
    }
}