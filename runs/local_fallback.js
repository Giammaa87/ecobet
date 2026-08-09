/* Generated only as a file:// fallback from the unchanged run JSON files. */
globalThis.ECOBET_LOCAL_DATA={
  "runs/index.json": {
    "schema_version": "1.0",
    "record_type": "run_index",
    "generated_at": "2026-08-05T10:00:00+02:00",
    "dates": {
      "2026-08-04": [
        "2026-08-04_2337",
        "2026-08-04_0021",
        "2026-08-04_0107"
      ]
    }
  },
  "runs/2026-08-04_2337.json": {
    "schema_version": "1.0",
    "record_type": "run_record",
    "run": {
      "run_id": "RUN_2026-08-04_2337_UCL_UEL_QUALIFICATION",
      "snapshot_id": "SNAP_2026-08-04_2337",
      "snapshot_time": "2026-08-03T23:37:00+02:00",
      "date": "2026-08-04",
      "scope": [
        "UEFA Champions League",
        "UEFA Europa League"
      ],
      "build_mode": "FULL",
      "audit_mode": true,
      "run_status": "COMPLETE",
      "run_integrity": "PASS",
      "output_integrity": "PASS",
      "norm_versions": {
        "master_os": "1.3",
        "data_fabric": "1.3",
        "football_decision_engine": "1.2",
        "output_audit": "1.2",
        "team_id_registry": "1.1",
        "history_calibration": "1.1"
      }
    },
    "matches": [
      {
        "fixture_id": "UEFA-2049100",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Mjällby AIF",
        "away": "ŠK Slovan Bratislava",
        "world_type": "CONTROL_BUT_FRAGILE_AWAY",
        "safe": "X2",
        "balanced": "Slovan über 0.5 Teamtore",
        "aggressive": "Slovan Sieg",
        "favourite": "X2",
        "model_probability_band": "62–74 %",
        "model_price_band": "1.35–1.61",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE",
          "MULTIWORLD_CLOSE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Mjällbys Heim-Suppression trifft auf Slovans höheres Angriffsvolumen.",
        "prime_world": "Slovan übersteht die Druckphase und findet über Umschaltmomente den Torpfad.",
        "counterworld": "Mjällby bindet Slovan in niedrigem Tempo, ein Tor entscheidet den Korridor.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "0:1",
          "1:1",
          "1:2",
          "0:2"
        ],
        "score_band": "1–3",
        "candidates": [
          {
            "expression": "X2",
            "axis": "DIRECTION",
            "cluster_coverage": "3/4",
            "W": 3,
            "F": 3,
            "R": 2,
            "D": 2,
            "score_total": 9,
            "status": "VALID"
          },
          {
            "expression": "Über 1.5 Tore",
            "axis": "TOTAL",
            "cluster_coverage": "2/4",
            "W": 2,
            "F": 2,
            "R": 3,
            "D": 2,
            "score_total": 8,
            "status": "VALID"
          },
          {
            "expression": "Slovan über 0.5 Teamtore",
            "axis": "TEAM_GOALS",
            "cluster_coverage": "3/4",
            "W": 2,
            "F": 2,
            "R": 2,
            "D": 2,
            "score_total": 7,
            "status": "VALID"
          }
        ],
        "repair_summary": [
          {
            "field": "DF07 Recent-xG",
            "routes": [
              "FootyStats",
              "FotMob",
              "SofaScore",
              "Matchlog-Aggregation",
              "Open Search"
            ],
            "result": "PARTIAL",
            "note": "Kein konsistentes L5 für beide Teams."
          },
          {
            "field": "DF11 Events",
            "routes": [
              "Offizielle Clubseiten",
              "Transfermarkt",
              "Open Search"
            ],
            "result": "PARTIAL",
            "note": "Kein unabhängig bestätigtes kritisches Ereignis."
          }
        ],
        "sources": [
          {
            "name": "UEFA.com",
            "trust": "HIGH"
          },
          {
            "name": "FootyStats",
            "trust": "HIGH"
          },
          {
            "name": "FotMob/SofaScore Matchlogs",
            "trust": "MEDIUM"
          }
        ]
      },
      {
        "fixture_id": "UEFA-2049103",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "FC Ararat-Armenia",
        "away": "NK Celje",
        "world_type": "GOALS_OPEN",
        "safe": "Über 1.5 Tore",
        "balanced": "BTTS Ja",
        "aggressive": "Über 2.5 Tore",
        "favourite": "Über 1.5 Tore",
        "model_probability_band": "71–83 %",
        "model_price_band": "1.20–1.41",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Beide Teams zeigten in der Qualifikation offene Transition und zwei Scoring Paths.",
        "prime_world": "Offener Verlauf mit beidseitigen Abschlusschancen.",
        "counterworld": "Ararat kontrolliert früh und drückt das Tempo aus dem Spiel.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:1",
          "2:1",
          "1:2",
          "2:2"
        ],
        "score_band": "2–4"
      },
      {
        "fixture_id": "UEFA-2049101",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Levski Sofia",
        "away": "Kairat Almaty",
        "world_type": "BALANCED_NARROW",
        "safe": "Unter 3.5 Tore",
        "balanced": "1X",
        "aggressive": "Levski DNB",
        "favourite": "Unter 3.5 Tore",
        "model_probability_band": "74–86 %",
        "model_price_band": "1.16–1.35",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE",
          "DRAW_GRAVITY_HIGH"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Zwei kontrollierte Defensivprofile mit engem Erwartungskorridor.",
        "prime_world": "Enger Verlauf, wenige klare Chancen, spätes Öffnen unwahrscheinlich.",
        "counterworld": "Kairats Auswärtsprozess erzeugt früh Volumen und öffnet die Partie.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:0",
          "1:1",
          "2:0",
          "0:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049104",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Hapoel Be'er Sheva",
        "away": "Crvena Zvezda",
        "world_type": "CONTROL_AWAY",
        "safe": "X2",
        "balanced": "Crvena Zvezda über 0.5 Teamtore",
        "aggressive": "Crvena Zvezda Sieg",
        "favourite": "X2",
        "model_probability_band": "66–78 %",
        "model_price_band": "1.28–1.52",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "SOURCE_MIXED"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Crvena Zvezda bringt den klareren Prozess und die stabilere Auswärtsrolle mit.",
        "prime_world": "Crvena kontrolliert Zonen und erzeugt den belastbareren Scoring Path.",
        "counterworld": "Hapoels Heimdruck trifft früh und kippt den Tie in einen 1:0-Korridor.",
        "modal_score": "0:1",
        "four_score_cluster": [
          "0:1",
          "1:1",
          "0:2",
          "1:2"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049105",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "GNK Dinamo Zagreb",
        "away": "Kauno Žalgiris",
        "world_type": "CONTROL_BUT_FRAGILE_HOME",
        "safe": "1X",
        "balanced": "Dinamo über 0.5 Teamtore",
        "aggressive": "Dinamo Sieg",
        "favourite": "1X",
        "model_probability_band": "78–90 %",
        "model_price_band": "1.11–1.28",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "ONE_SIDED_SCORING"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Klare Heimkontrolle gegen ein Team ohne belastbaren Auswärtsprozess.",
        "prime_world": "Dinamo kontrolliert Territorium und Chancenqualität durchgehend.",
        "counterworld": "Dinamo verwaltet früh und lässt die Partie torarm auslaufen.",
        "modal_score": "2:0",
        "four_score_cluster": [
          "1:0",
          "2:0",
          "2:1",
          "1:1"
        ],
        "score_band": "1–3",
        "candidates": [
          {
            "expression": "1X",
            "axis": "DIRECTION",
            "cluster_coverage": "4/4",
            "W": 3,
            "F": 3,
            "R": 3,
            "D": 2,
            "score_total": 11,
            "status": "VALID"
          },
          {
            "expression": "Dinamo über 0.5 Teamtore",
            "axis": "TEAM_GOALS",
            "cluster_coverage": "4/4",
            "W": 3,
            "F": 2,
            "R": 3,
            "D": 2,
            "score_total": 10,
            "status": "VALID"
          }
        ],
        "repair_summary": [
          {
            "field": "DF08 Shots gegen",
            "routes": [
              "FotMob",
              "FootyStats"
            ],
            "result": "FOUND",
            "note": "Vollständig über zwei Quellen bestätigt."
          }
        ],
        "sources": [
          {
            "name": "UEFA.com",
            "trust": "HIGH"
          },
          {
            "name": "FotMob",
            "trust": "HIGH"
          }
        ]
      },
      {
        "fixture_id": "UEFA-2049106",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Olympiacos FC",
        "away": "N.E.C. Nijmegen",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_NO_ANCHOR"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049107",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Union Saint-Gilloise",
        "away": "Bodø/Glimt",
        "world_type": "GOALS_OPEN",
        "safe": "Über 1.5 Tore",
        "balanced": "BTTS Ja",
        "aggressive": "Über 2.5 Tore",
        "favourite": "Über 1.5 Tore",
        "model_probability_band": "76–88 %",
        "model_price_band": "1.14–1.32",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "CHAOS_HIGH"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Zwei offensivstarke Profile mit hoher Transitionrate treffen aufeinander.",
        "prime_world": "Offener Schlagabtausch mit beidseitigen Torpfaden.",
        "counterworld": "Union kontrolliert den Ball und nimmt das Tempo aus der Partie.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:1",
          "2:1",
          "1:2",
          "2:2"
        ],
        "score_band": "2–4"
      },
      {
        "fixture_id": "UEFA-2049108",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "AC Sparta Praha",
        "away": "Olympique Lyonnais",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149201",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Larne FC",
        "away": "Iberia 1999 Tbilisi",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_MATERIAL_CONFLICT"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149202",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Shamrock Rovers",
        "away": "Egnatia Rrogozhinë",
        "world_type": "GOALS_OPEN",
        "safe": "Über 1.5 Tore",
        "balanced": "BTTS Ja",
        "aggressive": "Über 2.5 Tore",
        "favourite": "Über 1.5 Tore",
        "model_probability_band": "73–85 %",
        "model_price_band": "1.18–1.37",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Shamrocks Heimvolumen trifft auf eine auswärts fehleranfällige Struktur.",
        "prime_world": "Shamrock erzeugt wiederholt Abschlüsse, Egnatia bleibt über Konter gefährlich.",
        "counterworld": "Egnatia verteidigt kompakt und hält die Partie torarm.",
        "modal_score": "2:1",
        "four_score_cluster": [
          "1:1",
          "2:1",
          "2:2",
          "1:2"
        ],
        "score_band": "2–4"
      }
    ],
    "proof_of_work": {
      "matches_in_scope": 10,
      "matches_committed": 10,
      "matches_no_stable_prediction": 3,
      "silent_exclusions": 0,
      "out_of_scope_discovered": 13,
      "team_ebooks_built": 20,
      "match_ebooks_built": 10,
      "real_odds_input": 0,
      "tickets_created": false
    }
  },
  "runs/2026-08-04_0021.json": {
    "schema_version": "1.0",
    "record_type": "run_record",
    "run": {
      "run_id": "RUN_2026-08-04_0021_UCL_UEL_QUALIFICATION",
      "snapshot_id": "SNAP_2026-08-04_0021",
      "snapshot_time": "2026-08-04T00:21:00+02:00",
      "date": "2026-08-04",
      "scope": [
        "UEFA Champions League",
        "UEFA Europa League"
      ],
      "build_mode": "FULL",
      "audit_mode": true,
      "run_status": "COMPLETE",
      "run_integrity": "PASS",
      "output_integrity": "PASS",
      "norm_versions": {
        "master_os": "1.3",
        "data_fabric": "1.3",
        "football_decision_engine": "1.2",
        "output_audit": "1.2",
        "team_id_registry": "1.1",
        "history_calibration": "1.1"
      }
    },
    "matches": [
      {
        "fixture_id": "UEFA-2049100",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Mjällby AIF",
        "away": "ŠK Slovan Bratislava",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049103",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "FC Ararat-Armenia",
        "away": "NK Celje",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049101",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Levski Sofia",
        "away": "Kairat Almaty",
        "world_type": "BALANCED_NARROW",
        "safe": "Unter 3.5 Tore",
        "balanced": "Levski über 0.5 Teamtore",
        "aggressive": "Levski DNB",
        "favourite": "Levski über 0.5 Teamtore",
        "model_probability_band": "72–84 %",
        "model_price_band": "1.19–1.39",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Levskis Heimprozess trägt den eigenen Torpfad unabhängig vom Ausgang.",
        "prime_world": "Levski erzeugt zu Hause verlässlich Abschlüsse.",
        "counterworld": "Kairat kontrolliert und hält Levski vom eigenen Strafraum fern.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:0",
          "1:1",
          "2:1",
          "0:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049104",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Hapoel Be'er Sheva",
        "away": "Crvena Zvezda",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049105",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "GNK Dinamo Zagreb",
        "away": "Kauno Žalgiris",
        "world_type": "CONTROL_HOME",
        "safe": "Dinamo über 0.5 Teamtore",
        "balanced": "1X",
        "aggressive": "Dinamo Sieg",
        "favourite": "Dinamo über 0.5 Teamtore",
        "model_probability_band": "80–92 %",
        "model_price_band": "1.09–1.25",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "ONE_SIDED_SCORING"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Dinamos Heimvolumen erzeugt verlässlich mindestens einen Torpfad.",
        "prime_world": "Dinamo dominiert Territorium und Chancenqualität.",
        "counterworld": "Dinamo verwaltet früh, Partie bleibt torarm.",
        "modal_score": "2:0",
        "four_score_cluster": [
          "1:0",
          "2:0",
          "2:1",
          "1:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049106",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Olympiacos FC",
        "away": "N.E.C. Nijmegen",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_NO_ANCHOR"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049107",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Union Saint-Gilloise",
        "away": "Bodø/Glimt",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049108",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "AC Sparta Praha",
        "away": "Olympique Lyonnais",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149201",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Larne FC",
        "away": "Iberia 1999 Tbilisi",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_MATERIAL_CONFLICT"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149202",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Shamrock Rovers",
        "away": "Egnatia Rrogozhinë",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      }
    ],
    "proof_of_work": {
      "matches_in_scope": 10,
      "matches_committed": 10,
      "matches_no_stable_prediction": 8,
      "silent_exclusions": 0,
      "out_of_scope_discovered": 13,
      "team_ebooks_built": 20,
      "match_ebooks_built": 10,
      "real_odds_input": 0,
      "tickets_created": false
    }
  },
  "runs/2026-08-04_0107.json": {
    "schema_version": "1.0",
    "record_type": "run_record",
    "run": {
      "run_id": "RUN_2026-08-04_0107_UCL_UEL_QUALIFICATION",
      "snapshot_id": "SNAP_2026-08-04_0107",
      "snapshot_time": "2026-08-04T01:07:00+02:00",
      "date": "2026-08-04",
      "scope": [
        "UEFA Champions League",
        "UEFA Europa League"
      ],
      "build_mode": "FULL",
      "audit_mode": true,
      "run_status": "COMPLETE",
      "run_integrity": "PASS",
      "output_integrity": "PASS",
      "norm_versions": {
        "master_os": "1.3",
        "data_fabric": "1.3",
        "football_decision_engine": "1.2",
        "output_audit": "1.2",
        "team_id_registry": "1.1",
        "history_calibration": "1.1"
      }
    },
    "matches": [
      {
        "fixture_id": "UEFA-2049100",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Mjällby AIF",
        "away": "ŠK Slovan Bratislava",
        "world_type": "KO_STATE_DEPENDENT",
        "safe": "Unter 4.5 Tore",
        "balanced": "Über 1.5 Tore",
        "aggressive": "X2",
        "favourite": "Über 1.5 Tore",
        "model_probability_band": "69–81 %",
        "model_price_band": "1.23–1.45",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE",
          "MULTIWORLD_CLOSE",
          "STATE_SENSITIVE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Das erste Tor verschiebt den Korridor stärker als die Baseline-Stärke.",
        "prime_world": "Bewachte erste Stunde, danach mindestens ein zweites Gesamttor.",
        "counterworld": "Mjällby bindet Slovan in niedrigem Tempo, ein Tor entscheidet.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:1",
          "1:2",
          "2:1",
          "0:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049103",
        "kickoff": "18:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "FC Ararat-Armenia",
        "away": "NK Celje",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_NO_ANCHOR",
          "NSP_SCORE_CLUSTER"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049101",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Levski Sofia",
        "away": "Kairat Almaty",
        "world_type": "BALANCED_NARROW",
        "safe": "Unter 3.5 Tore",
        "balanced": "1X",
        "aggressive": "Levski DNB",
        "favourite": "Unter 3.5 Tore",
        "model_probability_band": "75–87 %",
        "model_price_band": "1.15–1.33",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "DRAW_GRAVITY_HIGH"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Zwei kontrollierte Defensivprofile mit engem Erwartungskorridor.",
        "prime_world": "Enger Verlauf mit wenigen klaren Chancen.",
        "counterworld": "Kairats Auswärtsprozess öffnet die Partie früh.",
        "modal_score": "1:1",
        "four_score_cluster": [
          "1:0",
          "1:1",
          "2:0",
          "0:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049104",
        "kickoff": "19:30",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Hapoel Be'er Sheva",
        "away": "Crvena Zvezda",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049105",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "GNK Dinamo Zagreb",
        "away": "Kauno Žalgiris",
        "world_type": "CONTROL_HOME",
        "safe": "Dinamo über 0.5 Teamtore",
        "balanced": "1X",
        "aggressive": "Dinamo Sieg",
        "favourite": "Dinamo über 0.5 Teamtore",
        "model_probability_band": "79–91 %",
        "model_price_band": "1.10–1.27",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "ONE_SIDED_SCORING"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Dinamos Heimvolumen erzeugt verlässlich mindestens einen Torpfad.",
        "prime_world": "Dinamo dominiert Territorium und Chancenqualität.",
        "counterworld": "Dinamo verwaltet früh, Partie bleibt torarm.",
        "modal_score": "2:0",
        "four_score_cluster": [
          "1:0",
          "2:0",
          "2:1",
          "1:1"
        ],
        "score_band": "1–3"
      },
      {
        "fixture_id": "UEFA-2049106",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Olympiacos FC",
        "away": "N.E.C. Nijmegen",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_NO_ANCHOR"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049107",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "Union Saint-Gilloise",
        "away": "Bodø/Glimt",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2049108",
        "kickoff": "20:00",
        "competition": "UEFA Champions League",
        "phase": "Q3 · Hinspiel",
        "home": "AC Sparta Praha",
        "away": "Olympique Lyonnais",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149201",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Larne FC",
        "away": "Iberia 1999 Tbilisi",
        "world_type": "NOT_AVAILABLE",
        "safe": "NOT_AVAILABLE",
        "balanced": "NOT_AVAILABLE",
        "aggressive": "NOT_AVAILABLE",
        "favourite": "NO_STABLE_PREDICTION",
        "model_probability_band": "NOT_AVAILABLE",
        "model_price_band": "NOT_AVAILABLE",
        "ampel": "RED",
        "flags": [
          "DATA_NOT_READY"
        ],
        "data_readiness": "NOT_READY",
        "match_core_status": "RESTRICTED",
        "nsp_codes": [
          "NSP_DATA_NOT_READY",
          "NSP_MATERIAL_CONFLICT"
        ],
        "anchor": "NOT_AVAILABLE",
        "prime_world": "NOT_AVAILABLE",
        "counterworld": "NOT_AVAILABLE",
        "modal_score": "NOT_AVAILABLE",
        "four_score_cluster": [],
        "score_band": "NOT_AVAILABLE"
      },
      {
        "fixture_id": "UEFA-2149202",
        "kickoff": "21:00",
        "competition": "UEFA Europa League",
        "phase": "Q3 · Hinspiel",
        "home": "Shamrock Rovers",
        "away": "Egnatia Rrogozhinë",
        "world_type": "GOALS_OPEN",
        "safe": "Über 1.5 Tore",
        "balanced": "BTTS Ja",
        "aggressive": "Über 2.5 Tore",
        "favourite": "Über 1.5 Tore",
        "model_probability_band": "72–84 %",
        "model_price_band": "1.19–1.39",
        "ampel": "YELLOW",
        "flags": [
          "DATA_CONDITIONAL",
          "LOW_SAMPLE"
        ],
        "data_readiness": "CONDITIONAL",
        "match_core_status": "PARTIAL",
        "nsp_codes": [],
        "anchor": "Shamrocks Heimvolumen trifft auf eine auswärts fehleranfällige Struktur.",
        "prime_world": "Shamrock erzeugt wiederholt Abschlüsse.",
        "counterworld": "Egnatia verteidigt kompakt und hält die Partie torarm.",
        "modal_score": "2:1",
        "four_score_cluster": [
          "1:1",
          "2:1",
          "2:2",
          "1:2"
        ],
        "score_band": "2–4"
      }
    ],
    "proof_of_work": {
      "matches_in_scope": 10,
      "matches_committed": 10,
      "matches_no_stable_prediction": 6,
      "silent_exclusions": 0,
      "out_of_scope_discovered": 13,
      "team_ebooks_built": 20,
      "match_ebooks_built": 10,
      "real_odds_input": 0,
      "tickets_created": false
    }
  }
};
