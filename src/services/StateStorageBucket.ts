import { Storage } from '@google-cloud/storage';
import { LoggerInterface } from '../interfaces/LoggerInterface';

export class StateStorageBucket {
  private readonly bucketName: string;
  private readonly storage: Storage;
  private readonly logger: LoggerInterface;

  constructor(bucketName: string, storage: Storage, logger: LoggerInterface) {
    this.bucketName = bucketName;
    this.storage = storage;
    this.logger = logger;
  }

  public async get(fileName: string): Promise<string | null> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [content] = await file.download();

      return content.toString();
    } catch (error) {
      this.logger.error(`Error reading previous state: ${error instanceof Error ? error.message : error}`);

      return null;
    }
  }

  public async set(fileName: string, content: string) {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.save(content, {
        metadata: {
          contentType: 'application/json',
        },
      });
    } catch (error) {
      this.logger.error(`Error saving state: ${error instanceof Error ? error.message : error}`);
    }
  }
}
