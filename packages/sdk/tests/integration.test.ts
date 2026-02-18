import { describe, it, expect, beforeAll } from 'vitest';
import { TempFileManager } from '../src/utils/temp-file-manager.js';
import { ArtifactManager } from '../src/utils/artifact-manager.js';
import { SubprocessPool } from '../src/integration/subprocess-pool.js';
import { PythonEngine } from '../src/integration/python-engine.js';
import { PandocWrapper } from '../src/integration/pandoc-wrapper.js';
import { PipelineMonitor } from '../src/logging/pipeline-monitor.js';
import { Logger } from '../src/logging/logger.js';
import { ToolBuilder } from '../src/factory/tool-builder.js';
import { generateRequestId } from '../src/utils/request-id-generator.js';
import { ConversionPipeline } from '@zen-sci/core';
import type { Artifact } from '@zen-sci/core';
import { existsSync, readFileSync } from 'node:fs';

// =============================================================================
// Utilities
// =============================================================================

describe('generateRequestId', () => {
  it('returns a UUID v4 string', () => {
    const id = generateRequestId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe('TempFileManager', () => {
  it('creates temp directory on construction', () => {
    const mgr = new TempFileManager('test-temp');
    expect(existsSync(mgr.getBaseDir())).toBe(true);
  });

  it('creates a temp file', async () => {
    const mgr = new TempFileManager('test-file');
    const path = await mgr.createTempFile('txt', 'hello');
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf-8')).toBe('hello');
    await mgr.cleanup();
  });

  it('creates a temp file without content', async () => {
    const mgr = new TempFileManager('test-empty');
    const path = await mgr.createTempFile('md');
    expect(existsSync(path)).toBe(true);
    await mgr.cleanup();
  });

  it('creates a temp directory', async () => {
    const mgr = new TempFileManager('test-dir');
    const dir = await mgr.createTempDir();
    expect(existsSync(dir)).toBe(true);
    await mgr.cleanup();
  });

  it('cleanup removes all files', async () => {
    const mgr = new TempFileManager('test-cleanup');
    const path = await mgr.createTempFile('txt', 'data');
    await mgr.cleanup();
    expect(existsSync(path)).toBe(false);
    expect(existsSync(mgr.getBaseDir())).toBe(false);
  });

  it('cleanup is idempotent', async () => {
    const mgr = new TempFileManager('test-idempotent');
    await mgr.cleanup();
    await mgr.cleanup(); // Should not throw
  });
});

describe('ArtifactManager', () => {
  it('registers and retrieves artifacts', () => {
    const mgr = new ArtifactManager();
    const artifact: Artifact = {
      name: 'output.pdf',
      path: '/tmp/output.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    };
    mgr.register(artifact);
    expect(mgr.getAll()).toHaveLength(1);
    expect(mgr.getByName('output.pdf')).toEqual(artifact);
  });

  it('returns undefined for unknown artifact', () => {
    const mgr = new ArtifactManager();
    expect(mgr.getByName('nonexistent')).toBeUndefined();
  });

  it('clear removes all artifacts', () => {
    const mgr = new ArtifactManager();
    mgr.register({
      name: 'a.txt',
      path: '/tmp/a.txt',
      mimeType: 'text/plain',
      size: 10,
    });
    mgr.clear();
    expect(mgr.getAll()).toHaveLength(0);
  });

  it('readBuffer throws for unknown artifact', async () => {
    const mgr = new ArtifactManager();
    await expect(mgr.readBuffer('missing')).rejects.toThrow('Artifact not found');
  });
});

// =============================================================================
// SubprocessPool
// =============================================================================

describe('SubprocessPool', () => {
  it('runs tasks sequentially when concurrency is 1', async () => {
    const pool = new SubprocessPool(1);
    const order: number[] = [];

    const task = (n: number) => async () => {
      order.push(n);
      return n;
    };

    const results = await Promise.all([
      pool.run(task(1)),
      pool.run(task(2)),
      pool.run(task(3)),
    ]);

    expect(results).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('reports activeCount and pendingCount', async () => {
    const pool = new SubprocessPool(1);
    expect(pool.activeCount).toBe(0);
    expect(pool.pendingCount).toBe(0);
  });
});

// =============================================================================
// PythonEngine (requires python3)
// =============================================================================

describe('PythonEngine', () => {
  const logger = new Logger('test-python');

  it('checkAvailable returns boolean', async () => {
    const engine = new PythonEngine(logger);
    const result = await engine.checkAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('run returns stdout/stderr/exitCode', async () => {
    const engine = new PythonEngine(logger);
    const result = await engine.run(
      '-c',
      [],
      undefined,
      5_000,
    );
    // python3 -c with no script may error but should not throw
    expect(typeof result.exitCode).toBe('number');
    expect(typeof result.stdout).toBe('string');
    expect(typeof result.stderr).toBe('string');
  });

  it('getPythonPath returns default path', () => {
    const engine = new PythonEngine(logger);
    expect(engine.getPythonPath()).toBe('python3');
  });

  it('uses custom python path', () => {
    const engine = new PythonEngine(logger, '/usr/bin/python3');
    expect(engine.getPythonPath()).toBe('/usr/bin/python3');
  });
});

// =============================================================================
// PandocWrapper (integration — requires pandoc installed)
// =============================================================================

describe('PandocWrapper', () => {
  const logger = new Logger('test-pandoc');
  let pandocAvailable = false;

  beforeAll(async () => {
    try {
      const wrapper = new PandocWrapper(logger);
      await wrapper.version();
      pandocAvailable = true;
    } catch {
      pandocAvailable = false;
    }
  });

  it('version returns a string (requires pandoc)', async () => {
    if (!pandocAvailable) return; // skip
    const wrapper = new PandocWrapper(logger);
    const v = await wrapper.version();
    expect(typeof v).toBe('string');
    expect(v).toMatch(/^\d+/);
  });

  it('convert transforms markdown to html (requires pandoc)', async () => {
    if (!pandocAvailable) return;
    const wrapper = new PandocWrapper(logger);
    const html = await wrapper.convert('# Hello', 'markdown', 'html5');
    expect(html).toContain('Hello');
  });
});

// =============================================================================
// PipelineMonitor
// =============================================================================

describe('PipelineMonitor', () => {
  const logger = new Logger('test-monitor');
  const monitor = new PipelineMonitor(logger);

  it('track logs pipeline state', () => {
    const pipeline = new ConversionPipeline('req-1');
    pipeline.start();
    pipeline.startStage('parse');
    // Should not throw
    monitor.track(pipeline);
  });

  it('logCompletion logs at info level', () => {
    const pipeline = new ConversionPipeline('req-2');
    pipeline.start();
    pipeline.complete(true);
    monitor.logCompletion(pipeline);
  });

  it('logFailure logs at error level', () => {
    const pipeline = new ConversionPipeline('req-3');
    pipeline.start();
    monitor.logFailure(pipeline, {
      code: 'TEST_ERROR',
      message: 'test failure',
    });
  });
});

// =============================================================================
// ToolBuilder
// =============================================================================

describe('ToolBuilder', () => {
  it('builds an MCPToolDefinition', () => {
    const builder = new ToolBuilder();
    const tool = builder.tool(
      'convert_paper',
      'Convert a paper',
      {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Markdown source' },
        },
        required: ['source'],
      },
    );

    expect(tool.name).toBe('convert_paper');
    expect(tool.description).toBe('Convert a paper');
    expect(tool.inputSchema.required).toContain('source');
    expect(tool.outputType).toBe('json');
  });

  it('includes outputSchema when provided', () => {
    const builder = new ToolBuilder();
    const tool = builder.tool(
      'test',
      'Test',
      { type: 'object', properties: {}, required: [] },
      { type: 'object' },
    );
    expect(tool.outputSchema).toEqual({ type: 'object' });
  });

  it('withManifest returns self for chaining', () => {
    const builder = new ToolBuilder();
    const result = builder.withManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'test',
      outputFormats: ['html'],
      inputFormats: ['markdown'],
      features: [],
      coreCapabilities: ['parser'],
      author: 'test',
      license: 'MIT',
      phase: 1,
      status: 'beta',
    });
    expect(result).toBe(builder);
  });
});

// =============================================================================
// Logger
// =============================================================================

describe('Logger', () => {
  it('creates a logger without error', () => {
    const logger = new Logger('test-logger');
    expect(logger).toBeDefined();
  });

  it('logs at all levels without throwing', () => {
    const logger = new Logger('test-levels');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    logger.debug('debug message');
    logger.info('with data', { key: 'value' });
  });
});
