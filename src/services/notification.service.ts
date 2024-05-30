import {Novu} from '@novu/node';
import envMap from "../config/env.config";
import Constants from "../constants/constants";
import AlertModel from "../interfaces/alert.model";

export default class NotificationService {
    _novu = new Novu(envMap.novu_api_key);

    async sendNotification(alert: AlertModel) {
        console.log('Sending notification...', alert);
        try {
            const notificationApiResult = await this._novu
                .trigger(Constants.notification_workflow_ids.crypto_price_alert, {
                    to: {
                        subscriberId: alert.notification.subscriber_id,
                    },
                    payload: {
                        target_price: alert.price.value,
                        trigger_price: alert.price.at_trigger,
                        pair: alert.pair,
                    },
                });
            console.log('Notification Result :: ', notificationApiResult);
            if(notificationApiResult.status !== 201) {
                throw new Error('Error sending notification :: notificationApiResult.status !== 201 :: Errorcode : '+ notificationApiResult.status);
            }
        } catch (e) {
            console.error('Error sending notification', e);
            throw e;
        }
    }
}
