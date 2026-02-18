// packages/sdk/src/types.ts
// SDK-specific types for ZenSci MCP servers

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  OutputFormat,
  DocumentRequest,
  DocumentResponse,
  DocumentTree,
  ConversionErrorData,
  Artifact,
} from '@zen-sci/core';
import type { MCPErrorHandler } from './errors/mcp-error-handler.js';
import type { Logger } from './logging/logger.js';
import type { TempFileManager } from './utils/temp-file-manager.js';
import type { ArtifactManager } from './utils/artifact-manager.js';
import type { PythonEngine } from './integration/python-engine.js';
import type { ModuleManifest } from './factory/module-manifest.js';

// ---------------------------------------------------------------------------
// ZenSciServerConfig
// ---------------------------------------------------------------------------

export interface ZenSciServerConfig {
  /** Module name (e.g., 'paper-mcp', 'latex-mcp') */
  name: string;

  /** Module version (semver) */
  version: string;

  /** Module manifest (capabilities, supported formats, etc.) */
  manifest: ModuleManifest;
}

// ---------------------------------------------------------------------------
// ZenSciContext
// ---------------------------------------------------------------------------

export interface ZenSciContext {
  /** Pre-configured McpServer instance (MCP SDK v2) */
  server: McpServer;

  /** Error handler for MCP errors */
  errorHandler: MCPErrorHandler;

  /** Structured logger */
  logger: Logger;

  /** Temp file manager (auto-cleanup on process exit) */
  tempFileManager: TempFileManager;

  /** Artifact manager for secondary outputs */
  artifactManager: ArtifactManager;

  /** Python engine for SymPy, pandoc, etc. */
  pythonEngine: PythonEngine;

  /** Start the server (connect stdio transport) */
  start: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Pipeline options for runConversionPipeline
// ---------------------------------------------------------------------------

export interface ConversionPipelineOptions {
  render?: (tree: DocumentTree, request: DocumentRequest) => Promise<string | Buffer>;
  compile?: (rendered: string | Buffer, request: DocumentRequest) => Promise<string | Buffer>;
  supportedFormats: OutputFormat[];
}

// ---------------------------------------------------------------------------
// Re-export commonly used core types for convenience
// ---------------------------------------------------------------------------

export type {
  OutputFormat,
  DocumentRequest,
  DocumentResponse,
  DocumentTree,
  ConversionErrorData,
  Artifact,
};
