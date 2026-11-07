"""The website performance league must be recoverable ONLY from exact run evidence."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "build_website_phase1_indexes.py"
spec = importlib.util.spec_from_file_location("website_builder", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class CompetitionEvidenceTest(unittest.TestCase):
    def setUp(self):
        self.published = [
            {"fixture_id": "ENG2627_A", "home": "Arsenal", "away": "Everton",
             "kickoff": "2026-10-24T14:00:00+00:00", "competition": "Premier League"},
            {"fixture_id": "ITA2627_B", "home": "Venezia", "away": "Lecce",
             "kickoff": "2026-10-24T15:00:00+00:00", "competition": "Serie A"}
        ]
        self.audit = {
            "fixture_id": "ENG2627_A",
            "fixture": {
                "home": "Arsenal", "away": "Everton",
                "kickoff_utc": "2026-10-24T14:00:00+00:00", "competition": None
            },
            "committed_model": {"favourite_prediction": "1X"},
            "result_settlement": {"favourite_result": "HIT"}
        }

    def test_exact_same_run_identity_recovers_competition(self):
        projected = builder.project_match(self.audit, self.published)
        self.assertEqual(projected["fixture"]["competition"], "Premier League")
        self.assertEqual(projected["fixture"]["fixture_id"], "ENG2627_A")
        self.assertEqual(projected["result_settlement"]["favourite_result"], "HIT")

    def test_refuse_inconsistent_team_and_kickoff(self):
        bad = dict(self.audit)
        bad["fixture"] = {**self.audit["fixture"], "home": "Not Arsenal"}
        self.assertIsNone(builder.resolve_published_match(bad, self.published))
        self.assertFalse(builder.project_match(bad, self.published)["fixture"].get("competition"))
        bad2 = dict(self.audit)
        bad2["fixture"] = {**self.audit["fixture"], "kickoff_utc": "2026-10-25T14:00:00+00:00"}
        self.assertIsNone(builder.resolve_published_match(bad2, self.published))

    def test_keep_original_league_and_prevent_team_guess(self):
        audited = dict(self.audit)
        audited["fixture"] = {**self.audit["fixture"], "competition": "UEFA Champions League"}
        self.assertEqual(builder.project_match(audited, self.published)["fixture"]["competition"],
                         "UEFA Champions League")
        blank = {"fixture": {}, "committed_model": {}, "result_settlement": {}}
        self.assertIsNone(builder.resolve_published_match(blank, self.published))

    def test_unique_home_away_kickoff_fallback(self):
        record = {"fixture": {"home": "Venezia", "away": "Lecce",
                              "kickoff_utc": "2026-10-24T15:00:00+00:00"}}
        self.assertEqual(builder.project_match(record, self.published)["fixture"]["competition"], "Serie A")
        same = self.published + [{**self.published[1], "fixture_id": "ITA2627_C"}]
        self.assertIsNone(builder.resolve_published_match(record, same))


if __name__ == "__main__":
    unittest.main()
