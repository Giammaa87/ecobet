#!/usr/bin/env python3
"""Build immutable, display-only website indexes from published ECOBET evidence.

The script reads existing published files only.  It neither updates sealed snapshots
nor result-audit records.  The two output manifests bind every derived record to its
source file SHA-256 and, where applicable, its correction overlay.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def canonical_json(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def write_immutable(directory: Path, stem: str, document: dict) -> tuple[str, str]:
    payload = canonical_json(document)
    sha = hashlib.sha256(payload).hexdigest()
    filename = f"{stem}.{sha[:16]}.json"
    target = directory / filename
    target.write_bytes(payload)
    return filename, sha


def selected(mapping, keys):
    return {key: mapping[key] for key in keys if key in mapping}


def project_match(record: dict) -> dict:
    committed = record.get("committed_model") or {}
    return {
        **selected(record, [
            "match_id", "snapshot_id", "data_snapshot_id", "data_snapshot_coverage",
            "data_source_mode", "snapshot_fixture_missing", "failure_cluster", "failure_tags",
            "audit_failure_tags", "audit_flags", "top_read", "top_read_rank", "top_read_tier",
            "selection",
        ]),
        "fixture": selected(record.get("fixture") or {}, [
            "fixture_id", "home", "away", "competition", "competition_name", "kickoff", "kickoff_utc",
        ]),
        "competition_metadata": selected(record.get("competition_metadata") or {}, [
            "competition_id", "competition_name", "competition_group", "competition_type",
        ]),
        "committed_model": selected(committed, [
            "data_readiness", "data_source_mode", "world_type", "score_band", "safe", "balanced",
            "aggressive", "favourite", "favourite_pick", "favourite_prediction", "favourite_robustness",
            "robustness", "favourite_specificity", "flags", "nsp_codes", "ampel", "top_read",
            "top_reads", "top_read_rank", "top_read_tier", "selection", "team_score_bands",
            "home_score_band", "away_score_band",
        ]),
        "result_settlement": selected(record.get("result_settlement") or {}, [
            "safe_result", "balanced_result", "aggressive_result", "favourite_result",
            "canonical_market_mapping",
        ]),
        "score_cluster_audit": selected(record.get("score_cluster_audit") or {}, [
            "modal_score_hit", "cluster_hit", "score_band_hit",
        ]),
        "team_score_band_audit": record.get("team_score_band_audit") or {},
        "world_verdict": selected(record.get("world_verdict") or {}, ["failure_cluster"]),
    }


def apply_overlay(audit: dict, overlay: dict | None) -> dict:
    """Apply the same display-relevant overlay semantics as index.html."""
    if not overlay or overlay.get("record_type") != "audit_settlement_correction_overlay":
        return audit
    copied = json.loads(json.dumps(audit))
    matches = copied.get("match_audit_records") or []
    for record in matches:
        delta = (overlay.get("matches") or {}).get(record.get("match_id")) or {}
        mapping = delta.get("canonical_market_mapping") or {}
        if mapping:
            model = record.setdefault("committed_model", {})
            for key in ("safe", "balanced", "aggressive", "favourite"):
                if mapping.get(key):
                    model[key] = mapping[key]
            if mapping.get("favourite"):
                model["favourite_status"] = mapping["favourite"]
        if delta.get("result_settlement"):
            settlement = record.setdefault("result_settlement", {})
            settlement.update(delta["result_settlement"])
            if mapping:
                settlement["canonical_market_mapping"] = mapping
    return copied


def build_performance(site: Path):
    audit_index_path = site / "audits" / "index.json"
    index = read_json(audit_index_path)
    overlays = {}
    for path in sorted((site / "corrections" / "audits").glob("*.json")):
        overlay = read_json(path)
        base = overlay.get("base_audit_file")
        if base:
            overlays.setdefault(base, []).append((path, overlay))
    for values in overlays.values():
        values.sort(key=lambda item: (
            item[1].get("sequence", item[1].get("correction_sequence", 0)),
            item[1].get("corrected_at", item[1].get("generated_at", item[1].get("created_at", ""))),
            item[0].name,
        ))

    entries = []
    for date, records in sorted((index.get("dates") or {}).items()):
        for record in records:
            entries.append((date, record))

    projected, sources = [], []
    raw_bytes = 0
    for date, entry in entries:
        rel = entry["file"]
        path = site / "audits" / rel
        raw_bytes += path.stat().st_size
        original = read_json(path)
        applied_overlays = overlays.get(rel, [])
        corrected = original
        for _, overlay in applied_overlays:
            corrected = apply_overlay(corrected, overlay)
        run = corrected.get("run_audit_record") or {}
        projected.append({
            "audit_generated_at": corrected.get("audit_generated_at") or entry.get("generated_at"),
            "run_audit_record": selected(run, ["run_id", "id", "date", "date_range", "audit_generated_at", "generated_at"]),
            "match_audit_records": [project_match(match) for match in corrected.get("match_audit_records") or []],
        })
        source = {"date": date, "file": f"audits/{rel}", "sha256": digest(path), "bytes": path.stat().st_size, "entry_generated_at": entry.get("generated_at")}
        if applied_overlays:
            source["corrections"] = [{"file": str(path.relative_to(site)).replace("\\", "/"), "sha256": digest(path)} for path, _ in applied_overlays]
        sources.append(source)

    document = {
        "schema_version": "website-performance-index/1.0",
        "derivation": "display-only projection of published result audits; correction overlays applied before projection",
        "source_audit_count": len(sources),
        "source_audit_bytes": raw_bytes,
        "sources": sources,
        "audits": projected,
    }
    destination = site / "performance"
    destination.mkdir(exist_ok=True)
    filename, sha = write_immutable(destination, "index", document)
    latest = {
        "schema_version": "website-performance-index-pointer/1.0",
        "index_file": filename,
        "index_sha256": sha,
        "source_audit_count": len(sources),
        "source_audit_bytes": raw_bytes,
    }
    (destination / "latest.json").write_bytes(canonical_json(latest))
    return latest


def build_team_form(site: Path):
    records = []
    for date_dir in sorted((site / "data").glob("20??-??-??")):
        latest_path = date_dir / "latest.json"
        if not latest_path.exists():
            continue
        latest = read_json(latest_path)
        snapshot_id = latest.get("snapshot_id")
        if not snapshot_id:
            continue
        fixture_path = date_dir / snapshot_id / "fixtures.json"
        if not fixture_path.exists():
            continue
        fixture_bundle = read_json(fixture_path)
        cutoff = (fixture_bundle.get("feature_cutoff") or {}).get("cutoff_date") or fixture_bundle.get("data_cutoff") or latest.get("data_cutoff")
        seen = set()
        for fixture in fixture_bundle.get("fixtures") or []:
            nested = fixture.get("fixture") or {}
            for side in ("home", "away"):
                team = fixture.get(f"{side}_team") or {}
                name = team.get("team_name") or nested.get(f"{side}_team_name")
                team_id = team.get("team_id") or fixture.get(f"{side}_team_id")
                ref = team.get("ref")
                if not (name and team_id and ref):
                    continue
                key = (name, team_id)
                if key in seen:
                    continue
                seen.add(key)
                records.append({
                    "name": name, "team_id": team_id, "date": date_dir.name, "snapshot_id": snapshot_id,
                    "cutoff": cutoff, "ref": f"data/{date_dir.name}/{snapshot_id}/{ref.lstrip('./')}",
                })
    document = {
        "schema_version": "website-team-form-index/1.0",
        "derivation": "display-only locator index of published snapshot team documents",
        "records": records,
    }
    destination = site / "team-form"
    destination.mkdir(exist_ok=True)
    filename, sha = write_immutable(destination, "index", document)
    latest = {"schema_version": "website-team-form-index-pointer/1.0", "index_file": filename, "index_sha256": sha, "record_count": len(records)}
    (destination / "latest.json").write_bytes(canonical_json(latest))
    return latest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    site = args.site.resolve()
    outcome = {"performance": build_performance(site), "team_form": build_team_form(site)}
    print(json.dumps(outcome, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
