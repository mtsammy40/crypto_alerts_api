import {ObjectId} from "mongodb";

export default interface Alert {
  _id?: ObjectId | undefined;
  pair: string;
  type: 'gt_price'
  status: 'active' | 'triggered' | 'cancelled';
  price: {
    current?: number;
    value: number;
  }
  notification: {
    channel: NotificationChannel
    address: string;
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