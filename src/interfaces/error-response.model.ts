import MessageResponseModel from './message-response.model';

export default interface ErrorResponseModel extends MessageResponseModel {
  stack?: string;
}