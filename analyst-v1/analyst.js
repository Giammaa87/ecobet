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
  var favQuoted=eco.FAVOURITE&&eco.FAVOURITE.published_odds;
  var favQuote=favQuoted!=null&&Number(favQuoted)>0?Number(favQuoted).toFixed(3):null;
  var favState=!value?"NICHT GEPRÜFT":value==="CONFIRM_FAVOURITE"?"✓ BESTÄTIGT":"✕ NICHT BESTÄTIGT";
  var favClass=value==="CONFIRM_FAVOURITE"?"an-fav-yes":"an-fav-no";
  var favQuoteWarning=/Quote (ist )?(nicht plausibel|unplausibel)|Zuordnung der Quote/i.test(g.decision&&g.decision.reasoning||"");
  var status=value==="SKIP"?"SKIP":!value?"NICHT PRÜFBAR":preferredSource==="FAVOURITE"?"FAVOURITE":preferredSource==="KI_TOP"?"KI TOP":preferredSource;
  var tagClass=value==="SKIP"?"an-judgement-skip":value==="CONFIRM_FAVOURITE"?"an-judgement-ok":"an-judgement-alt";
  var row='<tr class="an-game-row'+(g.playable_top===false?' an-notplayable':'')+'">'+
    '<td class="an-rank"><strong>'+esc(rk)+'</strong><small>Pilot 05: '+esc(or)+'</small></td>'+
    '<td class="an-match"><b>'+esc(g.match||"Unbekannte Begegnung")+'</b><small>'+esc(g.competition||"")+" · "+esc(timeCH(g.kickoff_utc))+'</small></td>'+
    '<td>'+esc(fav)+'</td>'+
    '<td><strong class="an-fav-result '+favClass+'">'+esc(favState)+'</strong></td>'+
    '<td><b>'+esc(preferredText)+'</b><small class="an-judgement '+tagClass+'">'+esc(dec)+'</small></td>'+
    '<td>'+esc(q.market||"Nicht verfügbar")+'</td>'+
    '<td>'+(favQuote?'<b>'+esc(favQuote)+(favQuoteWarning?' †':'')+'</b>':'<span class="an-no-quote">Nicht publiziert</span>')+'</td>'+
    '<td>'+(quote?'<b>'+esc(quote)+'</b>':'<span class="an-no-quote">Nicht publiziert</span>')+'</td>'+
    '<td><button type="button" class="an-expand" data-an-expand="'+esc(id)+'" aria-controls="'+esc(id)+'" aria-expanded="false">Details öffnen</button></td></tr>';
  var why='<tr class="an-why"><td colspan="9"><b>Warum?</b> '+esc(shortReason)+'</td></tr>';
  var detail='<div class="an-review">';
  detail+='<div class="an-review-head"><h4>Analyse und Marktentscheidung</h4><p><b>Endentscheidung:</b> '+esc(dec)+' · '+esc(preferredText)+'</p><p>'+esc(fullReason)+'</p></div>';
  detail+='<div class="an-review-cards"><div><b>Ursprünglicher Pilot 05</b><p>Rang '+esc(or)+' · '+esc(g.original&&g.original.best_market||"–")+'</p><small>Agreement: '+esc(g.original&&g.original.fixture_category||"–")+'</small></div>'+
    '<div><b>KI TOP – rechnerisch</b><p>'+esc(c.market||"–")+'</p><small>Worst-Case-Schätzung: '+(c.worst_case_p==null?"nicht verfügbar":esc(Math.round(c.worst_case_p*100)+" %"))+'</small></div>'+
    '<div><b>KI TOP – qualitativ</b><p>'+esc(q.market||"–")+'</p><small>Konfidenz: '+esc(q.confidence||"nicht angegeben")+'</small></div></div>';
  if(q.reasoning)detail+='<p><b>Unabhängige KI-Spielanalyse:</b> '+esc(q.reasoning)+'</p>';
  if(q.differs_from_computational&&q.difference_explanation)detail+='<p><b>Warum die KI-TOP-Stände abweichen:</b> '+esc(q.difference_explanation)+'</p>';
  if(g.preferred_market_fragility_assessment&&g.preferred_market_fragility_assessment.text)detail+='<p><b>Fragilität des gewählten Marktes:</b> '+esc(g.preferred_market_fragility_assessment.text)+'</p>';
  if(g.rank&&g.rank.original!==g.rank.reviewed&&g.rank.reason)detail+='<p><b>Begründung der Rangänderung:</b> '+esc(g.rank.reason)+'</p>';
  detail+='<div class="an-table-scroll"><table class="an-markets"><thead><tr><th>ECOBET-Pfad</th><th>Markt</th><th>Quote</th><th>Markt-Übereinstimmung</th><th>Spielannahme</th></tr></thead><tbody>';
  PATHS.forEach(function(p){var e=eco[p]||{},a=g.ecobet_agreement&&g.ecobet_agreement[p]||{};detail+='<tr><th>'+esc(p)+'</th><td>'+esc(e.market||"–")+'</td><td>'+esc(e.published_odds==null?"–":e.published_odds)+'</td><td>'+esc(AG[a.market_agreement]||a.market_agreement||"–")+'</td><td>'+esc(AG[a.assumption_agreement]||a.assumption_agreement||"–")+(a.assumption_comment?'<small>'+esc(a.assumption_comment)+'</small>':'')+'</td></tr>'});
  detail+='</tbody></table></div>';
  if(g.phase_q&&g.phase_q.xi_elo_check)detail+='<p><b>Aufstellung und Adjusted Elo:</b> '+esc(g.phase_q.xi_elo_check.summary||g.phase_q.xi_elo_check.status)+'</p>';
  if(g.findings&&g.findings.length)detail+='<details class="an-nested"><summary>Fragilitäten und Befundketten ('+g.findings.length+')</summary>'+g.findings.map(chain).join("")+'</details>';
  // Der gespeicherte detail_md-Bericht wiederholt die Entscheidung, Phase Q und XI.
  // Das Original bleibt unverändert im veröffentlichten JSON; UI zeigt die Primärabschnitte nur einmal.
  if(g.phase_q&&g.phase_q.research_log&&g.phase_q.research_log.length){detail+='<details class="an-nested"><summary>Recherchequellen ('+g.phase_q.research_log.length+')</summary><ul>';
    g.phase_q.research_log.forEach(function(x){var u=x.source||"";detail+='<li>'+( /^https:\/\//i.test(u)?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a>':esc(u))+(x.claim?' – '+esc(x.claim):'')+'</li>'});
    detail+='</ul></details>';
  }
  detail+='</div>';
  var expanded='<tr class="an-detail-row" id="'+esc(id)+'" hidden><td colspan="9">'+detail+'</td></tr>';
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
  root.insertAdjacentHTML("beforeend",'<p class="an-notice">Hinweis: Der KI-Rang ist die überprüfte Rangfolge nach der tatsächlich bevorzugten Prognose (Marktwechsel und Rangänderungen sind in den Befundketten begründet); der Pilot-05-Originalrang bleibt daneben unverändert sichtbar. Ein Platz 1 bestätigt nicht automatisch den ursprünglichen FAVOURITE. FAV-Quote gehört zum ECOBET FAVOURITE; Wahl-Quote zum vom KI-Analysten bevorzugten Markt. „Nicht publiziert“ bedeutet fehlende ECOBET-Quotenabdeckung, nicht nachgewiesene Unverfügbarkeit bei Wettanbietern. † Quote laut Analystenbericht möglicherweise falsch zugeordnet. Sportliche Stabilität ist nicht gleich Wettwert.</p>');
  if(!games.length){root.insertAdjacentHTML("beforeend",'<p class="an-status">Für diesen Lauf liegen keine geprüften Begegnungen vor.</p>');return;}
  root.insertAdjacentHTML("beforeend",'<div class="an-scroll" role="region" aria-label="KI-Gegencheck Rangliste" tabindex="0"><table class="an-rank-table"><thead><tr><th>KI-Rang</th><th>Begegnung</th><th>ECOBET FAVOURITE</th><th>FAVOURITE bestätigt?</th><th>Bevorzugter Markt</th><th>KI TOP (qualitativ)</th><th>FAV-Quote</th><th>Wahl-Quote</th><th>Analyse</th></tr></thead><tbody>'+games.map(game).join("")+'</tbody></table></div>');
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
 '.an-rank-table{min-width:1250px}.an-rank-table th:nth-child(1){width:72px}.an-rank-table th:nth-child(2){width:170px}.an-rank-table th:nth-child(3){width:168px}.an-rank-table th:nth-child(4){width:155px}.an-rank-table th:nth-child(5){width:177px}.an-rank-table th:nth-child(6){width:153px}.an-rank-table th:nth-child(7){width:83px}.an-rank-table th:nth-child(8){width:83px}.an-rank-table th:nth-child(9){width:122px}.an-fav-result{display:inline-block;padding:6px 8px;border-radius:7px;font-size:.75rem;letter-spacing:.01em}.an-fav-yes{background:rgba(40,170,113,.2);color:#a8ebc9}.an-fav-no{background:rgba(214,119,87,.2);color:#ffd0b7}.an-rank small{font-size:.72rem}.an-why td{padding-top:9px}.an-notice{border-left:3px solid rgba(98,187,194,.65);padding:8px 10px;background:rgba(60,109,127,.10)}'+
 '.an-availability{padding:13px 15px;margin:10px 0 14px;border:1px solid rgba(214,165,77,.50);border-left:4px solid #c9a460;border-radius:9px;background:rgba(146,109,45,.1);font-size:.9rem;line-height:1.55}.an-availability p{margin:7px 0}.an-availability button{margin:6px 0}.an-availability.an-current{border-color:rgba(85,179,154,.55);border-left-color:#76cbaa;background:rgba(70,145,125,.1)}'+
 '.an-master-fallback{margin-top:16px;border-top:1px solid rgba(135,175,190,.3);padding-top:12px}.an-fallback-head p{font-weight:400;margin:7px 0 12px}.an-master-table{min-width:600px}.an-master-table td:first-child{min-width:170px}.an-master-table td:last-child{white-space:nowrap}'+
 '@media(max-width:700px){.an-tab{flex:1 1 130px;text-align:center;padding:11px 10px}.an-panel{padding:10px}.an-review-cards{grid-template-columns:1fr}.an-toolbar select{width:100%}}';
 document.head.appendChild(s);
}



function boot(){
 var host=document.getElementById("page-topreads");
 if(!host||document.getElementById("ai-analyst-panel"))return;
 css();
 var intro=host.querySelector(".intro");
 if(intro){var h=intro.querySelector("h2"),p=intro.querySelector("p");
   if(h)h.textContent="Top Reads";
   if(p)p.textContent="Zwei unabhängige Auswertungen. Es werden nur Analysen des ausgewählten Spieltags angezeigt; ältere Tage sind separat abrufbar.";}
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
 fav.appendChild(el("div","an-intro",'<h3>FAVOURITE-Stabilitätsranking</h3><p>Das ursprüngliche Ranking bleibt unverändert. Die Anzeige ist an den ausgewählten ECOBET-Lauf gebunden.</p>'));
 if(guide)fav.appendChild(guide);
 var favNotice=el("div","an-availability");favNotice.id="an-favourite-availability";favNotice.setAttribute("role","status");fav.appendChild(favNotice);
 if(ranking)fav.appendChild(ranking);
 if(legacy)fav.appendChild(legacy);
 var panel=el("section","panel an-panel");panel.id="ai-analyst-panel";panel.setAttribute("aria-live","polite");
 panel.innerHTML='<p class="muted">Aktuellen KI-Gegencheck prüfen …</p>';ai.appendChild(panel);
 var analystIndex=null,stabilityIndex=null,runsIndex=null,indexErrors={};
 var loadedId=null,requestSerial=0,shownDay=null,favLoadSerial=0;
 function todayCH(){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
 function validDay(s){return /^\d{4}-\d{2}-\d{2}$/.test(s||"")}
 function currentDay(){
   var picker=document.getElementById("global-run-date"),runDay=document.getElementById("run-day");
   return (picker&&validDay(picker.value)?picker.value:runDay&&validDay(runDay.value)?runDay.value:todayCH());
 }
 function localDate(s){if(!validDay(s))return s||"unbekannt";var parts=s.split("-");return parts[2]+"."+parts[1]+"."+parts[0]}
 function entries(ix){return ix&&ix.entries||{}}
 function candidates(ix,day){return Object.keys(entries(ix)).filter(function(id){return (entries(ix)[id].date||entries(ix)[id].run_date||id.slice(0,10))===day}).sort()}
 function latestDay(ix){var all=Object.keys(entries(ix)).map(function(id){return entries(ix)[id].date||entries(ix)[id].run_date||id.slice(0,10)}).filter(validDay).sort();return all.length?all[all.length-1]:null}
 function masterKnown(day){return !!(runsIndex&&runsIndex.dates&&runsIndex.dates[day]&&runsIndex.dates[day].length)}
 function setGlobalDay(day){
   var picker=document.getElementById("global-run-date");
   if(picker){picker.value=day;picker.dispatchEvent(new Event("change",{bubbles:true}))}
   else {var rp=document.getElementById("run-day");if(rp){rp.value=day;rp.dispatchEvent(new Event("change",{bubbles:true}))} refresh()}
 }
 function historyButton(day,title){var b=el("button","an-expand",title||"Letzten archivierten Tag öffnen");
   b.type="button";b.onclick=function(){setGlobalDay(day)};return b}
 function updateFavourite(day){
   var favouriteRequest=++favLoadSerial;
   favNotice.innerHTML="";favNotice.hidden=true;
   if(!stabilityIndex){favNotice.hidden=false;favNotice.textContent=indexErrors.stability?"Stabilitätsindex nicht ladbar: "+indexErrors.stability:"Prüfe FAVOURITE-Veröffentlichung …";return}
   if(candidates(stabilityIndex,day).length)return;
   favNotice.hidden=false;
   favNotice.appendChild(el("strong",null,"Für den "+localDate(day)+" ist kein FAVOURITE-Stabilitätsranking veröffentlicht."));
   favNotice.appendChild(el("p",null,masterKnown(day)?"Der ECOBET-Masterlauf ist vorhanden. Die nachgelagerte Stabilitätsberechnung bzw. Veröffentlichung fehlt für diesen Tag.":"Für dieses Datum liegt noch keine zugehörige Stabilitätsveröffentlichung vor."));
   var previous=latestDay(stabilityIndex);
   if(previous){favNotice.appendChild(el("p",null,"Die letzte archivierte Stabilität stammt vom "+localDate(previous)+". Sie wird nicht als heutige Analyse ausgegeben."));
     favNotice.appendChild(historyButton(previous,"Stabilität vom "+localDate(previous)+" öffnen"))}
   // Der Original-Master bleibt nutzbar, obwohl der unabhängige Stabilitäts-Lauf fehlt.
   // Niemals die Master-FAVOURITES als Stabilitätsranking oder validierte Top-Tipps ausgeben.
   var dayRuns=runsIndex&&runsIndex.dates&&runsIndex.dates[day]||[];
   var ids=dayRuns.map(function(v){return typeof v==="string"?v:v&&v.id}).filter(Boolean);
   var chosen=document.getElementById("run-choice")?.value;
   var id=ids.indexOf(chosen)>=0?chosen:ids[ids.length-1];
   if(!id)return;
   var preview=el("div","an-master-fallback");
   preview.innerHTML='<div class="an-fallback-head"><strong>ECOBET-Master-FAVOURITES – ohne Stabilitätsranking</strong><p>Diese Märkte stammen unverändert aus dem heutigen Master. Es gibt noch keine Stabilitätsscores und keine geprüfte Rangfolge. Die Anzeige ist ausdrücklich kein Ersatz für den fehlenden Stabilitätscheck.</p></div>';
   favNotice.appendChild(preview);
   get("runs/"+encodeURIComponent(id)+".json").then(function(doc){
     if(favouriteRequest!==favLoadSerial||currentDay()!==day||candidates(stabilityIndex,day).length)return;
     if(doc.run?.publication_id!==id||doc.run?.date!==day)throw Error("Run-ID oder Datum stimmen nicht überein");
     var games=(doc.matches||[]).filter(function(m){return m.favourite&&!String(m.favourite).startsWith("NO_PREDICTION")});
     if(!games.length){preview.appendChild(el("p",null,"Keine regulären Master-FAVOURITES vorhanden."));return}
     var html='<div class="an-table-scroll"><table class="an-markets an-master-table"><thead><tr><th>Spiel</th><th>ECOBET FAVOURITE (unverändert)</th><th>Anpfiff CH</th></tr></thead><tbody>';
     games.forEach(function(m){html+='<tr><td>'+esc(m.home||"")+" – "+esc(m.away||"")+'</td><td><b>'+esc(m.favourite)+'</b></td><td>'+esc(timeCH(m.kickoff))+'</td></tr>'});
     preview.insertAdjacentHTML("beforeend",html+"</tbody></table></div>");
   }).catch(function(err){if(favouriteRequest===favLoadSerial)preview.appendChild(el("p","an-status","Master-FAVOURITES nicht abrufbar: "+esc(err.message)))});
 }
 function showMissingAnalyst(day){
   loadedId=null;requestSerial++;
   panel.innerHTML="";
   var n=el("div","an-availability");n.setAttribute("role","status");
   n.appendChild(el("strong",null,"Keine KI-Analyse für den "+localDate(day)+" veröffentlicht."));
   n.appendChild(el("p",null,masterKnown(day)?
     "Die ECOBET-Spiele für diesen Tag sind vorhanden, aber der unabhängige Analystenlauf fehlt. Es werden ausdrücklich keine Analysen des Vortags als aktuelle Ergebnisse angezeigt.":
     "Für diesen Tag ist kein unabhängiger KI-Lauf verfügbar. Ältere Ergebnisse werden nur nach ausdrücklicher Auswahl gezeigt."));
   var previous=latestDay(analystIndex);
   if(previous){n.appendChild(el("p",null,"Letzter archivierter KI-Gegencheck: "+localDate(previous)+"."));
     n.appendChild(historyButton(previous,"KI-Analyse vom "+localDate(previous)+" öffnen"))}
   panel.appendChild(n);
 }
 function renderAnalyst(day){
   if(!analystIndex){loadedId=null;panel.innerHTML='<div class="an-availability" role="status">KI-Veröffentlichungsindex nicht ladbar: '+esc(indexErrors.analyst||"wird geladen")+'</div>';return}
   var ids=candidates(analystIndex,day);
   if(!ids.length){showMissingAnalyst(day);return}
   var chosen=ids[ids.length-1],runChoice=document.getElementById("run-choice");
   if(runChoice&&ids.indexOf(runChoice.value)!==-1)chosen=runChoice.value;
   if(loadedId===chosen)return;
   loadedId=chosen;
   var token=++requestSerial,entry=entries(analystIndex)[chosen];
   panel.innerHTML='<div class="an-availability an-current">KI-Analyse vom '+esc(localDate(day))+' · Lauf '+esc(chosen)+'</div><p class="muted">Lade heutige KI-Analyse …</p>';
   get(entry.file).then(function(doc){
     if(token!==requestSerial||currentDay()!==day)return;
     if(doc.schema!==SCHEMA||doc.publication_id!==chosen||doc.date!==day)throw Error("Datum, Lauf-ID oder Schema stimmen nicht überein");
     panel.innerHTML="";
     render(panel,doc);
     markUnchecked(day,doc,token);
   }).catch(function(err){
     if(token!==requestSerial)return;
     loadedId=null;panel.innerHTML='<div class="an-availability" role="status">KI-Analyse '+esc(day)+' nicht lesbar: '+esc(err.message)+'</div>';
   });
 }
 // Spiele des aktiven Master-Laufs, die dieser KI-Gegencheck nicht analysiert hat (z. B. Nachpublikation), werden ausdruecklich als nicht geprueft gekennzeichnet.
 function markUnchecked(day,doc,token){
   var runs=runsIndex&&runsIndex.dates&&runsIndex.dates[day]||[];
   var ids=runs.map(function(v){return typeof v==="string"?v:v&&v.id}).filter(Boolean),active=ids[ids.length-1];
   if(!active||active===doc.publication_id)return;
   get("runs/"+encodeURIComponent(active)+".json").then(function(run){
     if(token!==requestSerial||currentDay()!==day||run.run?.publication_id!==active||run.run?.date!==day)return;
     var seen={};(doc.games||[]).forEach(function(g){seen[g.fixture_id]=true});
     var missing=(run.matches||[]).filter(function(m){return !seen[m.fixture_id]});
     if(!missing.length)return;
     var title=panel.querySelector(".an-intro h3");
     if(title)title.textContent="Unabhängige Analyse – nicht alle Spiele des aktuellen Laufs geprüft";
     var n=el("div","an-availability");n.setAttribute("role","status");
     n.innerHTML='<strong>Nicht vom KI-Gegencheck geprüft: '+missing.map(function(m){return esc(m.home)+" – "+esc(m.away)+" ("+esc(timeCH(m.kickoff))+")"}).join(", ")+'</strong>'+
       '<p>Die Analyse unten gehört zum Lauf '+esc(doc.publication_id)+'. Aktiv ist der später publizierte Lauf '+esc(active)+'. Für die genannten Spiele gibt es keine KI-Analyse, keinen KI-Rang und keine Bestätigung.</p>';
     panel.insertBefore(n,panel.firstChild);
   }).catch(function(){
     if(token!==requestSerial||currentDay()!==day)return;
     var n=el("div","an-availability");n.setAttribute("role","status");
     n.textContent="Hinweis: Diese Analyse gehört zum Lauf "+doc.publication_id+". Der aktive Lauf "+active+" konnte nicht abgeglichen werden; er kann ungeprüfte Spiele enthalten.";
     panel.insertBefore(n,panel.firstChild);
   });
 }
 function refresh(){
   var day=currentDay();
   if(shownDay!==day){shownDay=day;loadedId=null}
   updateFavourite(day);renderAnalyst(day);
 }
 function chooseTab(which){
   var isKi=which==="ki";fav.hidden=isKi;ai.hidden=!isKi;
   favTab.setAttribute("aria-selected",isKi?"false":"true");kiTab.setAttribute("aria-selected",isKi?"true":"false");
   favTab.tabIndex=isKi?-1:0;kiTab.tabIndex=isKi?0:-1;
 }
 favTab.onclick=function(){chooseTab("fav")};kiTab.onclick=function(){chooseTab("ki")};chooseTab("fav");
 tabs.addEventListener("keydown",function(e){if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;e.preventDefault();var next=ai.hidden?"ki":"fav";chooseTab(next);(next==="ki"?kiTab:favTab).focus()});
 panel.addEventListener("click",function(e){var btn=e.target.closest&&e.target.closest("[data-an-expand]");if(!btn)return;
   var row=document.getElementById(btn.getAttribute("data-an-expand"));if(!row)return;
   row.hidden=!row.hidden;btn.setAttribute("aria-expanded",row.hidden?"false":"true");btn.textContent=row.hidden?"Details öffnen":"Details schliessen"});
 var picker=document.getElementById("global-run-date"),runDay=document.getElementById("run-day"),runChoice=document.getElementById("run-choice");
 if(picker)picker.addEventListener("change",refresh);
 if(runDay){runDay.addEventListener("change",refresh);
   new MutationObserver(function(){refresh()}).observe(runDay,{childList:true,subtree:true});
 }
 if(runChoice)runChoice.addEventListener("change",refresh);
 Promise.allSettled([get("runs/index.json"),get("stability/index.json"),get("analyst/index.json")]).then(function(results){
   if(results[0].status==="fulfilled")runsIndex=results[0].value;else indexErrors.runs=String(results[0].reason);
   if(results[1].status==="fulfilled")stabilityIndex=results[1].value;else indexErrors.stability=String(results[1].reason);
   if(results[2].status==="fulfilled")analystIndex=results[2].value;else indexErrors.analyst=String(results[2].reason);
   refresh();
 });
 refresh();
 if(location.hash==="#topreads")document.querySelector('[data-page="topreads"]')?.click();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
