import { PartialWebsiteStateRequest, WebsiteStateRequest } from './WebSiteStateRequest';

export interface WebsiteChangesRecorderInterface {
  recordChanges(website: string, lastRequest: WebsiteStateRequest, changes: PartialWebsiteStateRequest): Promise<void>;
}
