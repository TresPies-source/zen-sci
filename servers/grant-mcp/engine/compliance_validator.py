#!/usr/bin/env python3
"""
Grant MCP Compliance Validator (Python)
Provides additional compliance checking via stdin/stdout JSON protocol.
This supplements the TypeScript ComplianceChecker with deeper analysis.
"""

import json
import sys
from typing import Any


# Page limits by funder and program type
PAGE_LIMITS: dict[str, dict[str, dict[str, int]]] = {
    "nih": {
        "R01": {
            "specific-aims": 1,
            "research-strategy": 12,
            "budget-justification": 3,
            "facilities": 2,
            "equipment": 1,
            "biosketch": 5,
        },
        "R21": {
            "specific-aims": 1,
            "research-strategy": 6,
            "budget-justification": 3,
            "facilities": 2,
            "equipment": 1,
            "biosketch": 5,
        },
    },
    "nsf": {
        "CAREER": {
            "project-description": 15,
            "data-management-plan": 2,
            "budget-justification": 5,
            "biosketch": 3,
        },
        "standard": {
            "project-description": 15,
            "data-management-plan": 2,
            "budget-justification": 5,
            "biosketch": 3,
        },
    },
    "erc": {
        "default": {
            "abstract": 1,
            "project-description": 15,
            "budget-justification": 3,
        },
    },
}

WORDS_PER_PAGE = 250


def estimate_pages(content: str) -> int:
    """Estimate page count from word count."""
    words = len(content.split())
    if words == 0:
        return 0
    return max(1, (words + WORDS_PER_PAGE - 1) // WORDS_PER_PAGE)


def validate_compliance(request: dict[str, Any]) -> dict[str, Any]:
    """Validate sections against funder compliance rules."""
    sections = request.get("sections", [])
    funder = request.get("funder", "nih")
    program_type = request.get("program_type", "R01")

    violations: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    # Get page limits
    funder_limits = PAGE_LIMITS.get(funder, {})
    limits = funder_limits.get(program_type, funder_limits.get("default", {}))

    # Check page limits
    for section in sections:
        role = section.get("role", "other")
        content = section.get("content", "")
        pages = estimate_pages(content)

        if role in limits:
            limit = limits[role]
            if pages > limit:
                violations.append({
                    "section": role,
                    "rule": "page-limit",
                    "severity": "error",
                    "details": f"Section '{role}' estimated at {pages} pages, exceeds limit of {limit}.",
                })

    # Check for empty sections
    for section in sections:
        content = section.get("content", "").strip()
        if not content:
            warnings.append({
                "section": section.get("role", "unknown"),
                "rule": "empty-section",
                "severity": "warning",
                "details": f"Section '{section.get('role', 'unknown')}' is empty.",
            })

    compliant = len(violations) == 0
    total_checks = len(sections) + len(limits)
    failed = len(violations)
    score = max(0, round(((total_checks - failed) / max(total_checks, 1)) * 100))

    return {
        "status": "success",
        "compliant": compliant,
        "violations": violations,
        "warnings": warnings,
        "score": score,
    }


def main() -> None:
    """Main entry point."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            result = {
                "status": "error",
                "error": {"code": "EMPTY_INPUT", "message": "No input provided"},
            }
        else:
            request = json.loads(raw_input)
            result = validate_compliance(request)
    except json.JSONDecodeError as e:
        result = {
            "status": "error",
            "error": {"code": "INVALID_JSON", "message": str(e)},
        }
    except Exception as e:
        result = {
            "status": "error",
            "error": {"code": "UNEXPECTED_ERROR", "message": str(e)},
        }

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
