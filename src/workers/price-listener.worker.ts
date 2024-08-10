import WebSocket from 'ws';
import {randomInt} from "node:crypto";
import AlertModel from "../interfaces/alert.model";
import MarkPriceUpdate from "../interfaces/mark-price-update.model";
import RedisConfig from "../config/redis.config";
import Constants from "../constants/constants";
import Alerts from "../routes/alerts";


export default class PriceListenerWorker {
    private static _instance: PriceListenerWorker;

    _isMonitoring = false;

    _ws: WebSocket = {} as WebSocket;

    _subscriber = RedisConfig.getInstance().getSubscriber();

    _publisher = RedisConfig.getInstance().getPublisher();

    _activeSubscriptions: string[] = [];

    _alerts: Map<string, AlertModel[]> = new Map<string, any>();

    _pendingResponses = new Map<string, any>();

    private constructor() {
        console.log('Starting PriceListenerWorker...');
        this.startMonitoring([])
            .then(() => {
                console.log('Monitoring started');
                this.startSubscribers()
                    .then(() => {
                        console.log('PriceListenerWorker Subscribers started successfully');
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    static getInstance(): PriceListenerWorker {
        if (!PriceListenerWorker._instance) {
            PriceListenerWorker._instance = new PriceListenerWorker();
        }
        return PriceListenerWorker._instance;
    }

    async startSubscribers() {
        console.log('Starting price-watcher-worker subscribers');
        (await this._subscriber).subscribe(Constants.channels.add_alert_listener, (message) => this.addListener(message));
        (await this._subscriber).subscribe(Constants.channels.delete_alert_listener, (message) => this.removeListener(message))
    }

    async startMonitoring(symbols: string[]) {
        if (this._isMonitoring) {
            console.log('Already monitoring prices...');
            return;
        }
        await this.monitorPrices(symbols);
    }

    private async monitorPrices(symbols: string[]): Promise<void> {
        console.log('Monitoring prices...');
        await this.openSocket(symbols);
        this._isMonitoring = true;
    }

    private openSocket(symbols: string[]) {
        return new Promise((resolve, reject) => {
            // todo - move to config
            this._ws = new WebSocket('wss://fstream.binance.com/stream?streams=btcusdt@markPrice');

            this._ws.on('error', (error) => {
                console.error('Error connecting to Binance: ', error);
                reject(error);
            });

            this._ws.on('message', (data) => {
                console.log('Received: %s', data);
                const message = JSON.parse(data.toString());
                if (message.id) {
                    this.handlePendingResponse(message);
                } else if (message.stream) {
                    // console.info('Stream message: ', message);
                    this.processPriceUpdate(message);
                }
            });

            this._ws.on('close', () => {
                console.log('Connection closed. Reconnecting...');
                this._isMonitoring = false;
                this.startMonitoring(symbols)
                    .then(() => console.log('Reconnected'))
                    .catch(console.error);
            });

            this._ws.on('open', () => {
                console.log('Connected to Binance...');
                this.subscribe(symbols);
                resolve({});
            });
        });
    }

    private subscribe(pairs: string[]) {
        console.log('Subscribing to pairs: ', pairs.join(', '));
        const newPairs = pairs
            .filter(pair => !this._activeSubscriptions.includes(pair));
        if (!newPairs.length) {
            console.log('All pairs already have subscriptions...');
            return;
        }
        const params = newPairs
            .map(pair => `${pair}@markPrice`);
        const ref = randomInt(10000, 99999);
        const payload = {
            "method": "SUBSCRIBE",
            "params": params,
            "id": ref
        }
        this._ws.send(JSON.stringify(payload));
        this._pendingResponses.set(ref.toString(), payload);
    }

    private unsubscribeIfNoAlerts(pair: string) {
        const alertsForPair = this._alerts.get(pair);
        if (!alertsForPair || !alertsForPair.length) {
            this.unsubscribe([pair]);
        }
    }

    private unsubscribe(pairs: string[]) {
        console.log('Unsubscribing from pairs: ', pairs.join(', '));
        const params = pairs
            .map(pair => `${pair}@markPrice`);
        const ref = randomInt(10000, 99999);
        const payload = {
            "method": "UNSUBSCRIBE",
            "params": params,
            "id": ref
        }
        this._ws.send(JSON.stringify(payload));
        this._pendingResponses.set(ref.toString(), payload);
    }

    addListener(message: string) {
        const alert: AlertModel = JSON.parse(message);
        console.log(`Adding alert ${alert._id} to listener `, alert);
        this.subscribe([alert.pair]);
        const alertsForPair = this._alerts.get(alert.pair) || [];
        alertsForPair.push(alert);
        this._alerts.set(alert.pair, [...alertsForPair]);
    }

    removeListener(message: string) {
        const alert: AlertModel = JSON.parse(message);
        console.log(`Removing alert ${alert._id} from listener `);
        this.unsubscribeIfNoAlerts(alert.pair);
        let alertsForPair = this._alerts.get(alert.pair) || [];
        alertsForPair = [...alertsForPair.filter(a => a._id !== alert._id)];
        this._alerts.set(alert.pair, [...alertsForPair]);
    }

    private handlePendingResponse(message: any) {
        const ref = message.id.toString();
        const pendingResponse = this._pendingResponses.get(ref);
        if (pendingResponse) {
            switch (pendingResponse.method) {
                case 'SUBSCRIBE':
                    this.handleSubscriptionResponse(message);
                    break;
                case 'UNSUBSCRIBE':
                    this.handleUnSubscribeResponse(message);
                    break;
                default:
                    console.log('Unhandled pending response: ', message);
            }
            this._pendingResponses.delete(ref);
        }
    }

    private handleSubscriptionResponse(message: any): void {
        if (message.result) {
            const symbols = this._pendingResponses.get(message.id)?.params.map((pair: string) => {
                return pair.split('@')[0];
            });
            this._activeSubscriptions = [...this._activeSubscriptions, ...symbols];
        }
    }

    private handleUnSubscribeResponse(message: any): void {
        if (message.result) {
            const symbols = this._pendingResponses.get(message.id)?.params.map((pair: string) => {
                return pair.split('@')[0];
            });
            const activeSubscriptions = this._activeSubscriptions.filter(pair => !symbols.includes(pair));
            this._activeSubscriptions = [...activeSubscriptions];
        }
    }

    processPriceUpdate(markPriceUpdate: MarkPriceUpdate) {
        const pair = markPriceUpdate.data.s.toLowerCase();
        const price = markPriceUpdate.data.p;
        console.log('Pairs Map ', this._alerts);
        const alerts = this._alerts.get(pair);
        if (!alerts) {
            return;
        }
        alerts.forEach(alert => {
            console.log(`Checking alert ${alert._id} for price ${price}`, alert);
            switch (alert.type) {
                case 'gt_price':
                    if (Number(price) >= alert.price.value) {
                        this.evictFromListener(alert);
                        this.triggerAlert(alert, price)
                            .then(() => console.log(`Alert ${alert._id} triggered.`))
                            .catch(console.error)
                    }
                    break;
                case 'lt_price':
                    if (Number(price) <= alert.price.value) {
                        this.evictFromListener(alert);
                        this.triggerAlert(alert, price)
                            .then(() => console.log(`Alert ${alert._id} triggered.`))
                            .catch(console.error)
                    }
                    break;
                default:
                    console.log(`Unhandled alert type: ${alert.type} for id ${alert._id}`);
            }
        });
    }

    evictFromListener(alert: AlertModel) {
        const alertsForPair = this._alerts.get(alert.pair) || [];
        const index = alertsForPair.findIndex(a => a._id === alert._id);
        if (index > -1) {
            alertsForPair.splice(index, 1);
            this._alerts.set(alert.pair, [...alertsForPair]);
        }

        // if no other alerts for pair, unsubscribe
        if (!alertsForPair.length) {
            this.unsubscribe([alert.pair]);
            this._alerts.delete(alert.pair);
        }
    }

    async triggerAlert(alert: AlertModel, triggerPrice: string) {
        console.log('AlertModel triggering : ', alert);
        if (!alert.triggerInfo.first_triggered_at) {
            alert.triggerInfo.first_triggered_at = new Date().toISOString();
        }
        alert.triggerInfo.last_triggered_at = new Date().toISOString();
        alert.price.at_trigger = Number(triggerPrice);

        // promise-then necessary to ensure they don't wait for each other.
        (await this._publisher)
            .publish(Constants.channels.pending_notifications, JSON.stringify(alert))
            .then(() => console.log('AlertModel sent to notification service'))
            .catch(console.error);
        (await this._publisher)
            .publish(Constants.channels.update_alert_triggered, JSON.stringify(alert))
            .then(() => console.log('AlertModel update sent for update'))
            .catch(console.error);
    }
}