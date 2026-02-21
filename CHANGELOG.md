# ZenSci Changelog

All notable changes to the ZenSci monorepo are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- `build:bundle` script added to all 6 server `package.json` files for reproducible esbuild bundling

---

## [0.4.1] — Gateway Deserialization Audit (2026-02-19)

### Fixed
- **`create_agent`**: request body corrected from `{project_id, name, provider}` to `{workspace_root, active_mode}` (gateway requires `workspace_root`); was returning HTTP 400 on every call
- **`AgentResponse`**: added `response` (agent reply), `task_id`, `plan_id`, `disposition`; `tool_calls` made `#[serde(default)]`; `finish_reason` made `Option<String>` — was always failing deserialization due to required fields the gateway never sends
- **`submit_dag`**: return type replaced from `DagJob` (wrong shape) with new `DagSubmitResult { execution_id, plan_id, status }`
- **`get_dag_status`**: return type replaced with `DagStatus`; nodes/edges now correctly extracted from nested `dag` sub-object; `DagNode` field names corrected (`tool_name`, `state`) from wrong names (`name`, `status`)
- **`search_memory`**: `results` key now extracted from wrapped `{"results": [...], "total_count": N}` response before deserialization; new `MemorySearchItem` struct with correct fields (`memory_type`, `relevance_score`)
- **`store_memory`**: request body corrected (adds required `type` field); `MemoryItem` struct now matches `MemoryResponse` wire format (`memory_type`, `context_type`, `updated_at`)
- **`get_gateway_status`**: `GatewayStatus` fields aligned to actual `/health` response — `uptime_seconds` (was `uptime_ms`), added `requests_processed`, `providers`, `dependencies`; removed fields not sent by gateway (`mcp_servers_connected`, `tools_available`)
- **`db/mod.rs`**: pre-existing borrow-checker error in `warm_cache` fixed (compiler-suggested `let x` split)

### Added
- `AgentCreateResult` struct replacing `Agent` for the `create_agent` response shape
- `DagSubmitResult` struct for `POST /v1/gateway/orchestrate` response
- `DagStatus`, `DagNode`, `DagEdge` structs for `GET /v1/gateway/orchestrate/:id/dag` response
- `MemorySearchItem` struct for `POST /v1/memory/search` results
- 8 unit tests in `gateway/client.rs` — every `GatewayClient` method now has a mockito test with body derived from the corresponding Go `c.JSON(...)` call
- `src-tauri/GATEWAY_AUDIT.md` — full method-by-method audit record

---

## [0.4.0] — Phase 4: Portal Integration (2026-02-19)

### Added
- **Three-tier stack live**: `zen-sci-portal` (SvelteKit 5 + Tauri v2) → `GatewayClient` → `AgenticGateway` (Go) → zen-sci MCP servers (Node.js stdio)
- **esbuild bundles**: all 6 servers bundled to `dist/index.bundle.js` (~2.1MB each); Tauri resources map configured
- **`ToolInvoker.svelte`**: UI component wiring the full tool-invoke chain from the portal
- **`/tools` route** added to portal with sidebar nav entry
- **SQLite persistence** (`~/.zen-sci/zensci.db`): documents and sections persisted via `rusqlite`; `DocumentStore` wraps DashMap cache + SQLite source-of-truth
- **Tailwind v4 CSS-first migration**: `app.css` converted to `@import`/`@theme`/`@plugin`; `tailwind.config.js` deleted
- **shadcn-svelte `@1.0.0-next.10`** initialized; `components.json` registry corrected to `next.shadcn-svelte.com`
- **`AgenticGateway` sidecar wired**: `ZEN_SCI_SERVERS_ROOT` set at launch from `app.path().resource_dir()`; `gateway-config.yaml` updated to `index.bundle.js` for all 6 servers
- **`cargo test`** — 25 tests green (20 unit + 5 integration)
- **Smoke test passed (2026-02-19)**: `zen_sci_latex:convert_to_pdf` → `isError: false`, 85ms end-to-end

### Fixed
- `zen-sci/README.md`: removed phantom top-level `engines/` directory; documented actual per-server `engine/` locations
- `components.json` schema + registry: updated from `tw3.shadcn-svelte.com` → `next.shadcn-svelte.com`
- HSL color tokens: stripped `/ <alpha-value>` suffix (Tailwind v3-only pattern) from all color definitions

### Added (MCP App Companions — Phase 4)
- 6 single-file HTML bundle companions shipped at `ui://` URIs:
  - `ui://latex-mcp/preview.html` — PDF.js viewer + LaTeX source tabs + citation dashboard
  - `ui://blog-mcp/preview.html` — live HTML preview + SEO/OG card validator
  - `ui://grant-mcp/dashboard.html` — compliance dashboard + section checklist
  - `ui://slides-mcp/preview.html` — Beamer (PDF.js) + Reveal.js (srcdoc) + speaker notes
  - `ui://newsletter-mcp/preview.html` — desktop/mobile/dark mode email preview + CAN-SPAM panel
  - `ui://paper-mcp/preview.html` — PDF.js viewer + IEEE/ACM/arXiv format selector + author sidebar

---

## [0.4.0-rc] — Phase 3: Grant MCP (2026-02-18)

### Added
- **`grant-mcp`** (v0.4.0): Tools `generate_proposal`, `validate_compliance`, `check_format`
- 50 tests; NIH, NSF, ERC, DOE agency format support
- Full health audit completed (2026-02-18) — all dimensions GREEN except Documentation (YELLOW)
- `CONTRIBUTING.md` — contributor guide (see below)

---

## [0.3.0] — Phase 3: Slides + Newsletter MCP

### Added
- **`slides-mcp`** (v0.3.0): Tools `convert_to_slides`, `validate_deck`; Beamer + Reveal.js output; 34 tests
- **`newsletter-mcp`** (v0.3.0): Tools `convert_to_email`, `validate_email`; MJML + HTML email; CAN-SPAM compliance; 63 tests

---

## [0.2.0] — Phase 2: Blog MCP

### Added
- **`blog-mcp`** (v0.2.0): Tools `convert_to_html`, `generate_feed`, `validate_post`; responsive HTML + RSS/Atom; 76 tests
- Validated core abstraction generality: same markdown source → different format families

---

## [0.1.0] — Phase 1: LaTeX MCP

### Added
- **`latex-mcp`** (v0.1.0): Tools `convert_to_pdf`, `validate_document`, `check_citations`; LaTeX + PDF output; 37 tests
- **`packages/core`** (v0.1.0): `MarkdownParser`, `CitationManager`, `MathValidator`, `SchemaValidator`, `BibTeXParser`, `Logger`; 129 tests, 91% statement coverage
- **`packages/sdk`** (v0.1.0): `createZenSciServer()`, `runConversionPipeline()`, `ModuleManifest`, `PipelineMonitor`; 68 tests, 85.43% statement coverage

---

## [0.0.1] — Phase 0: Monorepo Bootstrap

### Added
- pnpm workspaces monorepo structure
- `packages/core`, `packages/sdk` scaffolded
- `servers/` directory with 6 server stubs
- GitHub Actions CI: lint + typecheck + test + build on every push/PR
- System deps: pandoc 3.9, TeX Live 2025, Python `.venv` with sympy/pypandoc/bibtexparser
