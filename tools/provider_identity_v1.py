"""Tolerant, deterministic provider identity matching for settlement and odds supplements (05.11.2026).

Measured cause of the incomplete result audits (03.11. / 04.11.2026): API-Football and BSD had the final scores, but the exact-name matcher (``norm(a) == norm(b)`` plus a short alias table) refused
"PSV" vs "PSV Eindhoven", "Porto" vs "FC Porto", "Slavia Prague" vs "Slavia Praha", "Dortmund" vs "Borussia Dortmund", "Rennes" vs "Olympiakos Piraeus"-style display differences.  The kickoff
instant was identical in every case.

Rule (all conditions, otherwise NO match and the fixture stays PENDING):
  * the candidate rows are already restricted by the caller to the EXACT same kickoff instant;
  * per side the two names are compared as token sets after removing club-form words (fc, fk, sk, kv ...), transliterating special letters and applying a small, closed word-alias table:
        EQUAL (3)      identical token sets
        CONTAINED (2)  the token set of one name is a subset of the other and contains a token of >= 3 letters
        NONE (0)       anything else (a shared single token such as "real" or "city" is NOT enough)
  * both sides >= CONTAINED and exactly ONE candidate qualifies.
A match where only ONE side agrees (translated names such as Red Star / Crvena zvezda) is deliberately NOT accepted: a feed that pairs the same club with a different opponent at the same
instant is contradictory, not confirming (existing regression test ``test_strict_fixture``).  Such a fixture stays PENDING / NOT_AVAILABLE until an alias is added.
Nothing is fuzzy-scored, nothing is guessed from event order, nothing is written to a registry.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any, Callable, Iterable, Sequence

VERSION = "ECOBET_PROVIDER_IDENTITY_V1"

_TRANSLIT = str.maketrans({"ø": "o", "Ø": "O", "ł": "l", "Ł": "L", "æ": "ae", "Æ": "AE", "ß": "ss", "ð": "d", "Ð": "D", "þ": "th", "Þ": "Th", "ı": "i", "đ": "d", "Đ": "D"})
STOP = frozenset({"fc", "cf", "afc", "ac", "as", "ss", "ssc", "sc", "sk", "fk", "kf", "rc", "kv", "kaa", "vv", "jk", "bk", "if", "ik", "fa", "cd", "ud", "sv", "fsv", "fcsb", "1", "ii", "u", "de", "the", "club"})
PHRASE_ALIAS = (("red bull", "rb"), ("union sg", "union gilloise"), ("paris sg", "paris germain"))
WORD_ALIAS = {"ferencvarosi": "ferencvaros", "cs": "", "utd": "united", "st": "", "saint": "", "praha": "prague", "munchen": "munich", "munich": "munich", "kobenhavn": "copenhagen", "koln": "cologne", "olympiakos": "olympiacos", "wien": "vienna",
              "internazionale": "inter", "sporting": "sporting", "rotterdam": "", "piraeus": "", "eindhoven": "eindhoven"}


def tokens(name: Any) -> frozenset[str]:
    text = unicodedata.normalize("NFKD", str(name or "").translate(_TRANSLIT))
    text = "".join(c for c in text if not unicodedata.combining(c)).lower().replace("-", " ").replace(".", " ").replace("'", "").replace("’", "")
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    for phrase, short in PHRASE_ALIAS:
        text = re.sub(rf"\b{phrase}\b", short, text)
    out = set()
    for t in text.split():
        t = WORD_ALIAS.get(t, t)
        if len(t) > 1 and t not in STOP:                                  # single letters are initials / abbreviations ("Shakhtar D.", "B. Banja Luka") and carry no identity
            out.add(t)
    return frozenset(out)


def side_level(a: Any, b: Any) -> int:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0
    if ta == tb:
        return 3
    small, large = (ta, tb) if len(ta) <= len(tb) else (tb, ta)
    if small <= large and any(len(t) >= 3 for t in small):
        return 2
    return 0


def unique_match(home: Any, away: Any, candidates: Iterable[Any], names: Callable[[Any], tuple[Any, Any]]) -> tuple[Any | None, dict[str, Any]]:
    """(candidate | None, evidence).  ``candidates`` must already share the target's exact kickoff instant; ``names(c)`` returns (home name, away name)."""
    rows = [(c, side_level(home, names(c)[0]), side_level(away, names(c)[1])) for c in candidates]
    both = [c for c, h, a in rows if h >= 2 and a >= 2]
    if len(both) == 1:
        return both[0], {"identity_basis": "TOLERANT_NAME_TOKENS_BOTH_SIDES_AND_EXACT_KICKOFF", "matcher": VERSION}
    if len(both) > 1:
        return None, {"identity_basis": "AMBIGUOUS", "candidate_count": len(both), "matcher": VERSION}
    return None, {"identity_basis": "NO_MATCH", "candidate_count": 0, "matcher": VERSION}
