#!/usr/bin/env python3
"""Math expression validator using SymPy.

Protocol:
  - Input: JSON on stdin with { action, expression }
  - Output: JSON on stdout with { valid, error?, result?, unavailable? }
  - If SymPy is not installed, returns {"unavailable": true} immediately.
"""
import sys
import json

# Check SymPy availability upfront
try:
    from sympy.parsing.latex import parse_latex
    from sympy import sympify, simplify
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False


def validate_expression(expr: str) -> dict:
    try:
        parsed = parse_latex(expr)
        return {"valid": True, "result": str(parsed)}
    except Exception:
        # Fallback: try sympify for non-LaTeX expressions
        try:
            parsed = sympify(expr)
            return {"valid": True, "result": str(parsed)}
        except Exception as e2:
            return {"valid": False, "error": str(e2)}


def simplify_expression(expr: str) -> dict:
    try:
        parsed = parse_latex(expr)
        simplified = simplify(parsed)
        return {"valid": True, "result": str(simplified)}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def to_ascii(expr: str) -> dict:
    try:
        parsed = parse_latex(expr)
        return {"valid": True, "result": str(parsed)}
    except Exception as e:
        return {"valid": False, "error": str(e), "result": expr}


def main():
    input_data = json.loads(sys.stdin.read())

    if not SYMPY_AVAILABLE:
        print(json.dumps({"unavailable": True}))
        return

    action = input_data.get("action", "validate")
    expression = input_data.get("expression", "")

    if action == "validate":
        result = validate_expression(expression)
    elif action == "simplify":
        result = simplify_expression(expression)
    elif action == "to_ascii":
        result = to_ascii(expression)
    else:
        result = {"valid": False, "error": f"Unknown action: {action}"}

    print(json.dumps(result))


if __name__ == "__main__":
    main()
