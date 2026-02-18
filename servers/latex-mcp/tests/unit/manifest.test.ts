import { describe, it, expect } from 'vitest';
import { latexManifest } from '../../src/manifest.js';

describe('latexManifest', () => {
  it('has required id', () => {
    expect(latexManifest.id).toBe('latex-mcp');
  });

  it('has required name', () => {
    expect(latexManifest.name).toBe('LaTeX MCP');
  });

  it('has required version', () => {
    expect(latexManifest.version).toBe('0.1.0');
  });

  it('has a description', () => {
    expect(typeof latexManifest.description).toBe('string');
    expect(latexManifest.description.length).toBeGreaterThan(10);
  });

  it('supports latex output format', () => {
    expect(latexManifest.outputFormats).toContain('latex');
  });

  it('supports paper-ieee output format', () => {
    expect(latexManifest.outputFormats).toContain('paper-ieee');
  });

  it('supports paper-acm output format', () => {
    expect(latexManifest.outputFormats).toContain('paper-acm');
  });

  it('supports paper-arxiv output format', () => {
    expect(latexManifest.outputFormats).toContain('paper-arxiv');
  });

  it('supports thesis output format', () => {
    expect(latexManifest.outputFormats).toContain('thesis');
  });

  it('supports patent output format', () => {
    expect(latexManifest.outputFormats).toContain('patent');
  });

  it('has math-validation capability', () => {
    expect(latexManifest.features).toContain('math-validation');
  });

  it('has citation-resolution capability', () => {
    expect(latexManifest.features).toContain('citation-resolution');
  });

  it('has cross-references capability', () => {
    expect(latexManifest.features).toContain('cross-references');
  });

  it('has toc-generation capability', () => {
    expect(latexManifest.features).toContain('toc-generation');
  });

  it('has pdf-compilation capability', () => {
    expect(latexManifest.features).toContain('pdf-compilation');
  });

  it('requires all core capabilities', () => {
    expect(latexManifest.coreCapabilities).toContain('parser');
    expect(latexManifest.coreCapabilities).toContain('citations');
    expect(latexManifest.coreCapabilities).toContain('validation');
    expect(latexManifest.coreCapabilities).toContain('math');
  });

  it('is a phase 1 module', () => {
    expect(latexManifest.phase).toBe(1);
  });

  it('has beta status', () => {
    expect(latexManifest.status).toBe('beta');
  });

  it('has Apache-2.0 license', () => {
    expect(latexManifest.license).toBe('Apache-2.0');
  });

  it('accepts markdown input', () => {
    expect(latexManifest.inputFormats).toContain('markdown');
  });
});
