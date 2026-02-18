// packages/sdk/src/errors/mcp-error-handler.ts

import { ConversionError } from '@zen-sci/core';
import type { ConversionErrorData } from '@zen-sci/core';
import { mapErrorCode } from './error-mapper.js';
import type { Logger } from '../logging/logger.js';

export class MCPErrorHandler {
  /**
   * Convert a ConversionErrorData to MCP error format.
   * Validation errors → code 400, internal errors → code 500.
   */
  toMCPError(error: ConversionErrorData): { code: number; message: string } {
    const isValidation =
      error.code.startsWith('VALIDATION_') ||
      error.code === 'schema-validation-failed';

    return {
      code: isValidation ? 400 : 500,
      message: `[${error.code}] ${mapErrorCode(error.code)}: ${error.message}`,
    };
  }

  /**
   * Convert any error to a ConversionErrorData (wire-safe shape).
   */
  handleError(error: unknown): ConversionErrorData {
    if (error instanceof ConversionError) {
      return error.toData();
    }
    if (error instanceof Error) {
      const data: ConversionErrorData = {
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message,
      };
      if (error.stack) {
        data.stack = error.stack;
      }
      return data;
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
    };
  }

  /**
   * Convert any error to MCP tool result error shape.
   */
  toMCPToolError(error: unknown): {
    content: [{ type: 'text'; text: string }];
    isError: true;
  } {
    const conversionError = this.handleError(error);
    const errorMessage = `[${conversionError.code}] ${conversionError.message}`;
    return {
      content: [{ type: 'text' as const, text: errorMessage }],
      isError: true as const,
    };
  }

  /**
   * Wrap an async function, catching errors and rethrowing as MCP-compatible.
   */
  async wrap<T>(fn: () => Promise<T>, logger: Logger): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      const errData = this.handleError(error);
      logger.error(`MCP error: ${errData.message}`, {
        code: errData.code,
      });
      throw error;
    }
  }
}
