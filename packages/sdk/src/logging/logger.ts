// packages/sdk/src/logging/logger.ts
// Structured logger — JSON to stderr, matching core Logger pattern

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

export class Logger {
  private readonly level: LogLevel;
  private readonly moduleName: string;

  constructor(moduleName: string) {
    const env = process.env['LOG_LEVEL'] ?? 'info';
    this.level = isLogLevel(env) ? env : 'info';
    this.moduleName = moduleName;
  }

  info(msg: string, data?: Record<string, unknown>): void {
    this.log('info', msg, data);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    this.log('warn', msg, data);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    this.log('error', msg, data);
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    this.log('debug', msg, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const entry: Record<string, unknown> = {
      level,
      module: this.moduleName,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data) {
      Object.assign(entry, data);
    }

    process.stderr.write(JSON.stringify(entry) + '\n');
  }
}

function isLogLevel(value: string): value is LogLevel {
  return value in LOG_LEVELS;
}
