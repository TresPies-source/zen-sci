import { describe, it, expect } from 'vitest';
import { TemplateRegistry } from '../../src/templates/template-registry.js';

describe('TemplateRegistry', () => {
  const registry = new TemplateRegistry();

  // -------------------------------------------------------------------------
  // IEEE
  // -------------------------------------------------------------------------

  describe('paper-ieee', () => {
    it('returns columnsMode "two"', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.columnsMode).toBe('two');
    });

    it('has "IEEEtran" documentClass', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.documentClass).toBe('IEEEtran');
    });

    it('has classOptions containing "conference"', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.classOptions).toContain('conference');
    });

    it('has non-empty preambleLines', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.preambleLines.length).toBeGreaterThan(0);
    });

    it('preamble includes cite package', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.preambleLines.some((l) => l.includes('cite'))).toBe(true);
    });

    it('preamble includes amsmath', () => {
      const template = registry.getTemplate('paper-ieee');
      expect(template.preambleLines.some((l) => l.includes('amsmath'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // ACM
  // -------------------------------------------------------------------------

  describe('paper-acm', () => {
    it('returns columnsMode "two"', () => {
      const template = registry.getTemplate('paper-acm');
      expect(template.columnsMode).toBe('two');
    });

    it('has "acmart" documentClass', () => {
      const template = registry.getTemplate('paper-acm');
      expect(template.documentClass).toBe('acmart');
    });

    it('has classOptions containing "sigconf"', () => {
      const template = registry.getTemplate('paper-acm');
      expect(template.classOptions).toContain('sigconf');
    });

    it('has non-empty preambleLines', () => {
      const template = registry.getTemplate('paper-acm');
      expect(template.preambleLines.length).toBeGreaterThan(0);
    });

    it('preamble includes booktabs', () => {
      const template = registry.getTemplate('paper-acm');
      expect(template.preambleLines.some((l) => l.includes('booktabs'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // arXiv
  // -------------------------------------------------------------------------

  describe('paper-arxiv', () => {
    it('returns columnsMode "one"', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.columnsMode).toBe('one');
    });

    it('has "article" documentClass', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.documentClass).toBe('article');
    });

    it('has classOptions containing "a4paper"', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.classOptions).toContain('a4paper');
    });

    it('has non-empty preambleLines', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.preambleLines.length).toBeGreaterThan(0);
    });

    it('preamble includes geometry', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.preambleLines.some((l) => l.includes('geometry'))).toBe(true);
    });

    it('preamble includes natbib', () => {
      const template = registry.getTemplate('paper-arxiv');
      expect(template.preambleLines.some((l) => l.includes('natbib'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-format checks
  // -------------------------------------------------------------------------

  describe('all formats', () => {
    it('all templates have non-empty preambleLines', () => {
      const formats = ['paper-ieee', 'paper-acm', 'paper-arxiv'] as const;
      for (const format of formats) {
        const template = registry.getTemplate(format);
        expect(template.preambleLines.length).toBeGreaterThan(0);
      }
    });

    it('all templates have pandocArgs', () => {
      const formats = ['paper-ieee', 'paper-acm', 'paper-arxiv'] as const;
      for (const format of formats) {
        const template = registry.getTemplate(format);
        expect(template.pandocArgs.length).toBeGreaterThan(0);
      }
    });
  });
});
