import { NotificationChannel } from './alert';

export default interface CreateAlertDto {
  pair: string;
  type: 'gt_price'
  price: {
    value: number;
    current?: number;
  },
  notification: {
    channel: NotificationChannel
    address: string;
  },
}