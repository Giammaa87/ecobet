from pathlib import Path

PATH = Path("index.html")
text = PATH.read_text(encoding="utf-8")
original = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    text = text.replace(old, new, 1)
    print(f"PATCHED: {label}")

# 1) Accept both object and string Match-E-Book evidence and add v1.3/v1.4 compatibility helpers.
old = """  const evidence=m.match_ebook_evidence&&typeof m.match_ebook_evidence==='object'?m.match_ebook_evidence:null;
  const hasWorld=present(m.prime_world)||present(m.counterworld)||primeDetail||counterDetail;
  const hasEvidence=present(m.anchor)||present(m.modal_score)||cluster.length||present(m.score_band)||scoreDist;

  const candidateName=item=>present(item&&item.expression)?item.expression:(present(item&&item.prediction)?item.prediction:null);
"""
new = """  const evidence=m.match_ebook_evidence&&typeof m.match_ebook_evidence==='object'?m.match_ebook_evidence:null;
  const evidenceText=typeof m.match_ebook_evidence==='string'&&present(m.match_ebook_evidence)?m.match_ebook_evidence:null;
  const fieldStatus=m.field_status&&typeof m.field_status==='object'?m.field_status:null;
  const hasWorld=present(m.prime_world)||present(m.counterworld)||primeDetail||counterDetail;
  const hasEvidence=present(m.anchor)||present(m.modal_score)||cluster.length||present(m.score_band)||scoreDist||evidenceText;

  // Schema compatibility: v1.3 and v1.4 use different names for the same candidate/world concepts.
  const candidateName=item=>present(item&&item.expression)?item.expression:(present(item&&item.prediction)?item.prediction:null);
  const candidateAxis=item=>present(item&&item.axis)?item.axis:(present(item&&item.market_axis)?item.market_axis:null);
  const candidateWorld=item=>present(item&&item.world)?item.world:(present(item&&item.supported_world)?item.supported_world:null);
  const candidateScore=item=>present(item&&item.score_total)?item.score_total:(present(item&&item.score)?item.score:null);
  const candidateShock=item=>item&&item.shock_test&&typeof item.shock_test==='object'?item.shock_test:(item&&item.shock&&typeof item.shock==='object'?item.shock:null);
  const candidateTags=item=>[candidateAxis(item),candidateWorld(item),...arr(item&&item.penalties),...arr(item&&item.flags)].filter(present);
  const worldText=(world,detail)=>{
    if(detail&&present(detail.description))return detail.description;
    if(detail&&present(detail.mechanism))return detail.mechanism;
    if(typeof world==='string')return world;
    if(world&&typeof world==='object')return world.mechanism||world.description||world.summary||world.text||null;
    return null;
  };
  const worldPlausibility=(world,detail)=>present(detail&&detail.plausibility)?detail.plausibility:(world&&typeof world==='object'&&present(world.plausibility)?world.plausibility:null);
  const worldType=(world,detail)=>present(detail&&detail.world_type)?detail.world_type:(world&&typeof world==='object'&&present(world.world_type)?world.world_type:null);
"""
replace_once(old, new, "compatibility helpers")

# 2) Candidate table and cards: map axis/world aliases and show v1.4 shock_test values without removing old fields.
old = """  const candidateRows=candidates.map(item=>`<tr><td>${show(candidateName(item))}</td><td>${show(item.axis)}</td><td>${show(item.world)}</td><td>${show(item.cluster_coverage)}</td><td>${show(item.p_raw)}</td><td>${show(item.W)} / ${show(item.F)} / ${show(item.R)} / ${show(item.D)}</td><td>${show(item.score_total)}</td><td>${show(item.robustness)}</td><td>${arr(item.penalties).length?esc(arr(item.penalties).join(', ')):'—'}</td><td>${show(item.status)}</td></tr>`).join('');
  const candidateCards=candidates.map(item=>{
    const rawProb=present(item.p_raw)?String(item.p_raw)+(typeof item.p_raw==='number'?'%':''):'—';
    const robust=show(item.robustness);
    const low=String(item.robustness||'').toUpperCase()==='LOW';
    const tags=[item.axis,item.world,...arr(item.penalties)].filter(present);
    const wfrd=[item.W,item.F,item.R,item.D].every(v=>v!==undefined&&v!==null)?`${item.W}/${item.F}/${item.R}/${item.D}`:(present(item.W_F_R_D)?item.W_F_R_D:'—');
    return `<article class="candidate-card ${low?'low':'valid'}"><div class="candidate-card-head"><h5>${show(candidateName(item))}</h5><span class="candidate-score">${show(item.score_total)}</span></div><ul><li><span>Achse</span><b>${show(item.axis)}</b></li><li><span>Szenario</span><b>${show(item.world)}</b></li><li><span>Abdeckung</span><b>${show(item.cluster_coverage)}</b></li><li><span>p_raw</span><b>${esc(rawProb)}</b></li><li><span>Robustheit</span><b>${robust}</b></li><li><span>W/F/R/D</span><b>${show(wfrd)}</b></li></ul><div class="candidate-meta">${tags.map(tag=>`<span class="match-flag">${show(tag)}</span>`).join('')}</div></article>`;
  }).join('');
"""
new = """  const candidateRows=candidates.map(item=>`<tr><td>${show(candidateName(item))}</td><td>${show(candidateAxis(item))}</td><td>${show(candidateWorld(item))}</td><td>${show(item.cluster_coverage)}</td><td>${show(item.p_raw)}</td><td>${show(item.W)} / ${show(item.F)} / ${show(item.R)} / ${show(item.D)}</td><td>${show(candidateScore(item))}</td><td>${show(item.robustness)}</td><td>${arr(item.penalties).length?esc(arr(item.penalties).join(', ')):'—'}</td><td>${show(item.status)}</td></tr>`).join('');
  const candidateCards=candidates.map(item=>{
    const rawProb=present(item.p_raw)?String(item.p_raw)+(typeof item.p_raw==='number'?'%':''):'—';
    const robust=show(item.robustness);
    const low=String(item.robustness||'').toUpperCase()==='LOW';
    const shockInfo=candidateShock(item);
    const shockTags=shockInfo?Object.entries(shockInfo).filter(([,v])=>present(v)).map(([k,v])=>`${k}: ${v}`):[];
    const tags=[...candidateTags(item),...shockTags];
    const wfrd=[item.W,item.F,item.R,item.D].every(v=>v!==undefined&&v!==null)?`${item.W}/${item.F}/${item.R}/${item.D}`:(present(item.W_F_R_D)?item.W_F_R_D:'—');
    return `<article class="candidate-card ${low?'low':'valid'}"><div class="candidate-card-head"><h5>${show(candidateName(item))}</h5><span class="candidate-score">${show(candidateScore(item))}</span></div><ul><li><span>Achse</span><b>${show(candidateAxis(item))}</b></li><li><span>Szenario</span><b>${show(candidateWorld(item))}</b></li><li><span>Abdeckung</span><b>${show(item.cluster_coverage)}</b></li><li><span>p_raw</span><b>${esc(rawProb)}</b></li><li><span>Robustheit</span><b>${robust}</b></li><li><span>W/F/R/D</span><b>${show(wfrd)}</b></li></ul><div class="candidate-meta">${tags.map(tag=>`<span class="match-flag">${show(tag)}</span>`).join('')}</div></article>`;
  }).join('');
"""
replace_once(old, new, "candidate schema compatibility")

# 3) Prediction path lookup must also understand v1.4 market_axis.
old = """    return `<tr><td>${show(expression)}</td><td class="path-name">${esc(path)}</td><td>${show(candidate.axis)}</td><td>${show(candidate.cluster_coverage)}</td><td>${show(wfrd)}</td><td>${show(candidate.score_total)}</td><td>${show(candidate.robustness)}</td><td>${show(candidate.status)}</td></tr>`;
"""
new = """    return `<tr><td>${show(expression)}</td><td class="path-name">${esc(path)}</td><td>${show(candidateAxis(candidate))}</td><td>${show(candidate.cluster_coverage)}</td><td>${show(wfrd)}</td><td>${show(candidateScore(candidate))}</td><td>${show(candidate.robustness)}</td><td>${show(candidate.status)}</td></tr>`;
"""
replace_once(old, new, "path candidate aliases")

# 4) Team E-Books: retain legacy fields renderer, but fall back to direct v1.3/v1.4 properties and nested data_quality.
old = """  const renderTeam=(side,label)=>{
    const team=teamEbook&&teamEbook[side];
    if(!team)return `<article class="report-team-card"><div class="report-team-head"><div><h5>${show(label)}</h5></div></div><p class="unavailable-note">Nicht im run_record vorhanden.</p></article>`;
    const fields=team.fields&&typeof team.fields==='object'?Object.values(team.fields):[];
    const completenessField=fields.find(field=>/completeness|vollständigkeit/i.test(String(field.label||'')));
    const topBadge=present(completenessField?.status)?completenessField.status:(fields.find(field=>present(field.status))?.status||null);
    return `<article class="report-team-card"><div class="report-team-head"><div><h5>${show(team.team||label)}</h5>${present(team.role)?`<div class="team-role">${show(team.role)}</div>`:''}</div>${present(topBadge)?`<span class="team-badge">${show(topBadge)}</span>`:''}</div><div class="team-summary">${fields.map(field=>`<div class="team-row"><div class="team-key">${show(field.label)}</div><div class="team-value">${show(field.value)}${(present(field.status)||present(field.trust))?`<span class="team-note">${present(field.status)?show(field.status):'—'}${present(field.trust)?` · Vertrauen ${show(field.trust)}`:''}</span>`:''}</div></div>`).join('')}</div></article>`;
  };
"""
new = """  const teamLabel={season:'Saison',L5:'Letzte 5',role:'Rolle / Profil',process:'Prozess',load:'Belastung',events:'Ereignisse',regime:'Regime',trust:'Vertrauen',data_snapshot_id:'Snapshot-ID',snapshot_shard_ref:'Snapshot-Shard',snapshot_feature_count_declared:'Deklarierte Snapshot-Features',raw_core_status:'Core-Status',team_data_completeness:'Datenvollständigkeit',team_data_trust:'Datenvertrauen',note:'Hinweis'};
  const teamFieldLabel=key=>teamLabel[key]||String(key).replace(/_/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase());
  const teamValue=value=>Array.isArray(value)?value.join(' · '):(value&&typeof value==='object'?JSON.stringify(value):value);
  const renderTeam=(side,label)=>{
    const team=teamEbook&&teamEbook[side];
    if(!team)return `<article class="report-team-card"><div class="report-team-head"><div><h5>${show(label)}</h5></div></div><p class="unavailable-note">Nicht im run_record vorhanden.</p></article>`;
    let fields=team.fields&&typeof team.fields==='object'?Object.values(team.fields):[];
    if(!fields.length){
      const skip=new Set(['team','fields','data_quality']);
      fields=Object.entries(team).filter(([key,value])=>!skip.has(key)&&present(value)).map(([key,value])=>({label:teamFieldLabel(key),value:teamValue(value)}));
      if(team.data_quality&&typeof team.data_quality==='object'){
        fields.push(...Object.entries(team.data_quality).filter(([,value])=>present(value)).map(([key,value])=>({label:teamFieldLabel(key),value:teamValue(value)})));
      }
    }
    const completenessField=fields.find(field=>/completeness|vollständigkeit|core-status|datenvollständigkeit/i.test(String(field.label||'')));
    const directBadge=team.data_quality&&typeof team.data_quality==='object'?(team.data_quality.team_data_completeness||team.data_quality.team_data_trust):null;
    const topBadge=present(completenessField?.status)?completenessField.status:(present(completenessField?.value)?completenessField.value:(present(directBadge)?directBadge:(fields.find(field=>present(field.status))?.status||null)));
    return `<article class="report-team-card"><div class="report-team-head"><div><h5>${show(team.team||label)}</h5>${present(team.role)?`<div class="team-role">${show(team.role)}</div>`:''}</div>${present(topBadge)?`<span class="team-badge">${show(topBadge)}</span>`:''}</div><div class="team-summary">${fields.length?fields.map(field=>`<div class="team-row"><div class="team-key">${show(field.label)}</div><div class="team-value">${show(field.value)}${(present(field.status)||present(field.trust))?`<span class="team-note">${present(field.status)?show(field.status):'—'}${present(field.trust)?` · Vertrauen ${show(field.trust)}`:''}</span>`:''}</div></div>`).join(''):'<p class="unavailable-note">Team-E-Book vorhanden, aber ohne darstellbare Detailfelder.</p>'}</div></article>`;
  };
"""
replace_once(old, new, "team ebook direct-field fallback")

# 5) Data availability matrix: make field_status visible as an available data block.
old = """    availabilityRow('Team-E-Books · Rohübersicht',!!teamEbook),
    availabilityRow('Interpretationsachsen',!!axes),
"""
new = """    availabilityRow('Team-E-Books · Rohübersicht',!!teamEbook),
    availabilityRow('DF01–DF16 Feldstatus',!!fieldStatus),
    availabilityRow('Interpretationsachsen',!!axes),
"""
replace_once(old, new, "availability field status")

# 6) Show the full DF01-DF16 status without changing any gate logic.
old = """    <section class="report-subsection">
      <h4>Match-E-Book · Übersicht</h4>
"""
new = """    ${fieldStatus?`<section class="report-subsection"><h4>Datenfelder · DF01–DF16</h4><div class="report-status-grid">${Object.entries(fieldStatus).map(([code,state])=>{const obj=state&&typeof state==='object'?state:{};const details=[];if(present(obj.status))details.push(`Status ${obj.status}`);if(present(obj.home))details.push(`Home ${obj.home}`);if(present(obj.away))details.push(`Away ${obj.away}`);if(present(obj.trust))details.push(`Vertrauen ${obj.trust}`);return `<div><small>${esc(code)}</small><strong>${details.length?details.map(show).join(' · '):show(state)}</strong></div>`;}).join('')}</div></section>`:''}

    <section class="report-subsection">
      <h4>Match-E-Book · Übersicht</h4>
"""
replace_once(old, new, "field status section")

# 7) If legacy Match-E-Book evidence is a string, display it instead of silently dropping it.
old = """          ${evidence&&present(evidence.data_readiness_evidence)?`<div class="matchbook-note"><strong>Evidenz zur Datenbereitschaft</strong><p>${show(evidence.data_readiness_evidence)}</p></div>`:''}
          <div class="matchbook-note"><strong>Datenstatus</strong><p>${show(m.data_readiness)} · MATCH_CORE_STATUS ${show(m.match_core_status)}</p></div>
"""
new = """          ${evidence&&present(evidence.data_readiness_evidence)?`<div class="matchbook-note"><strong>Evidenz zur Datenbereitschaft</strong><p>${show(evidence.data_readiness_evidence)}</p></div>`:''}
          ${evidenceText?`<div class="matchbook-note"><strong>Match-E-Book Evidenz</strong><p>${show(evidenceText)}</p></div>`:''}
          <div class="matchbook-note"><strong>Datenstatus</strong><p>${show(m.data_readiness)} · MATCH_CORE_STATUS ${show(m.match_core_status)}</p></div>
"""
replace_once(old, new, "string match ebook evidence")

# 8) World objects in v1.4: render mechanism/type/plausibility instead of [object Object].
old = """    ${hasWorld?`<section class="report-subsection"><h4>Szenarioanalyse</h4><div class="report-worlds">
      <div class="report-world prime"><small>Hauptszenario · Plausibilität ${show(primeDetail?.plausibility)}</small><h5>${show(primeDetail?.description||m.prime_world)}</h5>${present(primeDetail?.break_condition)?`<p><b>Bruchauslöser:</b> ${esc(primeDetail.break_condition)}</p>`:''}</div>
      <div class="report-world counter"><small>Gegenszenario · Plausibilität ${show(counterDetail?.plausibility)}</small><h5>${show(counterDetail?.description||m.counterworld)}</h5>${present(counterDetail?.break_condition)?`<p><b>Bruchauslöser:</b> ${esc(counterDetail.break_condition)}</p>`:''}</div>
    </div></section>`:''}
"""
new = """    ${hasWorld?`<section class="report-subsection"><h4>Szenarioanalyse</h4><div class="report-worlds">
      <div class="report-world prime"><small>Hauptszenario${present(worldType(m.prime_world,primeDetail))?` · ${show(worldType(m.prime_world,primeDetail))}`:''} · Plausibilität ${show(worldPlausibility(m.prime_world,primeDetail))}</small><h5>${show(worldText(m.prime_world,primeDetail))}</h5>${present(primeDetail?.break_condition)?`<p><b>Bruchauslöser:</b> ${esc(primeDetail.break_condition)}</p>`:''}</div>
      <div class="report-world counter"><small>Gegenszenario${present(worldType(m.counterworld,counterDetail))?` · ${show(worldType(m.counterworld,counterDetail))}`:''} · Plausibilität ${show(worldPlausibility(m.counterworld,counterDetail))}</small><h5>${show(worldText(m.counterworld,counterDetail))}</h5>${present(counterDetail?.break_condition)?`<p><b>Bruchauslöser:</b> ${esc(counterDetail.break_condition)}</p>`:''}</div>
    </div></section>`:''}
"""
replace_once(old, new, "world object rendering")

# 9) Favourite-decision diagnostics from schema v1.4; purely additive.
old = """      <div class="report-decision-grid ${nsp?'nsp':''}"><div><small>Favorisierte Prognose</small><strong>${nsp?'NO_STABLE_PREDICTION':show(m.favourite)}</strong></div><div><small>Modellwahrscheinlichkeit Band</small><strong class="mono">${show(m.model_probability_band)}</strong></div><div><small>Modellpreis Band</small><strong class="mono">${show(m.model_price_band)}</strong></div><div><small>Ampel</small><strong>${ampelChip(m.ampel)}</strong></div></div>
    </section>
"""
new = """      <div class="report-decision-grid ${nsp?'nsp':''}"><div><small>Favorisierte Prognose</small><strong>${nsp?'NO_STABLE_PREDICTION':show(m.favourite)}</strong></div><div><small>Modellwahrscheinlichkeit Band</small><strong class="mono">${show(m.model_probability_band)}</strong></div><div><small>Modellpreis Band</small><strong class="mono">${show(m.model_price_band)}</strong></div><div><small>Ampel</small><strong>${ampelChip(m.ampel)}</strong></div></div>
      ${(present(m.favourite_decision_reason)||present(m.favourite_specificity)||present(m.favourite_cluster_coverage)||present(m.favourite_robustness)||present(m.numerical_p_raw)||present(m.why_not_safest_candidate)||present(m.why_safe_is_also_best_decision))?`<div class="report-status-grid" style="margin-top:12px"><div><small>Entscheidungsgrund</small><strong>${show(m.favourite_decision_reason)}</strong></div><div><small>Spezifität</small><strong>${show(m.favourite_specificity)}</strong></div><div><small>Cluster-Abdeckung</small><strong>${show(m.favourite_cluster_coverage)}</strong></div><div><small>Favorit-Robustheit</small><strong>${show(m.favourite_robustness)}</strong></div><div><small>Numerisches p_raw</small><strong>${show(m.numerical_p_raw)}</strong></div>${present(m.numerical_p_raw_available)?`<div><small>p_raw verfügbar</small><strong>${show(m.numerical_p_raw_available)}</strong></div>`:''}${present(m.why_not_safest_candidate)?`<div><small>Warum nicht sicherster Kandidat</small><strong>${show(m.why_not_safest_candidate)}</strong></div>`:''}${present(m.why_safe_is_also_best_decision)?`<div><small>Warum Safe zugleich beste Wahl</small><strong>${show(m.why_safe_is_also_best_decision)}</strong></div>`:''}</div>`:''}
    </section>
"""
replace_once(old, new, "favourite decision diagnostics")

if text == original:
    raise SystemExit("No changes made")

PATH.write_text(text, encoding="utf-8")
print(f"OK: index.html patched; size {len(original)} -> {len(text)} characters")
