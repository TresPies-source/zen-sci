// packages/sdk/src/utils/request-id-generator.ts

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 request ID.
 */
export function generateRequestId(): string {
  return uuidv4();
}
