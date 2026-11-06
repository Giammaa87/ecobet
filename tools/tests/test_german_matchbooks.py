"""Regression checks for the automatic, immutable-source-bound German publisher."""
import importlib.util
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "publish_german_matchbooks.py"
spec = importlib.util.spec_from_file_location("german_matchbooks", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class GermanMatchbooksTest(unittest.TestCase):
    def fixture(self):
        return {
            "fixture_identity": {"fixture_id": "ENG2627_TEST"},
            "prediction": {
                "match_thesis": {"summary": "Team scores 1.5 expected goals."},
                "match_book": {"summary": "Home advantage is expected."},
                "team_books": {"home": {"state_summary": "Home attack has 2 goals."},
                               "away": {"state_summary": "Away attack has 1 goal."}},
                "worlds": {
                    "primary": {"description": "Home team scores 2 goals."},
                    "competing": {"description": "Away side scores 1 goal."},
                    "tail_breaks": [{"description": "A draw remains possible."}]
                },
                "decision_explanation": {"cluster_summary": "From 1 to 3 goals."}
            }
        }

    def stage(self):
        return {
            "publication_identity": {
                "publication_id": "2026-11-07_0300",
                "publication_status": "PUBLISHED",
                "content_hash": "sha256:" + "a" * 64
            },
            "fixtures": [self.fixture()]
        }

    @staticmethod
    def fake_translate(source):
        return "Deutsche Fassung: " + source

    def test_complete_translation_and_identity(self):
        out = module.prepare(self.stage(), "2026-11-07_0300", self.fake_translate)
        self.assertEqual(out["translation_status"], module.STATUS)
        self.assertEqual(out["publication_id"], "2026-11-07_0300")
        self.assertEqual(out["source_stage12_content_hash"], "sha256:" + "a" * 64)
        self.assertEqual(len(out["fixtures"]), 1)
        self.assertIn("1.5", out["fixtures"]["ENG2627_TEST"]["thesis"])
        self.assertEqual(len(out["fixtures"]["ENG2627_TEST"]["risks"]), 1)

    def test_correct_numerical_changes_without_changing_source(self):
        def model(text):
            if "1.5" in text:
                return "Mannschaft hat 2.5 xG"
            if "Team has" in text:
                return "Mannschaft hat"
            return text
        result = module.translated("Team has 1.5 xG", model)
        self.assertIn("Mannschaft hat 1.5 xG", result)
        self.assertNotIn("2.5", result)

    def test_fail_closed_for_numeric_invention_and_passthrough(self):
        with self.assertRaises(ValueError):
            module.translated("Team has 1.5 xG", lambda text: "Falsch 99")
        with self.assertRaises(ValueError):
            module.translated("Team has 1.5 xG", lambda text: text)

    def test_written_english_numbers_become_german_digits(self):
        source = "Everton can score one or two goals."
        def model(text):
            if text == source:
                return "Everton kann 1 oder 2 Tore erzielen."
            return "Everton kann 1 oder 2 Tore erzielen."
        self.assertEqual(module.translated(source, model),
                         "Everton kann 1 oder 2 Tore erzielen.")

    def test_original_numeric_values_and_written_words_together(self):
        source = "Everton has 1.65 xG but can score one or two goals."
        def model(text):
            if text == source:
                return "Everton hat 1.75 xG, trifft aber 1 oder 2 Mal."
            if text.startswith("Everton has"):
                return "Everton hat"
            if "one or two" in text:
                return "xG, trifft aber 1 oder 2 Mal."
            return text
        output = module.translated(source, model)
        self.assertIn("1.65", output)
        self.assertNotIn("1.75", output)
        self.assertIn("1 oder 2", output)

    def test_reject_unsupported_numbers_even_with_word_numbers(self):
        source = "Everton can score one or two goals."
        with self.assertRaises(ValueError):
            module.translated(source, lambda text: "Everton trifft 99 Tore.")

    def test_fail_closed_if_wrong_run(self):
        with self.assertRaises(ValueError):
            module.prepare(self.stage(), "2026-11-08_0300", self.fake_translate)

    def test_creates_once_without_overwriting(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            (root / "runs").mkdir()
            (root / "stage13/source-records").mkdir(parents=True)
            rid = "2026-11-07_0300"
            day = date.today().isoformat()
            (root / "runs/index.json").write_text(
                json.dumps({"dates": {day: [rid]}}), encoding="utf-8"
            )
            (root / "stage13/source-records" / (rid + ".stage12.json")).write_text(
                json.dumps(self.stage()), encoding="utf-8"
            )
            result = module.run(root, 0, 10, self.fake_translate)
            self.assertEqual(result, [rid])
            path = root / "translations/matchbooks" / (rid + ".json")
            before = path.read_text(encoding="utf-8")
            self.assertEqual(module.run(root, 0, 10, self.fake_translate), [])
            self.assertEqual(path.read_text(encoding="utf-8"), before)


if __name__ == "__main__":
    unittest.main()
