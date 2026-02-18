// packages/sdk/src/utils/artifact-manager.ts

import { readFile } from 'node:fs/promises';
import type { Artifact } from '@zen-sci/core';

export class ArtifactManager {
  private artifacts: Artifact[] = [];

  /**
   * Register an artifact.
   */
  register(artifact: Artifact): void {
    this.artifacts.push(artifact);
  }

  /**
   * Get all registered artifacts.
   */
  getAll(): Artifact[] {
    return [...this.artifacts];
  }

  /**
   * Get an artifact by name.
   */
  getByName(name: string): Artifact | undefined {
    return this.artifacts.find((a) => a.name === name);
  }

  /**
   * Read artifact file into buffer.
   */
  async readBuffer(name: string): Promise<Buffer> {
    const artifact = this.getByName(name);
    if (!artifact) {
      throw new Error(`Artifact not found: ${name}`);
    }
    return readFile(artifact.path);
  }

  /**
   * Remove all registered artifacts.
   */
  clear(): void {
    this.artifacts = [];
  }
}
