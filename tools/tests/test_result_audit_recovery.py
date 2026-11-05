"""Unit tests: no heuristic result matching, no unsupported market settlement."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "reconcile_result_audits", Path(__file__).resolve().parents[1] / "reconcile_result_audits.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class RecoveryTests(unittest.TestCase):
    def test_club_aliases(self):
        self.assertEqual(mod.name("Manchester Utd"), mod.name("Manchester United"))
        self.assertEqual(mod.name("Sporting CP"), mod.name("Sporting Lisbon"))
        self.assertEqual(mod.name("PSV Eindhoven"), mod.name("PSV"))
    def test_market_outcomes(self):
        fixture={"home":"Manchester Utd","away":"Roma"}
        score={"home":3,"away":2}
        self.assertEqual(mod.market("Manchester Utd Team Goals Under 1.5",fixture,score),"MISS")
        self.assertEqual(mod.market("Match Total Over 1.5",fixture,score),"HIT")
        self.assertEqual(mod.market("Both Teams To Score: Yes",fixture,score),"HIT")
        self.assertEqual(mod.market("Roma Draw No Bet",fixture,score),"MISS")
        self.assertEqual(mod.market("Roma to win",fixture,score),"MISS")
        self.assertEqual(mod.market("Roma Team Goals 1-3",fixture,score),"HIT")
        self.assertEqual(mod.market("Match Total Under 5",fixture,score),"PUSH")
    def test_unsupported_market_stays_open(self):
        with self.assertRaises(ValueError):
            mod.market("Winning Margin 3+",{"home":"PSV","away":"Club Brugge"},{"home":1,"away":2})
    def test_strict_fixture(self):
        event={"names":{"home":"PSV Eindhoven","away":"Club Brugge"},
               "score":{"home":1,"away":2},"date":"2026-11-04T20:00:00Z","id":"1"}
        fixture={"home":"PSV","away":"Club Brugge","kickoff_utc":"2026-11-04T20:00:00Z"}
        self.assertIsNotNone(mod.resolve(fixture,[event]))
        self.assertIsNone(mod.resolve(fixture,[event,event]))
        late=dict(event,date="2026-11-06T20:00:00Z")
        self.assertIsNone(mod.resolve(fixture,[late]))
        wrong=dict(event,names={"home":"PSV","away":"Napoli"})
        self.assertIsNone(mod.resolve(fixture,[wrong]))
    def test_best_revision_keeps_settlement(self):
        def audit(settled,pending,date):
            return {"audit_generated_at":date,"match_audit_records":
                ([{"result_settlement":{"status":"SETTLED","favourite_result":"HIT"}}]*settled+
                 [{"result_settlement":{"status":"PENDING_RESULT","favourite_result":"PENDING"}}]*pending)}
        completed=audit(9,0,"2026-11-04T08:00:00Z")
        regression=audit(4,5,"2026-11-05T08:00:00Z")
        self.assertGreater(mod.quality(completed),mod.quality(regression))

if __name__=="__main__":
    unittest.main()
