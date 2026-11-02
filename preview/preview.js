
/* ECOBET Redesign preview: read-only data access. No changes to football engine or sealed records. */
(function(){
"use strict";
const X={run:null,rows:[],picks:new Map(),odds:null,source:null,stage12:null,daily:null,perfRendered:new Set(),perfBusy:false};
const el=id=>document.getElementById(id);
const escapeText=v=>esc(v==null?"":v);
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const money=v=>"CHF "+(Number.isFinite(v)?v:0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
const num=(v,fallback=null)=>v===null||v===undefined||v===""?fallback:(Number.isFinite(Number(v))?Number(v):fallback);
const fmt=(v,d=2)=>num(v)==null?"Nicht verfügbar":Number(v).toLocaleString("de-CH",{minimumFractionDigits:d,maximumFractionDigits:d});
const tag=(v)=>!v||String(v).toUpperCase()==="NOT_AVAILABLE"?"Nicht verfügbar":escapeText(v);
const matchId=m=>m.fixture_id||((m.home||"")+"-"+(m.away||""));
const nameMarket=s=>{
 s=String(s||"");if(!s)return "Markt nicht publiziert";
 let t=s.replace(/^Both Teams To Score: Yes$/i,"Beide Teams treffen: Ja")
 .replace(/^Both Teams To Score: No$/i,"Beide Teams treffen: Nein")
 .replace(/^Match Total Under ([\d.]+)$/i,"Unter $1 Tore")
 .replace(/^Match Total Over ([\d.]+)$/i,"Über $1 Tore")
 .replace(/^Match Goals ([\d]+)-([\d]+)$/i,"$1 bis $2 Tore")
 .replace(/ Team Goals Over ([\d.]+)/i," über $1 Teamtore")
 .replace(/ Team Goals Under ([\d.]+)/i," unter $1 Teamtore")
 .replace(/ Draw No Bet$/i," DNB")
 .replace(/ or Draw$/i," oder Remis")
 .replace(/ to win$/i," Sieg");
 return t;
};
const roleName=v=>v==="FAVOURITE"?"ECOBET Favourite":v;
const shade=m=>String(m?.ampel||m?.world_stability||m?.prediction_stability_light||"").toUpperCase();
const issues=m=>arr(m?.flags).concat(arr(m?.risk_flags)).filter(Boolean);
const status=m=>String(m?.data_readiness||"").toUpperCase();
const quotePriority=m=>{
 const s=shade(m);let p=s==="RED"||s==="ROT"?100:s==="YELLOW"||s==="GELB"?28:s==="GREEN"||s==="GRUEN"||s==="GRÜN"?0:36;
 if(status(m)==="NOT_READY")p+=80; if(status(m)==="CONDITIONAL")p+=10;
 const r=String(m?.favourite_robustness||m?.robustness||"").toUpperCase();
 if(r==="HIGH")p-=10;else if(r==="LOW")p+=22;
 p+=Math.min(issues(m).length,8)*4;
 return p;
};
function showSelected(){
 const out=el("v3-selected");if(!out)return;
 const rows=[...X.picks.values()];let product=rows.reduce((p,x)=>p*x.odds,1),stake=Math.max(0,num(el("v3-stake").value,0));
 el("v3-slip-count").textContent=rows.length+" Tipps";
 out.innerHTML=rows.length?rows.map(x=>'<div class="v3-slip-row"><div><b>'+escapeText(x.match.home)+" – "+escapeText(x.match.away)+'</b><div>'+escapeText(nameMarket(x.market))+' · '+fmt(x.odds,3)+'</div></div><button data-remove="'+escapeText(x.fixtureId)+'" type="button" aria-label="Tipp entfernen">×</button></div>').join(""):'<p class="v3-small">Noch kein Tipp ausgewählt.</p>';
 el("v3-total-odds").textContent=rows.length?fmt(product,3):"–";
 el("v3-payout").textContent=money(rows.length?product*stake:0);
 el("v3-profit").textContent=money(rows.length?Math.max(0,(product-1)*stake):0);
 out.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{X.picks.delete(b.dataset.remove);showSelected();renderQuotes()}));
}
function filteredQuotes(){
 const role=el("v3-role").value,league=el("v3-league").value,profile=el("v3-risk").value,market=el("v3-market").value.toLowerCase().trim();
 const lo=Math.max(1,num(el("v3-min-odds").value,1)),hi=Math.max(lo,num(el("v3-max-odds").value,100));
 return X.rows.filter(x=>{
 if(role!=="ALL"&&x.role!==role)return false;
 if(league!=="ALL"&&x.league!==league)return false;
 if(market&&!(x.market+" "+nameMarket(x.market)).toLowerCase().includes(market))return false;
 if(profile==="0"&&!(["GREEN","GRUEN","GRÜN"].includes(shade(x.match))))return false;
 if(profile==="1"&&["RED","ROT"].includes(shade(x.match)))return false;
 if(x.available&&(x.odds<lo||x.odds>hi))return false;
 return true;
 });
}
function renderQuotes(){
 const box=el("v3-quotes");if(!box)return;
 const rows=filteredQuotes(),avail=rows.filter(x=>x.available).length;
 box.innerHTML=rows.length?rows.map(x=>{
 const already=X.picks.get(x.fixtureId)?.key===x.key;
 return '<article class="panel v3-quote"><div><div class="v3-roles"><span>'+escapeText(x.league)+'</span><span>'+escapeText(roleName(x.role))+'</span><span>Stabilität '+tag(shade(x.match)||"Nicht klassifiziert")+'</span></div><h3>'+escapeText(x.match.home)+" – "+escapeText(x.match.away)+'</h3><div class="v3-market">'+escapeText(nameMarket(x.market))+'</div><div class="v3-quote-status">'+(x.available?'BSD Snapshot '+escapeText(x.updated||"ohne Zeitangabe"):"Keine BSD Quote · "+escapeText(x.reason||"nicht verfügbar"))+'</div></div><div class="v3-odds">'+(x.available?fmt(x.odds,3):"—")+'</div><button type="button" data-pick="'+escapeText(x.key)+'"'+(!x.available?' disabled title="Keine Quote verfügbar"':'')+' class="'+(already?"v3-in-slip":"")+'">'+(!x.available?"Nicht verfügbar":already?"Entfernen":"Hinzufügen")+'</button></article>';
 }).join(""):'<div class="v3-info">Keine veröffentlichten Quoten oder Prognosen entsprechen den Filtern.</div>';
 el("v3-board-status").textContent= X.run+" · "+rows.length+" Marktpfade · "+avail+" BSD Quoten verfügbar. Archivierte Snapshots, keine Live Quoten.";
 box.querySelectorAll("[data-pick]").forEach(b=>b.addEventListener("click",()=>{
 const x=X.rows.find(y=>y.key===b.dataset.pick);if(!x||!x.available)return;
 if(X.picks.get(x.fixtureId)?.key===x.key)X.picks.delete(x.fixtureId);
 else X.picks.set(x.fixtureId,x);
 showSelected();renderQuotes();
 }));
}
async function loadBoard(){
 const id=state.currentRunId;
 if(!id||!state.currentRun){el("v3-board-status").textContent="Bitte zuerst einen gültigen Run auswählen.";return;}
 if(X.run===id&&X.rows.length){renderQuotes();return;}
 X.run=id;X.rows=[];X.picks.clear();showSelected();
 el("v3-board-status").textContent="BSD Quoten für "+id+" werden geprüft …";
 el("v3-quotes").innerHTML='<div class="v3-info">Quotenrecords werden geladen …</div>';
 try{
  const index=await getJSON("odds/index.json");
  const entry=Object.values(obj(index.entries)).filter(e=>e.publication_id===id).slice(-1)[0];
  if(!entry){el("v3-board-status").textContent="Für "+id+" wurde kein BSD Quotensnapshot veröffentlicht.";el("v3-quotes").innerHTML='<div class="v3-info">ECOBET Predictions sind vorhanden. Für diesen Run fehlen jedoch veröffentlichte BSD Quoten. Es werden keine Ersatzquoten erfunden.</div>';return;}
  const doc=await getJSON(entry.file);if(id!==state.currentRunId)return;
  const byID=new Map(state.currentRun.matches.map(m=>[matchId(m),m]));X.odds=doc;
  for(const fx of arr(doc.fixtures)){
   const m=byID.get(fx.fixture_id);if(!m||isNSP(m))continue;
   for(const role of ["FAVOURITE","SAFE","BALANCED","AGGRESSIVE"]){
    const q=obj(obj(fx.quotes)[role]);if(!Object.keys(q).length)continue;
    const odds=num(q.decimal_odds);
    const available=q.status==="AVAILABLE"&&odds!==null&&odds>1;
    X.rows.push({key:fx.fixture_id+"_"+role,fixtureId:fx.fixture_id,match:m,role,market:q.market?.expression||m[role.toLowerCase()]||"",odds,available,reason:q.reason,updated:q.provider_updated_at||fx.retrieved_at_utc||"",league:m.competition||m.competition_name||"Nicht klassifiziert",provider:q.bookmaker||"",source:entry.file});
   }
  }
  const leagueSelect=el("v3-league");const prev=leagueSelect.value;
  const leagues=[...new Set(X.rows.map(x=>x.league))].sort((a,b)=>a.localeCompare(b,"de"));
  leagueSelect.innerHTML='<option value="ALL">Alle Wettbewerbe</option>'+leagues.map(l=>'<option value="'+escapeText(l)+'">'+escapeText(l)+'</option>').join("");
  if(leagues.includes(prev))leagueSelect.value=prev;
  renderQuotes();
 }catch(e){
  el("v3-board-status").textContent="Datenzugriff fehlgeschlagen: "+String(e.message||e);
  el("v3-quotes").innerHTML='<div class="v3-info">Bitte überprüfe, ob der öffentliche Quotensnapshot verfügbar ist.</div>';
 }
}
function chooseCombo(pool,nMin,nMax,threshold){
 let best=null;
 let checked=0; const ceiling=120000;
 const walk=(start,set,odds,cost)=>{
  if(set.length>=nMin&&odds>=threshold){
   const score=cost+Math.abs(Math.log(odds/threshold))*2+Math.max(0,set.length-nMin)*.4;
   if(!best||score<best.score)best={rows:set.slice(),odds,score};
  }
  if(set.length>=nMax||start>=pool.length||checked++>ceiling)return;
  for(let i=start;i<pool.length;i++){
   set.push(pool[i]);walk(i+1,set,odds*pool[i].odds,cost+quotePriority(pool[i].match));set.pop();
   if(checked>ceiling)break;
  }
 };
 walk(0,[],1,0);return best;
}
function renderCombos(){
 const out=el("v3-combo-results"),n=Math.min(3,Math.max(1,num(el("v3-combo-count").value,2)));
 const low=Math.max(3,Math.min(5,num(el("v3-combo-min").value,3)));
 const high=Math.max(low,Math.min(5,num(el("v3-combo-max").value,5)));
 const threshold=Math.max(1,num(el("v3-combo-quote").value,3));
 let pool=X.rows.filter(x=>x.role==="FAVOURITE"&&x.available&&!isNSP(x.match)&&status(x.match)!=="NOT_READY")
  .sort((a,b)=>quotePriority(a.match)-quotePriority(b.match)||a.fixtureId.localeCompare(b.fixtureId));
 pool=[...new Map(pool.map(x=>[x.fixtureId,x])).values()].slice(0,35);
 const combos=[];for(let i=0;i<n;i++){if(pool.length<low)break;const c=chooseCombo(pool,low,high,threshold);if(!c)break;combos.push(c);const used=new Set(c.rows.map(x=>x.fixtureId));pool=pool.filter(x=>!used.has(x.fixtureId));}
 if(!combos.length){out.innerHTML='<div class="v3-info" style="grid-column:1/-1">Für diesen Run gibt es keine zulässige Favourite Kombination mit '+low+' bis '+high+' unterschiedlichen Spielen und einer Gesamtquote von mindestens '+fmt(threshold)+' aus vorhandenen BSD Quoten. Prognosen und Quoten wurden nicht verändert.</div>';return;}
 out.innerHTML=combos.map((c,i)=>'<article class="v3-combo-card"><h3>Vorschlag '+(i+1)+'</h3><ol>'+c.rows.map(x=>'<li><b>'+escapeText(x.match.home)+" – "+escapeText(x.match.away)+'</b><div>'+escapeText(nameMarket(x.market))+' · '+fmt(x.odds,3)+'</div></li>').join("")+'</ol><div class="v3-total"><span>Gesamtquote</span><strong>'+fmt(c.odds,3)+'</strong></div><button type="button" data-combo="'+i+'">In Wettschein übernehmen</button></article>').join("");
 out.querySelectorAll("[data-combo]").forEach(b=>b.addEventListener("click",()=>{
 X.picks.clear();combos[Number(b.dataset.combo)].rows.forEach(x=>X.picks.set(x.fixtureId,x));showSelected();renderQuotes();el("v3-selected").scrollIntoView({behavior:"smooth",block:"nearest"});
 }));
}
async function prepareTeamSelect(){
 const s=el("v3-team-select");if(!s)return;
 const teams=[...new Set(arr(state.currentRun?.matches).flatMap(m=>[m.home,m.away]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
 const prev=s.value;
 s.innerHTML=teams.map(t=>'<option value="'+escapeText(t)+'">'+escapeText(t)+'</option>').join("");
 if(teams.includes(prev))s.value=prev;
 if(!teams.length)el("v3-team-content").innerHTML='<div class="v3-info">Dieser Run enthält keine Teams.</div>';
}
async function getDaily(){
 const day=state.currentRun?.meta?.date||el("runDate")?.value||"";
 if(X.daily?.date===day)return X.daily;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error("Kein gültiges Tagesdatum");
 const ptr=await getJSON("data/"+day+"/latest.json");
 const root="data/"+day+"/"+ptr.snapshot_id+"/";
 const doc=await getJSON(root+"fixtures.json");
 return X.daily={date:day,ptr,root,doc};
}
function teamMetricsHTML(f){
 const metrics=[
 ["Formspiele","last5_all_competitions_n",0],
 ["Siege","last5_all_competitions_wins",0],
 ["Unentschieden","last5_all_competitions_draws",0],
 ["Niederlagen","last5_all_competitions_losses",0],
 ["xG pro Spiel","last5_all_competitions_xg_for_avg",2],
 ["xGA pro Spiel","last5_all_competitions_xg_against_avg",2],
 ["Tore pro Spiel","last5_all_competitions_goals_for_avg",2],
 ["Gegentore pro Spiel","last5_all_competitions_goals_against_avg",2],
 ["Torschüsse pro Spiel","last5_all_competitions_shots_for_avg",1],
 ["Schüsse aufs Tor","last5_all_competitions_shots_on_target_for_avg",1],
 ["Gegnerische Schüsse","last5_all_competitions_shots_against_avg",1],
 ["Punkte pro Spiel","last5_all_competitions_ppg",2]
 ];
 return metrics.map(x=>'<div class="panel v3-metric"><small>'+x[0]+'</small><strong>'+fmt(f[x[1]],x[2])+'</strong></div>').join("");
}
function matchHistoryHTML(h){
 const matches=arr(h.matches).filter(m=>m.d&&m.res).slice().sort((a,b)=>b.d.localeCompare(a.d)).slice(0,5);
 if(!matches.length)return '<p>Keine chronologische Matchhistorie im Snapshot.</p>';
 return '<div class="v3-results">'+matches.map(m=>'<div class="v3-result '+(m.res==="W"?"win":m.res==="L"?"loss":"")+'"><div>'+escapeText(m.d)+'</div><strong>'+tag(m.gf)+" : "+tag(m.ga)+'</strong><div>'+escapeText(String(m.opp||"").replace(/_/g," "))+'</div><div>'+escapeText(m.res==="W"?"Sieg":m.res==="L"?"Niederlage":"Remis")+'</div></div>').join("")+'</div>';
}
function eloForTeam(name){
 for(const fx of arr(X.stage12?.fixtures)){
  const identity=obj(fx.fixture_identity);
  const side=identity.home_team_name===name?"home":identity.away_team_name===name?"away":null;
  if(side){const p=obj(fx.prediction),x=obj(obj(p.structural_strength)[side]);return {base:x.base_elo?.value,adjusted:x.adjusted_elo?.value,source:fx};}
 }
 return null;
}
async function loadTeam(){
 const name=el("v3-team-select").value,box=el("v3-team-content");
 if(!name)return;
 box.innerHTML='<div class="v3-info">Der zugehörige Team Snapshot wird geladen …</div>';
 try{
  const [daily,stage]=await Promise.all([getDaily(),getStage12ForRun().catch(()=>null)]);
  X.stage12=stage;
  const fx=arr(daily.doc.fixtures).find(x=>[x.home_team?.team_name,x.away_team?.team_name,x.fixture?.home_team_name,x.fixture?.away_team_name].includes(name));
  if(!fx)throw Error("Keine Teamreferenz für "+name+" in diesem Tages-Snapshot");
  const side=fx.home_team?.team_name===name?"home":"away";
  const teamRef=fx[side+"_team"]?.ref;
  if(!teamRef)throw Error("Kein Teamdokument publiziert");
  const team=await getJSON(daily.root+teamRef);
  if(el("v3-team-select").value!==name)return;
  const f=obj(team.feature_state),hist=obj(team.match_history),elo=eloForTeam(name);
  const snapshotStamp=daily.ptr.generated_at||daily.ptr.data_cutoff||"";
  const runStamp=X.stage12?.publication_identity?.published_at_utc||"";
  const later=Date.parse(snapshotStamp)>Date.parse(runStamp)&&Boolean(runStamp);
  const summary='<div class="panel v3-team-hero"><div class="v3-kicker">TEAM BOOK · '+escapeText(daily.date)+'</div><h2>'+escapeText(name)+'</h2><p>Snapshot '+escapeText(daily.ptr.snapshot_id)+' · Cutoff '+escapeText(daily.ptr.data_cutoff||"nicht publiziert")+'</p><p class="v3-small">'+(later?"Hinweis: Dieser Tages-Snapshot entstand nach der Run-Publikation. Er ist zusätzlicher Datenkontext, nicht die damalige Entscheidungsgrundlage.":"Teamdaten aus dem veröffentlichten Tages-Snapshot.")+'</p></div>';
  const eloHTML='<div class="v3-team-grid"><div class="panel v3-metric"><small>Base ClubElo aus Stage12</small><strong>'+fmt(elo?.base,1)+'</strong></div><div class="panel v3-metric"><small>Adjustment Elo aus Stage12</small><strong>'+fmt(elo?.adjusted,1)+'</strong></div></div>';
  box.innerHTML=summary+'<div class="v3-team-grid" style="margin-bottom:13px">'+teamMetricsHTML(f)+'</div>'+eloHTML+'<div class="panel v3-team-hero" style="margin-top:14px"><h3>Last Five · echte Matchresultate</h3>'+matchHistoryHTML(hist)+'</div><div class="panel v3-team-hero"><h3>ECOBET Momentum</h3><p>Team Momentum ist eine separate Auswertung historischer ECOBET Settlements und darf nicht mit der sportlichen Last Five Form verwechselt werden.</p><button class="v3-btn-alt" id="v3-open-momentum" type="button">Zur Performance: Team Momentum</button></div><div class="v3-small">Quelle: '+escapeText(daily.root+teamRef)+'. Nulldaten werden nicht durch 0 ersetzt. Historie und Formfenster können voneinander abweichen.</div>';
  el("v3-open-momentum").onclick=()=>{activateView("performance");activatePerfTab("momentum");};
 }catch(e){box.innerHTML='<div class="v3-info">Team Book derzeit nicht vollständig ladbar: '+escapeText(e.message||e)+'. Fehlende Daten werden nicht ergänzt oder geschätzt.</div>';}
}
function deeperMatch(m){
 const p=obj(stage12Match(m)?.prediction);
 if(!Object.keys(p).length)return '<div class="v3-info">Stage12 Quellrecord noch nicht geladen. Die Analyse wird nach dem Laden ergänzt.</div>';
 const text=(v)=>v?'<p>'+escapeText(v)+'</p>':'<p>Keine Textfassung vorhanden.</p>';
 const evidence=(heading,body)=>'<article class="v3-evidence"><h4>'+heading+'</h4>'+body+'</article>';
 const original=(v)=>'<details><summary>Englischer Originaltext aus dem versiegelten Record</summary>'+text(v)+'</details>';
 const h=obj(p.team_books?.home),a=obj(p.team_books?.away);
 const score=obj(p.score_state_cluster),frag=obj(p.fragility),paths=obj(p.final_paths),s=obj(p.structural_strength);
 const elo=(o)=>"Base Elo "+fmt(o?.base_elo?.value,1)+" · Adjusted Elo "+fmt(o?.adjusted_elo?.value,1);
 let parts=[];
 parts.push(evidence("Match Thesis",'<p>Die versiegelte Match These und ihre Evidenz werden im ursprünglichen Wortlaut nachgewiesen.</p>'+original(p.match_thesis?.summary)));
 parts.push(evidence("Match Book",'<p>Originale Match Book Zusammenfassung und referenzierte Konflikte.</p>'+original(p.match_book?.summary)+'<p>Konfliktverweise: '+arr(p.match_book?.opposing_ids).length+' · Unterstützende Verweise: '+arr(p.match_book?.supporting_ids).length+'</p>'));
 parts.push(evidence(escapeText(m.home)+" · Team Book",'<p>'+escapeText(elo(s.home))+'</p>'+original(h.state_summary)+'<p>Recordstatus: '+tag(h.status)+'</p>'));
 parts.push(evidence(escapeText(m.away)+" · Team Book",'<p>'+escapeText(elo(s.away))+'</p>'+original(a.state_summary)+'<p>Recordstatus: '+tag(a.status)+'</p>'));
 const states=arr(score.game_states);
 parts.push(evidence("Scoreline Szenarien · "+states.length+" Zustände",states.length?'<ol>'+states.map(z=>'<li><b>'+tag(z.state_id)+'</b> · '+escapeText(z.description||"Keine Beschreibung")+'</li>').join("")+'</ol>':'<p>Keine Szenarien publiziert.</p>'));
 parts.push(evidence("Fragility · Bruchbedingungen",arr(frag.path_bindings).length?'<ul>'+arr(frag.path_bindings).map(z=>'<li><b>'+tag(z.path_id)+'</b> · '+escapeText(z.break_summary||"Nicht verfügbar")+'</li>').join("")+'</ul>':'<p>Keine Break Bindings publiziert.</p>'));
 parts.push(evidence("Aufstellungen und Spielerstatus",["home","away"].map(side=>{const item=obj(obj(p.player_context)[side]);return '<p><b>'+escapeText(side==="home"?m.home:m.away)+":</b> Predicted XI "+tag(item.predicted_xi?.status)+" · "+arr(item.players).length+" Spielerrecords</p>";}).join("")));
 parts.push(evidence("Final Paths und Auswahl",["safe","balanced","aggressive"].map(k=>{const x=obj(paths[k]);return '<p><b>'+k.toUpperCase()+":</b> "+tag(x.path?.market_expression)+" · "+tag(x.status)+"</p>";}).join("")+'<p><b>Favourite:</b> '+tag(p.favourite?.expression)+' · Quelle '+tag(p.favourite?.source_role)+'</p>'));
 return '<div class="panel v3-detail-extras"><div class="v3-kicker">VERTIEFUNG · NUR PUBLIKATIONSDATEN</div><h3>Vollständigerer Einblick in den Stage12 Record</h3><p class="v3-small">Deutsche Überschriften und technische Kennzahlen; nicht geprüfte englische Langtexte bleiben als gekennzeichnete Originale erhalten. Es werden keine Aussagen neu erfunden.</p><div class="v3-evidence-grid">'+parts.join("")+'</div></div>';
}
if(typeof window.phase2DetailHTML==="function"){
 const phase2=window.phase2DetailHTML;
 window.phase2DetailHTML=function(m){
  const html=phase2(m);
  const add='<button type="button" data-p2-tab="deep" onclick="window.ecobetPhase2Tab(this)">Vertiefung</button>';
  return html.replace("</nav>",""+add+"</nav>")+'<div class="phase2-panel" data-p2-panel="deep">'+deeperMatch(m)+'</div>';
 };
}
const originalActivateView=activateView;
activateView=function(view,sync=true){
 if(view==="board"||view==="teams"){
  state.activeView=view;
  document.querySelectorAll("#mainNav button[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+view));
  const guide=el("methodGuideWrap");if(guide)guide.hidden=true;
  if(view==="board")loadBoard();else prepareTeamSelect();
  if(sync)syncURL();return;
 }
 return originalActivateView(view,sync);
};
const originalLoadSelected=loadSelectedRun;
loadSelectedRun=async function(route){
 await originalLoadSelected(route);
 X.run=null;X.daily=null;X.rows=[];X.picks.clear();showSelected();
 if(state.activeView==="board")await loadBoard();
 if(state.activeView==="teams")prepareTeamSelect();
};
const oldRenderPerformance=renderPerformance;
renderPerformance=function(p){
 X.perfRendered.clear();
 renderCockpit(p);X.perfRendered.add("cockpit");
};
const perfMap={cockpit:renderCockpit,trends:renderTrends,markets:renderMarkets,leagues:renderLeagues,hitmiss:renderHitMiss,momentum:renderTeamMomentum,topreads:renderTopReadsPerformance,nsp:renderNSP,scores:renderScores};
const oldPerfTab=activatePerfTab;
activatePerfTab=function(tab,sync=true){
 oldPerfTab(tab,sync);
 if(!state.performance||X.perfRendered.has(state.performanceTab))return;
 const current=state.performanceTab,fn=perfMap[current];
 if(typeof fn!=="function")return;
 X.perfRendered.add(current);
 if(current==="momentum"){
  const target=el("perf-momentum");target.innerHTML='<div class="v3-info">Team Form und historisches ECOBET Momentum werden bei Bedarf geladen …</div>';
  (async()=>{try{await hydrateRunSnapshots();const names=[...momentumMap(state.performance.rawAudits).values()].map(x=>x.name);await hydrateRecentTeamForms(names,3);}catch(e){console.warn("Teamform Ergänzung eingeschränkt",e)}fn(state.performance)})().catch(e=>target.innerHTML='<div class="v3-info">'+escapeText(e.message||e)+'</div>');
 }else fn(state.performance);
};
loadPerformance=async function(){
 if(X.perfBusy)return;X.perfBusy=true;state.performanceLoaded=true;
 const box=el("performanceLoading");box.style.display="block";box.textContent="Performance Index wird geladen …";
 try{
  const loaded=await ensureAuditData();
  state.performanceAudits=dedupeAuditRuns(loaded);
  state.performanceCompetitionOptions=performanceCompetitionUniverse(state.performanceAudits);
  if(!(state.performanceCompetitionSelection instanceof Set))state.performanceCompetitionSelection=new Set(state.performanceCompetitionOptions);
  state.performance=aggregatePerformance(filteredPerformanceAudits(state.performanceAudits,state.performanceCompetitionSelection));
  renderPerformance(state.performance);box.style.display="none";activatePerfTab(state.performanceTab,false);syncURL();
 }catch(e){state.performanceLoaded=false;box.innerHTML='<div class="error">'+escapeText(e.message||e)+'</div>';}
 finally{X.perfBusy=false;}
};
el("v3-top-ranking").onclick=()=>activateView("topreads");
el("v3-team-open").onclick=loadTeam;
["v3-role","v3-risk","v3-league","v3-min-odds","v3-max-odds","v3-market"].forEach(id=>el(id).addEventListener("input",renderQuotes));
el("v3-odds-slider").addEventListener("input",e=>{el("v3-min-odds").value=e.target.value;el("v3-slider-label").textContent=fmt(e.target.value);renderQuotes()});
el("v3-min-odds").addEventListener("input",e=>{const n=Math.min(10,Math.max(1,num(e.target.value,1)));el("v3-odds-slider").value=n;el("v3-slider-label").textContent=fmt(n)});
el("v3-slip-clear").onclick=()=>{X.picks.clear();showSelected();renderQuotes()};
el("v3-stake").addEventListener("input",showSelected);
el("v3-combo-build").onclick=renderCombos;
el("v3-team-select").addEventListener("change",()=>{el("v3-team-content").innerHTML='<div class="v3-info">Team auswählen und Team Book laden.</div>';});
showSelected();
})();
