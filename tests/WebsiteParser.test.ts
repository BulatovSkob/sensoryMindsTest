import { AxiosInstance } from 'axios';
import { LoggerInterface } from '../src/interfaces/LoggerInterface';
import { WebsiteParser } from '../src/services/WebsiteParser';

describe('WebsiteParser', () => {
  let websiteParser: WebsiteParser;

  const mockedAxiosGet = jest.fn();
  const loggerMock: LoggerInterface = {
    error: jest.fn(),
    info: jest.fn(),
  };
  const axiosInstanceMock: AxiosInstance = {
    get: mockedAxiosGet,
  } as unknown as AxiosInstance;

  beforeEach(() => {
    websiteParser = new WebsiteParser(axiosInstanceMock, loggerMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse website correctly when the request is successful', async () => {
    const responseData = 'Website content here';
    const responseStatus = 200;

    mockedAxiosGet.mockResolvedValueOnce({
      data: responseData,
      status: responseStatus,
    });

    const website = 'http://example.com';
    const stateRequest = await websiteParser.parse(website);

    expect(stateRequest.website).toBe(website);
    expect(stateRequest.state.content).toBe(responseData);
    expect(stateRequest.state.httpStatus).toBe(responseStatus);
    expect(stateRequest.state.loadingTime).not.toBeNull();
    expect(loggerMock.error).not.toHaveBeenCalled();
  });
});
