import { WebsiteState } from './WebsiteState';

export interface WebsiteStateRequest {
  website: string;
  timestamp: string;
  state: WebsiteState;
}

export interface PartialWebsiteStateRequest extends Omit<WebsiteStateRequest, 'state'> {
  state: Partial<WebsiteState>;
}
