# zen-sci — ZenSci Product Code

This directory contains all product source code for ZenSci (ZenithScience).

**Owner:** TresPiesDesign.com / Cruz Morales
**Domain:** ZenithScience.org
**GitHub:** github.com/TresPies-source/ZenithScience

## Directory Layout

```
zen-sci/
├── packages/
│   ├── core/          # Shared parsing, pipeline, citation, validation
│   └── sdk/           # MCP base class and protocol wrapper
└── servers/
    ├── latex-mcp/     # LaTeX + PDF output (v0.1 — flagship)
    ├── blog-mcp/      # HTML blog output (v0.2)
    ├── slides-mcp/    # Beamer + Reveal.js (v0.3)
    ├── newsletter-mcp/ # MJML email output (v0.3)
    └── grant-mcp/     # Grant proposals (v0.4)
```

## Status

Pre-code. Architecture phase complete. First implementation target: `packages/core` + `servers/latex-mcp`.

See parent directory for: strategic scouts, naming research, semantic cluster map, and schemas backlog.

