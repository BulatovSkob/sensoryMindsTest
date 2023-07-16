export interface NotificationSenderInterface {
  sendNotification(message: string): Promise<void>;
}
