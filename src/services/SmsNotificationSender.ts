import { LoggerInterface } from '../interfaces/LoggerInterface';
import { NotificationSenderInterface } from '../interfaces/NotificationSenderInterface';
import { Twilio } from 'twilio';

export class SmsNotificationSender implements NotificationSenderInterface {
  private readonly logger: LoggerInterface;
  private readonly twilioClient: Twilio;
  constructor(logger: LoggerInterface, twilioClient: Twilio) {
    this.logger = logger;
    this.twilioClient = twilioClient;
  }
  public async sendNotification(message: string) {
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER ?? '';
    const myNumber = process.env.MY_NUMBER ?? '';

    try {
      await this.twilioClient.messages.create({
        from: twilioNumber,
        to: myNumber,
        body: message,
      });

      this.logger.info(`SMS notification sent: '${message}'`);
    } catch (error) {
      this.logger.error(`Error sending SMS notification: '${error instanceof Error ? error.message : error}'`);
    }
  }
}
