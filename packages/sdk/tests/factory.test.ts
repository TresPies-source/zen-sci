import { describe, it, expect } from 'vitest';
import { createZenSciServer, mapOutputFormatToRenderTarget } from '../src/factory/create-server.js';
import type { ModuleManifest } from '../src/factory/module-manifest.js';

const testManifest: ModuleManifest = {
  id: 'test-mcp',
  name: 'Test Module',
  version: '1.0.0',
  description: 'A test module for unit testing',
  outputFormats: ['html', 'latex'],
  inputFormats: ['markdown'],
  features: ['parsing'],
  coreCapabilities: ['parser'],
  author: 'test',
  license: 'MIT',
  phase: 1,
  status: 'beta',
};

describe('createZenSciServer', () => {
  it('returns a ZenSciContext with all expected properties', () => {
    const ctx = createZenSciServer({
      name: 'test-mcp',
      version: '1.0.0',
      manifest: testManifest,
    });

    expect(ctx.server).toBeDefined();
    expect(ctx.errorHandler).toBeDefined();
    expect(ctx.logger).toBeDefined();
    expect(ctx.tempFileManager).toBeDefined();
    expect(ctx.artifactManager).toBeDefined();
    expect(ctx.pythonEngine).toBeDefined();
    expect(ctx.start).toBeTypeOf('function');
  });

  it('server has tool method from McpServer', () => {
    const ctx = createZenSciServer({
      name: 'test-mcp',
      version: '1.0.0',
      manifest: testManifest,
    });

    // McpServer should have tool() method for registering tools
    expect(typeof ctx.server.tool).toBe('function');
  });

  it('creates independent contexts for different configs', () => {
    const ctx1 = createZenSciServer({
      name: 'mod-a',
      version: '1.0.0',
      manifest: { ...testManifest, id: 'mod-a' },
    });
    const ctx2 = createZenSciServer({
      name: 'mod-b',
      version: '2.0.0',
      manifest: { ...testManifest, id: 'mod-b' },
    });

    expect(ctx1.server).not.toBe(ctx2.server);
    expect(ctx1.logger).not.toBe(ctx2.logger);
    expect(ctx1.tempFileManager).not.toBe(ctx2.tempFileManager);
  });
});

describe('mapOutputFormatToRenderTarget', () => {
  it('maps latex to latex', () => {
    expect(mapOutputFormatToRenderTarget('latex')).toBe('latex');
  });

  it('maps html to html5', () => {
    expect(mapOutputFormatToRenderTarget('html')).toBe('html5');
  });

  it('maps email to html5', () => {
    expect(mapOutputFormatToRenderTarget('email')).toBe('html5');
  });

  it('maps beamer to beamer', () => {
    expect(mapOutputFormatToRenderTarget('beamer')).toBe('beamer');
  });

  it('maps paper-ieee to latex', () => {
    expect(mapOutputFormatToRenderTarget('paper-ieee')).toBe('latex');
  });

  it('maps paper-acm to latex', () => {
    expect(mapOutputFormatToRenderTarget('paper-acm')).toBe('latex');
  });

  it('maps epub to epub3', () => {
    expect(mapOutputFormatToRenderTarget('epub')).toBe('epub3');
  });

  it('maps pptx to pptx', () => {
    expect(mapOutputFormatToRenderTarget('pptx')).toBe('pptx');
  });

  it('maps docx to docx', () => {
    expect(mapOutputFormatToRenderTarget('docx')).toBe('docx');
  });

  it('maps docs to docx', () => {
    expect(mapOutputFormatToRenderTarget('docs')).toBe('docx');
  });

  it('maps grant-latex to latex', () => {
    expect(mapOutputFormatToRenderTarget('grant-latex')).toBe('latex');
  });

  it('maps thesis to latex', () => {
    expect(mapOutputFormatToRenderTarget('thesis')).toBe('latex');
  });

  it('maps resume to latex', () => {
    expect(mapOutputFormatToRenderTarget('resume')).toBe('latex');
  });

  it('maps lab-notebook to html5', () => {
    expect(mapOutputFormatToRenderTarget('lab-notebook')).toBe('html5');
  });

  it('maps revealjs to revealjs', () => {
    expect(mapOutputFormatToRenderTarget('revealjs')).toBe('revealjs');
  });
});
