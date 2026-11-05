
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const safe=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=x=>Array.isArray(x)?x:[];
const obj=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:{};
const N=x=>x===null||x===undefined||x===""||!Number.isFinite(+x)?null:+x;
const fmt=(x,n=2)=>N(x)===null?"Nicht verfügbar":N(x).toLocaleString("de-CH",{minimumFractionDigits:n,maximumFractionDigits:n});
const CHF=x=>"CHF "+fmt(x,2);
const known=x=>x!==null&&x!==undefined&&x!==""&&!["NOT_AVAILABLE","NOT_APPLICABLE","NO_PREDICTION_TECHNICAL_BLOCKER"].includes(String(x).toUpperCase());
const val=x=>known(x)?safe(x):"Nicht verfügbar";
const S={index:null,id:null,run:null,stage:null,stageMap:new Map(),board:null,odds:[],daily:null,teamCache:new Map(),selection:new Map(),detail:null,performance:null,perfTab:"cockpit",auditDate:null};
const dataCache=new Map();
async function get(path,cache=true){
 if(cache&&dataCache.has(path))return dataCache.get(path);
 const promise=(async()=>{const r=await fetch(path,{cache:cache?"force-cache":"no-store"});if(!r.ok)throw Error(path+": HTTP "+r.status);return r.json()})();
 if(cache)dataCache.set(path,promise);
 try{return await promise}catch(e){dataCache.delete(path);throw e}
}
const slug=x=>String(x||"").trim().toLowerCase().replace(/\s+/g," ");
const key=m=>slug(m.home)+"|"+slug(m.away);
const matchF=(m)=>m.home+" – "+m.away;
function market(x){
 if(!known(x))return "Nicht verfügbar";
 let s=String(x);
 return safe(s.replace(/^Both Teams To Score: Yes$/i,"Beide Mannschaften treffen: Ja")
  .replace(/^Both Teams To Score: No$/i,"Beide Mannschaften treffen: Nein")
  .replace(/^Match Total Under ([\d.]+)$/i,"Unter $1 Tore insgesamt")
  .replace(/^Match Total Over ([\d.]+)$/i,"Über $1 Tore insgesamt")
  .replace(/^Match goals ([\d]+)-([\d]+)$/i,"$1 bis $2 Tore insgesamt")
  .replace(/ Team Goals Under ([\d.]+)/i," unter $1 Teamtore")
  .replace(/ Team Goals Over ([\d.]+)/i," über $1 Teamtore")
  .replace(/ Draw No Bet$/i," ohne Remis (DNB)")
  .replace(/ or Draw$/i," oder Remis")
  .replace(/ to win$/i," Sieg")
  .replace(/\bBTTS Yes\b/gi,"Beide treffen")
  .replace(/\bBTTS No\b/gi,"Nicht beide treffen")
  .replace(/\bMatch\b/gi,"Spiel"));
}
const stateName=x=>({"YELLOW":"Gelb","GREEN":"Grün","RED":"Rot","STABLE":"Stabil","CONDITIONAL":"Eingeschränkt","READY":"Bereit","PARTIAL":"Teilweise","FULL":"Vollständig","NOT_READY":"Nicht bereit","NOT_APPLICABLE":"Nicht anwendbar","AVAILABLE":"Verfügbar","NOT_AVAILABLE":"Nicht verfügbar"}[String(x)]||val(x));
const reasonName=x=>({"PROVIDER_MARKET_NOT_COVERED":"Wettmarkt beim Datenanbieter nicht abgedeckt","PROVIDER_LINE_NOT_OFFERED":"Gewünschte Torlinie nicht angeboten","PROVIDER_EVENT_NOT_FOUND":"Spiel beim Anbieter nicht gefunden","PROVIDER_QUOTE_NOT_AVAILABLE":"Keine Quote vom Anbieter","NO_PROVIDER_QUOTE":"Keine Anbieterquote","EVENT_NOT_PRE_MATCH":"Kein gültiger Quotenstand vor Spielbeginn"}[String(x)]||"Keine verfügbare BSD Quote");
const stability=m=>m.ampel||S.stageMap.get(m.fixture_id)?.prediction?.prediction_stability_light||"Nicht klassifiziert";
const pill=(label,c="")=>'<span class="pill '+c+'">'+safe(label)+'</span>';
const positive=x=>x==="HIT",negative=x=>x==="MISS";
const today=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const ztime=x=>{if(!x)return"Zeit nicht angegeben";let d=new Date(x);return isNaN(d.getTime())?"Zeit nicht angegeben":new Intl.DateTimeFormat("de-CH",{timeZone:"Europe/Zurich",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)};
function feedback(id,text,type=""){$(id).className="notice "+type;$(id).textContent=text}
function navigate(page,hash=true){
 document.querySelectorAll(".view").forEach(e=>e.classList.toggle("active",e.id==="page-"+page));
 document.querySelectorAll("[data-page]").forEach(e=>e.classList.toggle("active",e.dataset.page===page));
 if(page==="analysen"){}else if(page==="board")loadBoard();else if(page==="performance")loadPerformance();else if(page==="audit")loadAudit();
 if(hash)history.replaceState(null,"","#"+page);
 window.scrollTo({top:page==="analysen"?240:300,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(e=>e.onclick=()=>navigate(e.dataset.page));
async function bootstrap(){
 try{
  S.index=await get("runs/index.json",false);
  const days=Object.keys(obj(S.index.dates)).sort().reverse();
  $("run-day").innerHTML=days.map(d=>'<option value="'+safe(d)+'">'+safe(d)+'</option>').join("");
  $("run-day").onchange=()=>{fillIds();loadRun()};
  $("run-choice").onchange=loadRun;
  $("run-league").onchange=renderList;
  $("reload-run").onclick=()=>{S.id=null;loadRun()};
  fillIds();
  await loadRun();
  $("connection").textContent="Veröffentlichte ECOBET Daten verbunden";
  const hash=location.hash.slice(1);
  if(["board","performance","audit"].includes(hash))navigate(hash,false);
 }catch(e){feedback("run-message","Laden fehlgeschlagen: "+e.message,"error");$("connection").textContent="Daten nicht verbunden";}
}
function fillIds(){
 const d=$("run-day").value;
 const ids=arr(S.index?.dates?.[d]);
 $("run-choice").innerHTML=ids.map(i=>'<option value="'+safe(typeof i==="string"?i:i.id)+'">'+safe(typeof i==="string"?i:i.id)+'</option>').join("");
}
async function loadRun(){
 const id=$("run-choice").value;
 if(!id)return;
 const previous=id===S.id;
 feedback("run-message","Run, Stage12 und Tages Snapshot werden verbunden …");
 $("match-list").innerHTML="";
 $("run-kpis").innerHTML="";
 S.id=id;S.run=null;S.stage=null;S.stageMap.clear();S.daily=null;S.board=null;S.odds=[];S.teamCache.clear();S.selection.clear();S.detail=null;
 $("report").hidden=true;$("analysis-home").hidden=false;
 try{
  const [run,stage,board]=await Promise.all([
   get("runs/"+id+".json"),
   get("stage13/source-records/"+id+".stage12.json").catch(()=>null),
   get("stage13/"+id+".json").catch(()=>null)
  ]);
  if(id!==S.id)return;
  S.run=run;S.stage=stage;S.board=board;
  arr(stage?.fixtures).forEach(f=>S.stageMap.set(f.fixture_identity?.fixture_id,f));
  $("run-league").innerHTML='<option value="">Alle Wettbewerbe</option>'+[...new Set(arr(run.matches).map(m=>m.competition).filter(Boolean))].map(s=>'<option>'+safe(s)+'</option>').join("");
  let real=arr(run.matches).filter(m=>!technical(m));
  $("run-kpis").innerHTML=[["Spiele",run.matches.length],["Prognosen",real.length],["Technische Blocker",run.matches.length-real.length],["Run",id]].map(([label,v])=>'<div><strong>'+safe(v)+'</strong><small>'+safe(label)+'</small></div>').join("");
  const integrity=run.run?.run_integrity||"Nicht angegeben";
  feedback("run-message",integrity==="PARTIAL"?"Teilweise veröffentlichter Lauf: "+(run.matches.length-real.length)+" technische Blocker. Es werden nur die publizierten gültigen Prognosen dargestellt.":"Verifizierter Lauf. Die Anzeige verwendet unveränderte veröffentlichte Predictions und gekennzeichnete Daten Snapshots.",integrity==="PARTIAL"?"warn":"");
  renderList();
  loadDaily().then(()=>{if(S.detail!==null)openReport(S.detail,true)}).catch(()=>{});
 }catch(e){feedback("run-message","Run nicht ladbar: "+e.message,"error")}
}
const technical=m=>String(m.match_core_status||"").includes("TECHNICAL")||String(m.favourite||"").startsWith("NO_PREDICTION");
function renderList(){
 if(!S.run)return;
 const league=$("run-league").value;
 const rows=arr(S.run.matches).filter(m=>!league||m.competition===league);
 const EV=window.EV3;
 const badgeFor=m=>technical(m)?"Technischer Blocker":stateName(stability(m));
 $("match-list").innerHTML=rows.length?rows.map(m=>{
  const label=badgeFor(m),colour=technical(m)?"red":stability(m)==="GREEN"?"green":stability(m)==="RED"?"red":"yellow";
  const club=name=>EV?EV.entity(name,"team","lg"):safe(name);
  const comp=EV?EV.entity(m.competition||"Wettbewerb","competition","sm"):safe(m.competition||"Wettbewerb");
  const paths=[["SAFE",m.safe],["BALANCED",m.balanced],["AGGRESSIVE",m.aggressive]];
  return '<article class="match panel ev3-match"><div class="match-top">'+comp+'<span>'+ztime(m.kickoff)+'</span></div>'+
  '<div class="ev3-match-teams"><div>'+club(m.home)+'</div><span class="ev3-vs">VS</span><div>'+club(m.away)+'</div></div>'+
  '<div class="favourite"><small>ECOBET Favourite</small><b>'+market(m.favourite)+'</b></div>'+
  '<div class="pills">'+pill(label,colour)+pill(stateName(m.data_readiness||"Datenstatus"))+'</div>'+
  '<div class="ev3-pathline">'+paths.map(([role,v])=>'<div><small>'+role+'</small><b>'+market(v)+'</b></div>').join("")+'</div>'+
  '<div class="foot"><span>Analyse, Team Books und Scoreline</span><button data-match="'+safe(m.fixture_id)+'" type="button">Spielanalyse öffnen ↗</button></div></article>';
 }).join(""):'<div class="notice">Keine Spiele für diesen Wettbewerb vorhanden.</div>';
 $("match-list").querySelectorAll("[data-match]").forEach(b=>b.onclick=()=>openReport(b.dataset.match));
}
async function loadDaily(){
 const date=S.run?.run?.date||$("run-day").value;
 if(S.daily?.date===date)return S.daily;
 const pointer=await get("data/"+date+"/latest.json");
 const root="data/"+date+"/"+pointer.snapshot_id+"/";
 const doc=await get(root+"fixtures.json");
 if(date!==(S.run?.run?.date||$("run-day").value))return null;
 return S.daily={date,root,pointer,doc};
}
const teamByName=(m,side)=>{
 const fx=arr(S.daily?.doc?.fixtures).find(x=>x.fixture?.legacy_match_id===m.fixture_id||x.fixture?.fixture_id===m.fixture_id||x.fixture?.home_team_name===m.home&&x.fixture?.away_team_name===m.away);
 return fx?.[side+"_team"]?.ref||null;
};
async function loadTeam(m,side){
 const ref=teamByName(m,side);
 if(!ref)return null;
 const root=S.daily.root+ref;
 if(S.teamCache.has(root))return S.teamCache.get(root);
 try{const team=await get(root);S.teamCache.set(root,team);return team}catch(e){return null}
}
const metricName={
"last5_all_competitions_n":"Spiele", "last5_all_competitions_wins":"Siege","last5_all_competitions_draws":"Remis","last5_all_competitions_losses":"Niederlagen",
"last5_all_competitions_goals_for_avg":"Tore pro Spiel","last5_all_competitions_goals_against_avg":"Gegentore pro Spiel",
"last5_all_competitions_xg_for_avg":"xG pro Spiel","last5_all_competitions_xg_against_avg":"xGA pro Spiel",
"last5_all_competitions_shots_for_avg":"Schüsse pro Spiel","last5_all_competitions_shots_on_target_for_avg":"Schüsse aufs Tor",
"last5_all_competitions_shots_against_avg":"Gegnerische Schüsse","last5_all_competitions_ppg":"Punkte pro Spiel",
"last10_all_competitions_goals_for_avg":"Tore pro Spiel (letzte 10)","last10_all_competitions_goals_against_avg":"Gegentore pro Spiel (letzte 10)",
"last10_all_competitions_xg_for_avg":"xG pro Spiel (letzte 10)","last10_all_competitions_xg_against_avg":"xGA pro Spiel (letzte 10)"
};
const metrics=Object.keys(metricName);
function compareTable(h,a){
 const f=obj(h?.feature_state),g=obj(a?.feature_state);
 return '<div class="metric-table-wrap"><table class="compare metric-table"><thead><tr><th>Kennzahl</th><th>Heim</th><th>Auswärts</th></tr></thead><tbody>'+
 metrics.map(k=>'<tr><td>'+safe(metricName[k])+'</td><td>'+fmt(f[k],k.includes("_n")||k.endsWith("wins")||k.endsWith("draws")||k.endsWith("losses")?0:2)+'</td><td>'+fmt(g[k],k.includes("_n")||k.endsWith("wins")||k.endsWith("draws")||k.endsWith("losses")?0:2)+'</td></tr>').join("")+'</tbody></table></div>';
}
function formCoverage(t){
 const f=obj(t?.feature_state);
 const total=N(f.last5_all_competitions_n);
 const hasXG=N(f.last5_all_competitions_xg_for_n_available);
 const hasXGA=N(f.last5_all_competitions_xg_against_n_available);
 if(total===null)return '<div class="time-note">Datenabdeckung: Das vollständige Last Five Fenster ist nicht vorhanden.</div>';
 const xg=hasXG===null?'nicht ausgewiesen':hasXG+' von '+total;
 const xga=hasXGA===null?'nicht ausgewiesen':hasXGA+' von '+total;
 const quality=(hasXG!==null&&hasXG<total)||(hasXGA!==null&&hasXGA<total);
 return '<div class="form-coverage '+(quality?'partial':'complete')+'"><strong>Statistikabdeckung</strong>'+
 '<span>xG: '+xg+' Spielen · xGA: '+xga+' Spielen</span>'+
 (quality?'<small>Fehlende Werte werden weder als 0 noch als geschätzte Zahlen dargestellt. Durchschnittswerte basieren nur auf verfügbaren Spielen.</small>':'')+'</div>';
}
function formCards(t){
 const history=arr(t?.match_history?.matches).filter(x=>x.d&&x.res).sort((a,b)=>a.d.localeCompare(b.d)).slice(-5);
 if(!history.length)return '<p class="small muted">Keine einzelnen Spiele im zugehörigen Tages Snapshot verfügbar.</p>';
 return '<div class="form-line">'+history.map(x=>'<div class="form-event '+(x.res==="W"?"win":x.res==="L"?"loss":"draw")+'"><span>'+safe(x.d.slice(5))+' · '+(x.v==="H"?"Heim":"Auswärts")+'</span><b>'+val(x.gf)+' : '+val(x.ga)+'</b><em>'+safe(String(x.opp||"").replace(/_/g," "))+'</em><em>xG '+fmt(x.xgf)+' · xGA '+fmt(x.xga)+'</em></div>').join("")+'</div>';
}
function metricRows(signal){
 const picks=arr(signal?.signals).filter(x=>x.value?.status==="AVAILABLE"&&N(x.value.value)!==null);
 const map={"season_to_date_ppg":"Punkte pro Spiel (Saison)","season_to_date_goals_for_avg":"Tore pro Spiel (Saison)","season_to_date_xg_for_avg":"xG pro Spiel (Saison)","season_to_date_xg_against_avg":"xGA pro Spiel (Saison)","season_to_date_shots_on_target_for_avg":"Schüsse aufs Tor (Saison)"};
 return picks.filter(x=>map[x.metric_id]).slice(0,12).map(x=>'<tr><td>'+safe(map[x.metric_id])+'</td><td>'+fmt(x.value.value)+'</td><td>'+safe(x.sample_matches??"—")+'</td></tr>').join("");
}
function reportHeader(m,p){
 const tag=technical(m)?"Technischer Blocker":stateName(stability(m));
 return '<div class="report-title"><button class="back" id="back-matches" type="button">← Zurück zu den Spielen</button><div class="eyebrow">'+safe(m.competition||"Match Intelligence")+' · '+safe(S.run?.run?.date)+'</div><div class="report-top"><h2>'+safe(matchF(m))+'</h2></div><div class="report-identity">'+pill(tag,tag==="Gelb"?"yellow":tag==="Rot"?"red":"")+pill(S.id)+pill("ECOBET Match Book")+'</div></div>';
}
function reportPaths(m,p,quotes){
 return '<div class="paths">'+["SAFE","BALANCED","AGGRESSIVE","FAVOURITE"].map(role=>{
  const x=quotes.find(q=>q.role===role);
  const path=role==="FAVOURITE"?m.favourite:m[role.toLowerCase()];
  const f=obj(p?.final_paths?.[role.toLowerCase()]);
  const breaks=arr(p?.fragility?.path_bindings).find(x=>x.path_id===f?.path?.path_id);
  const trans=ECOBET_DE_20261103[matchF(m)];
  const r=({SAFE:0,BALANCED:1,AGGRESSIVE:2})[role];
  return '<div class="path inset"><small>'+role+'</small><b>'+market(path)+'</b><div>'+pill(x?.available?"BSD "+fmt(x.odds,3):"Keine BSD Quote",x?.available?"green":"yellow")+'</div>'+
  (r!==undefined&&trans?.risks?.[r]?'<p class="small" style="margin:9px 0 0">Bruchbedingung: '+safe(trans.risks[r])+'</p>':breaks?'<p class="small" style="margin:9px 0 0">Bruchbedingungen im Originalrecord vorhanden, aber noch nicht als geprüfte deutsche Fassung veröffentlicht.</p>':'')+
  '</div>';
 }).join("")+'</div>';
}
function xi(p,name,side){
 const x=obj(obj(p?.player_context)[side]);
 const q=obj(x.predicted_xi);
 const available=q.status==="AVAILABLE";
 return '<div class="inset" style="padding:15px"><h4>'+safe(name)+'</h4><p class="small">Prognostizierte Formation: <b>'+ (available?val(q.formation):"Nicht verfügbar")+'</b></p><p class="small">Aufstellungsabdeckung: <b>'+fmt(N(q.coverage?.value)!==null?N(q.coverage?.value)*100:null,1)+' %</b><br>Konfidenz: <b>'+fmt(N(q.confidence?.value)!==null?N(q.confidence?.value)*100:null,1)+' %</b></p><p class="small">Spielerreferenzen: '+arr(q.player_ids).length+'. '+(arr(x.players).length?'Spielerrecords vorhanden.':'Spielernamen sind im veröffentlichten Record nicht enthalten. IDs werden nicht als Namen ausgegeben.')+'</p></div>';
}
const linkSrc=(path)=>'<a href="'+safe(path)+'" target="_blank" rel="noopener">Originalrecord auf GitHub Pages öffnen</a>';
async function openReport(fixture,quiet=false){
 const m=arr(S.run?.matches).find(x=>x.fixture_id===fixture);
 if(!m)return;
 S.detail=fixture;
 $("analysis-home").hidden=true;$("report").hidden=false;
 $("report").innerHTML=reportHeader(m)+'<div class="notice">Team Books und veröffentlichte Matchdaten werden geladen …</div>';
 if(!quiet)window.scrollTo({top:240,behavior:"smooth"});
 const stage=S.stageMap.get(fixture);
 const p=stage?.prediction;
 const tr=ECOBET_DE_20261103[matchF(m)];
 const [day,odds]=await Promise.all([loadDaily().catch(()=>null),loadOdds().catch(()=>[])]);
 if(S.detail!==fixture)return;
 const [home,away]=day?await Promise.all([loadTeam(m,"home"),loadTeam(m,"away")]):[null,null];
 if(S.detail!==fixture)return;
 const str=obj(p?.structural_strength),h=obj(str.home),a=obj(str.away);
 const n=(x)=>x?.status==="AVAILABLE"?x.value:null;
 const quote=odds.filter(x=>x.fixtureId===fixture);
 const lead=tr?.thesis||"Für diesen historischen Run liegt noch keine geprüfte deutsche Langtextfassung vor. Die folgenden Angaben basieren auf den tatsächlich veröffentlichten Teamkennzahlen, Entscheidungspfaden und Szenarien.";
 const intro=tr?.match||"Die technischen Prognosedaten und vorhandenen Teamstatistiken werden angezeigt. Englische Originaltexte werden nicht automatisch als ungesicherte deutsche Übersetzung ausgegeben.";
 const sourceTag=!tr?'<div class="notice warn">Die Langtextübersetzung für diesen älteren Run ist noch nicht freigegeben. Keine englischen Texte in der Analyse und keine erfundenen Zusammenfassungen.</div>':"";
 const sec=(id,num,title,body)=>'<section class="report-section" id="'+id+'"><div class="eyebrow">'+num+'</div><h3>'+title+'</h3>'+body+'</section>';
 const report=reportHeader(m,p)+
 '<div class="report-highlights"><div><div class="eyebrow">ECOBET Favourite</div><strong>'+market(m.favourite)+'</strong><p class="small muted">Wettentscheidung des veröffentlichten ECOBET Runs. Die Spielthese steht in der Übersicht und die vertiefte Begründung im Match Book.</p></div><aside><div><span class="muted">Stabilität</span><b>'+stateName(stability(m))+'</b></div><div><span class="muted">Quotenstatus</span><b>'+(quote.find(x=>x.role==="FAVOURITE")?.available?"BSD "+fmt(quote.find(x=>x.role==="FAVOURITE").odds,3):"Keine BSD Quote")+'</b></div><div><span class="muted">Datenbasis</span><b>'+safe(day?.pointer?.snapshot_id||"Nicht verfügbar")+'</b></div></aside></div>'+
 '<div class="report-body"><article class="report-article">'+sourceTag+
 sec("spielthese","01 · Match Book","Detaillierte Matchanalyse",'<p class="lead">'+safe(intro)+'</p>')+
 sec("teams","02 · Team Intelligence","Team Books und objektive Leistungswerte",
 '<div class="opposite"><div class="inset"><h4>'+safe(m.home)+'</h4><p>'+(tr?safe(tr.home):'Keine geprüfte deutsche Team Book Langfassung vorhanden.')+'</p></div><div class="inset"><h4>'+safe(m.away)+'</h4><p>'+(tr?safe(tr.away):'Keine geprüfte deutsche Team Book Langfassung vorhanden.')+'</p></div></div>'+
 '<div class="figure"><h4>Strukturelle Spielstärke und Adjustment Elo</h4><div class="metric-table-wrap"><table class="compare"><thead><tr><th>Kennzahl</th><th>'+safe(m.home)+'</th><th>'+safe(m.away)+'</th></tr></thead><tbody>'+
 [["Basis ClubElo","base_elo"],["Angepasster Elo Wert","adjusted_elo"],["Elo Anpassung","adjustment_delta"],["Trend 7 Tage","trajectory_7d"],["Trend 14 Tage","trajectory_14d"],["Trend 30 Tage","trajectory_30d"],["Stärke der aktuellen Elf","current_xi_strength"]].map(([t,k])=>'<tr><td>'+t+'</td><td>'+fmt(n(h[k]),1)+'</td><td>'+fmt(n(a[k]),1)+'</td></tr>').join("")+'</tbody></table></div></div>'+
 '<div class="figure"><h4>Einzeldaten aus dem Tages Snapshot</h4>'+compareTable(home,away)+'</div>'+
 '<div class="figure"><h4>Kennzahlen aus dem versiegelten Stage12 Teamprofil</h4><div class="opposite"><div class="inset" style="padding:12px"><b>'+safe(m.home)+'</b><div class="table-wrap"><table class="compare"><thead><tr><th>Kennzahl</th><th>Wert</th><th>Spiele</th></tr></thead><tbody>'+metricRows(p?.team_performance?.home)+'</tbody></table></div></div><div class="inset" style="padding:12px"><b>'+safe(m.away)+'</b><div class="table-wrap"><table class="compare"><thead><tr><th>Kennzahl</th><th>Wert</th><th>Spiele</th></tr></thead><tbody>'+metricRows(p?.team_performance?.away)+'</tbody></table></div></div></div></div>'+
 '<div class="time-note">Run Veröffentlichung: '+ztime(S.stage?.publication_identity?.published_at_utc)+'. Team Snapshot: '+val(day?.pointer?.data_cutoff)+'. Falls der Snapshot später erstellt wurde, sind diese Statistiken zusätzlicher Kontext und nicht Teil des damaligen Modellentscheids.</div>')+
 sec("form","03 · Sportliche Form","Last Five: tatsächliche Spiele",
 '<p>Fünf chronologisch letzte dokumentierte Spiele, unabhängig vom Wettbewerbstyp. xG und xGA erscheinen nur dann, wenn sie für das einzelne Spiel im publizierten Snapshot vorhanden sind.</p>'+
 '<h4>'+safe(m.home)+' · letzte fünf dokumentierte Spiele</h4>'+formCoverage(home)+formCards(home)+
 '<h4>'+safe(m.away)+' · letzte fünf dokumentierte Spiele</h4>'+formCoverage(away)+formCards(away))+
 sec("momentum","04 · ECOBET Performance","Team Momentum: ECOBET Trefferbilanz",
 '<p>Team Momentum misst ausschliesslich die Treffer und Fehler der historischen ECOBET Favourites. Es ist keine sportliche Last Five Form und wird getrennt von den Mannschaftsresultaten ausgewertet.</p>'+
 '<div id="report-momentum" class="notice">Historische ECOBET Treffer werden aus den veröffentlichten Performance Audits geladen.</div>')+
 sec("welten","04 · Match Worlds","Spielverlauf und Gegenwelten",'<div class="opposite"><div class="inset"><h4>Hauptszenario</h4><p>'+safe(tr?.prime||"Das Szenario ist im Originalrecord dokumentiert. Eine geprüfte deutsche Fassung ist noch nicht verfügbar.")+'</p></div><div class="inset"><h4>Gegenszenario</h4><p>'+safe(tr?.counter||"Die Gegenwelt ist im Originalrecord dokumentiert. Eine geprüfte deutsche Fassung ist noch nicht verfügbar.")+'</p></div></div><h4>Scoreline Szenarien</h4><div class="score-row">'+arr(p?.score_state_cluster?.score_scenarios).map(x=>'<span class="score">'+safe(x.score)+'</span>').join("")+'</div><p>'+safe(tr?.cluster||"Die statistischen Scoreline Ergebnisse sind dem veröffentlichten Record entnommen.")+'</p>')+
 sec("aufstellungen","05 · Spieler und Aufstellungen","Prognostizierte Formationen",'<p>Die prognostizierte Aufstellung ist keine bestätigte Startelf. Es werden nur die im Record verfügbaren Informationen dargestellt.</p><div class="opposite">'+xi(p,m.home,"home")+xi(p,m.away,"away")+'</div>')+
 sec("betting","06 · Betting Book","Entscheidungswege und Fragility",'<p>Diese Pfade stammen unverändert aus dem veröffentlichten ECOBET Run. Das Betting Board ergänzt nur tatsächlich verfügbare BSD Quoten.</p>'+reportPaths(m,p,quote)+
 '<p class="time-note">Fragility bedeutet: Unter welchen Bedingungen kann die jeweilige Prognose trotz plausibler Ausgangslage scheitern?</p>')+
 sec("quellen","07 · Transparenz","Datenherkunft und Nachweise",'<div class="source"><p>Der vollständige versiegelte Record bleibt unverändert und ist von der deutschen Anzeige getrennt.</p><p>'+linkSrc("stage13/source-records/"+S.id+".stage12.json")+'</p><p>'+linkSrc("runs/"+S.id+".json")+'</p>'+(day?'<p>'+linkSrc("data/"+day.date+"/latest.json")+'</p>':'')+'<details><summary>Technische Record Kennungen</summary><pre>'+safe(JSON.stringify({publication:S.id,fixture_id:m.fixture_id,stage12_record:S.stage?.publication_identity?.record_id,run_record:S.run?.run?.record_id,snapshot:day?.pointer?.snapshot_id,integrity:S.run?.run?.run_integrity},null,2))+'</pre></details></div>')+
 '</article><aside class="report-menu"><div class="eyebrow" style="margin-bottom:10px">Berichtsinhalt</div><a href="#spielthese">Spielanalyse</a><a href="#teams">Team Books und Zahlen</a><a href="#form">Last Five und Momentum</a><a href="#welten">Spielwelten</a><a href="#aufstellungen">Aufstellungen</a><a href="#betting">Betting Book</a><a href="#quellen">Quellen</a></aside></div>';
 $("report").innerHTML=report;
 $("back-matches").onclick=()=>{$("report").hidden=true;$("analysis-home").hidden=false;S.detail=null;window.scrollTo({top:245,behavior:"smooth"})};
 if(S.performance)renderReportMomentum(m);else loadPerformanceData().then(()=>{if(S.detail===fixture)renderReportMomentum(m)}).catch(()=>{});
}
async function loadOdds(){
 if(S.board?.__oddsLoaded===S.id)return S.odds;
 const id=S.id,index=await get("odds/index.json",false);
 const x=Object.values(obj(index.entries)).filter(e=>e.publication_id===id).at(-1);
 if(!x){S.odds=[];return[]}
 const doc=await get(x.file);
 if(id!==S.id)return[];
 const byId=new Map(arr(S.run?.matches).map(m=>[m.fixture_id,m]));
 const rows=[];
 for(const f of arr(doc.fixtures)){
  const m=byId.get(f.fixture_id);
  if(!m||technical(m))continue;
  for(const role of ["FAVOURITE","SAFE","BALANCED","AGGRESSIVE"]){
   const q=f.quotes?.[role];
   if(!q)continue;
   const od=N(q.decimal_odds);
   rows.push({key:f.fixture_id+":"+role,fixtureId:f.fixture_id,match:m,role,odds:od,available:q.status==="AVAILABLE"&&od!==null&&od>1,market:q.market?.expression||m[role.toLowerCase()]||"",reason:q.reason,updated:q.provider_updated_at,bookmaker_count:q.bookmaker_count,source:x.file});
  }
 }
 S.odds=rows;if(S.board)S.board.__oddsLoaded=id;return rows;
}
async function loadBoard(){
 if(!S.run)return;
 feedback("board-status","BSD Quoten werden geladen …");
 try{
  const q=await loadOdds();
  const league=$("quote-league");const old=league.value;
  const options=[...new Set(q.map(x=>x.match.competition).filter(Boolean))];
  league.innerHTML='<option value="ALL">Alle Wettbewerbe</option>'+options.map(x=>'<option>'+safe(x)+'</option>').join("");
  if(options.includes(old))league.value=old;
  renderQuotes();renderSlip();
 }catch(e){feedback("board-status","BSD Records konnten nicht geladen werden: "+e.message,"error");$("quotes").innerHTML=""}
}
function filteredQuotes(){
 const role=$("quote-role").value,st=$("quote-status").value,l=$("quote-league").value,r=$("quote-risk").value,
 term=$("quote-market").value.toLowerCase(),minimum=Math.max(1,N($("quote-min").value)??1),maximum=Math.max(minimum,N($("quote-max").value)??100);
 return S.odds.filter(x=>{
  if(role!=="ALL"&&role!==x.role||st!=="ALL"&&st!==(x.available?"AVAILABLE":"NOT_AVAILABLE")||l!=="ALL"&&l!==x.match.competition)return false;
  if(term&&!market(x.market).toLowerCase().includes(term)&&!matchF(x.match).toLowerCase().includes(term))return false;
  const s=stability(x.match);
  if(r==="GREEN"&&s!=="GREEN"||r==="GREEN_YELLOW"&&!["GREEN","YELLOW"].includes(s))return false;
  return !x.available||x.odds>=minimum&&x.odds<=maximum;
 });
}
function renderQuotes(){
 const rows=filteredQuotes(),a=rows.filter(x=>x.available);
 const fav=S.odds.filter(x=>x.role==="FAVOURITE");
 const favAvail=fav.filter(x=>x.available).length;
 const uniqueMarkets=new Set(S.odds.filter(x=>x.available).map(x=>x.fixtureId+"|"+x.market)).size;
 const missing=new Map();
 for(const x of S.odds.filter(x=>!x.available))missing.set(x.reason,(missing.get(x.reason)||0)+1);
 const reasonText=[missing.get("PROVIDER_MARKET_NOT_COVERED")?missing.get("PROVIDER_MARKET_NOT_COVERED")+" Märkte nicht abgedeckt":null,missing.get("PROVIDER_LINE_NOT_OFFERED")?missing.get("PROVIDER_LINE_NOT_OFFERED")+" Torlinie nicht angeboten":null].filter(Boolean).join(" · ");
 feedback("board-status",S.id+" · "+rows.length+" Pfade im aktuellen Filter, "+a.length+" bepreist. Run gesamt: "+uniqueMarkets+" unterschiedliche Märkte mit BSD Quote, "+favAvail+" von "+fav.length+" Favourites bepreist. "+(reasonText?"Fehlend: "+reasonText+". ":"")+"Das sind Lücken des BSD Quotensnapshots, keine fehlenden Football Predictions.");
 $("quotes").innerHTML=rows.length?rows.map(x=>{
  const picked=S.selection.get(x.fixtureId)?.key===x.key;
  return '<article class="quote panel"><div><div class="pills">'+pill(x.role)+pill(stateName(stability(x.match)),stability(x.match)==="YELLOW"?"yellow":"")+'</div><h4>'+safe(matchF(x.match))+'</h4><p>'+market(x.market)+'</p><div class="small dim">'+(x.available?"BSD Snapshot: "+ztime(x.updated):"Ohne Quote: "+reasonName(x.reason))+'</div></div><div class="controls"><b>'+ (x.available?fmt(x.odds,3):"—")+'</b><button class="btn '+(picked?"secondary":"")+' small" data-pick="'+safe(x.key)+'"'+(x.available?"":" disabled")+' type="button">'+(picked?"Entfernen":x.available?"Hinzufügen":"Nicht verfügbar")+'</button></div></article>';
 }).join(""):'<div class="notice">Für diese Filter sind keine Marktpfade vorhanden.</div>';
 $("quotes").querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{const x=S.odds.find(y=>y.key===b.dataset.pick);if(!x||!x.available)return;if(S.selection.get(x.fixtureId)?.key===x.key)S.selection.delete(x.fixtureId);else S.selection.set(x.fixtureId,x);renderSlip();renderQuotes()});
}
function renderSlip(){
 const rows=[...S.selection.values()];
 const product=rows.reduce((n,x)=>n*x.odds,1),stake=Math.max(0,N($("stake").value)??0);
 $("slip-list").innerHTML=rows.length?rows.map(x=>'<div class="slip-row"><div><b>'+safe(matchF(x.match))+'</b><div class="muted">'+market(x.market)+' · '+fmt(x.odds,3)+'</div></div><button type="button" data-remove="'+safe(x.fixtureId)+'" aria-label="Entfernen">×</button></div>').join(""):'Keine Auswahl';
 $("slip-list").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{S.selection.delete(b.dataset.remove);renderSlip();renderQuotes()});
 $("slip-quote").textContent=rows.length?fmt(product,3):"–";
 $("slip-payout").textContent=CHF(rows.length?stake*product:0);
 $("slip-profit").textContent=CHF(rows.length?stake*(product-1):0);
}
function comboPick(pool,min,max,threshold){
 let best=null,steps=0;
 const recurse=(start,chosen,odds,cost)=>{
  if(chosen.length>=min&&odds>=threshold){
   const score=cost+Math.log(odds/threshold)*3+Math.max(0,chosen.length-min)*.5;
   if(!best||score<best.score)best={list:chosen.slice(),odds,score};
  }
  if(chosen.length>=max||steps++>250000)return;
  for(let i=start;i<pool.length;i++){
   chosen.push(pool[i]);
   recurse(i+1,chosen,odds*pool[i].odds,cost+comboRisk(pool[i]));
   chosen.pop();
   if(steps>250000)break;
  }
 };
 recurse(0,[],1,0);return best;
}
function comboRisk(x){
 const s=stability(x.match),p=S.stageMap.get(x.fixtureId)?.prediction;
 let cost=s==="GREEN"?0:s==="YELLOW"?20:85;
 if(p?.fragility?.favourite_affected)cost+=12;
 if(p?.anomaly?.favourite_affected)cost+=22;
 if(p?.player_context?.home?.status==="NOT_AVAILABLE"||p?.player_context?.away?.status==="NOT_AVAILABLE")cost+=3;
 cost+=arr(x.match.flags).length*4;
 return cost;
}
function combos(){
 const n=Math.min(3,Math.max(1,N($("combo-count").value)||2));
 const min=Math.min(5,Math.max(3,N($("combo-min").value)||3));
 const max=Math.min(5,Math.max(min,N($("combo-max").value)||5));
 const threshold=Math.max(1,N($("combo-odds").value)||3);
 let pool=S.odds.filter(x=>x.role==="FAVOURITE"&&x.available&&!technical(x.match));
 pool.sort((a,b)=>comboRisk(a)-comboRisk(b)||b.odds-a.odds);
 const possibilities=[],unique=new Map(pool.map(x=>[x.fixtureId,x]));
 pool=[...unique.values()];
 const originalCount=pool.length;
 for(let i=0;i<n;i++){
  if(pool.length<min)break;
  const c=comboPick(pool,min,max,threshold);
  if(!c)break;possibilities.push(c);
  const used=new Set(c.list.map(x=>x.fixtureId));pool=pool.filter(x=>!used.has(x.fixtureId));
 }
 if(!possibilities.length){
  const available=pool.length;
  const maxProduct=pool.slice().sort((a,b)=>b.odds-a.odds).slice(0,max).reduce((p,x)=>p*x.odds,1);
  $("combo-results").innerHTML='<div class="notice warn" style="grid-column:1/-1">Kein zulässiger Favourite Wettschein für diesen Run. '+available+' unterschiedliche Favourites verfügen über eine BSD Quote. '+(available>=min?"Die bestmögliche Quote mit bis zu "+max+" Spielen liegt bei "+fmt(maxProduct,3)+", die gewählte Mindestquote beträgt "+fmt(threshold,2)+".":"Für einen Wettschein sind mindestens "+min+" unterschiedliche Partien erforderlich.")+' Die Originalmärkte bleiben unverändert.</div>';
  return;
 }
 $("combo-results").innerHTML=possibilities.map((c,i)=>'<div class="combo-ticket inset"><div class="eyebrow">Vorschlag '+(i+1)+'</div><ol>'+c.list.map(x=>'<li><b>'+safe(matchF(x.match))+'</b><div>'+market(x.market)+' · '+fmt(x.odds,3)+'</div></li>').join("")+'</ol><b class="num" style="color:var(--green)">Gesamtquote '+fmt(c.odds,3)+'</b><button type="button" class="btn small" data-combo="'+i+'">In Wettschein übernehmen</button></div>').join("");
 $("combo-results").querySelectorAll("[data-combo]").forEach(b=>b.onclick=()=>{S.selection.clear();possibilities[+b.dataset.combo].list.forEach(x=>S.selection.set(x.fixtureId,x));renderSlip();renderQuotes();$("slip-list").scrollIntoView({block:"nearest",behavior:"smooth"})});
}
["quote-role","quote-status","quote-league","quote-market","quote-min","quote-max","quote-risk"].forEach(id=>$(id).addEventListener("input",renderQuotes));
$("quote-slider").oninput=e=>{$("quote-min").value=e.target.value;$("quote-slider-value").textContent=fmt(e.target.value);renderQuotes()};
$("quote-min").oninput=e=>{$("quote-slider").value=Math.min(10,Math.max(1,N(e.target.value)||1));$("quote-slider-value").textContent=fmt(N(e.target.value)||1);renderQuotes()};
$("stake").oninput=renderSlip;$("slip-clear").onclick=()=>{S.selection.clear();renderSlip();renderQuotes()};
$("combo-create").onclick=combos;
const auditRows=()=>arr(S.performance?.audits).flatMap((a,idx)=>arr(a.match_audit_records).map(r=>({...r,__audit_date:a.run_audit_record?.date_range?.from||a.audit_generated_at?.slice(0,10)||"",__audit_index:idx})));
function stat(rows,path="favourite"){
 const status=rows.map(r=>String(r.result_settlement?.[path+"_result"]||"").toUpperCase());
 return {hit:status.filter(x=>x==="HIT").length,miss:status.filter(x=>x==="MISS").length,push:status.filter(x=>x==="PUSH").length,ns:status.filter(x=>!["HIT","MISS","PUSH"].includes(x)).length};
}
const rate=x=>x.hit+x.miss?fmt(100*x.hit/(x.hit+x.miss),1)+" %":"—";
async function loadPerformanceData(){
 if(S.performance)return S.performance;
 const ptr=await get("performance/latest.json",false);
 S.performance=await get("performance/"+ptr.index_file);
 return S.performance;
}
async function loadPerformance(){
 if(!S.performance)feedback("performance-body","98 historische Ergebnis Audits werden geprüft …");
 try{await loadPerformanceData();renderPerformance()}catch(e){feedback("performance-body","Performance Index nicht verfügbar: "+e.message,"error")}
}
const box=(label,value,desc="")=>'<div class="stat-tile panel"><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong><span>'+safe(desc)+'</span></div>';
const tiles=s=>'<div class="stat-tiles">'+s.join("")+'</div>';
const table=(heads,rows)=>'<div class="table-wrap"><table class="compare"><thead><tr>'+heads.map(h=>'<th>'+safe(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
const tr=c=>'<tr>'+c.map(x=>'<td>'+x+'</td>').join("")+'</tr>';
const graph=(items,format=(x)=>x)=>'<div class="bars">'+items.map(([label,n,detail])=>'<div class="barrow"><span>'+safe(label)+'</span><div class="track"><div class="fill" style="width:'+Math.max(0,Math.min(100,n))+'%"></div></div><span class="num">'+safe(format(n))+(detail?" · "+safe(detail):"")+'</span></div>').join("")+'</div>';
const groupBy=(rows,fn)=>{const map=new Map();for(const x of rows){const key=fn(x)||"Nicht klassifiziert";if(!map.has(key))map.set(key,[]);map.get(key).push(x)}return [...map.entries()].sort((a,b)=>b[1].length-a[1].length)};
const metricGrouped=(rows,fn)=>table(["Gruppe","Spiele","Treffer","Fehler","Trefferquote"],groupBy(rows,fn).slice(0,45).map(([name,list])=>{const s=stat(list);return tr([safe(name),fmt(list.length,0),fmt(s.hit,0),fmt(s.miss,0),rate(s)])}));
function renderPerformance(){
 const rows=auditRows(),all=stat(rows),audits=arr(S.performance?.audits);
 let html="";
 const pathStats=["favourite","safe","balanced","aggressive"].map(path=>[path,stat(rows,path)]);
 if(S.perfTab==="cockpit")html='<div class="eyebrow">Auswertung aus veröffentlichten Settlements</div>'+tiles([box("Historische Audits",fmt(audits.length,0),"Veröffentlichter Performance Index"),box("Geprüfte Matches",fmt(rows.length,0),"Match Audit Records"),box("Favourite Trefferquote",rate(all),all.hit+" HIT / "+all.miss+" MISS"),box("Nicht klassifiziert",fmt(all.ns,0),"Ohne eindeutiges Settlement")])+
 metricGrouped(rows,r=>r.fixture?.competition||r.competition_metadata?.competition_name||"Wettbewerb nicht angegeben");
 else if(S.perfTab==="trends"){
  const d=groupBy(rows,r=>r.__audit_date).sort((a,b)=>a[0].localeCompare(b[0]));
  html='<h3>Favourite Trefferquote nach Audit Datum</h3>'+graph(d.slice(-25).map(([day,l])=>[day,stat(l).hit+stat(l).miss?100*stat(l).hit/(stat(l).hit+stat(l).miss):0,l.length]),v=>fmt(v,0)+" %")+
  table(["Datum","Spiele","HIT","MISS","Quote"],d.slice(-40).reverse().map(([day,l])=>{const s=stat(l);return tr([safe(day),fmt(l.length,0),fmt(s.hit,0),fmt(s.miss,0),rate(s)])}));
 }
 else if(S.perfTab==="markets")html='<h3>Auswertung nach Favourite Markt und Pfad</h3>'+tiles(pathStats.map(([k,s])=>box(k==="favourite"?"Favourite":k.toUpperCase(),rate(s),s.hit+" HIT / "+s.miss+" MISS")))+
 metricGrouped(rows,r=>r.committed_model?.favourite_prediction||r.committed_model?.favourite||"Nicht verfügbar");
 else if(S.perfTab==="leagues")html='<h3>Ergebnisse nach Wettbewerb</h3>'+metricGrouped(rows,r=>r.fixture?.competition||r.competition_metadata?.competition_name||"Nicht angegeben");
 else if(S.perfTab==="hitmiss")html='<h3>Entscheidungspfade: Treffer, Fehlschläge und PUSH</h3>'+table(["Pfad","HIT","MISS","PUSH","Offen","Trefferquote"],pathStats.map(([k,s])=>tr([safe(k.toUpperCase()),fmt(s.hit,0),fmt(s.miss,0),fmt(s.push,0),fmt(s.ns,0),rate(s)])))+
 metricGrouped(rows,r=>r.committed_model?.ampel||"Keine Ampel");
 else if(S.perfTab==="momentum"){
  const list=rows.filter(r=>r.fixture?.home&&r.fixture?.away);
  const teams=groupBy(list.flatMap(r=>[r.fixture.home,r.fixture.away].map(name=>({...r,__team:name}))),r=>r.__team);
  html='<h3>Team Momentum aus ECOBET Favourite Settlements</h3><p class="muted small">Dies misst ausschliesslich die historische Trefferbilanz der Modellprognosen, nicht die sportliche Form eines Vereins. Für die letzte Fünferfolge werden die jüngsten bis zu fünf eindeutigen Settlements verwendet.</p>'+
  table(["Mannschaft","Letzte 5","HIT","MISS","Quote"],teams.slice(0,150).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,l])=>{
    const uniq=l.slice().sort((a,b)=>b.__audit_date.localeCompare(a.__audit_date)).filter(x=>["HIT","MISS","PUSH"].includes(x.result_settlement?.favourite_result)).slice(0,5),s=stat(uniq);
    const symbols=uniq.map(x=>x.result_settlement.favourite_result==="HIT"?"●":x.result_settlement.favourite_result==="MISS"?"×":"–").join(" ");
    return tr([safe(name),safe(symbols||"—"),fmt(s.hit,0),fmt(s.miss,0),rate(s)]);
  }));
 }
 else if(S.perfTab==="topreads")html='<h3>Top Reads Performance</h3><p class="muted">Historische Top Reads Auswertungen, soweit eine eindeutige Ranking Zuordnung im Auditrecord vorliegt.</p>'+
 metricGrouped(rows.filter(r=>r.top_read_rank!=null||r.topread_rank!=null||r.top_read_tier!=null),r=>r.top_read_tier||r.top_read_rank||r.topread_rank);
 else if(S.perfTab==="nsp"){
 const no=rows.filter(x=>String(x.committed_model?.favourite_prediction||x.committed_model?.favourite||"").includes("NO_STABLE_PREDICTION")||arr(x.committed_model?.flags).some(f=>f==="NSP"));const missing=rows.filter(x=>!known(x.committed_model?.favourite_prediction)&&!known(x.committed_model?.favourite));
 html='<h3>NSP und bewusste Enthaltungen</h3>'+tiles([box("Klassifizierte NSP",fmt(no.length,0)),box("Ohne Favourite",fmt(missing.length,0)),box("Geprüfte Spiele",fmt(rows.length,0))])+metricGrouped(no,r=>r.fixture?.competition||r.competition_metadata?.competition_name||"Wettbewerb");
 }
 else if(S.perfTab==="scores"){
 html='<h3>Treffer der Scoreline Modelle</h3>'+tiles([
 box("Score Cluster Treffer",fmt(rows.filter(r=>r.score_cluster_audit?.cluster_hit===true).length,0)),
 box("Exakter Modalscore",fmt(rows.filter(r=>r.score_cluster_audit?.modal_score_hit===true).length,0)),
 box("Score Band Treffer",fmt(rows.filter(r=>r.score_cluster_audit?.score_band_hit===true).length,0)),
 box("Mit Scoreprüfung",fmt(rows.filter(r=>r.score_cluster_audit&&Object.keys(r.score_cluster_audit).length).length,0))
 ])+'<p class="muted">Nicht vorhandene Score Audits werden nicht als Fehlprognosen interpretiert.</p>';
 }
 $("performance-body").className="";
 $("performance-body").innerHTML=html||'<div class="notice">Für diese Unterkategorie liegen keine eindeutig klassifizierbaren Datensätze vor.</div>';
}
$("performance-nav").querySelectorAll("[data-perf]").forEach(b=>b.onclick=()=>{S.perfTab=b.dataset.perf;document.querySelectorAll("[data-perf]").forEach(x=>x.classList.toggle("active",x===b));if(S.performance)renderPerformance();else loadPerformance()});
function renderReportMomentum(m){
 const el=$("report-momentum");if(!el||!S.performance)return;
 const rows=auditRows().filter(r=>r.fixture?.home&&r.fixture?.away);
 const team=(name)=>{
  const recent=rows.filter(x=>x.fixture.home===name||x.fixture.away===name).filter(x=>["HIT","MISS","PUSH"].includes(x.result_settlement?.favourite_result)).sort((a,b)=>b.__audit_date.localeCompare(a.__audit_date)).slice(0,5);
  const s=stat(recent);
  return '<div class="inset" style="padding:14px"><b>'+safe(name)+'</b><p class="small">Letzte '+recent.length+' dokumentierte ECOBET Favourites: '+s.hit+' HIT, '+s.miss+' MISS, '+s.push+' PUSH. Trefferquote: '+rate(s)+'</p></div>';
 };
 el.className="opposite";el.innerHTML=team(m.home)+team(m.away);
}
async function loadAudit(){
 try{await loadPerformanceData();renderAuditDates()}catch(e){feedback("audit-body","Audit Index nicht verfügbar: "+e.message,"error")}
}
function auditDays(){
 return [...new Set(arr(S.performance?.audits).flatMap(a=>[a.run_audit_record?.date_range?.from,a.audit_generated_at?.slice(0,10)].filter(Boolean)))].sort().reverse();
}
function renderAuditDates(){
 const d=auditDays();
 $("audit-days").innerHTML=d.slice(0,25).map(x=>'<button type="button" data-day="'+safe(x)+'" class="'+(x===S.auditDate?"active":"")+'">'+safe(x)+'</button>').join("");
 $("audit-days").querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{S.auditDate=b.dataset.day;$("audit-date").value=b.dataset.day;showAudit()});
 if(!S.auditDate)S.auditDate=d[0]||today();
 $("audit-date").value=S.auditDate;
 showAudit();
}
function auditDateMatches(a,day){
 const from=a.run_audit_record?.date_range?.from,to=a.run_audit_record?.date_range?.to;
 return (from&&to?from<=day&&day<=to:from===day)||a.audit_generated_at?.slice(0,10)===day;
}
function showAudit(){
 const day=$("audit-date").value||S.auditDate;
 if(!day)return;
 S.auditDate=day;
 $("audit-days").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.day===day));
 const audits=arr(S.performance?.audits).filter(a=>auditDateMatches(a,day));
 const rows=audits.flatMap(a=>arr(a.match_audit_records));
 if(!audits.length){$("audit-body").className="notice warn";$("audit-body").textContent="Für "+day+" ist kein veröffentlichter Auditrecord im aktuellen Performance Index vorhanden.";return}
 const s=stat(rows);
 $("audit-body").className="";
 $("audit-body").innerHTML='<div class="kpi-line"><div><strong>'+fmt(audits.length,0)+'</strong><small>Audit Records</small></div><div><strong>'+fmt(rows.length,0)+'</strong><small>Matches</small></div><div><strong>'+fmt(s.hit,0)+'</strong><small>Favourite HIT</small></div><div><strong>'+fmt(s.miss,0)+'</strong><small>Favourite MISS</small></div></div>'+
 table(["Spiel","Favourite","SAFE","BALANCED","AGGRESSIVE"],rows.map(r=>{
  const result=obj(r.result_settlement);
  const marked=x=>x==="HIT"?'<span style="color:var(--green)">HIT</span>':x==="MISS"?'<span style="color:var(--rose)">MISS</span>':safe(x||"—");
  return tr([safe((r.fixture?.home||"Unbekannt")+" – "+(r.fixture?.away||"Unbekannt")),marked(result.favourite_result),marked(result.safe_result),marked(result.balanced_result),marked(result.aggressive_result)]);
 }))+'<div class="source" style="margin-top:15px"><details><summary>Technische Run Metadaten</summary><pre>'+safe(JSON.stringify(audits.map(a=>a.run_audit_record),null,2))+'</pre></details></div>';
}
$("audit-open").onclick=showAudit;
$("audit-date").onchange=()=>showAudit();
$("audit-calendar").onclick=()=>{const input=$("audit-date");if(typeof input.showPicker==="function"){try{input.showPicker()}catch{input.focus()}}else input.focus()};

/* V3 display-only enhancements: no mutation of source records. */
const oldOpenReport=openReport;
openReport=async function(id,quiet=false){
 await oldOpenReport(id,quiet);
 const root=$("report"),body=root.querySelector(".report-body"),article=root.querySelector(".report-article");
 if(!body||!article||root.querySelector(".report-tabs"))return;
 const m=arr(S.run?.matches).find(x=>x.fixture_id===id);if(!m)return;
 const p=S.stageMap.get(id)?.prediction||{},t=ECOBET_DE_20261103[matchF(m)];
 const q=S.odds.find(x=>x.fixtureId===id&&x.role==="FAVOURITE");
 const statX=(side,key)=>{const x=p.structural_strength?.[side]?.[key];return x?.status==="AVAILABLE"?fmt(x.value,1):"—"};
 const scores=arr(p.score_state_cluster?.score_scenarios).slice(0,5).map(x=>safe(x.score)).join(" · ")||"Nicht verfügbar";
 const card=(label,value,detail)=>'<article class="report-overview panel"><small>'+label+'</small><strong>'+value+'</strong><p>'+detail+'</p></article>';
 const overview=document.createElement("section");overview.id="uebersicht";overview.className="report-section active";
 overview.innerHTML='<div class="eyebrow">01 · Spielüberblick</div><h3>Spielübersicht</h3><div class="report-dashboard">'+
 card("ECOBET Favourite",market(m.favourite),"Originalentscheidung unverändert")+
 card("Stabilität",stateName(stability(m)),"Klassifizierung des veröffentlichten Runs")+
 card("BSD Quote",q?.available?fmt(q.odds,3):"Nicht verfügbar","Ohne Ersatz- oder Schätzquote")+
 card("Basis ClubElo",statX("home","base_elo")+" / "+statX("away","base_elo"),"Heim / Auswärts")+
 card("Adjustment Elo",statX("home","adjusted_elo")+" / "+statX("away","adjusted_elo"),"Heim / Auswärts")+
 card("Scoreline Szenarien",scores,"Plausible Spielresultate laut Stage12")+'</div>'+
 '<div class="report-explanation"><h4>Die Spielthese</h4><p>'+safe(t?.thesis||"Keine freigegebene deutsche Langtextfassung für diesen historischen Lauf. Die vorhandenen statistischen Daten sind weiterhin einsehbar.")+'</p></div>'+
 '<div class="report-teaser"><article class="inset"><span class="figurelabel">Team Intelligence</span><h4>Team Books und Einzeldaten</h4><p>Last Five, xG, xGA, ClubElo, Adjustment Elo und Aufstellungsinformationen.</p><button type="button" class="btn secondary small" data-go="teams">Teamdaten öffnen</button></article><article class="inset"><span class="figurelabel">Betting Intelligence</span><h4>Risiken und Entscheidungswege</h4><p>Alle vier Pfade mit Fragility und Quotenstatus.</p><button type="button" class="btn secondary small" data-go="betting">Betting Book öffnen</button></article></div>';
 article.prepend(overview);
 const sections=[["uebersicht","Übersicht"],["spielthese","Match Book"],["teams","Team Books"],["form","Last Five"],["momentum","ECOBET Momentum"],["welten","Spielwelten"],["aufstellungen","Aufstellungen"],["betting","Betting Book"],["quellen","Quellen"]];
 const nav=document.createElement("div");nav.className="report-tabs";nav.setAttribute("role","tablist");
 nav.innerHTML=sections.map(([k,v],i)=>'<button type="button" data-tab="'+k+'" aria-selected="'+(!i)+'" class="'+(!i?"active":"")+'">'+v+'</button>').join("");
 body.before(nav);
 const show=k=>{
  root.querySelectorAll(".report-section").forEach(x=>x.classList.toggle("active",x.id===k));
  nav.querySelectorAll("[data-tab]").forEach(x=>{const active=x.dataset.tab===k;x.classList.toggle("active",active);x.setAttribute("aria-selected",active?"true":"false")});
  nav.scrollIntoView({block:"nearest",behavior:"smooth"});
 };
 nav.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>show(b.dataset.tab));
 root.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
 // Eliminate the obsolete anchor based side menu; tabs stay within the new report.
 root.querySelectorAll(".report-menu a").forEach(a=>a.removeAttribute("href"));
};
const oldPerf=renderPerformance;
renderPerformance=function(){
 oldPerf();
 const root=$("performance-body");if(!root||!S.performance)return;
 root.querySelectorAll("td").forEach(td=>{
  const v=td.textContent.trim(),cls=v==="HIT"?"hit-chip":v==="MISS"?"miss-chip":v==="PUSH"?"push-chip":null;
  if(cls)td.innerHTML='<span class="'+cls+'">'+v+'</span>';
  if(/^[●×–](?: [●×–]){0,4}$/.test(v))td.innerHTML='<div class="dot-strip">'+v.split(/\s+/).map(sym=>'<span class="dot '+(sym==="●"?"hit":sym==="×"?"miss":"push")+'">'+(sym==="●"?"✓":sym==="×"?"✕":"–")+'</span>').join("")+'</div>';
 });
 if(!["cockpit","trends","markets","leagues","hitmiss","momentum"].includes(S.perfTab))return;
 const rows=auditRows(),r=stat(rows),total=r.hit+r.miss,pct=total?100*r.hit/total:0;
 const data=groupBy(rows,x=>x.__audit_date).sort((a,b)=>a[0].localeCompare(b[0])).slice(-16);
 const max=Math.max(1,...data.map(([,l])=>l.length));
 const bars=data.map(([day,list])=>{
  const a=stat(list),sum=a.hit+a.miss+a.push,h=Math.max(2,110*sum/max),pct=v=>sum?100*v/sum:0;
  return '<div class="bar-column" title="'+safe(day)+' · '+a.hit+' HIT, '+a.miss+' MISS"><div class="stack" style="height:'+h+'px"><i style="height:'+pct(a.push)+'%;background:#f6c869"></i><i style="height:'+pct(a.miss)+'%;background:#ff788b"></i><i style="height:'+pct(a.hit)+'%;background:#36e6ab"></i></div><small>'+safe(day.slice(5))+'</small></div>';
 }).join("");
 const hero='<div class="stat-tiles"><div class="stat-tile kpi-hit"><small>Favourite HIT</small><strong>'+r.hit+'</strong><span>Erfolgreiche Prognosen</span></div><div class="stat-tile kpi-miss"><small>Favourite MISS</small><strong>'+r.miss+'</strong><span>Fehler</span></div><div class="stat-tile kpi-blue"><small>Trefferquote</small><strong>'+rate(r)+'</strong><span>Nur HIT / MISS</span></div><div class="stat-tile kpi-amber"><small>Historische Audits</small><strong>'+arr(S.performance.audits).length+'</strong><span>Veröffentlichte Prüfungen</span></div></div>'+
 '<div class="performance-grid"><div class="panel analytics-panel"><h3>HIT / MISS Verlauf</h3><div class="bar-chart">'+bars+'</div><div class="legend"><span><i style="background:var(--green)"></i>HIT</span><span><i style="background:var(--rose)"></i>MISS</span><span><i style="background:var(--amber)"></i>PUSH</span></div></div>'+
 '<div class="panel analytics-panel"><h3>Favourite Trefferbilanz</h3><div class="visual-donut"><div class="donut" style="--percentage:'+pct+'%"><div><b>'+(total?fmt(pct,1)+"%":"—")+'</b><small>HIT Quote</small></div></div><div><div class="legend"><span><i style="background:var(--green)"></i>'+r.hit+' HIT</span><span><i style="background:var(--rose)"></i>'+r.miss+' MISS</span><span><i style="background:var(--amber)"></i>'+r.push+' PUSH</span></div><p class="small muted">PUSH ist weder HIT noch MISS.</p></div></div></div></div>';
 root.insertAdjacentHTML("afterbegin",hero);
};
const oldAudit=showAudit;
showAudit=function(){
 oldAudit();
 const root=$("audit-body");
 if(!root)return;
 root.querySelectorAll("td").forEach(td=>{
  const v=td.textContent.trim(),cls=v==="HIT"?"hit-chip":v==="MISS"?"miss-chip":v==="PUSH"?"push-chip":null;
  if(cls)td.innerHTML='<span class="'+cls+'">'+v+'</span>';
 });
 const kpi=root.querySelector(".kpi-line");if(!kpi||!S.performance)return;
 const matching=arr(S.performance.audits).filter(a=>auditDateMatches(a,S.auditDate||$("audit-date").value));
 const r=stat(matching.flatMap(a=>arr(a.match_audit_records))),n=r.hit+r.miss;
 kpi.insertAdjacentHTML("beforeend",'<div><strong class="audit-hit-rate">'+(n?fmt(100*r.hit/n,1)+" %":"—")+'</strong><small>Favourite Trefferquote</small></div><div><strong class="audit-miss-rate">'+(n?fmt(100*r.miss/n,1)+" %":"—")+'</strong><small>Favourite Fehlerquote</small></div>');
 kpi.querySelectorAll("strong").forEach((e,i)=>{if(i===2)e.style.color="var(--green)";if(i===3)e.style.color="var(--rose)"});
};


/* Restore all Performance filter controls and canonical data reconciliation. */
const ev3OldPerformance=renderPerformance;
renderPerformance=function(){
 if(!window.EV3||!S.performance){ev3OldPerformance();return}
 const rows=window.EV3.records(S.performance.audits);
 window.EV3.renderPerformance($("performance-body"),rows,S.perfTab,()=>renderPerformance());
};
const ev3OldMatch= openReport;
openReport=async function(id,quiet=false){
 await ev3OldMatch(id,quiet);
 const root=$("report");if(!root||S.detail!==id||!window.EV3)return;
 const m=arr(S.run?.matches).find(x=>x.fixture_id===id);if(!m)return;
 const heading=root.querySelector(".report-title h2");
 if(heading)heading.innerHTML='<span class="ev3-report-match">'+window.EV3.entity(m.home,"team","lg")+'<span class="ev3-vs">GEGEN</span>'+window.EV3.entity(m.away,"team","lg")+'</span>';
 const league=root.querySelector(".report-title .eyebrow");
 if(league)league.innerHTML=window.EV3.entity(m.competition||"Wettbewerb","competition","sm")+' <span class="small muted"> · '+safe(S.run?.run?.date||"")+'</span>';
 const section=root.querySelector("#teams .opposite");
 if(section){const sides=section.querySelectorAll(":scope > .inset h4");for(let i=0;i<sides.length;i++){sides[i].innerHTML=window.EV3.entity(i===0?m.home:m.away,"team","sm")}}
 const teamSection=root.querySelector("#teams");
 const source=S.stageMap.get(m.fixture_id)?.prediction?.structural_strength||{};
 const unavailable=[];
 for(const side of ["home","away"]){
   const team=side==="home"?m.home:m.away;
   const state=source[side]||{};
   const base=state.base_elo,adjusted=state.adjusted_elo;
   if(base?.status!=="AVAILABLE")unavailable.push("<b>"+safe(team)+" · ClubElo Basis:</b> Kein verifizierter Basiswert im eingefrorenen Stage12 Record ("+safe(base?.reason_code||"Quelle nicht geliefert")+").");
   if(adjusted?.status!=="AVAILABLE")unavailable.push("<b>"+safe(team)+" · Adjustment Elo:</b> Nicht verfügbar ("+safe(adjusted?.reason_code||"Adjustment Datensatz fehlt")+").");
 }
 if(teamSection&&unavailable.length){
   const element=document.createElement("div");element.className="notice warn";
   element.innerHTML="<strong>ClubElo Datenabdeckung</strong><p class='small'>"+unavailable.join("<br>")+"</p><p class='small'>ClubElo Basis und Adjustment Elo sind unterschiedliche Datensätze. Der fehlende Wert wird nicht erfunden oder mit einem anderen Stärkeindikator gleichgesetzt. Ein separater Quelldaten Korrekturlauf ist erforderlich.</p>";
   teamSection.appendChild(element);
 }
};
const ev3OldMomentum=renderReportMomentum;
renderReportMomentum=function(m){
 if(!window.EV3||!S.performance){ev3OldMomentum(m);return}
 const root=$("report-momentum");if(!root)return;
 const rows=window.EV3.records(S.performance.audits);
 const team=name=>{
  const subset=rows.filter(r=>[r.home,r.away].some(n=>window.EV3.key(n)===window.EV3.key(name)))
     .filter(r=>["HIT","MISS","PUSH"].includes(String(r.rs?.favourite_result||"").toUpperCase()))
     .sort((a,b)=>a.day.localeCompare(b.day));
  const last=subset.slice(-5),hits=last.filter(x=>x.rs.favourite_result==="HIT").length,miss=last.filter(x=>x.rs.favourite_result==="MISS").length;
  const cells=Array(Math.max(0,5-last.length)).fill('<span class="dot ev3-empty">·</span>').join("")+
   last.map(x=>'<span class="dot '+(x.rs.favourite_result==="HIT"?"hit":x.rs.favourite_result==="MISS"?"miss":"push")+'">'+(x.rs.favourite_result==="HIT"?"✓":x.rs.favourite_result==="MISS"?"✕":"–")+'</span>').join("");
  return '<div class="inset ev3-report-momentum"><h4>'+window.EV3.entity(name)+'</h4><div class="dot-strip">'+cells+'</div><p class="small">'+hits+' HIT / '+miss+' MISS · '+(hits+miss?fmt(100*hits/(hits+miss),1)+" %":"Keine entschiedenen Wetten")+'</p><p class="small muted">'+last.length+' der letzten fünf möglichen ECOBET Favourite Settlements nachgewiesen.</p></div>';
 };
 root.className="opposite";
 root.innerHTML=team(m.home)+team(m.away);
};
const ev3OldBootstrap=bootstrap;
bootstrap=async function(){
 await window.EV3.loadLogos().catch(e=>console.warn("Logo Manifest aktuell nicht geladen",e));
 return ev3OldBootstrap();
};


/* Audit V3 repair: fixture date in Europe/Zurich, canonical match deduplication, verified latest settlements. */
function auditRowsCorrected(){
 if(!window.EV3||!S.performance)return[];
 return window.EV3.records(S.performance.audits);
}
auditDays=function(){
 return [...new Set(auditRowsCorrected().map(r=>r.day).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort().reverse();
};
showAudit=function(){
 const day=$("audit-date").value||S.auditDate;
 if(!day||!S.performance)return;
 S.auditDate=day;
 $("audit-days").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.day===day));
 const rows=auditRowsCorrected().filter(r=>r.day===day);
 const target=$("audit-body");
 if(!rows.length){
  target.className="notice warn";
  target.textContent="Für den "+day+" sind im veröffentlichten Performance Index keine Spiele mit diesem tatsächlichen Anpfiffdatum (Europe/Zurich) vorhanden.";
  return;
 }
 const statFor=path=>{
  const v=rows.map(r=>String(r.rs?.[path+"_result"]||"").toUpperCase());
  const hit=v.filter(x=>x==="HIT").length,miss=v.filter(x=>x==="MISS").length,push=v.filter(x=>x==="PUSH").length;
  return {hit,miss,push,open:rows.length-hit-miss-push};
 };
 const x=statFor("favourite"),decided=x.hit+x.miss,percent=decided?fmt(x.hit/decided*100,1)+" %":"—",missRate=decided?fmt(x.miss/decided*100,1)+" %":"—";
 const renderStatus=value=>{
  const v=String(value||"").toUpperCase();
  const cls=v==="HIT"?"hit-chip":v==="MISS"?"miss-chip":v==="PUSH"?"push-chip":"unsettled-chip";
  const label=({HIT:"HIT",MISS:"MISS",PUSH:"PUSH",PENDING:"Offen",NOT_APPLICABLE:"Nicht anwendbar",UNMAPPABLE:"Nicht zuordenbar"})[v]||v||"—";
  return '<span class="'+cls+'">'+safe(label)+'</span>';
 };
 const rowsSorted=rows.slice().sort((a,b)=>a.kickoff-b.kickoff||a.home.localeCompare(b.home,"de"));
 const sources=[...new Set(rowsSorted.map(r=>r.auditDate))].filter(Boolean);
 target.className="";
 target.innerHTML='<div class="notice">Spieldatum: <b>'+safe(day)+'</b> (Schweiz). Die Prüfung verwendet das tatsächliche Anpfiffdatum, nicht das Erstellungsdatum des Audit. Mehrere Prüfstände einer Partie werden zu einem Fixture zusammengeführt. Quelle: veröffentlichter Performance Index.</div>'+
 '<div class="kpi-line ev3-audit-summary">'+
 '<div><strong>'+rows.length+'</strong><small>Partien</small></div>'+
 '<div><strong>'+x.hit+'</strong><small>Favourite HIT</small></div>'+
 '<div><strong>'+x.miss+'</strong><small>Favourite MISS</small></div>'+
 '<div><strong>'+x.open+'</strong><small>Offen / nicht anwendbar</small></div>'+
 '<div><strong class="audit-hit-rate">'+percent+'</strong><small>Trefferquote</small></div>'+
 '<div><strong class="audit-miss-rate">'+missRate+'</strong><small>Fehlerquote</small></div></div>'+
 '<div class="table-wrap"><table class="compare ev3-perf-table"><thead><tr><th>Spiel</th><th>Favourite</th><th>SAFE</th><th>BALANCED</th><th>AGGRESSIVE</th></tr></thead><tbody>'+
 rowsSorted.map(r=>'<tr><td>'+(window.EV3?window.EV3.entity(r.home):safe(r.home))+' – '+(window.EV3?window.EV3.entity(r.away):safe(r.away))+'<div class="small dim">'+safe(r.competition)+' · '+safe(r.day)+'</div></td>'+
 ["favourite","safe","balanced","aggressive"].map(p=>'<td>'+renderStatus(r.rs?.[p+"_result"])+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>'+
 '<p class="small dim">Quellenprüfung(en): '+safe(sources.join(", ")||"Nicht angegeben")+'. HIT-Quote = HIT / (HIT + MISS). Offene Ergebnisse werden nicht als MISS gewertet.</p>';
};

bootstrap();
})();
