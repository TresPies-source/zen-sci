import type { ConversionErrorData, DocumentLocation } from '../types.js';

export class ZenSciError extends Error {
  constructor(
    public code: string,
    message: string,
    public location?: DocumentLocation,
    public suggestions?: string[],
  ) {
    super(message);
    this.name = 'ZenSciError';
  }
}

export class ParseError extends ZenSciError {
  constructor(
    message: string,
    location?: DocumentLocation,
    suggestions?: string[],
  ) {
    super('PARSE_ERROR', message, location, suggestions);
    this.name = 'ParseError';
  }
}

export class ValidationError extends ZenSciError {
  constructor(
    message: string,
    location?: DocumentLocation,
    suggestions?: string[],
  ) {
    super('VALIDATION_ERROR', message, location, suggestions);
    this.name = 'ValidationError';
  }
}

export class ConversionError extends ZenSciError {
  constructor(
    message: string,
    location?: DocumentLocation,
    suggestions?: string[],
  ) {
    super('CONVERSION_ERROR', message, location, suggestions);
    this.name = 'ConversionError';
  }

  static fromData(data: ConversionErrorData): ConversionError {
    const error = new ConversionError(
      data.message,
      data.location,
      data.suggestions,
    );
    if (data.stack) {
      error.stack = data.stack;
    }
    return error;
  }

  toData(): ConversionErrorData {
    const data: ConversionErrorData = {
      code: this.code,
      message: this.message,
    };
    if (this.location) {
      data.location = this.location;
    }
    if (this.suggestions) {
      data.suggestions = this.suggestions;
    }
    if (this.stack) {
      data.stack = this.stack;
    }
    return data;
  }
}
