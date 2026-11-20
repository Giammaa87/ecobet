/* ECOBET KI-Analyst V1 – Anzeige unter Top Reads. Ergaenzt (ersetzt nicht) die bestehende Top-Reads-Anzeige.
   Liest analyst/index.json -> analyst/<publication_id>.json (Schema ECOBET_AI_ANALYST_DAY_V1). Keine Berechnungen, nur Darstellung. */
(function(){
"use strict";
var SCHEMA="ECOBET_AI_ANALYST_DAY_V1",PATHS=["FAVOURITE","SAFE","BALANCED","AGGRESSIVE"];
var DEC={CONFIRM_FAVOURITE:"FAVOURITE bestätigt",OTHER_ECOBET_PATH:"Anderer ECOBET-Pfad",KI_TOP:"KI TOP",SKIP:"SKIP – nicht spielen"};
var AG={EXACT:"exakt",COMPATIBLE:"vereinbar",PARTIAL:"teilweise",CONTRADICTORY:"widersprüchlich",NOT_ASSESSABLE:"nicht beurteilbar"};
var STAT={NULL_DAY:"Bestätigter Nulltag – keine Spiele, keine Analyse.",MASTER_MISSING:"Kein Master-Ergebnis vorhanden – keine Analyse, keine Ersatzprognosen.",MASTER_FAILED:"Master fehlerhaft – keine Analyse, keine Ersatzprognosen.",MASTER_PARTIAL:"Master unvollständig – keine Analyse, keine Ersatzprognosen.",ANALYST_ERROR:"Analyst-Lauf fehlgeschlagen – keine Ersatzprognosen."};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function md(s){ // minimales, sicheres Markdown: Absaetze, **fett**, - Listen
  var out=[],list=false;String(s||"").split(/\n/).forEach(function(l){var e=esc(l).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
    if(/^\s*[-*] /.test(l)){if(!list){out.push("<ul>");list=true}out.push("<li>"+e.replace(/^\s*[-*] /,"")+"</li>")}
    else{if(list){out.push("</ul>");list=false}if(l.trim())out.push("<p>"+e+"</p>")}});
  if(list)out.push("</ul>");return out.join("")}
function get(u){return fetch(u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(u+" HTTP "+r.status);return r.json()})}
function chain(c){
  var f=c.finding&&c.finding.text?c.finding.text:c.finding,h='<div class="an-chain"><b>Befund '+esc(c.finding_id)+'</b> <span class="an-tag">'+esc(c.phase==="Q"?"Phase Q":"nach Offenlegung")+'</span> '+(c.material?'<span class="an-tag an-mat">wesentlich'+(c.materiality?" · "+esc(c.materiality.area)+" "+esc(c.materiality.level):"")+'</span>':'<span class="an-tag">nicht wesentlich</span>');
  h+='<p>'+esc(f)+(c.finding&&c.finding.origin?' <i>('+esc(c.finding.origin)+')</i>':'')+'</p><p><b>Sportliche Auswirkung:</b> '+esc(c.sporting_effect)+'</p>';
  if(c.material){h+='<p><b>Betroffene Märkte:</b></p><ul>';(c.affected_markets||[]).forEach(function(m){h+='<li>'+esc(m.path)+' · '+esc(m.market_text)+': '+esc(m.effect)+' – '+esc(m.why)+'</li>'});
    h+='</ul><p><b>Gegencheck-Entscheidung:</b> '+esc(c.decision_effect)+'</p><p><b>Rangwirkung:</b> '+esc(c.rank_effect&&c.rank_effect.value)+(c.rank_effect&&c.rank_effect.why?' – '+esc(c.rank_effect.why):'')+'</p>'}
  else h+='<p><b>Warum nicht wesentlich:</b> '+esc(c.not_material_reason)+'</p>';
  return h+'</div>'}
function game(g){
  var d=el("details","an-game"+(g.playable_top===false?" an-skip":""));
  var rk=g.rank.reviewed==null?"–":g.rank.reviewed,dec=g.decision?(DEC[g.decision.value]||g.decision.value):"nicht geprüft ("+esc(g.eligibility.status)+")";
  var pm=g.decision&&g.decision.preferred_market&&g.decision.preferred_market.market_text?g.decision.preferred_market.market_text:"—";
  var s=el("summary","an-sum",'<span class="an-rank">'+esc(rk)+'</span><span class="an-match">'+esc(g.match)+'<small>'+esc(g.competition)+' · '+esc((g.kickoff_utc||"").replace("T"," ").replace("Z"," UTC"))+'</small></span><span class="an-dec"><b>'+esc(dec)+'</b><small>'+esc(pm)+'</small></span><span class="an-orig">Original #'+esc(g.original.rank)+'</span>');
  d.appendChild(s);var b=el("div","an-body");
  var h='<p class="an-ranks"><b>Rang:</b> Original '+esc(g.original.rank)+' · überprüft '+esc(rk)+(g.rank.change!=null?' ('+(g.rank.change>0?'+':'')+esc(g.rank.change)+' relativ)':'')+'</p>';
  h+='<table class="an-t"><thead><tr><th>Pfad</th><th>Markt</th><th>Pilot-05</th>'+(g.ecobet_agreement?'<th>Markt-Übereinst.</th><th>Annahmen</th>':'')+'</tr></thead><tbody>';
  PATHS.forEach(function(p){var e=g.ecobet[p],a=g.ecobet_agreement&&g.ecobet_agreement[p];h+='<tr><td>'+p+'</td><td>'+esc(e.market)+'</td><td>'+esc(e.pilot05_category)+'</td>'+(a?'<td>'+esc(AG[a.market_agreement]||a.market_agreement)+'</td><td>'+esc(AG[a.assumption_agreement]||a.assumption_agreement)+(a.assumption_comment?'<small> '+esc(a.assumption_comment)+'</small>':'')+'</td>':'')+'</tr>'});
  h+='</tbody></table>';
  var kc=g.ki_top_computational,kq=g.ki_top_qualitative;
  h+='<p><b>KI TOP (rechnerisch, Pilot 05):</b> '+esc(kc.market)+' <small>(schlechtester Fall '+esc(kc.worst_case_p)+')</small></p>';
  if(kq)h+='<p><b>KI TOP (qualitativ, Phase Q):</b> '+esc(kq.market)+' <small>(Konfidenz '+esc(kq.confidence)+')</small>'+(kq.differs_from_computational?' – <i>weicht ab:</i> '+esc(kq.difference_explanation):' – deckt sich mit dem rechnerischen')+'</p>';
  if(g.decision){h+='<p><b>Endentscheidung:</b> '+esc(dec)+' · '+esc(pm)+'</p><p>'+esc(g.decision.reasoning)+'</p>';
    if(g.preferred_market_fragility_assessment)h+='<p><b>Fragilität des bevorzugten Marktes:</b> '+esc(g.preferred_market_fragility_assessment.text)+'</p>'}
  if(g.phase_q&&g.phase_q.xi_elo_check)h+='<p><b>Spieler/XI/Elo-Prüfung:</b> '+esc(g.phase_q.xi_elo_check.status)+(g.phase_q.xi_elo_check.summary?' – '+esc(g.phase_q.xi_elo_check.summary):'')+'</p>';
  b.innerHTML=h;
  if(g.findings&&g.findings.length){var fs=el("details","an-sub");fs.appendChild(el("summary",null,"Befunde und Befundketten ("+g.findings.length+")"));fs.appendChild(el("div",null,g.findings.map(chain).join("")));b.appendChild(fs)}
  var dt=el("details","an-sub");dt.appendChild(el("summary",null,"Ausführliche Begründung"));dt.appendChild(el("div","an-detail",md(g.detail_md)));b.appendChild(dt);
  if(g.phase_q&&g.phase_q.research_log&&g.phase_q.research_log.length){var rs=el("details","an-sub");rs.appendChild(el("summary",null,"Recherchequellen ("+g.phase_q.research_log.length+")"));rs.appendChild(el("ul",null,g.phase_q.research_log.map(function(x){return"<li>"+esc(x.source)+" – "+esc(x.claim)+"</li>"}).join("")));b.appendChild(rs)}
  d.appendChild(b);return d}
function render(root,doc){
  root.innerHTML="";root.appendChild(el("div","an-head",'<div class="eyebrow">KI-Analyst V1 · '+esc(doc.date)+' · '+esc(doc.status)+'</div><h3>Vollständige KI-Analyse aller Spiele</h3><p class="muted">Unabhängige Zusatzanalyse. Kein Ersatz der ECOBET-Prognosen, keine Trefferwahrscheinlichkeit, nicht ausgewertet. Version '+esc(doc.analyst&&doc.analyst.assignment_version)+' · SHA-256 '+esc((doc.analyst&&doc.analyst.assignment_sha256||"").slice(0,12))+'…</p>'));
  if(STAT[doc.status]){root.appendChild(el("p","an-status",esc(STAT[doc.status])+(doc.reason?" "+esc(doc.reason):"")));return}
  var sm=doc.summary||{};root.appendChild(el("p","an-sum-line","<b>"+esc(doc.fixtures_reviewed)+"</b> von "+esc(doc.fixtures_total)+" Spielen geprüft · <b>"+esc(sm.playable_count)+"</b> spielbar · "+esc(sm.skip_count)+" SKIP"+(doc.fixtures_not_eligible?" · "+esc(doc.fixtures_not_eligible)+" nicht prüfbar (zu spät)":"")));
  if(sm.top5&&sm.top5.length){var t=el("ol","an-top");sm.top5.forEach(function(x){t.appendChild(el("li",null,"<b>"+esc(x.match)+"</b> – "+esc(x.market)+" <small>("+esc(DEC[x.decision]||x.decision)+")</small>"))});root.appendChild(el("div","an-top5","<h4>Top 5 (nur spielbare Empfehlungen)</h4>"));root.lastChild.appendChild(t)}
  root.appendChild(el("h4",null,"Alle Spiele (überprüfter Rang)"));
  doc.games.forEach(function(g){root.appendChild(game(g))})}
function css(){if(document.getElementById("an-css"))return;var s=el("style");s.id="an-css";s.textContent=
".an-panel{margin:16px 0;padding:14px}.an-sum{display:grid;grid-template-columns:34px 1fr auto auto;gap:10px;align-items:center;cursor:pointer;padding:8px 0;list-style:none}.an-sum small,.an-ranks small{display:block;opacity:.7}.an-rank{font-weight:700;font-size:1.2em;color:var(--accent,#42e7aa)}.an-game{border-bottom:1px solid rgba(102,151,160,.24)}.an-skip{opacity:.65}.an-body{padding:6px 0 12px}.an-t{width:100%;border-collapse:collapse;font-size:.85em;margin:8px 0;display:block;overflow-x:auto}.an-t td,.an-t th{padding:4px 8px;border-bottom:1px solid rgba(102,151,160,.2);text-align:left}.an-sub{margin:6px 0;padding-left:8px}.an-chain{margin:8px 0;padding:8px;border-left:3px solid var(--blue,#67c8fa);background:rgba(255,255,255,.03)}.an-tag{font-size:.75em;padding:1px 6px;border-radius:8px;background:rgba(255,255,255,.08)}.an-mat{background:rgba(66,231,170,.18)}.an-status{padding:10px;border:1px dashed rgba(102,151,160,.5);border-radius:10px}@media(max-width:640px){.an-sum{grid-template-columns:28px 1fr}.an-dec,.an-orig{grid-column:2}}";document.head.appendChild(s)}
function boot(){
  var host=document.getElementById("page-topreads");if(!host||document.getElementById("ai-analyst-panel"))return;css();
  var p=el("section","panel an-panel");p.id="ai-analyst-panel";p.innerHTML='<div class="eyebrow">KI-Analyst V1</div><p class="muted">Lade KI-Analyse …</p>';
  var anchor=document.getElementById("v4-ranking");if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(p,anchor.nextSibling);else host.appendChild(p);
  get("analyst/index.json").then(function(ix){
    var ids=Object.keys(ix.entries||{}).sort();if(!ids.length)throw new Error("keine Veröffentlichung im Index");
    var sel=el("select","an-sel");ids.slice().reverse().forEach(function(i){var o=el("option",null,esc(i)+" · "+esc(ix.entries[i].status));o.value=i;sel.appendChild(o)});
    var box=el("div");function load(id){var en=ix.entries[id];box.innerHTML='<p class="muted">Lade …</p>';get(en.file).then(function(doc){if(doc.schema!==SCHEMA)throw new Error("Schema "+doc.schema+" ungültig");render(box,doc)}).catch(function(e){box.innerHTML='<p class="an-status">KI-Analyse konnte nicht angezeigt werden: '+esc(e.message)+'</p>'})}
    p.innerHTML="";if(ids.length>1)p.appendChild(sel);p.appendChild(box);sel.onchange=function(){load(sel.value)};load(ids[ids.length-1])
  }).catch(function(e){p.innerHTML='<div class="eyebrow">KI-Analyst V1</div><p class="an-status">Noch keine KI-Analyse veröffentlicht ('+esc(e.message)+').</p>'})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
