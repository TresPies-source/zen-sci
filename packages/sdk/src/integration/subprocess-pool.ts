// packages/sdk/src/integration/subprocess-pool.ts
// Simple concurrency limiter for subprocess execution

export class SubprocessPool {
  private running = 0;
  private readonly queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor(private readonly maxConcurrent: number = 4) {}

  /**
   * Run a function with concurrency limiting.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running < this.maxConcurrent) {
      return this.execute(fn);
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  private async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        this.execute(next.fn).then(next.resolve, next.reject);
      }
    }
  }

  /** Current number of running tasks. */
  get activeCount(): number {
    return this.running;
  }

  /** Number of tasks waiting in queue. */
  get pendingCount(): number {
    return this.queue.length;
  }
}
