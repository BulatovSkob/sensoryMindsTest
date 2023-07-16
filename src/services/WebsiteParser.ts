import { AxiosError, AxiosInstance } from 'axios';
import { LoggerInterface } from '../interfaces/LoggerInterface';
import { WebsiteParserInterface } from '../interfaces/WebsiteParserInterface';
import { WebsiteStateRequest } from '../interfaces/WebSiteStateRequest';

export class WebsiteParser implements WebsiteParserInterface {
  private readonly client: AxiosInstance;
  private readonly logger: LoggerInterface;

  constructor(client: AxiosInstance, logger: LoggerInterface) {
    this.client = client;
    this.logger = logger;
  }

  public async parse(website: string): Promise<WebsiteStateRequest> {
    const stateRequest: WebsiteStateRequest = {
      website,
      timestamp: new Date().toISOString(),
      state: {
        content: null,
        httpStatus: null,
        loadingTime: null,
      },
    };
    const startTime = new Date();

    try {
      const response = await this.client.get(website);

      stateRequest.state.content = response.data;
      stateRequest.state.httpStatus = response.status;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Error parsing website: ${error.message}`);
        if (error.response) {
          stateRequest.state.httpStatus = error.response.status;
        } else {
          stateRequest.state.httpStatus = error.code === 'ENOTFOUND' ? 404 : 500;
        }
      } else {
        this.logger.error(`Error parsing website: ${error}`);
      }
    }

    const endTime = new Date();

    stateRequest.state.loadingTime = endTime.getTime() - startTime.getTime();

    return stateRequest;
  }
}
