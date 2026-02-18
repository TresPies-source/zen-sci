import { describe, it, expect } from 'vitest';
import { MCPErrorHandler } from '../src/errors/mcp-error-handler.js';
import { mapErrorCode } from '../src/errors/error-mapper.js';
import { ConversionError } from '@zen-sci/core';
import type { ConversionErrorData } from '@zen-sci/core';
import { Logger } from '../src/logging/logger.js';

describe('MCPErrorHandler', () => {
  const handler = new MCPErrorHandler();

  describe('toMCPError', () => {
    it('maps validation errors to code 400', () => {
      const error: ConversionErrorData = {
        code: 'VALIDATION_SOURCE_EMPTY',
        message: 'source must be a non-empty string',
      };
      const result = handler.toMCPError(error);
      expect(result.code).toBe(400);
      expect(result.message).toContain('VALIDATION_SOURCE_EMPTY');
    });

    it('maps schema-validation-failed to code 400', () => {
      const error: ConversionErrorData = {
        code: 'schema-validation-failed',
        message: 'bad input',
      };
      const result = handler.toMCPError(error);
      expect(result.code).toBe(400);
    });

    it('maps non-validation errors to code 500', () => {
      const error: ConversionErrorData = {
        code: 'CONVERSION_ERROR',
        message: 'something broke',
      };
      const result = handler.toMCPError(error);
      expect(result.code).toBe(500);
    });
  });

  describe('handleError', () => {
    it('converts ConversionError to ConversionErrorData', () => {
      const convError = new ConversionError('test failure');
      const data = handler.handleError(convError);
      expect(data.code).toBe('CONVERSION_ERROR');
      expect(data.message).toBe('test failure');
    });

    it('converts plain Error to ConversionErrorData', () => {
      const err = new Error('plain error');
      const data = handler.handleError(err);
      expect(data.code).toBe('Error');
      expect(data.message).toBe('plain error');
    });

    it('converts non-Error to ConversionErrorData', () => {
      const data = handler.handleError('string error');
      expect(data.code).toBe('UNKNOWN_ERROR');
      expect(data.message).toBe('string error');
    });

    it('converts null to ConversionErrorData', () => {
      const data = handler.handleError(null);
      expect(data.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('toMCPToolError', () => {
    it('returns error shape with isError: true', () => {
      const result = handler.toMCPToolError(new Error('oops'));
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('oops');
    });
  });

  describe('wrap', () => {
    const logger = new Logger('test');

    it('returns result on success', async () => {
      const result = await handler.wrap(async () => 42, logger);
      expect(result).toBe(42);
    });

    it('rethrows original error on failure', async () => {
      const original = new Error('fail');
      await expect(
        handler.wrap(async () => {
          throw original;
        }, logger),
      ).rejects.toBe(original);
    });
  });
});

describe('mapErrorCode', () => {
  it('maps known codes to friendly messages', () => {
    expect(mapErrorCode('pandoc-timeout')).toContain('timed out');
    expect(mapErrorCode('PARSE_ERROR')).toContain('parse');
    expect(mapErrorCode('CONVERSION_ERROR')).toContain('conversion');
  });

  it('returns the code itself for unknown codes', () => {
    expect(mapErrorCode('UNKNOWN_CUSTOM_CODE')).toBe('UNKNOWN_CUSTOM_CODE');
  });
});
