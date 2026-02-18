#!/usr/bin/env python3
"""
citation_engine.py — BibTeX citation resolution.

Reads JSON from stdin:
  { bibliography_content, citation_keys }

Writes JSON to stdout:
  { resolved: [{key, entry}], unresolved: [key] }
"""

import json
import sys


def main():
    try:
        data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        json.dump({"error": f"Invalid JSON: {e}"}, sys.stdout)
        sys.exit(1)

    bibliography_content = data.get("bibliography_content", "")
    citation_keys = data.get("citation_keys", [])

    try:
        import bibtexparser

        parser = bibtexparser.bparser.BibTexParser(common_strings=True)
        bib_db = bibtexparser.loads(bibliography_content, parser=parser)

        entries_by_key = {}
        for entry in bib_db.entries:
            entries_by_key[entry.get("ID", "")] = entry

        resolved = []
        unresolved = []

        for key in citation_keys:
            if key in entries_by_key:
                resolved.append({
                    "key": key,
                    "entry": entries_by_key[key],
                })
            else:
                unresolved.append(key)

        json.dump({
            "resolved": resolved,
            "unresolved": unresolved,
        }, sys.stdout)

    except ImportError:
        # bibtexparser not available — cannot resolve
        json.dump({
            "resolved": [],
            "unresolved": citation_keys,
            "warning": "bibtexparser not installed",
        }, sys.stdout)


if __name__ == "__main__":
    main()
