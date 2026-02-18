// packages/sdk/src/factory/create-server.ts
// createZenSciServer() factory — composition over inheritance

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ConversionPipeline,
  SchemaValidator,
  MarkdownParser,
  CitationManager,
} from '@zen-sci/core';
import type {
  OutputFormat,
  DocumentRequest,
  DocumentResponse,
  DocumentTree,
} from '@zen-sci/core';

import { Logger } from '../logging/logger.js';
import { MCPErrorHandler } from '../errors/mcp-error-handler.js';
import { TempFileManager } from '../utils/temp-file-manager.js';
import { ArtifactManager } from '../utils/artifact-manager.js';
import { PythonEngine } from '../integration/python-engine.js';
import { PandocWrapper } from '../integration/pandoc-wrapper.js';
import type { ZenSciServerConfig, ZenSciContext, ConversionPipelineOptions } from '../types.js';

/**
 * createZenSciServer: Factory function that creates a McpServer
 * with pre-configured ZenSci utilities.
 *
 * Modules call this once, then register their tools on the returned server.
 */
export function createZenSciServer(config: ZenSciServerConfig): ZenSciContext {
  const { name, version } = config;

  // Initialize shared utilities
  const logger = new Logger(name);
  const errorHandler = new MCPErrorHandler();
  const tempFileManager = new TempFileManager(name);
  const artifactManager = new ArtifactManager();
  const pythonEngine = new PythonEngine(logger);

  // Create MCP Server (SDK v2 high-level API)
  const server = new McpServer({ name, version });

  // Start function: connect stdio transport
  const start = async () => {
    try {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logger.info(`${name} v${version} started and ready for requests`);
    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  return {
    server,
    errorHandler,
    logger,
    tempFileManager,
    artifactManager,
    pythonEngine,
    start,
  };
}

/**
 * Map OutputFormat to Pandoc render target string.
 */
export function mapOutputFormatToRenderTarget(format: OutputFormat): string {
  const mapping: Record<string, string> = {
    latex: 'latex',
    html: 'html5',
    email: 'html5',
    beamer: 'beamer',
    revealjs: 'revealjs',
    pptx: 'pptx',
    docs: 'docx',
    docx: 'docx',
    epub: 'epub3',
    mobi: 'mobi',
    'lab-notebook': 'html5',
    'policy-brief': 'latex',
    proposal: 'docx',
    'podcast-notes': 'html5',
    resume: 'latex',
    'grant-latex': 'latex',
    'paper-ieee': 'latex',
    'paper-acm': 'latex',
    'paper-arxiv': 'latex',
    thesis: 'latex',
    patent: 'latex',
    whitepaper: 'latex',
  };
  return mapping[format] ?? 'latex';
}

/**
 * Run the standard ZenSci conversion pipeline.
 * validate → parse → transform → render → compile → output
 */
export async function runConversionPipeline(
  request: DocumentRequest,
  ctx: ZenSciContext,
  options?: ConversionPipelineOptions,
): Promise<DocumentResponse> {
  const { logger, errorHandler, tempFileManager, artifactManager } = ctx;
  const pipeline = new ConversionPipeline(request.id);
  pipeline.start();

  try {
    // Validate
    pipeline.startStage('validate');
    const validationResult = SchemaValidator.validate(
      request,
      options?.supportedFormats ?? [],
    );
    if (!validationResult.valid) {
      throw new Error(
        `Schema validation failed: ${validationResult.errors[0]?.message ?? 'unknown'}`,
      );
    }
    pipeline.completeStage('validate');

    // Parse
    pipeline.startStage('parse');
    const parser = new MarkdownParser();
    const tree = parser.parse(request.source);
    pipeline.completeStage('parse');

    // Transform (citations)
    if (request.bibliography) {
      pipeline.startStage('transform');
      const citationManager = new CitationManager(request.bibliography);
      const keys = citationManager.extractKeysFromAST(tree);
      const unresolved = keys.filter((k) => !citationManager.resolve(k));
      if (unresolved.length > 0) {
        logger.warn('Unresolved citations detected', { keys: unresolved });
      }
      pipeline.completeStage('transform');
    }

    // Render
    pipeline.startStage('render');
    const renderResult = options?.render
      ? await options.render(tree, request)
      : await new PandocWrapper(logger).convert(
          request.source,
          'markdown',
          mapOutputFormatToRenderTarget(request.format),
        );
    pipeline.completeStage('render');

    // Compile
    pipeline.startStage('compile');
    const compileResult = options?.compile
      ? await options.compile(renderResult, request)
      : renderResult;
    pipeline.completeStage('compile');

    // Output
    pipeline.startStage('output');
    const artifacts = artifactManager.getAll();

    const metadata: DocumentResponse['metadata'] = {
      generatedAt: new Date().toISOString(),
      citationCount: 0,
      sources: [request.frontmatter.title ?? 'markdown-source'],
    };
    if (request.frontmatter.title) {
      metadata.title = request.frontmatter.title;
    }
    if (request.frontmatter.author) {
      metadata.author = Array.isArray(request.frontmatter.author)
        ? request.frontmatter.author
        : [request.frontmatter.author];
    }

    const response: DocumentResponse = {
      id: request.id,
      requestId: request.id,
      format: request.format,
      content: compileResult,
      artifacts,
      warnings: [],
      metadata,
      elapsed: pipeline.elapsed(),
    };
    pipeline.completeStage('output');
    pipeline.complete(true);

    logger.info(`Document conversion successful (${pipeline.elapsed()}ms)`, {
      requestId: request.id,
      format: request.format,
    });

    return response;
  } catch (error) {
    const conversionError = errorHandler.handleError(error);
    pipeline.complete(false, undefined, conversionError);
    logger.error('Document conversion failed', {
      requestId: request.id,
      error: conversionError,
    });
    throw error;
  } finally {
    await tempFileManager.cleanup();
  }
}
