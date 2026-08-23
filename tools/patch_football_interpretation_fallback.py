from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
old = '''    ${!nsp?`<section class="report-subsection">
      <h4>Fussballinterpretation</h4>
      ${present(m.football_interpretation?.summary)?`<div class="report-anchor"><span class="chip green">${show(m.world_type)}</span><p>${esc(m.football_interpretation.summary)}</p></div>`:''}
      ${axes?`<div class="report-axis-grid">${axisHtml}</div>`:'<p class="unavailable-note">Keine strukturierten Achsen vorhanden.</p>'}
      ${gameState?`<h5 class="detail-mini-title">Spielzustände</h5><div class="report-status-grid">${stateRows}</div>`:''}
    </section>`:''}
'''
new = '''    ${!nsp?`<section class="report-subsection">
      <h4>Fussballinterpretation</h4>
      ${present(m.football_interpretation?.summary)?`<div class="report-anchor"><span class="chip green">${show(m.world_type)}</span><p>${esc(m.football_interpretation.summary)}</p></div>`:(present(m.anchor)?`<div class="report-anchor"><span class="chip green">${show(m.world_type)}</span><p>${show(m.anchor)}</p></div>`:'<p class="unavailable-note">Keine zusammenfassende Fussballinterpretation im run_record vorhanden.</p>')}
      ${(present(worldText(m.prime_world,primeDetail))||present(worldText(m.counterworld,counterDetail)))?`<div class="report-worlds" style="margin-top:14px"><div class="report-world prime"><small>Spielmechanismus · PRIME</small><h5>${show(worldText(m.prime_world,primeDetail))}</h5></div><div class="report-world counter"><small>Gegenmechanismus · COUNTER</small><h5>${show(worldText(m.counterworld,counterDetail))}</h5></div></div>`:''}
      ${axes&&Object.values(axes).some(v=>present(v)&&String(v).toUpperCase()!=='NOT_AVAILABLE')?`<div class="report-axis-grid">${axisHtml}</div>`:'<p class="unavailable-note">Strukturierte Interpretationsachsen sind in diesem Run nicht verfügbar.</p>'}
      ${gameState&&Object.keys(gameState).length?`<h5 class="detail-mini-title">Spielzustände</h5><div class="report-status-grid">${stateRows}</div>`:''}
    </section>`:''}
'''
count = s.count(old)
if count != 1:
    raise SystemExit(f'Expected one football interpretation block, found {count}')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('football interpretation fallback patched')
