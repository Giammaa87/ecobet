#!/usr/bin/env python3
"""Offline validation for the isolated Phase 1 display build."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def l5(team):
    f = team.get("feature_state") or {}
    return tuple(int(f.get(k) or 0) for k in (
        "last5_all_competitions_n", "last5_all_competitions_wins",
        "last5_all_competitions_draws", "last5_all_competitions_losses",
    ))


def main(site: Path):
    site = site.resolve()
    spec = importlib.util.spec_from_file_location("builder", site / "tools" / "build_website_phase1_indexes.py")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)

    pointer = read(site / "performance" / "latest.json")
    document_path = site / "performance" / pointer["index_file"]
    document = read(document_path)
    actual_index_hash = hashlib.sha256(document_path.read_bytes()).hexdigest()
    assert actual_index_hash == pointer["index_sha256"], "Performance index hash mismatch"
    assert len(document["audits"]) == pointer["source_audit_count"]
    assert len(document["sources"]) == pointer["source_audit_count"]

    by_file = {source["file"].removeprefix("audits/"): source for source in document["sources"]}
    indexed = {source["file"].removeprefix("audits/"): audit for source, audit in zip(document["sources"], document["audits"])}
    for filename, source in by_file.items():
        raw_path = site / "audits" / filename
        assert sha(raw_path) == source["sha256"], f"Audit hash mismatch: {filename}"
        raw = read(raw_path)
        for correction in source.get("corrections", []):
            overlay_path = site / correction["file"]
            assert sha(overlay_path) == correction["sha256"], f"Overlay hash mismatch: {filename}"
            raw = builder.apply_overlay(raw, read(overlay_path))
        expected = {
            "audit_generated_at": raw.get("audit_generated_at") or source.get("entry_generated_at"),
            "run_audit_record": builder.selected(raw.get("run_audit_record") or {}, ["run_id", "id", "date", "date_range", "audit_generated_at", "generated_at"]),
            "match_audit_records": [builder.project_match(match) for match in raw.get("match_audit_records") or []],
        }
        assert indexed[filename] == expected, f"Projection mismatch: {filename}"

    def settled(audits):
        out = {key: {"HIT": 0, "MISS": 0, "PUSH": 0} for key in ("favourite", "safe", "balanced", "aggressive")}
        matches = 0
        for audit in audits:
            for match in audit.get("match_audit_records") or []:
                matches += 1
                rs = match.get("result_settlement") or {}
                for key in out:
                    value = str(rs.get(f"{key}_result") or "").upper()
                    if value in out[key]:
                        out[key][value] += 1
        return matches, out

    # The original, corrected evidence and the compact index must produce the same settlements.
    raw_audits = []
    for filename, source in by_file.items():
        raw = read(site / "audits" / filename)
        for correction in source.get("corrections", []):
            raw = builder.apply_overlay(raw, read(site / correction["file"]))
        raw_audits.append(raw)
    assert settled(raw_audits) == settled(document["audits"]), "Settlement regression"

    team_pointer = read(site / "team-form" / "latest.json")
    team_doc_path = site / "team-form" / team_pointer["index_file"]
    assert sha(team_doc_path) == team_pointer["index_sha256"], "Team form index hash mismatch"
    rows = read(team_doc_path)["records"]
    assert len(rows) == team_pointer["record_count"]
    current = {row["name"]: row for row in rows if row["date"] == "2026-10-27" and row["name"] in {"Roma", "Lazio"}}
    assert current["Roma"]["team_id"] == "serie_a_roma"
    assert current["Lazio"]["team_id"] == "serie_a_lazio"
    roma, lazio = (read(site / current[name]["ref"]) for name in ("Roma", "Lazio"))
    assert l5(roma) == (5, 2, 2, 1)
    assert l5(lazio) == (5, 4, 1, 0)
    assert [m["res"] for m in roma["match_history"]["matches"][-5:]] == ["D", "L", "W", "W", "D"]
    assert [m["res"] for m in lazio["match_history"]["matches"][-5:]] == ["D", "W", "W", "W", "W"]
    print(json.dumps({
        "status": "PASS",
        "audits": len(document["audits"]),
        "source_bytes": pointer["source_audit_bytes"],
        "index_bytes": document_path.stat().st_size,
        "matches": settled(document["audits"])[0],
        "settlements": settled(document["audits"])[1],
        "roma": l5(roma),
        "lazio": l5(lazio),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
