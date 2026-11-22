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
    def test_double_chance_or_draw(self):
        fx={"home":"Lorient","away":"Brest"}
        self.assertEqual(mod.market("Lorient or Draw",fx,{"home":1,"away":1}),"HIT")
        self.assertEqual(mod.market("Lorient or Draw",fx,{"home":0,"away":1}),"MISS")
        self.assertEqual(mod.market("Brest or Draw",fx,{"home":2,"away":1}),"MISS")
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

class IdentityToleranceTests(unittest.TestCase):
    def test_provider_display_names_resolve_but_wrong_opponent_does_not(self):
        fx={"home":"Porto","away":"Napoli","kickoff_utc":"2026-11-04T20:00:00Z"}
        ok={"names":{"home":"FC Porto","away":"Napoli"},"score":{"home":4,"away":1},"date":"2026-11-04T20:00:00Z","id":"2"}
        self.assertIsNotNone(mod.resolve(fx,[ok]))
        self.assertIsNone(mod.resolve(fx,[dict(ok,names={"home":"FC Porto","away":"Arsenal"})]))
        fx2={"home":"Viking","away":"Sabah FK","kickoff_utc":"2026-11-04T20:00:00Z"}
        ev2={"names":{"home":"Viking","away":"Sabah FA"},"score":{"home":4,"away":1},"date":"2026-11-04T22:00:00Z","id":"6"}
        self.assertIsNone(mod.resolve(fx2,[ev2]))                                      # tolerant tier needs the same kickoff instant (+-30 min)
        self.assertIsNotNone(mod.resolve(fx2,[dict(ev2,date="2026-11-04T20:00:00Z")]))
    def test_psv_and_slavia_resolve(self):
        for h,a,eh,ea in (("PSV","Club Brugge","PSV Eindhoven","Club Brugge KV"),("Slavia Prague","Arsenal","SK Slavia Praha","Arsenal"),("Dortmund","Real Betis","Borussia Dortmund","Real Betis")):
            fx={"home":h,"away":a,"kickoff_utc":"2026-11-04T20:00:00Z"}
            ev={"names":{"home":eh,"away":ea},"score":{"home":1,"away":0},"date":"2026-11-04T20:00:00Z","id":"3"}
            self.assertIsNotNone(mod.resolve(fx,[ev]),(h,a))
    def test_two_candidates_stay_pending(self):
        fx={"home":"Real Madrid","away":"Sevilla","kickoff_utc":"2026-11-04T20:00:00Z"}
        e1={"names":{"home":"Real Madrid CF","away":"Sevilla FC"},"score":{"home":1,"away":0},"date":"2026-11-04T20:00:00Z","id":"4"}
        e2=dict(e1,id="5",names={"home":"Real Madrid C.F.","away":"Sevilla F.C."})
        self.assertIsNone(mod.resolve(fx,[e1,e2]))

if __name__=="__main__":
    unittest.main()
