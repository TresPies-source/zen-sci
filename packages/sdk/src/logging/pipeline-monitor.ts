// packages/sdk/src/logging/pipeline-monitor.ts

import type { ConversionPipeline, ConversionErrorData } from '@zen-sci/core';
import type { Logger } from './logger.js';

export class PipelineMonitor {
  constructor(private readonly logger: Logger) {}

  /**
   * Log stage transitions at debug level.
   */
  track(pipeline: ConversionPipeline): void {
    const state = pipeline.getState();
    this.logger.debug(`Pipeline ${state.id} stage update`, {
      requestId: state.requestId,
      status: state.status,
      stages: state.stages.map((s) => `${s.name}:${s.status}`),
    });
  }

  /**
   * Log pipeline completion at info level.
   */
  logCompletion(pipeline: ConversionPipeline): void {
    const state = pipeline.getState();
    this.logger.info(`Pipeline ${state.id} completed (${pipeline.elapsed()}ms)`, {
      requestId: state.requestId,
      elapsed: pipeline.elapsed(),
      stages: state.stages.length,
    });
  }

  /**
   * Log pipeline failure at error level.
   */
  logFailure(pipeline: ConversionPipeline, error: ConversionErrorData): void {
    const state = pipeline.getState();
    this.logger.error(`Pipeline ${state.id} failed: ${error.message}`, {
      requestId: state.requestId,
      errorCode: error.code,
      elapsed: pipeline.elapsed(),
    });
  }
}
