# ECOBET Team Logos — 2026/27

Local club crest library for the ECOBET website.

## Coverage

- England — Premier League
- Spain — La Liga
- Italy — Serie A
- Germany — Bundesliga
- France — Ligue 1
- UEFA Champions League — 2026/27 league phase
- UEFA Europa League — 2026/27 league phase
- UEFA Conference League — 2026/27 league phase

The generated library currently contains **174 unique clubs**. Clubs appearing in both a domestic league and a UEFA competition are stored once and list all applicable competitions in `manifest.json`.

## Files

- `*.svg` — local crest assets used by the website
- `manifest.json` — canonical club/alias/competition-to-logo lookup
- `unresolved.json` — clubs that could not be safely mapped; expected to be `[]`
- `../../scripts/sync_team_logos.py` — reproducible sync and normalization script
- `../../.github/workflows/sync-team-logos.yml` — GitHub Actions workflow

## Sources

- Current 2026/27 domestic league membership/names: `luukhopman/football-logos`
- SVG artwork source: `JoseArroyave/football-logos`
- UEFA league-phase membership: official UEFA 2026/27 participant lists, verified 27–28 August 2026

## Integration

Website code should resolve teams through `manifest.json` instead of constructing logo filenames from display names. This keeps aliases such as `Inter` / `Inter Milan`, `Rennes` / `Stade Rennais`, and `Athletic Bilbao` / `Athletic Club` mapped to one canonical asset.

## Rights

Club crests can be protected by copyright and/or trademark rights independently of the source repository's software/content licence. Use them for club identification/editorial presentation and respect applicable rights-holder terms.
