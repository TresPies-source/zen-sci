// packages/sdk/src/utils/temp-file-manager.ts

import { mkdirSync, rmSync } from 'node:fs';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Static cleanup registry — signal handlers are registered exactly once.
// ---------------------------------------------------------------------------

/** All active TempFileManager instances that need cleanup on exit. */
const activeManagers = new Set<TempFileManager>();
let handlersRegistered = false;

function runAllCleanups(): void {
  for (const mgr of activeManagers) {
    mgr['cleanupSync']();
  }
}

function ensureHandlersRegistered(): void {
  if (handlersRegistered) return;
  handlersRegistered = true;

  process.on('exit', runAllCleanups);
  process.on('SIGINT', () => {
    runAllCleanups();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    runAllCleanups();
    process.exit(143);
  });
}

// ---------------------------------------------------------------------------

export class TempFileManager {
  private readonly baseDir: string;
  private readonly createdPaths: Set<string> = new Set();
  private cleaned = false;

  constructor(moduleName: string) {
    this.baseDir = join(tmpdir(), `zen-sci-${moduleName}-${process.pid}-${Date.now()}`);
    mkdirSync(this.baseDir, { recursive: true });

    // Register with the shared cleanup registry (handlers added only once).
    activeManagers.add(this);
    ensureHandlersRegistered();
  }

  /** Synchronous cleanup called from process exit handlers. */
  private cleanupSync(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    activeManagers.delete(this);
    try {
      rmSync(this.baseDir, { recursive: true, force: true });
    } catch {
      // Ignore errors during process shutdown
    }
  }

  /**
   * Create a temporary file with the given extension.
   * Optionally write initial content.
   */
  async createTempFile(extension: string, content?: string | Buffer): Promise<string> {
    const filename = `${randomUUID()}.${extension.replace(/^\./, '')}`;
    const filePath = join(this.baseDir, filename);

    if (content !== undefined) {
      await writeFile(filePath, content);
    } else {
      await writeFile(filePath, '');
    }

    this.createdPaths.add(filePath);
    return filePath;
  }

  /**
   * Create a temporary subdirectory.
   */
  async createTempDir(): Promise<string> {
    const dirName = randomUUID();
    const dirPath = join(this.baseDir, dirName);
    await mkdir(dirPath, { recursive: true });
    this.createdPaths.add(dirPath);
    return dirPath;
  }

  /**
   * Delete all temp files and the base directory.
   */
  async cleanup(): Promise<void> {
    if (this.cleaned) return;
    this.cleaned = true;
    activeManagers.delete(this);

    for (const p of this.createdPaths) {
      try {
        await rm(p, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    try {
      await rm(this.baseDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    this.createdPaths.clear();
  }

  /** Get the base temp directory path. */
  getBaseDir(): string {
    return this.baseDir;
  }
}
