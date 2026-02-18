// packages/sdk/src/factory/tool-builder.ts
// Helper to build MCP tool definitions

import type { ModuleManifest, MCPToolDefinition } from './module-manifest.js';

export class ToolBuilder {
  private manifest?: ModuleManifest;

  /**
   * Associate a manifest for format validation.
   */
  withManifest(manifest: ModuleManifest): ToolBuilder {
    this.manifest = manifest;
    return this;
  }

  /**
   * Build an MCPToolDefinition.
   */
  tool(
    name: string,
    description: string,
    inputSchema: MCPToolDefinition['inputSchema'],
    outputSchema?: Record<string, unknown>,
  ): MCPToolDefinition {
    const def: MCPToolDefinition = {
      name,
      description,
      inputSchema,
      outputType: 'json',
    };
    if (outputSchema) {
      def.outputSchema = outputSchema;
    }
    return def;
  }
}
