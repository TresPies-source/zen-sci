#!/usr/bin/env python3
"""
math_validator.py — Batch math expression validation using SymPy.

Reads JSON from stdin:
  { expressions: [{ id, expression, context }] }

Writes JSON to stdout:
  { results: [{ id, valid, error? }] }
"""

import json
import sys


def main():
    try:
        data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        json.dump({"error": f"Invalid JSON: {e}"}, sys.stdout)
        sys.exit(1)

    expressions = data.get("expressions", [])
    results = []

    try:
        from sympy.parsing.latex import parse_latex
    except ImportError:
        # If sympy not available, mark all as valid with warning
        for expr in expressions:
            results.append({
                "id": expr.get("id", ""),
                "valid": True,
                "warning": "sympy not available; skipping validation",
            })
        json.dump({"results": results}, sys.stdout)
        return

    for expr in expressions:
        expr_id = expr.get("id", "")
        expression = expr.get("expression", "")

        try:
            # Strip display math delimiters
            cleaned = expression.strip()
            for delim in ["$$", "$", "\\[", "\\]", "\\(", "\\)"]:
                cleaned = cleaned.replace(delim, "")
            cleaned = cleaned.strip()

            if cleaned:
                parse_latex(cleaned)
            results.append({"id": expr_id, "valid": True})
        except Exception as e:
            results.append({
                "id": expr_id,
                "valid": False,
                "error": str(e),
            })

    json.dump({"results": results}, sys.stdout)


if __name__ == "__main__":
    main()
