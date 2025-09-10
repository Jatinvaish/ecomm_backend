import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  log(message: string) {
    super.log(`[LOG]: ${message}`);
  }

  error(message: string, trace: string) {
    super.error(`[ERROR]: ${message}`, trace);
  }

  warn(message: string) {
    super.warn(`[WARN]: ${message}`);
  }
}
