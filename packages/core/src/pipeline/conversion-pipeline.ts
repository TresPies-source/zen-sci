import { randomUUID } from 'node:crypto';
import type {
  ConversionPipelineData,
  PipelineStage,
  ConversionErrorData,
} from '../types.js';

export class ConversionPipeline {
  private readonly id: string;
  private readonly requestId: string;
  private stages: PipelineStage[];
  private startedAt: Date;
  private completedAt?: Date;
  private status: ConversionPipelineData['status'];
  private result?: { success: boolean; error?: ConversionErrorData };

  constructor(requestId: string) {
    this.id = randomUUID();
    this.requestId = requestId;
    this.stages = [];
    this.startedAt = new Date();
    this.status = 'pending';
  }

  start(): void {
    this.status = 'running';
    this.startedAt = new Date();
  }

  startStage(name: PipelineStage['name']): void {
    this.stages.push({
      name,
      status: 'running',
      startedAt: new Date(),
    });
  }

  completeStage(name: PipelineStage['name'], progress?: number): void {
    const stage = this.stages.find(
      (s) => s.name === name && s.status === 'running',
    );
    if (!stage) {
      return;
    }
    stage.status = 'complete';
    stage.elapsed = stage.startedAt
      ? Date.now() - stage.startedAt.getTime()
      : 0;
    if (progress !== undefined) {
      stage.progress = progress;
    }
  }

  failStage(name: PipelineStage['name'], error: ConversionErrorData): void {
    const stage = this.stages.find(
      (s) => s.name === name && s.status === 'running',
    );
    if (!stage) {
      return;
    }
    stage.status = 'failed';
    stage.error = error;
    stage.elapsed = stage.startedAt
      ? Date.now() - stage.startedAt.getTime()
      : 0;
  }

  complete(
    success: boolean,
    _result?: unknown,
    error?: ConversionErrorData,
  ): void {
    this.status = success ? 'completed' : 'failed';
    this.completedAt = new Date();
    this.result = { success };
    if (error) {
      this.result.error = error;
    }
  }

  getState(): ConversionPipelineData {
    const state: ConversionPipelineData = {
      id: this.id,
      requestId: this.requestId,
      stages: [...this.stages],
      startedAt: this.startedAt,
      status: this.status,
    };
    if (this.completedAt) {
      state.completedAt = this.completedAt;
    }
    if (this.result) {
      state.result = { ...this.result };
    }
    return state;
  }

  elapsed(): number {
    return Date.now() - this.startedAt.getTime();
  }
}
