import { NotificationSenderInterface } from '../interfaces/NotificationSenderInterface';
import { StateStorageInterface } from '../interfaces/StateStorageInterface';
import { WebsiteChangesRecorderInterface } from '../interfaces/WebsiteChangesRecorderInterface';
import { WebsiteParserInterface } from '../interfaces/WebsiteParserInterface';
import { WebsiteState } from '../interfaces/WebsiteState';
import { WebsiteStateRequest } from '../interfaces/WebSiteStateRequest';

export class WebsiteMonitor {
  private readonly parser: WebsiteParserInterface;
  private readonly storage: StateStorageInterface;
  private readonly notificationSender: NotificationSenderInterface;
  private readonly websiteChangesRecorder: WebsiteChangesRecorderInterface;

  constructor(
    parser: WebsiteParserInterface,
    storage: StateStorageInterface,
    notificationSender: NotificationSenderInterface,
    websiteChangesRecorder: WebsiteChangesRecorderInterface,
  ) {
    this.parser = parser;
    this.storage = storage;
    this.notificationSender = notificationSender;
    this.websiteChangesRecorder = websiteChangesRecorder;
  }

  public async track(websites: string[]) {
    websites.forEach(async website => {
      const parsedUrl = new URL(website);
      const currentStateRequest = await this.parser.parse(website);
      const previousState = await this.getPreviousState(parsedUrl.hostname);

      await this.storage.set(parsedUrl.hostname, JSON.stringify(currentStateRequest.state));

      const changes = this.getChanges(currentStateRequest, previousState);

      if (changes !== null) {
        await this.websiteChangesRecorder.recordChanges(website, currentStateRequest, changes);
        await this.notificationSender.sendNotification(
          `Website ${website} has changed, changes: ${Object.keys(changes.state)}`,
        );
      }
    });
  }

  private async getPreviousState(website: string): Promise<WebsiteState | null> {
    const bucketData = await this.storage.get(website);

    if (bucketData === null) {
      return null;
    }

    const parsedData: WebsiteState = JSON.parse(bucketData);

    return parsedData instanceof Object &&
      parsedData.content !== undefined &&
      parsedData.loadingTime !== undefined &&
      parsedData.httpStatus !== undefined
      ? parsedData
      : null;
  }

  private getChanges(currentStateRequest: WebsiteStateRequest, previousState: WebsiteState | null) {
    const changes: Partial<WebsiteState> = {};

    if (previousState === null) {
      return currentStateRequest;
    }

    if (previousState.content !== currentStateRequest.state.content) {
      changes.content = this.getContentDifference(previousState.content ?? '', currentStateRequest.state.content ?? '');
      if (changes.content.length > 2000) {
        changes.content = 'Content was changed. It is too long to be displayed. Please check it manually.';
      }
    }

    if (previousState.httpStatus !== currentStateRequest.state.httpStatus) {
      changes.httpStatus = currentStateRequest.state.httpStatus;
    }

    if (previousState.loadingTime !== currentStateRequest.state.loadingTime) {
      changes.loadingTime = currentStateRequest.state.loadingTime;
    }

    return Object.keys(changes).length > 0
      ? {
          website: currentStateRequest.website,
          timestamp: currentStateRequest.timestamp,
          state: changes,
        }
      : null;
  }

  private getContentDifference(previousContent: string, currentContent: string) {
    const previousLines = previousContent.split('\n');
    const currentLines = currentContent.split('\n');
    const previousLinesSet = new Set(previousLines);
    const currentLinesSet = new Set(currentLines);

    return JSON.stringify({
      added: [...currentLinesSet].filter(line => !previousLinesSet.has(line)),
      removed: [...previousLinesSet].filter(line => !currentLinesSet.has(line)),
    });
  }
}
