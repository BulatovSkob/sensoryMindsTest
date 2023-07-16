import { WebsiteStateRequest } from './WebSiteStateRequest';

export interface WebsiteParserInterface {
  parse(url: string): Promise<WebsiteStateRequest>;
}
