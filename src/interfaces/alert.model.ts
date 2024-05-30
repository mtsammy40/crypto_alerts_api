import {ObjectId} from "mongodb";

export default interface AlertModel {
  _id?: ObjectId | undefined;
  pair: string;
  type: 'gt_price'
  status: 'active' | 'triggered' | 'cancelled';
  price: {
    current?: number;
    value: number;
    at_trigger?: number;
  }
  notification: {
    channel: NotificationChannel
    address: string;
    subscriber_id: string;
  },
  triggerInfo: {
    last_triggered_at: string | null;
    first_triggered_at: string | null;
  }
  created_at: string;
}

export enum NotificationChannel {
  EMAIL,
}