import { NotificationChannel } from './alert.model';

export default interface CreateAlertDtoModel {
  pair: string;
  type: 'gt_price' | 'lt_price';
  price: {
    value: number;
    current?: number;
  },
  notification: {
    channel: NotificationChannel
    address: string;
    subscriber_id: string;
  },
}