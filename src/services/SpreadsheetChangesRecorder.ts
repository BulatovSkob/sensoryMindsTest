import { WebsiteChangesRecorderInterface } from '../interfaces/WebsiteChangesRecorderInterface';
import { PartialWebsiteStateRequest, WebsiteStateRequest } from '../interfaces/WebSiteStateRequest';
import { LoggerInterface } from '../interfaces/LoggerInterface';
import { google } from 'googleapis';

export class SpreadsheetChangesRecorder implements WebsiteChangesRecorderInterface {
  private readonly spreadsheetId: string;
  private readonly logger: LoggerInterface;
  private readonly serviceAccountPrivateKey: string;
  private readonly serviceAccountEmail: string;

  constructor(logger: LoggerInterface) {
    this.spreadsheetId = process.env.SPREADSHEET_ID ?? '';
    this.serviceAccountPrivateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY ?? '';
    this.serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL ?? '';
    this.spreadsheetId = process.env.SPREADSHEET_ID ?? '';
    this.logger = logger;
  }

  public async recordChanges(
    website: string,
    lastRequest: WebsiteStateRequest,
    changes: PartialWebsiteStateRequest,
  ): Promise<void> {
    const auth = new google.auth.JWT({
      email: this.serviceAccountEmail,
      key: this.serviceAccountPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheet = google.sheets('v4');

    try {
      const { timestamp, state } = changes;
      const {
        content = 'No changes',
        loadingTime = `No changes (current:${lastRequest.state.loadingTime})`,
        httpStatus = `No changes (current:${lastRequest.state.httpStatus})`,
      } = state || {};
      const data = [website, timestamp, content, loadingTime, httpStatus];

      await sheet.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        auth: auth,
        range: 'Sheet1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [data],
        },
      });
      this.logger.info(`Changes recorded for website '${website}'`);
    } catch (error) {
      this.logger.error(`Error writing to the spreadsheet: '${error instanceof Error ? error.message : error}`);
    }
  }
}
