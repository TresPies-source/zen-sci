#!/usr/bin/env python3
"""Math expression validator using SymPy."""
import sys
import json


def validate_expression(expr: str) -> dict:
    try:
        from sympy.parsing.latex import parse_latex
        parsed = parse_latex(expr)
        return {"valid": True, "result": str(parsed)}
    except Exception as e:
        # Try simpler validation
        try:
            from sympy import sympify
            parsed = sympify(expr)
            return {"valid": True, "result": str(parsed)}
        except Exception as e2:
            return {"valid": False, "error": str(e2)}


def simplify_expression(expr: str) -> dict:
    try:
        from sympy.parsing.latex import parse_latex
        from sympy import simplify
        parsed = parse_latex(expr)
        simplified = simplify(parsed)
        return {"valid": True, "result": str(simplified)}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def to_ascii(expr: str) -> dict:
    try:
        from sympy.parsing.latex import parse_latex
        parsed = parse_latex(expr)
        return {"valid": True, "result": str(parsed)}
    except Exception as e:
        return {"valid": False, "error": str(e), "result": expr}


def main():
    input_data = json.loads(sys.stdin.read())
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
