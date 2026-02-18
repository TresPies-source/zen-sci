#!/usr/bin/env python3
"""
Slides Engine — Python bridge for Beamer PDF compilation.

Reads a JSON request from stdin, compiles Beamer LaTeX to PDF using
pypandoc or pdflatex, and writes a JSON response to stdout.

This is a stub implementation. Full compilation requires:
  - pypandoc (pip install pypandoc)
  - pdflatex (TeX Live or MiKTeX)
"""

import json
import sys
import os
import tempfile
import subprocess
from pathlib import Path


def compile_beamer_to_pdf(latex_source: str, output_dir: str | None = None) -> dict:
    """
    Compile Beamer LaTeX source to PDF.

    Args:
        latex_source: Complete Beamer LaTeX document source
        output_dir: Optional output directory for the PDF

    Returns:
        dict with pdf_path, pdf_base64, page_count, warnings
    """
    warnings = []

    # Create temp directory for compilation
    with tempfile.TemporaryDirectory(prefix="zen-sci-slides-") as tmpdir:
        tex_path = Path(tmpdir) / "slides.tex"
        tex_path.write_text(latex_source, encoding="utf-8")

        try:
            # Try pdflatex compilation (two passes for references)
            for pass_num in range(2):
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, str(tex_path)],
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                if result.returncode != 0 and pass_num == 1:
                    warnings.append(f"pdflatex warnings: {result.stdout[-500:]}")

            pdf_path = Path(tmpdir) / "slides.pdf"
            if pdf_path.exists():
                import base64
                pdf_bytes = pdf_path.read_bytes()
                pdf_base64 = base64.b64encode(pdf_bytes).decode("ascii")

                # Copy to output dir if specified
                final_path = None
                if output_dir:
                    os.makedirs(output_dir, exist_ok=True)
                    final_path = str(Path(output_dir) / "slides.pdf")
                    with open(final_path, "wb") as f:
                        f.write(pdf_bytes)

                return {
                    "pdf_path": final_path,
                    "pdf_base64": pdf_base64,
                    "page_count": None,  # Would need PDF parsing
                    "warnings": warnings,
                }
            else:
                return {
                    "error": {
                        "code": "COMPILATION_FAILED",
                        "message": "pdflatex did not produce output PDF",
                    },
                    "warnings": warnings,
                }

        except FileNotFoundError:
            return {
                "error": {
                    "code": "PDFLATEX_NOT_FOUND",
                    "message": "pdflatex is not installed. Install TeX Live or MiKTeX.",
                },
                "warnings": warnings,
            }
        except subprocess.TimeoutExpired:
            return {
                "error": {
                    "code": "COMPILATION_TIMEOUT",
                    "message": "pdflatex compilation timed out after 60 seconds",
                },
                "warnings": warnings,
            }


def main():
    """Main entry point: read JSON from stdin, process, write JSON to stdout."""
    try:
        request = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        json.dump({"error": {"code": "INVALID_JSON", "message": str(e)}}, sys.stdout)
        sys.stdout.flush()
        return

    latex_source = request.get("latex_source", "")
    output_dir = request.get("output_dir")

    if not latex_source:
        json.dump(
            {"error": {"code": "MISSING_SOURCE", "message": "No latex_source provided"}},
            sys.stdout,
        )
        sys.stdout.flush()
        return

    result = compile_beamer_to_pdf(latex_source, output_dir)
    json.dump(result, sys.stdout)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
