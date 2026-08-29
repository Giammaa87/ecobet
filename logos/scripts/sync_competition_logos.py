#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

OUT = Path('logos/assets/competition-logos')
OUT.mkdir(parents=True, exist_ok=True)
UA = 'ECOBET-CompetitionLogoSync/1.0'

COMPETITIONS = [
    {
        'id': 'ENG-Premier League',
        'name': 'Premier League',
        'file': 'premier-league.svg',
        'source': 'wikimedia_commons',
        'source_file': 'Premier_League.svg',
        'aliases': ['Premier League', 'ENG-Premier League', 'EPL'],
    },
    {
        'id': 'GER-Bundesliga',
        'name': 'Bundesliga',
        'file': 'bundesliga.svg',
        'source': 'wikimedia_commons',
        'source_file': 'Bundesliga_logo.svg',
        'aliases': ['Bundesliga', 'GER-Bundesliga'],
    },
    {
        'id': 'ESP-La Liga',
        'name': 'La Liga',
        'file': 'la-liga.svg',
        'source': 'wikimedia_commons',
        'source_file': 'LaLiga_2023_Horizontal_Logo.svg',
        'aliases': ['La Liga', 'LaLiga', 'ESP-La Liga'],
    },
    {
        'id': 'ITA-Serie A',
        'name': 'Serie A',
        'file': 'serie-a.svg',
        'source': 'wikimedia_commons',
        'source_file': 'Serie_A.svg',
        'aliases': ['Serie A', 'ITA-Serie A'],
    },
    {
        'id': 'FRA-Ligue 1',
        'name': 'Ligue 1',
        'file': 'ligue-1.svg',
        'source': 'wikimedia_commons',
        'source_file': "Ligue_1_McDonald's_logo.svg",
        'aliases': ['Ligue 1', 'FRA-Ligue 1', "Ligue 1 McDonald's"],
    },
    {
        'id': 'UEFA-Champions League',
        'name': 'UEFA Champions League',
        'file': 'champions-league.svg',
        'source': 'wikimedia_commons',
        'source_file': 'UEFA_Champions_League_logo.svg',
        'aliases': ['UEFA Champions League', 'Champions League', 'UCL'],
    },
    {
        'id': 'UEFA-Europa League',
        'name': 'UEFA Europa League',
        'file': 'europa-league.svg',
        'source': 'wikimedia_commons',
        'source_file': 'UEFA_Europa_League_logo_(2024_version).svg',
        'source_url': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/UEFA_Europa_League_logo_%282024_version%29.svg',
        'aliases': ['UEFA Europa League', 'Europa League', 'UEL'],
    },
    {
        'id': 'UEFA-Conference League',
        'name': 'UEFA Conference League',
        'file': 'conference-league.svg',
        'source': 'wikimedia_commons',
        'source_file': 'UEFA_Conference_League_logo_(2024_version).svg',
        'source_url': 'https://upload.wikimedia.org/wikipedia/commons/2/26/UEFA_Conference_League_logo_%282024_version%29.svg',
        'aliases': ['UEFA Conference League', 'Conference League', 'UECL'],
    },
]


def fetch(url: str) -> bytes:
    request = Request(url, headers={'User-Agent': UA})
    return urlopen(request, timeout=60).read()


def commons_url(filename: str) -> str:
    return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + quote(filename, safe='')


def main() -> None:
    manifest_entries = []
    unresolved = []

    for competition in COMPETITIONS:
        url = competition.get('source_url') or commons_url(competition['source_file'])
        try:
            data = fetch(url)
            head = data[:1000].lower()
            if b'<svg' not in head and b'<?xml' not in head:
                raise RuntimeError('download is not SVG')
            destination = OUT / competition['file']
            destination.write_bytes(data)
            entry = dict(competition)
            entry['path'] = str(destination).replace('\\', '/')
            entry['source_url'] = url
            manifest_entries.append(entry)
        except Exception as exc:
            unresolved.append({
                'id': competition['id'],
                'name': competition['name'],
                'source_url': url,
                'error': str(exc),
            })

    manifest = {
        'schema_version': '1.0',
        'record_type': 'ecobet_competition_logo_manifest',
        'season': '2026/27',
        'counts': {
            'requested': len(COMPETITIONS),
            'resolved': len(manifest_entries),
            'unresolved': len(unresolved),
        },
        'competitions': manifest_entries,
    }

    (OUT / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    (OUT / 'unresolved.json').write_text(
        json.dumps(unresolved, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )

    print(json.dumps(manifest['counts']))
    if unresolved:
        print(json.dumps(unresolved, ensure_ascii=False, indent=2))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
