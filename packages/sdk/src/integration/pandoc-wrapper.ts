// packages/sdk/src/integration/pandoc-wrapper.ts
// Pandoc execution abstraction

import { spawn } from 'node:child_process';
import type { Logger } from '../logging/logger.js';

const DEFAULT_TIMEOUT = 30_000;

export class PandocWrapper {
  constructor(private readonly logger: Logger) {}

  /**
   * Convert content from one format to another via pandoc stdin/stdout.
   */
  async convert(
    content: string,
    fromFormat: string,
    toFormat: string,
    extraArgs: string[] = [],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-f', fromFormat,
        '-t', toFormat,
        ...extraArgs,
      ];

      const proc = spawn('pandoc', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: DEFAULT_TIMEOUT,
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
        if (err.message.includes('ETIMEDOUT') || err.message.includes('timed out')) {
          reject(new Error('pandoc-timeout: Pandoc conversion timed out'));
        } else {
          reject(new Error(`pandoc-conversion-failed: ${err.message}`));
        }
      });

      proc.on('close', (code: number | null) => {
        if (code !== 0) {
          this.logger.error('Pandoc conversion failed', {
            exitCode: code,
            stderr: stderr.slice(0, 500),
          });
          reject(
            new Error(
              `pandoc-conversion-failed: pandoc exited with code ${String(code)}: ${stderr.slice(0, 200)}`,
            ),
          );
          return;
        }
        resolve(stdout);
      });

      proc.stdin.write(content);
      proc.stdin.end();
    });
  }

  /**
   * Convert a file to another format, writing the output to a file.
   */
  async convertFile(
    inputPath: string,
    toFormat: string,
    outputPath: string,
    extraArgs: string[] = [],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        inputPath,
        '-t', toFormat,
        '-o', outputPath,
        ...extraArgs,
      ];

      const proc = spawn('pandoc', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: DEFAULT_TIMEOUT,
      });

      let stderr = '';

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err: Error) => {
        reject(new Error(`pandoc-conversion-failed: ${err.message}`));
      });

      proc.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(
            new Error(
              `pandoc-conversion-failed: pandoc exited with code ${String(code)}: ${stderr.slice(0, 200)}`,
            ),
          );
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Get the installed pandoc version string.
   */
  async version(): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('pandoc', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5_000,
      });

      let stdout = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.on('error', (err: Error) => {
        reject(new Error(`pandoc not found: ${err.message}`));
      });

      proc.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error('pandoc --version returned non-zero exit code'));
          return;
        }
        // First line: "pandoc 3.x.x"
        const firstLine = stdout.split('\n')[0] ?? '';
        const versionMatch = firstLine.match(/pandoc\s+([\d.]+)/);
        resolve(versionMatch?.[1] ?? 'unknown');
      });
    });
  }
}
