// packages/sdk/src/errors/error-mapper.ts
// Maps machine error codes to user-friendly messages

const ERROR_MAP: Record<string, string> = {
  'schema-validation-failed': 'Input validation failed: check required fields',
  'pandoc-conversion-failed': 'Document conversion failed: check markdown syntax',
  'tex-compilation-failed': 'LaTeX compilation failed: check math expressions and environments',
  'pandoc-timeout': 'Pandoc conversion timed out — the document may be too large',
  'pandoc-version-mismatch': 'Pandoc version is too old — version 3.0 or higher is required',
  'python-unavailable': 'Python is not available — install python3 for full functionality',
  PARSE_ERROR: 'Failed to parse markdown source',
  VALIDATION_ERROR: 'Document validation failed',
  CONVERSION_ERROR: 'Document conversion failed',
  MATH_INVALID_EXPRESSION: 'Invalid math expression — check the LaTeX syntax',
  CITATION_UNRESOLVED: 'One or more citations could not be resolved',
  LINK_DEAD: 'One or more URLs are unreachable',
  LINK_MISSING_TARGET: 'Internal cross-reference target not found',
};

/**
 * Map a machine error code to a user-friendly message.
 * Returns the original code if no mapping exists.
 */
export function mapErrorCode(code: string): string {
  return ERROR_MAP[code] ?? code;
}
