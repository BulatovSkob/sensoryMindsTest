import { LoggerInterface } from '../interfaces/LoggerInterface';

export class Logger implements LoggerInterface {
  error(message: string): void {
    console.error(message);
  }

  info(message: string): void {
    console.info(message);
  }
}
