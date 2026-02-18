// packages/sdk/src/factory/module-manifest.ts
// ModuleManifest and MCPToolDefinition interfaces

import type { OutputFormat } from '@zen-sci/core';

/**
 * ModuleManifest: Metadata describing a ZenSci module server.
 */
export interface ModuleManifest {
  /** Module identifier (kebab-case, e.g., 'paper-mcp') */
  id: string;

  /** Human-readable name (e.g., 'Research Paper Generator') */
  name: string;

  /** Module version (semver) */
  version: string;

  /** Module description (1-2 sentences) */
  description: string;

  /** Supported output formats (subset of OutputFormat union) */
  outputFormats: OutputFormat[];

  /** Supported input formats (usually just 'markdown') */
  inputFormats: string[];

  /** Supported features (e.g., 'citations', 'math', 'toc') */
  features: string[];

  /** Required capabilities from packages/core */
  coreCapabilities: ('parser' | 'citations' | 'validation' | 'math')[];

  /** Documentation URL */
  documentationUrl?: string;

  /** Author/maintainer */
  author: string;

  /** License (e.g., 'Apache-2.0') */
  license: string;

  /** Phase (1, 2, 3) */
  phase: 1 | 2 | 3;

  /** Shipping status */
  status: 'beta' | 'stable' | 'deprecated';

  /** Custom options schema */
  optionsSchema?: Record<string, unknown>;

  /** Example input (markdown snippet) */
  exampleInput?: string;

  /** Example output (shortened) */
  exampleOutput?: string;

  /** Release notes or changelog */
  releaseNotes?: string;
}

/**
 * MCPToolDefinition: Definition of a single MCP tool.
 */
export interface MCPToolDefinition {
  /** Tool name (snake_case) */
  name: string;

  /** Short description */
  description?: string;

  /** Input JSON Schema */
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: unknown[] }>;
    required: string[];
    additionalProperties?: boolean;
  };

  /** Expected output type */
  outputType?: 'text' | 'buffer' | 'json';

  /** Output JSON Schema */
  outputSchema?: Record<string, unknown>;
}
