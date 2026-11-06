#!/usr/bin/env python3
"""Build German Match Book presentation records from immutable Stage12 data.

Requires argostranslate on the GitHub Actions runner. Does not change football
predictions, audits, odds, or existing editorial translations.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import date, timedelta
from pathlib import Path

FIELDS = ("thesis", "match", "home", "away", "prime", "counter", "cluster")
SCHEMA = "ECOBET_MATCHBOOK_TRANSLATION_V1"
STATUS = "AUTOMATIC_TRANSLATED_FROM_FROZEN_SOURCE"


def extracted(prediction: dict) -> dict:
    p = prediction or {}
    thesis = p.get("match_thesis") or {}
    decision = p.get("decision_explanation") or {}
    teams = p.get("team_books") or {}
    worlds = p.get("worlds") or {}
    return {
        "thesis": thesis.get("summary") or decision.get("thesis_summary") or "",
        "match": (p.get("match_book") or {}).get("summary") or decision.get("thesis_summary") or "",
        "home": (teams.get("home") or {}).get("state_summary") or "",
        "away": (teams.get("away") or {}).get("state_summary") or "",
        "prime": (worlds.get("primary") or {}).get("description") or decision.get("primary_world_summary") or "",
        "counter": (worlds.get("competing") or {}).get("description") or decision.get("competing_world_summary") or "",
        "cluster": decision.get("cluster_summary") or "",
        "risks": [x.get("description") for x in (worlds.get("tail_breaks") or [])
                  if isinstance(x, dict) and x.get("description")],
    }


def translator_model():
    import argostranslate.package
    import argostranslate.translate
    if not any(x.from_code == "en" and x.to_code == "de"
               for x in argostranslate.package.get_installed_packages()):
        argostranslate.package.update_package_index()
        candidates = [x for x in argostranslate.package.get_available_packages()
                      if x.from_code == "en" and x.to_code == "de"]
        if not candidates:
            raise RuntimeError("Argos English-German model unavailable")
        argostranslate.package.install_from_path(candidates[0].download())
    return lambda sentence: argostranslate.translate.translate(sentence, "en", "de")


def translated(source: str, translator) -> str:
    result = str(translator(source)).strip()
    if not result or result == source:
        raise ValueError("Translation missing or unchanged")
    # Avoid a translated narrative that silently changes probability/goal numbers.
    number = re.compile(r"(?<![\w])\d+(?:[.,]\d+)*(?:%)?")
    before = [x.replace(",", ".") for x in number.findall(source)]
    after = [x.replace(",", ".") for x in number.findall(result)]
    if before != after:
        raise ValueError("Translated text changed a numerical value")
    return result


def prepare(stage: dict, run_id: str, translator) -> dict:
    ident = stage.get("publication_identity") or {}
    if ident.get("publication_id") != run_id or ident.get("publication_status") != "PUBLISHED":
        raise ValueError("Unverified Stage12 publication identity")
    source_hash = ident.get("content_hash")
    if not isinstance(source_hash, str) or not source_hash.startswith("sha256:"):
        raise ValueError("Missing immutable content hash")
    output = {}
    for f in stage.get("fixtures") or []:
        fixture_id = (f.get("fixture_identity") or {}).get("fixture_id")
        if not fixture_id:
            raise ValueError("Missing fixture ID")
        source = extracted(f.get("prediction") or {})
        if not all(isinstance(source.get(k), str) and source[k].strip() for k in FIELDS):
            raise ValueError("Incomplete original Match Book " + fixture_id)
        translated_record = {k: translated(source[k], translator) for k in FIELDS}
        translated_record["risks"] = [translated(x, translator) for x in source["risks"]]
        output[fixture_id] = translated_record
    if not output:
        raise ValueError("No match records in published Stage12")
    return {
        "schema_version": SCHEMA,
        "publication_id": run_id,
        "language": "de-CH",
        "translation_status": STATUS,
        "source_stage12_content_hash": source_hash,
        "source_stage12_path": "stage13/source-records/" + run_id + ".stage12.json",
        "notes": "Automatische deutsche Übersetzung, nicht redaktionell geprüft. Originaldaten unverändert.",
        "fixtures": output,
    }


def scan(repository: Path, lookback_days: int, max_runs: int) -> list:
    idx = json.loads((repository / "runs/index.json").read_text(encoding="utf-8"))
    cutoff = (date.today() - timedelta(days=lookback_days)).isoformat()
    candidates = []
    for day, ids in (idx.get("dates") or {}).items():
        if day < cutoff:
            continue
        for value in ids:
            rid = value if isinstance(value, str) else value.get("id")
            if isinstance(rid, str) and re.fullmatch(r"[a-zA-Z0-9_.-]+", rid):
                src = repository / "stage13/source-records" / (rid + ".stage12.json")
                out = repository / "translations/matchbooks" / (rid + ".json")
                if src.is_file() and not out.exists():
                    candidates.append((day, rid, src, out))
    return sorted(candidates, reverse=True)[:max_runs]


def run(repository: Path, lookback_days: int, max_runs: int, translator=None) -> list[str]:
    items = scan(repository, lookback_days, max_runs)
    if not items:
        print("No untranslated published Stage12 records.")
        return []
    if translator is None:
        translator = translator_model()
    created = []
    for _, run_id, source_path, target_path in items:
        stage = json.loads(source_path.read_text(encoding="utf-8"))
        doc = prepare(stage, run_id, translator)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        created.append(run_id)
        print(f"Translated {run_id}: {len(doc['fixtures'])} fixtures")
    return created


def main():
    p = argparse.ArgumentParser()
    p.add_argument("repository", type=Path, nargs="?", default=Path("."))
    p.add_argument("--lookback-days", type=int, default=7)
    p.add_argument("--max-runs", type=int, default=10)
    args = p.parse_args()
    if args.lookback_days < 0 or args.max_runs < 1:
        p.error("Invalid scan bounds")
    created = run(args.repository, args.lookback_days, args.max_runs)
    print(f"Published {len(created)} German translated run artifacts.")


if __name__ == "__main__":
    main()
