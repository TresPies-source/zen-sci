const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

export class Logger {
  private level: string;

  constructor(private context?: string) {
    this.level = process.env['LOG_LEVEL'] ?? 'info';
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  private isLogLevel(value: string): value is LogLevel {
    return value in LOG_LEVELS;
  }

  private log(
    level: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const configuredLevel = this.isLogLevel(this.level)
      ? LOG_LEVELS[this.level]
      : LOG_LEVELS.info;
    const messageLevel = this.isLogLevel(level)
      ? LOG_LEVELS[level]
      : LOG_LEVELS.info;

    if (messageLevel < configuredLevel) {
      return;
    }

    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (this.context) {
      entry['context'] = this.context;
    }

    if (data) {
      Object.assign(entry, data);
    }

    process.stderr.write(JSON.stringify(entry) + '\n');
  }
}
