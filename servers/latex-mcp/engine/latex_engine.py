#!/usr/bin/env python3
"""
latex_engine.py — Primary LaTeX conversion engine for zen-sci latex-mcp.

Reads JSON from stdin:
  { request_id, source, frontmatter, bibliography, bibliography_style, latex_preamble, options }

Writes JSON to stdout:
  { pdf_base64, latex_source, page_count, warnings, citations }
  OR
  { error: { code, message, details } }
"""

import json
import sys
import os
import subprocess
import tempfile
import base64
import shutil
from pathlib import Path


def main():
    try:
        data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        write_error("json-parse-failed", f"Invalid JSON input: {e}")
        sys.exit(1)

    request_id = data.get("request_id", "unknown")
    source = data.get("source", "")
    frontmatter = data.get("frontmatter", {})
    bibliography = data.get("bibliography")
    bib_style = data.get("bibliography_style", "apa")
    latex_preamble = data.get("latex_preamble")
    options = data.get("options", {})

    warnings = []

    # Create temp directory
    tmpdir = tempfile.mkdtemp(prefix=f"zen-sci-latex-{request_id}-")

    try:
        md_path = os.path.join(tmpdir, "input.md")
        tex_path = os.path.join(tmpdir, "output.tex")
        pdf_path = os.path.join(tmpdir, "output.pdf")

        # Write markdown source
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(source)

        # Write bibliography if provided
        bib_path = None
        if bibliography:
            bib_path = os.path.join(tmpdir, "references.bib")
            with open(bib_path, "w", encoding="utf-8") as f:
                f.write(bibliography)

        # Convert markdown to LaTeX via pypandoc
        try:
            import pypandoc

            extra_args = ["--standalone"]
            if bib_path:
                extra_args.extend(["--bibliography", bib_path])
                extra_args.extend(["--citeproc"])

            pypandoc.convert_file(
                md_path, "latex", outputfile=tex_path, extra_args=extra_args
            )
        except ImportError:
            warnings.append("pypandoc not installed; using basic conversion")
            basic_latex = basic_md_to_latex(source, frontmatter, latex_preamble)
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(basic_latex)
        except Exception as e:
            warnings.append(f"pypandoc conversion warning: {e}")
            basic_latex = basic_md_to_latex(source, frontmatter, latex_preamble)
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(basic_latex)

        # Read and post-process TeX
        with open(tex_path, "r", encoding="utf-8") as f:
            latex_source = f.read()

        # Inject custom preamble if provided
        if latex_preamble:
            idx = latex_source.find("\\begin{document}")
            if idx >= 0:
                latex_source = (
                    latex_source[:idx] + latex_preamble + "\n" + latex_source[idx:]
                )

        # Inject frontmatter metadata
        if frontmatter.get("title"):
            if "\\title{" not in latex_source:
                idx = latex_source.find("\\begin{document}")
                if idx >= 0:
                    latex_source = (
                        latex_source[:idx]
                        + f"\\title{{{frontmatter['title']}}}\n"
                        + latex_source[idx:]
                    )

        # Ensure common packages
        for pkg in ["microtype", "hyperref", "bookmark"]:
            if f"\\usepackage{{{pkg}}}" not in latex_source:
                idx = latex_source.find("\\begin{document}")
                if idx >= 0:
                    latex_source = (
                        latex_source[:idx]
                        + f"\\usepackage{{{pkg}}}\n"
                        + latex_source[idx:]
                    )

        # Write post-processed TeX
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_source)

        # Compile with pdflatex (twice for cross-refs)
        pdf_base64 = None
        page_count = None

        try:
            for _ in range(2):
                proc = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
                    capture_output=True,
                    text=True,
                    timeout=60,
                    cwd=tmpdir,
                )
                if proc.returncode != 0:
                    warnings.append(f"pdflatex warning: {proc.stdout[-500:] if proc.stdout else 'no output'}")

            if os.path.exists(pdf_path):
                with open(pdf_path, "rb") as f:
                    pdf_base64 = base64.b64encode(f.read()).decode("ascii")

                # Count pages (rough estimate from PDF)
                try:
                    with open(pdf_path, "rb") as f:
                        content = f.read()
                        page_count = content.count(b"/Type /Page") - content.count(b"/Type /Pages")
                        if page_count <= 0:
                            page_count = 1
                except Exception:
                    page_count = None
            else:
                warnings.append("PDF file was not produced")
        except FileNotFoundError:
            warnings.append("pdflatex not found; returning LaTeX source only")
        except subprocess.TimeoutExpired:
            warnings.append("pdflatex compilation timed out (60s)")

        # Build result
        result = {
            "latex_source": latex_source,
            "warnings": warnings,
            "citations": {
                "total": 0,
                "resolved": 0,
                "unresolved": [],
            },
        }
        if pdf_base64 is not None:
            result["pdf_base64"] = pdf_base64
        if page_count is not None:
            result["page_count"] = page_count

        json.dump(result, sys.stdout)

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def basic_md_to_latex(source, frontmatter, preamble):
    """Fallback basic markdown to LaTeX converter."""
    lines = ["\\documentclass{article}"]
    lines.append("\\usepackage[utf8]{inputenc}")
    lines.append("\\usepackage{amsmath}")
    lines.append("\\usepackage{hyperref}")

    if preamble:
        lines.append(preamble)

    lines.append("\\begin{document}")

    title = frontmatter.get("title")
    author = frontmatter.get("author")

    if title:
        lines.append(f"\\title{{{title}}}")
    if author:
        if isinstance(author, list):
            lines.append(f"\\author{{{' \\\\and '.join(author)}}}")
        else:
            lines.append(f"\\author{{{author}}}")
    if title:
        lines.append("\\maketitle")

    for line in source.split("\n"):
        stripped = line.strip()
        if stripped.startswith("# "):
            lines.append(f"\\section{{{stripped[2:]}}}")
        elif stripped.startswith("## "):
            lines.append(f"\\subsection{{{stripped[3:]}}}")
        elif stripped.startswith("### "):
            lines.append(f"\\subsubsection{{{stripped[4:]}}}")
        elif stripped.startswith("---"):
            pass
        elif ":" in stripped and len(stripped.split(":")[0].split()) <= 2:
            pass  # Skip frontmatter lines
        elif stripped:
            lines.append(stripped)

    lines.append("\\end{document}")
    return "\n".join(lines)


def write_error(code, message, details=None):
    error = {"error": {"code": code, "message": message}}
    if details:
        error["error"]["details"] = details
    json.dump(error, sys.stdout)


if __name__ == "__main__":
    main()
