import axios from 'axios';
import { WebsiteParser } from './services/WebsiteParser';
import { Storage } from '@google-cloud/storage';
import { StateStorageBucket } from './services/StateStorageBucket';
import { Logger } from './services/Logger';
import { SmsNotificationSender } from './services/SmsNotificationSender';
import { SpreadsheetChangesRecorder } from './services/SpreadsheetChangesRecorder';
import { WebsiteMonitor } from './services/WebsiteMonitor';
import dotenv from 'dotenv';
import path from 'path';
import { Twilio } from 'twilio';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const trackUrlChanges = async () => {
  const logger = new Logger();
  const parser = new WebsiteParser(axios.create(), logger);
  const storage = new StateStorageBucket(process.env.BUCKET_NAME ?? '', new Storage(), logger);
  const smsSender = new SmsNotificationSender(
    logger,
    new Twilio(process.env.TWILIO_ACCOUNT_SID ?? '', process.env.TWILIO_AUTH_TOKEN ?? ''),
  );
  const changesRecorder = new SpreadsheetChangesRecorder(logger);

  const websiteMonitor = new WebsiteMonitor(parser, storage, smsSender, changesRecorder);

  websiteMonitor.track(process.env.WEBSITES?.split(',') ?? []);
};

