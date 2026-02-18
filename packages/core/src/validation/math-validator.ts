// packages/core/src/validation/math-validator.ts
// Math expression validation via Python/SymPy subprocess bridge

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type {
  ValidationResult,
  ConversionErrorData,
  ConversionWarning,
  DocumentTree,
  DocumentNode,
  MathNode,
} from '../types.js';

// ---------------------------------------------------------------------------
// Types for the Python bridge protocol
// ---------------------------------------------------------------------------

interface PythonRequest {
  action: 'validate' | 'simplify' | 'to_ascii';
  expression: string;
}

interface PythonResponse {
  valid: boolean;
  error?: string;
  result?: string;
  unavailable?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PYTHON_SCRIPT = join(__dirname, 'math_validator.py');
const DEFAULT_TIMEOUT = 5_000; // 5 seconds

/**
 * Attempt to run a Python subprocess with the math_validator.py bridge script.
 * Returns `null` when Python is unavailable (no error thrown).
 */
async function callPython(request: PythonRequest): Promise<PythonResponse | null> {
  const pythonPaths = ['python3', 'python'];

  for (const pythonBin of pythonPaths) {
    try {
      return await runPythonProcess(pythonBin, request);
    } catch {
      // Try next binary
    }
  }

  // Python not available at all
  return null;
}

function runPythonProcess(
  pythonBin: string,
  request: PythonRequest,
): Promise<PythonResponse> {
  return new Promise<PythonResponse>((resolve, reject) => {
    const proc = spawn(pythonBin, [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: DEFAULT_TIMEOUT,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err: Error) => {
      reject(err);
    });

    proc.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Python exited with code ${String(code)}: ${stderr}`));
        return;
      }
      try {
        const parsed: unknown = JSON.parse(stdout);
        resolve(parsed as PythonResponse);
      } catch {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    proc.stdin.write(JSON.stringify(request));
    proc.stdin.end();
  });
}

function makeResult(
  errors: ConversionErrorData[],
  warnings: ConversionWarning[],
): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Recursively collect all MathNode instances from a document tree.
 */
function collectMathNodes(nodes: DocumentNode[]): MathNode[] {
  const result: MathNode[] = [];

  for (const node of nodes) {
    if (node.type === 'math') {
      result.push(node);
    } else if (node.type === 'section') {
      result.push(...collectMathNodes(node.children));
    }
    // ParagraphNode children are InlineNode, which does not include MathNode
  }

  return result;
}

// ---------------------------------------------------------------------------
// MathValidator
// ---------------------------------------------------------------------------

export class MathValidator {
  /**
   * Validate a single LaTeX math expression via SymPy.
   *
   * If Python / SymPy is unavailable, the result contains a warning and
   * `valid` is still `true` (graceful degradation).
   */
  async validate(
    latex: string,
    mode: 'inline' | 'display',
  ): Promise<ValidationResult> {
    const errors: ConversionErrorData[] = [];
    const warnings: ConversionWarning[] = [];

    const response = await callPython({ action: 'validate', expression: latex });

    if (response === null || response.unavailable) {
      warnings.push({
        code: 'MATH_PYTHON_UNAVAILABLE',
        message:
          'Python/SymPy is not available; math validation was skipped. Install python3 with SymPy for full validation.',
        suggestion: 'pip install sympy',
      });
      return makeResult(errors, warnings);
    }

    if (!response.valid) {
      errors.push({
        code: 'MATH_INVALID_EXPRESSION',
        message: `Invalid ${mode} math expression: ${response.error ?? 'unknown error'}`,
        suggestions: ['Check the LaTeX syntax of the expression'],
      });
    }

    return makeResult(errors, warnings);
  }

  /**
   * Validate every MathNode in a DocumentTree.
   */
  async validateTree(tree: DocumentTree): Promise<ValidationResult> {
    const allErrors: ConversionErrorData[] = [];
    const allWarnings: ConversionWarning[] = [];

    const mathNodes = collectMathNodes(tree.children);

    for (const node of mathNodes) {
      const result = await this.validate(node.latex, node.mode);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);

      // If Python is unavailable, the first call will warn; skip further calls
      if (
        result.warnings.some((w) => w.code === 'MATH_PYTHON_UNAVAILABLE')
      ) {
        break;
      }
    }

    return makeResult(allErrors, allWarnings);
  }

  /**
   * Simplify a LaTeX expression via SymPy and return the simplified form.
   * Returns the original expression unchanged when Python is unavailable.
   */
  async simplify(latex: string): Promise<string> {
    const response = await callPython({ action: 'simplify', expression: latex });

    if (response === null || response.unavailable) {
      return latex;
    }

    if (!response.valid || response.result === undefined) {
      return latex;
    }

    return response.result;
  }

  /**
   * Convert a LaTeX expression to an ASCII representation via SymPy.
   * Returns the original expression unchanged when Python is unavailable.
   */
  async toAscii(latex: string): Promise<string> {
    const response = await callPython({ action: 'to_ascii', expression: latex });

    if (response === null || response.unavailable) {
      return latex;
    }

    return response.result ?? latex;
  }
}
