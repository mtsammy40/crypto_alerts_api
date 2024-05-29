import WebSocket from 'ws';
import {randomInt} from "node:crypto";
import Alert from "../interfaces/alert";
import MarkPriceUpdate from "../interfaces/mark-price-update.model";
import RedisConfig from "../config/redis.config";
import Constants from "../constants/constants";


export default class PriceListenerWorker {
    private static _instance: PriceListenerWorker;

    _isMonitoring = false;

    _ws: WebSocket = {} as WebSocket;

    _subscriber = RedisConfig.getInstance().getSubscriber();

    _publisher = RedisConfig.getInstance().getPublisher();

    _activeSubscriptions: string[] = [];

    _alerts: Map<string, Alert[]> = new Map<string, any>();

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

    async startSubscribers() {
        console.log('Starting price-watcher-worker subscribers');
        (await this._subscriber).subscribe(Constants.channels.add_alert_listener, (message) => this.addListener(message))
    }

    async startMonitoring(symbols: string[]) {
        if (this._isMonitoring) {
            console.log('Already monitoring prices...');
            return;
        }
        await this.monitorPrices(symbols);
    }

    static getInstance(): PriceListenerWorker {
        if (!PriceListenerWorker._instance) {
            PriceListenerWorker._instance = new PriceListenerWorker();
        }
        return PriceListenerWorker._instance;
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
                    console.log('Stream message: ', message);
                    this.processPriceUpdate(message);
                }
            });

            this._ws.on('close', () => {
                console.log('Connection closed. Reconnecting...');
                this._isMonitoring = false;
                this.monitorPrices(symbols)
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

    addListener(message: string) {
        const alert: Alert = JSON.parse(message);
        console.log(`Adding alert ${alert._id}  to listener `, alert);
        this.subscribe([alert.pair]);
        const alertsForPair = this._alerts.get(alert.pair) || [];
        alertsForPair.push(alert);
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
                        this.triggerAlert(alert)
                            .then(() => console.log(`Alert ${alert._id} triggered.`))
                            .catch(console.error)
                    }
                    break;
                default:
                    console.log(`Unhandled alert type: ${alert.type} for id ${alert._id}`);
            }
        });
    }

    async triggerAlert(alert: Alert) {
        console.log('Alert triggering : ', alert);
        if (!alert.triggerInfo.first_triggered_at) {
            alert.triggerInfo.last_triggered_at = new Date().toISOString();
        }
        alert.triggerInfo.last_triggered_at = new Date().toISOString();

        // promise-then necessary to ensure they don't wait for each other.
        (await this._publisher)
            .publish(Constants.channels.pending_notifications, JSON.stringify(alert))
            .then(() => console.log('Alert sent to notification service'))
            .catch(console.error);
        (await this._publisher)
            .publish(Constants.channels.update_alert_triggered, JSON.stringify(alert))
            .then(() => console.log('Alert update sent for update'))
            .catch(console.error);
    }
}