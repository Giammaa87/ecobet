# /data/ — Input für ECOBET

Hier liegen die Daily Data Snapshots aus der lokalen soccerdata-Datenbank.
Erzeugt und veröffentlicht von Claude Code (build_daily_snapshot.py + publish).

Struktur:

    data/<YYYY-MM-DD>/latest.json          → jeweils neuester Snapshot des Tages, darf aktualisiert werden
    data/<YYYY-MM-DD>/<snapshot_id>.json   → versionierter Snapshot, wird NIE überschrieben

Der ECOBET Master ruft beim Lauf die Adresse zum angefragten Datum ab.
Diese Webseite stellt die Dateien nur bereit und zeigt sie bewusst nicht an.

Abzugrenzen von /runs/ — dort liegt der Output von ECOBET.
