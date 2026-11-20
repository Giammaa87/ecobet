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

function game(g,i){
  var id="an-detail-"+(i+1),rk=g.rank&&g.rank.reviewed!=null?g.rank.reviewed:"–",or=g.original&&g.original.rank!=null?g.original.rank:"–";
  var value=g.decision&&g.decision.value,dec=value?(DEC[value]||value):"Nicht geprüft";
  var preferred=g.decision&&g.decision.preferred_market||{};
  var preferredSource=preferred.source||"NONE",preferredText=preferred.market_text||"Kein Markt";
  var eco=g.ecobet||{},fav=eco.FAVOURITE&&eco.FAVOURITE.market||"Nicht verfügbar";
  var q=g.ki_top_qualitative||{},c=g.ki_top_computational||{};
  var fullReason=g.decision&&g.decision.reasoning||g.rank&&g.rank.reason||"Keine ausführliche Begründung vorhanden.";
  var shortReason=fullReason.length>195?fullReason.slice(0,190).replace(/\s+\S*$/,"")+"…":fullReason;
  var quoted=preferredSource==="NONE"?null:(eco[preferredSource]&&eco[preferredSource].published_odds);
  var quote=quoted!=null&&Number(quoted)>0?Number(quoted).toFixed(3):null;
  var status=value==="SKIP"?"SKIP":!value?"NICHT PRÜFBAR":preferredSource==="FAVOURITE"?"FAVOURITE":preferredSource==="KI_TOP"?"KI TOP":preferredSource;
  var tagClass=value==="SKIP"?"an-judgement-skip":value==="CONFIRM_FAVOURITE"?"an-judgement-ok":"an-judgement-alt";
  var row='<tr class="an-game-row'+(g.playable_top===false?' an-notplayable':'')+'">'+
    '<td class="an-rank"><strong>'+esc(rk)+'</strong><small>alt '+esc(or)+'</small></td>'+
    '<td class="an-match"><b>'+esc(g.match||"Unbekannte Begegnung")+'</b><small>'+esc(g.competition||"")+" · "+esc(timeCH(g.kickoff_utc))+'</small></td>'+
    '<td>'+esc(fav)+'</td>'+
    '<td>'+esc(q.market||"Nicht verfügbar")+'</td>'+
    '<td><b>'+esc(preferredText)+'</b><small class="an-judgement '+tagClass+'">'+esc(dec)+'</small></td>'+
    '<td><span class="an-tag '+tagClass+'">'+esc(status)+'</span></td>'+
    '<td>'+(quote?'<b>'+esc(quote)+'</b>':'<span class="an-no-quote">Keine Quote</span>')+'</td>'+
    '<td><button type="button" class="an-expand" data-an-expand="'+esc(id)+'" aria-controls="'+esc(id)+'" aria-expanded="false">Details öffnen</button></td></tr>';
  var why='<tr class="an-why"><td colspan="8"><b>Warum?</b> '+esc(shortReason)+'</td></tr>';
  var detail='<div class="an-review">';
  detail+='<div class="an-review-head"><h4>Analyse und Marktentscheidung</h4><p><b>Endentscheidung:</b> '+esc(dec)+' · '+esc(preferredText)+'</p><p>'+esc(fullReason)+'</p></div>';
  detail+='<div class="an-review-cards"><div><b>Ursprünglicher Pilot 05</b><p>Rang '+esc(or)+' · '+esc(g.original&&g.original.best_market||"–")+'</p><small>Agreement: '+esc(g.original&&g.original.fixture_category||"–")+'</small></div>'+
    '<div><b>KI TOP – rechnerisch</b><p>'+esc(c.market||"–")+'</p><small>Worst-Case-Schätzung: '+(c.worst_case_p==null?"nicht verfügbar":esc(Math.round(c.worst_case_p*100)+" %"))+'</small></div>'+
    '<div><b>KI TOP – qualitativ</b><p>'+esc(q.market||"–")+'</p><small>Konfidenz: '+esc(q.confidence||"nicht angegeben")+'</small></div></div>';
  if(q.reasoning)detail+='<p><b>Unabhängige KI-Spielanalyse:</b> '+esc(q.reasoning)+'</p>';
  if(q.differs_from_computational&&q.difference_explanation)detail+='<p><b>Warum die KI-TOP-Stände abweichen:</b> '+esc(q.difference_explanation)+'</p>';
  if(g.preferred_market_fragility_assessment&&g.preferred_market_fragility_assessment.text)detail+='<p><b>Fragilität des gewählten Marktes:</b> '+esc(g.preferred_market_fragility_assessment.text)+'</p>';
  if(g.rank&&g.rank.reason)detail+='<p><b>Begründung der Rangposition:</b> '+esc(g.rank.reason)+'</p>';
  detail+='<div class="an-table-scroll"><table class="an-markets"><thead><tr><th>ECOBET-Pfad</th><th>Markt</th><th>Quote</th><th>Markt-Übereinstimmung</th><th>Spielannahme</th></tr></thead><tbody>';
  PATHS.forEach(function(p){var e=eco[p]||{},a=g.ecobet_agreement&&g.ecobet_agreement[p]||{};detail+='<tr><th>'+esc(p)+'</th><td>'+esc(e.market||"–")+'</td><td>'+esc(e.published_odds==null?"–":e.published_odds)+'</td><td>'+esc(AG[a.market_agreement]||a.market_agreement||"–")+'</td><td>'+esc(AG[a.assumption_agreement]||a.assumption_agreement||"–")+(a.assumption_comment?'<small>'+esc(a.assumption_comment)+'</small>':'')+'</td></tr>'});
  detail+='</tbody></table></div>';
  if(g.phase_q&&g.phase_q.xi_elo_check)detail+='<p><b>Aufstellung und Adjusted Elo:</b> '+esc(g.phase_q.xi_elo_check.summary||g.phase_q.xi_elo_check.status)+'</p>';
  if(g.findings&&g.findings.length)detail+='<details class="an-nested"><summary>Fragilitäten und Befundketten ('+g.findings.length+')</summary>'+g.findings.map(chain).join("")+'</details>';
  if(g.detail_md)detail+='<details class="an-nested"><summary>Vollständige Spielanalyse</summary><div class="an-detail-text">'+md(g.detail_md)+'</div></details>';
  if(g.phase_q&&g.phase_q.research_log&&g.phase_q.research_log.length){detail+='<details class="an-nested"><summary>Recherchequellen ('+g.phase_q.research_log.length+')</summary><ul>';
    g.phase_q.research_log.forEach(function(x){var u=x.source||"";detail+='<li>'+( /^https:\/\//i.test(u)?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a>':esc(u))+(x.claim?' – '+esc(x.claim):'')+'</li>'});
    detail+='</ul></details>';
  }
  detail+='</div>';
  var expanded='<tr class="an-detail-row" id="'+esc(id)+'" hidden><td colspan="8">'+detail+'</td></tr>';
  return row+why+expanded;
}
function timeCH(iso){
  if(!iso)return "Anstosszeit unbekannt";
  var d=new Date(iso);if(isNaN(d.getTime()))return "Anstosszeit unbekannt";
  return new Intl.DateTimeFormat("de-CH",{timeZone:"Europe/Zurich",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)+" Uhr";
}


function render(root,doc){
  root.innerHTML="";
  root.insertAdjacentHTML("beforeend",'<div class="an-intro"><div class="eyebrow">KI-Gegencheck · '+esc(doc.date||"–")+'</div><h3>Unabhängige Analyse aller Spiele</h3><p>Geprüfte Stabilität der tatsächlich bevorzugten Märkte – mit Quellen, XI-/Elo-Prüfung und Entscheidungsgründen. Keine garantierte Trefferwahrscheinlichkeit.</p></div>');
  if(STAT[doc.status]){root.insertAdjacentHTML("beforeend",'<p class="an-status">'+esc(STAT[doc.status])+'</p>');return;}
  var games=(doc.games||[]).slice().sort(function(a,b){var x=a.rank&&a.rank.reviewed,y=b.rank&&b.rank.reviewed;return (x==null?9999:x)-(y==null?9999:y)});
  var changed=games.filter(function(g){return g.decision&&g.decision.value==="OTHER_ECOBET_PATH"}).length;
  var confirmed=games.filter(function(g){return g.decision&&g.decision.value==="CONFIRM_FAVOURITE"}).length;
  var skipped=games.filter(function(g){return g.decision&&g.decision.value==="SKIP"}).length;
  var unpriced=games.filter(function(g){var d=g.decision,p=d&&d.preferred_market,source=p&&p.source;return d&&d.value!=="SKIP"&&!(g.ecobet&&g.ecobet[source]&&g.ecobet[source].published_odds!=null)}).length;
  root.insertAdjacentHTML("beforeend",'<div class="an-kpis"><span><b>'+games.length+'</b> Spiele</span><span><b>'+confirmed+'</b> FAVOURITE bestätigt</span><span><b>'+changed+'</b> Pfadwechsel</span><span><b>'+skipped+'</b> SKIP</span><span><b>'+unpriced+'</b> ohne publizierte Quote</span></div>');
  root.insertAdjacentHTML("beforeend",'<p class="an-notice">Hinweis: Sportliche Stabilität ist nicht gleich Wettwert. Ohne verifizierte Quote wird kein Wettwert behauptet. Die ursprünglichen ECOBET-Prognosen bleiben unverändert.</p>');
  if(!games.length){root.insertAdjacentHTML("beforeend",'<p class="an-status">Für diesen Lauf liegen keine geprüften Begegnungen vor.</p>');return;}
  root.insertAdjacentHTML("beforeend",'<div class="an-scroll" role="region" aria-label="KI-Gegencheck Rangliste" tabindex="0"><table class="an-rank-table"><thead><tr><th>Rang</th><th>Begegnung</th><th>ECOBET FAVOURITE</th><th>KI TOP</th><th>Bevorzugter Markt</th><th>Urteil</th><th>Quote</th><th>Analyse</th></tr></thead><tbody>'+games.map(game).join("")+'</tbody></table></div>');
  root.insertAdjacentHTML("beforeend",'<p class="an-footer-note">Stand '+esc(doc.compiled_utc?timeCH(doc.compiled_utc):doc.date)+' · '+esc(doc.analyst&&doc.analyst.assignment_version||"")+' · '+esc(doc.analyst&&doc.analyst.execution_path==="MANUAL_CLAUDE_SESSION_ON_REQUEST_NOT_AUTOMATED"?"Manuell erstellt":"")+'</p>');
}


function css(){
 if(document.getElementById("an-css"))return;
 var s=el("style");s.id="an-css";s.textContent=
 '.an-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 20px;padding:4px;border:1px solid rgba(125,164,177,.23);border-radius:12px;background:rgba(9,29,39,.6)}'+
 '.an-tab{appearance:none;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;font-weight:650;padding:11px 16px;cursor:pointer;min-height:42px}.an-tab[aria-selected="true"]{background:rgba(65,184,191,.2);box-shadow:inset 0 0 0 1px rgba(88,204,210,.4)}'+
 '.an-tab:focus-visible,.an-expand:focus-visible{outline:2px solid #80dfe2;outline-offset:2px}.an-subpage[hidden],.an-detail-row[hidden]{display:none!important}'+
 '.an-panel{margin:12px 0;padding:16px}.an-intro h3{margin:4px 0 8px}.an-intro p{opacity:.8;margin:0 0 14px;line-height:1.55}'+
 '.an-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px}.an-toolbar select{min-width:210px;max-width:100%;border:1px solid rgba(125,164,177,.45);border-radius:8px;background:#102936;color:inherit;padding:9px}'+
 '.an-kpis{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.an-kpis span{display:inline-flex;gap:5px;align-items:center;padding:7px 10px;border-radius:8px;background:rgba(92,145,159,.14);font-size:.83rem}.an-kpis b{font-size:1rem}'+
 '.an-notice{font-size:.82rem;opacity:.8;margin:8px 0 16px;line-height:1.5}.an-scroll,.an-table-scroll{overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch;border:1px solid rgba(102,151,160,.24);border-radius:10px}.an-rank-table{border-collapse:collapse;width:100%;min-width:1030px;font-size:.85rem;table-layout:fixed}.an-rank-table th:nth-child(1){width:65px}.an-rank-table th:nth-child(2){width:170px}.an-rank-table th:nth-child(3){width:163px}.an-rank-table th:nth-child(4){width:153px}.an-rank-table th:nth-child(5){width:190px}.an-rank-table th:nth-child(6){width:110px}.an-rank-table th:nth-child(7){width:95px}.an-rank-table th:nth-child(8){width:130px}'+
 '.an-rank-table thead{background:rgba(35,81,95,.38)}.an-rank-table th,.an-rank-table td{padding:11px 10px;text-align:left;vertical-align:top;border-bottom:1px solid rgba(102,151,160,.2);overflow-wrap:anywhere}.an-rank-table thead th{font-size:.76rem;letter-spacing:.03em}.an-rank-table tbody .an-game-row:hover{background:rgba(102,151,160,.08)}'+
 '.an-rank small,.an-match small,.an-judgement{display:block;margin-top:3px;font-size:.76rem;opacity:.74}.an-rank strong{font-size:1.25rem}.an-why td{padding:7px 10px 13px;background:rgba(20,55,68,.25);font-size:.79rem;line-height:1.55;color:inherit}.an-why b{color:#98dadd}.an-no-quote{font-size:.75rem;opacity:.85}.an-notplayable{opacity:.75}'+
 '.an-tag{display:inline-block;padding:3px 7px;border-radius:6px;background:rgba(122,147,156,.2);font-size:.73rem}.an-judgement-ok{color:#9ed8c5}.an-judgement-alt{color:#9edbe7}.an-judgement-skip{color:#f6bfac}'+
 '.an-expand{cursor:pointer;background:rgba(75,151,168,.19);border:1px solid rgba(93,169,185,.39);border-radius:7px;color:inherit;padding:7px 9px;font:inherit;font-size:.78rem;white-space:nowrap}.an-expand:hover{background:rgba(75,151,168,.32)}'+
 '.an-review{padding:14px 5px 10px;line-height:1.55}.an-review-head h4{margin:0 0 5px}.an-review p{margin:8px 0}.an-review-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0}.an-review-cards>div{padding:12px;background:rgba(88,133,150,.12);border-radius:8px}.an-review-cards p{margin:4px 0}.an-review-cards small{opacity:.78}.an-markets{border-collapse:collapse;width:100%;min-width:690px;font-size:.82rem}.an-markets td,.an-markets th{text-align:left;padding:9px;border-bottom:1px solid rgba(102,151,160,.24);vertical-align:top}.an-markets small{display:block;opacity:.7}.an-nested{margin:12px 0;padding:10px;border:1px solid rgba(102,151,160,.23);border-radius:8px}.an-nested summary{cursor:pointer;font-weight:600}.an-chain{margin:10px 0;padding:10px;border-left:3px solid #67c8fa;background:rgba(255,255,255,.03)}.an-mat{background:rgba(66,231,170,.18)}.an-detail-text p{margin:8px 0}.an-footer-note{margin:12px 0 0;opacity:.65;font-size:.76rem}.an-status{padding:12px;border:1px dashed rgba(102,151,160,.5);border-radius:10px}'+
 '@media(max-width:700px){.an-tab{flex:1 1 130px;text-align:center;padding:11px 10px}.an-panel{padding:10px}.an-review-cards{grid-template-columns:1fr}.an-toolbar select{width:100%}}';
 document.head.appendChild(s);
}


function boot(){
 var host=document.getElementById("page-topreads");if(!host||document.getElementById("ai-analyst-panel"))return;css();
 var intro=host.querySelector(".intro");if(intro){
  var head=intro.querySelector("h2"),p=intro.querySelector("p");
  if(head)head.textContent="Top Reads";if(p)p.textContent="FAVOURITE-Stabilität und unabhängiger KI-Gegencheck – zwei eigenständige Ranglisten für denselben Spieltag.";
 }
 var guide=host.querySelector(".v42-table-guide"),ranking=host.querySelector("#v4-ranking"),legacy=host.querySelector(".v4-legacy");
 var tabs=el("div","an-tabs");tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Top Reads Auswertungen");
 var favTab=el("button","an-tab","FAVOURITE-Stabilität"),kiTab=el("button","an-tab","KI-Gegencheck");
 favTab.type=kiTab.type="button";favTab.id="an-tab-favourite";kiTab.id="an-tab-ki";
 favTab.setAttribute("role","tab");kiTab.setAttribute("role","tab");
 favTab.setAttribute("aria-controls","an-view-favourite");kiTab.setAttribute("aria-controls","an-view-ki");
 tabs.appendChild(favTab);tabs.appendChild(kiTab);
 var fav=el("div","an-subpage"),ai=el("div","an-subpage");
 fav.id="an-view-favourite";ai.id="an-view-ki";fav.setAttribute("role","tabpanel");ai.setAttribute("role","tabpanel");
 fav.setAttribute("aria-labelledby",favTab.id);ai.setAttribute("aria-labelledby",kiTab.id);
 if(intro&&intro.parentNode)intro.parentNode.insertBefore(tabs,intro.nextSibling);else host.appendChild(tabs);
 host.insertBefore(fav,tabs.nextSibling);host.insertBefore(ai,fav.nextSibling);
 var fh=el("div","an-intro",'<h3>FAVOURITE-Stabilitätsranking</h3><p>Das bisherige modellinterne Ranking bleibt unverändert erhalten.</p>');
 fav.appendChild(fh);if(guide)fav.appendChild(guide);if(ranking)fav.appendChild(ranking);if(legacy)fav.appendChild(legacy);
 var panel=el("section","panel an-panel");panel.id="ai-analyst-panel";panel.setAttribute("aria-live","polite");
 panel.innerHTML='<p class="muted">KI-Gegencheck wird geladen …</p>';ai.appendChild(panel);
 function chooseTab(which){
  var isKi=which==="ki";fav.hidden=isKi;ai.hidden=!isKi;
  favTab.setAttribute("aria-selected",isKi?"false":"true");kiTab.setAttribute("aria-selected",isKi?"true":"false");
  favTab.tabIndex=isKi?-1:0;kiTab.tabIndex=isKi?0:-1;
 }
 favTab.onclick=function(){chooseTab("fav")};kiTab.onclick=function(){chooseTab("ki")};chooseTab("fav");
 tabs.addEventListener("keydown",function(e){if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;e.preventDefault();var to=ai.hidden?"ki":"fav";chooseTab(to);(to==="ki"?kiTab:favTab).focus()});
 panel.addEventListener("click",function(e){var btn=e.target.closest&&e.target.closest("[data-an-expand]");if(!btn)return;var target=document.getElementById(btn.getAttribute("data-an-expand"));if(!target)return;target.hidden=!target.hidden;btn.setAttribute("aria-expanded",target.hidden?"false":"true");btn.textContent=target.hidden?"Details öffnen":"Details schliessen"});
 get("analyst/index.json").then(function(ix){
  var ids=Object.keys(ix.entries||{}).sort();if(!ids.length)throw new Error("Keine Analyse veröffentlicht");
  var bar=el("div","an-toolbar"),select=el("select","an-select");select.setAttribute("aria-label","KI-Analyst Tageslauf");
  ids.slice().reverse().forEach(function(id){var o=el("option",null,esc(id)+" · "+esc(ix.entries[id].status||""));o.value=id;select.appendChild(o)});
  var label=el("label",null,"KI-Lauf auswählen: ");label.appendChild(select);bar.appendChild(label);
  var content=el("div","an-content");panel.innerHTML="";panel.appendChild(bar);panel.appendChild(content);
  function load(id){var entry=ix.entries[id];if(!entry)return;select.value=id;content.innerHTML='<p class="muted">Lade KI-Analyse …</p>';
    get(entry.file).then(function(doc){if(doc.schema!==SCHEMA)throw new Error("Unbekanntes Analyse-Schema: "+doc.schema);if(doc.publication_id!==id)throw new Error("Lauf-ID passt nicht zum Index");if(select.value===id)render(content,doc)})
    .catch(function(e){content.innerHTML='<p class="an-status">KI-Analyse konnte nicht geladen werden: '+esc(e.message)+'</p>'})}
  function selectDay(day){
   if(!day){load(ids[ids.length-1]);return}
   var matched=ids.filter(function(id){return (ix.entries[id].date||id.slice(0,10))===day});
   if(matched.length)load(matched[matched.length-1]);else{
     select.selectedIndex=-1;content.innerHTML='<p class="an-status">Für '+esc(day)+' ist noch kein unabhängiger KI-Gegencheck veröffentlicht. Das bisherige FAVOURITE-Ranking kann trotzdem verfügbar sein.</p>';
   }
  }
  select.onchange=function(){load(select.value)};
  var picker=document.getElementById("global-run-date");
  if(picker)picker.addEventListener("change",function(){selectDay(picker.value)});
  selectDay(picker&&picker.value||"");
 }).catch(function(e){panel.innerHTML='<div class="an-status">KI-Gegencheck noch nicht verfügbar: '+esc(e.message)+'</div>'});
 // Vorhandene #topreads-Links auch bei Direktaufruf korrekt öffnen.
 if(location.hash==="#topreads")document.querySelector('[data-page="topreads"]')?.click();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
