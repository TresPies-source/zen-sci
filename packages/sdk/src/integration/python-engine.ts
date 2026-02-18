// packages/sdk/src/integration/python-engine.ts
// Python subprocess orchestration for SymPy, pandoc, and custom scripts

import { spawn } from 'node:child_process';
import type { Logger } from '../logging/logger.js';

const DEFAULT_TIMEOUT = 5_000;
const COMPILATION_TIMEOUT = 60_000;

export class PythonEngine {
  private readonly pythonPath: string;

  constructor(
    private readonly logger: Logger,
    pythonPath?: string,
  ) {
    this.pythonPath = pythonPath ?? 'python3';
  }

  /**
   * Run a Python script with arguments and optional stdin input.
   */
  async run(
    scriptPath: string,
    args: string[] = [],
    input?: string,
    timeout?: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const effectiveTimeout = timeout ?? DEFAULT_TIMEOUT;

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [scriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: effectiveTimeout,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err: Error) => {
        this.logger.error('Python process error', {
          script: scriptPath,
          error: err.message,
        });
        reject(err);
      });

      proc.on('close', (code: number | null) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });

      if (input !== undefined) {
        proc.stdin.write(input);
      }
      proc.stdin.end();
    });
  }

  /**
   * Run a Python script with JSON stdin/stdout protocol.
   * Serializes inputData to JSON on stdin, parses JSON from stdout.
   */
  async runJSON<T>(
    scriptPath: string,
    inputData: unknown,
    timeout?: number,
  ): Promise<T> {
    const result = await this.run(
      scriptPath,
      [],
      JSON.stringify(inputData),
      timeout ?? COMPILATION_TIMEOUT,
    );

    if (result.exitCode !== 0) {
      this.logger.error('Python script failed', {
        script: scriptPath,
        exitCode: result.exitCode,
        stderr: result.stderr.slice(0, 500),
      });
      throw new Error(
        `Python script failed (exit ${result.exitCode}): ${result.stderr.slice(0, 200)}`,
      );
    }

    try {
      return JSON.parse(result.stdout) as T;
    } catch {
      throw new Error(`Failed to parse Python output: ${result.stdout.slice(0, 200)}`);
    }
  }

  /**
   * Check if Python is available by running a simple version check.
   */
  async checkAvailable(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const p = spawn(this.pythonPath, [
        '-c',
        'import sys; print(sys.version)',
      ], { timeout: DEFAULT_TIMEOUT });

      p.on('close', (code) => resolve(code === 0));
      p.on('error', () => resolve(false));
    });
  }

  /** Get the configured Python binary path. */
  getPythonPath(): string {
    return this.pythonPath;
  }
}
