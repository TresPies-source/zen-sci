# Contributing to ZenSci

ZenSci is a solo-authored project (Cruz, Tres Pies Design). This guide documents the conventions used so that future contributors — human or AI — can work effectively.

---

## Repository Layout

```
zen-sci/
├── packages/
│   ├── core/          # Shared parsing, citation, math, schema utilities
│   └── sdk/           # createZenSciServer(), runConversionPipeline()
├── servers/
│   ├── latex-mcp/     # LaTeX + PDF output
│   ├── blog-mcp/      # HTML blog + RSS
│   ├── slides-mcp/    # Beamer + Reveal.js
│   ├── newsletter-mcp/# MJML + email HTML
│   ├── grant-mcp/     # Grant proposals (NIH/NSF/ERC/DOE)
│   └── paper-mcp/     # IEEE/ACM/arXiv paper formats
└── package.json       # Monorepo root (pnpm workspaces)
```

Each server is a standalone pnpm workspace package with its own `src/`, `tests/`, `dist/`, and optionally `engine/` (Python subprocess bridge) and `app/` (Phase 4 MCP App companion).

---

## Prerequisites

| Tool | Version |
| :--- | :--- |
| Node.js | ≥ 20 |
| pnpm | ≥ 8 |
| Python | ≥ 3.11 (for engine servers) |
| pandoc | 3.9 |
| TeX Live | 2025 (pdflatex) |

Set up the Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install sympy pypandoc bibtexparser
```

---

## Development Workflow

### Install dependencies

```bash
pnpm install
```

### Build all packages

```bash
pnpm build          # TypeScript compile (tsc --build)
pnpm build:apps     # Vite build for all MCP App companions
```

### Build esbuild bundles (for gateway deployment)

```bash
pnpm -r run build:bundle
```

Each server's bundle is written to `servers/{name}/dist/index.bundle.js`.

### Run tests

```bash
pnpm test                              # All packages
pnpm --filter @zen-sci/latex-mcp test  # Single server
```

### Typecheck + lint

```bash
pnpm typecheck
pnpm lint
```

---

## Adding a New Server

1. Create `servers/{name}-mcp/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Use `createZenSciServer()` from `@zen-sci/sdk` — do not reinvent the base layer
3. Register tools with Zod input schemas
4. Add `engine/` directory for any Python subprocess bridge
5. Write tests in `tests/` — minimum coverage target: 85%
6. Add `build:bundle` script matching the pattern in existing servers
7. Update `gateway-config.yaml` in `AgenticGatewayByDojoGenesis/`
8. Update `STATUS.md` Module Roadmap table

---

## Code Conventions

- **TypeScript strict mode** — `"strict": true` in all `tsconfig.json` files
- **ESM only** — `"type": "module"` in all `package.json` files; no CommonJS
- **Zod schemas** for all tool inputs — validates at the MCP boundary
- **No format-specific hacks in `core/`** — `packages/core` must stay format-agnostic
- **`createZenSciServer()` factory** — all servers use this pattern; no custom `Server` subclasses
- **Python engines** — subprocess bridge only; keep Python code in `engine/`; test it separately

---

## Testing

- Unit tests: `vitest run`
- Integration tests: `vitest run tests/integration` (requires pandoc + TeX Live)
- Minimum targets: `packages/core` ≥ 90% statement coverage, servers ≥ 80%
- CI enforces: lint + typecheck + test + build on every push/PR (GitHub Actions)

---

## Commit Style

Short imperative subject lines, present tense:

```
feat(latex-mcp): add table-of-contents support
fix(core): handle missing citation keys gracefully
chore: bump pnpm lockfile
```

---

## Questions

Open an issue or reach out to Cruz at `cruz@zensci.dev`.
