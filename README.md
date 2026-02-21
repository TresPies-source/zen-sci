# zen-sci — ZenSci Product Code

This directory contains all product source code for ZenSci (ZenithScience).

**Owner:** TresPiesDesign.com / Cruz Morales
**Domain:** ZenithScience.org
**GitHub:** github.com/TresPies-source/zen-sci
**License:** Apache 2.0

## What ZenSci Is

A suite of MCP servers that converts structured markdown and AI-assisted reasoning into publication-ready artifacts — LaTeX PDFs, HTML blog posts, grant proposals, slide decks, academic papers, and email newsletters. One input schema (`DocumentRequest`), many output formats.

## Current State

All Phases 0–4 are **implemented and passing**. 14 packages build clean (8 server/package builds + 6 app companion builds). 493 tests across 26 test files. 6 MCP App companions ship as single-file HTML bundles.

## Directory Layout

```
zen-sci/
├── packages/
│   ├── core/               # Shared parsing, citation, validation, pipeline (129 tests, 91% coverage)
│   └── sdk/                # createZenSciServer() factory, runConversionPipeline(), ModuleManifest
└── servers/
    ├── latex-mcp/          # LaTeX + PDF (v0.1) — flagship. 37 tests.
    │   ├── app/            # PDF.js viewer + LaTeX source tabs + citation dashboard
    │   └── engine/         # Python: latex_engine.py, citation_engine.py, math_validator.py
    ├── blog-mcp/           # HTML blog (v0.2). 76 tests. SEO, KaTeX, RSS.
    │   └── app/            # Live HTML preview + SEO/OG validator
    ├── slides-mcp/         # Beamer + Reveal.js (v0.3). 34 tests.
    │   ├── app/            # Beamer PDF + Reveal.js live preview + speaker notes
    │   └── engine/         # Python: slides_engine.py
    ├── newsletter-mcp/     # MJML email (v0.3). 63 tests. CAN-SPAM compliance.
    │   └── app/            # Desktop/Mobile/Dark Mode email preview + CAN-SPAM panel
    ├── grant-mcp/          # NIH/NSF grant proposals (v0.4). 50 tests.
    │   ├── app/            # Compliance dashboard + section checklist + agency selector
    │   └── engine/         # Python: grant_engine.py, compliance_validator.py
    └── paper-mcp/          # IEEE/ACM/arXiv papers (v0.5). 36 tests.
        └── app/            # PDF.js viewer + format selector + author sidebar
```

## Tech Stack

- **TypeScript** (Node.js >= 20) — MCP protocol layer, tool registration, schema validation
- **Python** (>= 3.11) — pandoc, SymPy, LaTeX toolchain, bibliography management
- **pnpm** (>= 8) — monorepo workspace management
- **MCP SDK** — `@modelcontextprotocol/sdk` for protocol compliance
- **MCP Apps** — `@modelcontextprotocol/ext-apps` for companion UI bundles
- **Zod** — runtime schema validation for `DocumentRequest` and tool inputs
- **Vite** + `vite-plugin-singlefile` — single-file HTML app bundles

## Architecture Pattern

ZenSci uses **composition over inheritance**:

- `createZenSciServer()` factory (from `@zen-sci/sdk`) creates configured MCP server instances
- Each server registers tools via `McpServer.registerTool()` with Zod input schemas
- Shared pipeline: `runConversionPipeline()` handles markdown → target format conversion
- Python engines called via subprocess for pandoc, TeX rendering, and math validation

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type-check
pnpm typecheck

# Lint
pnpm lint
```

## System Dependencies (for full PDF compilation)

- pandoc >= 3.0
- TeX Live (pdflatex/xelatex/lualatex)
- Python >= 3.11 with: sympy, pypandoc, bibtexparser

These are optional for development — servers gracefully degrade when system deps are missing.

## Documentation

- **Specifications:** `../docs/specs/` (19 specs across infrastructure + 3 phases + Phase 4 apps)
- **Project status:** `../docs/STATUS.md`
- **Architecture:** `../docs/architecture/` (semantic clusters, data flow)
- **Schemas:** `../docs/schemas/SCHEMAS.md` (35+ data contracts)

---

*Last updated: 2026-02-19*
