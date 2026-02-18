import { describe, it, expect, vi } from 'vitest';
import { runConversionPipeline, createZenSciServer, mapOutputFormatToRenderTarget } from '../src/factory/create-server.js';
import type { ModuleManifest } from '../src/factory/module-manifest.js';
import type { DocumentRequest, DocumentTree } from '@zen-sci/core';

const testManifest: ModuleManifest = {
  id: 'test-mcp',
  name: 'Test Module',
  version: '1.0.0',
  description: 'A test module',
  outputFormats: ['html', 'latex'],
  inputFormats: ['markdown'],
  features: ['parsing'],
  coreCapabilities: ['parser'],
  author: 'test',
  license: 'MIT',
  phase: 1,
  status: 'beta',
};

function makeRequest(overrides?: Partial<DocumentRequest>): DocumentRequest {
  return {
    id: 'test-req-1',
    source: '# Hello\n\nWorld',
    format: 'html',
    frontmatter: { title: 'Test' },
    options: {},
    ...overrides,
  };
}

describe('runConversionPipeline', () => {
  it('runs full pipeline with custom render', async () => {
    const ctx = createZenSciServer({
      name: 'test-pipeline',
      version: '1.0.0',
      manifest: testManifest,
    });

    const response = await runConversionPipeline(
      makeRequest(),
      ctx,
      {
        supportedFormats: ['html', 'latex'],
        render: async (_tree: DocumentTree, _req: DocumentRequest) => {
          return '<h1>Hello</h1><p>World</p>';
        },
      },
    );

    expect(response.id).toBe('test-req-1');
    expect(response.format).toBe('html');
    expect(response.content).toContain('Hello');
    expect(response.metadata.generatedAt).toBeDefined();
    expect(response.elapsed).toBeGreaterThanOrEqual(0);
  });

  it('runs pipeline with custom render and compile', async () => {
    const ctx = createZenSciServer({
      name: 'test-pipeline-compile',
      version: '1.0.0',
      manifest: testManifest,
    });

    const response = await runConversionPipeline(
      makeRequest({ format: 'latex' }),
      ctx,
      {
        supportedFormats: ['html', 'latex'],
        render: async () => '\\section{Hello}',
        compile: async (rendered) => `compiled:${String(rendered)}`,
      },
    );

    expect(response.content).toBe('compiled:\\section{Hello}');
  });

  it('processes bibliography during transform stage', async () => {
    const ctx = createZenSciServer({
      name: 'test-bib',
      version: '1.0.0',
      manifest: testManifest,
    });

    const bib = `@article{smith2020,
  title = {Test},
  author = {Smith, John},
  year = {2020}
}`;

    const response = await runConversionPipeline(
      makeRequest({ bibliography: bib }),
      ctx,
      {
        supportedFormats: ['html', 'latex'],
        render: async () => 'rendered',
      },
    );

    expect(response.id).toBe('test-req-1');
  });

  it('sets author metadata from array', async () => {
    const ctx = createZenSciServer({
      name: 'test-author-array',
      version: '1.0.0',
      manifest: testManifest,
    });

    const response = await runConversionPipeline(
      makeRequest({
        frontmatter: { title: 'Paper', author: ['Alice', 'Bob'] },
      }),
      ctx,
      {
        supportedFormats: ['html'],
        render: async () => 'out',
      },
    );

    expect(response.metadata.author).toEqual(['Alice', 'Bob']);
  });

  it('sets author metadata from string', async () => {
    const ctx = createZenSciServer({
      name: 'test-author-string',
      version: '1.0.0',
      manifest: testManifest,
    });

    const response = await runConversionPipeline(
      makeRequest({
        frontmatter: { title: 'Paper', author: 'Alice' },
      }),
      ctx,
      {
        supportedFormats: ['html'],
        render: async () => 'out',
      },
    );

    expect(response.metadata.author).toEqual(['Alice']);
  });

  it('omits author metadata when not present', async () => {
    const ctx = createZenSciServer({
      name: 'test-no-author',
      version: '1.0.0',
      manifest: testManifest,
    });

    const response = await runConversionPipeline(
      makeRequest({
        frontmatter: {},
      }),
      ctx,
      {
        supportedFormats: ['html'],
        render: async () => 'out',
      },
    );

    expect(response.metadata.author).toBeUndefined();
    expect(response.metadata.sources).toContain('markdown-source');
  });

  it('throws on schema validation failure', async () => {
    const ctx = createZenSciServer({
      name: 'test-fail',
      version: '1.0.0',
      manifest: testManifest,
    });

    await expect(
      runConversionPipeline(
        makeRequest({ source: '' }), // empty source fails validation
        ctx,
        {
          supportedFormats: ['html'],
          render: async () => 'out',
        },
      ),
    ).rejects.toThrow();
  });

  it('throws on unsupported format', async () => {
    const ctx = createZenSciServer({
      name: 'test-unsupported',
      version: '1.0.0',
      manifest: testManifest,
    });

    await expect(
      runConversionPipeline(
        makeRequest({ format: 'epub' }),
        ctx,
        {
          supportedFormats: ['html'], // epub not supported
          render: async () => 'out',
        },
      ),
    ).rejects.toThrow();
  });

  it('throws when render throws', async () => {
    const ctx = createZenSciServer({
      name: 'test-render-fail',
      version: '1.0.0',
      manifest: testManifest,
    });

    await expect(
      runConversionPipeline(
        makeRequest(),
        ctx,
        {
          supportedFormats: ['html'],
          render: async () => {
            throw new Error('render failed');
          },
        },
      ),
    ).rejects.toThrow('render failed');
  });

  it('uses default supportedFormats when not provided', async () => {
    const ctx = createZenSciServer({
      name: 'test-no-formats',
      version: '1.0.0',
      manifest: testManifest,
    });

    // Without supportedFormats, the format check will fail
    // because the empty array won't include 'html'
    await expect(
      runConversionPipeline(makeRequest(), ctx),
    ).rejects.toThrow();
  });
});
