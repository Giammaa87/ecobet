/* ECOBET V4 DEV · read-only companion for existing V3. Original predictions untouched. */
(()=>{"use strict";
const $=id=>document.getElementById(id), esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=x=>Array.isArray(x)?x:[], st={id:null,run:null,stability:null,reads:null,failed:{},expanded:false,league:"ALL",team:"ALL",tier:"ALL",detail:null};
const labels={HOCH:"Hoch",MITTEL:"Mittel",NIEDRIG:"Niedrig",STRONG:"Stark",MEDIUM:"Mittel",WEAK:"Schwach",NEU:"Neu",STAERKER_ABGEDECKT:"Bereits stärker abgedeckt",ABGEDECKT:"Bereits abgedeckt",KOMBINATION:"Kombination",NO_READ:"Keine neue Lesart",READ:"Read",SELECTED:"Ausgewählt",TIE:"Gleichstand",NO_SOURCE:"Keine Quelle"};
const label=x=>labels[String(x)]||String(x??"—");
const after=x=>x==="AFTER_KICKOFF";
const locale=x=>{const d=new Date(x);return isNaN(+d)?"Zeit unbekannt":new Intl.DateTimeFormat("de-CH",{timeZone:"Europe/Zurich",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)};
const logo=(v,k="team")=>window.EV3?.entity(v,k,"sm")||esc(v);
const norm=v=>window.EV3?.key(v)||String(v||"").toLowerCase();
const market=x=>esc(String(x??"Nicht verfügbar").replace(/^Both Teams To Score: Yes$/i,"Beide Teams treffen: Ja").replace(/^Both Teams To Score: No$/i,"Beide Teams treffen: Nein").replace(/^Match Total (Over|Under) ([\d.]+)$/i,(_,d,n)=>(d==="Over"?"Über ":"Unter ")+n+" Tore insgesamt").replace(/^(.+) Team Goals (Over|Under) ([\d.]+)$/i,(_,t,d,n)=>t+(d==="Over"?" über ":" unter ")+n+" Teamtore").replace(/^(.+) Team Goals (\d+)[–-](\d+)$/i,(_,t,l,h)=>t+" "+l+" bis "+h+" Tore").replace(/^(.+) Draw No Bet$/i,"$1 ohne Remis").replace(/^(.+) to win$/i,"Sieg $1"));
const exploratory=d=>d?.data_status==="EXPLORATORY_DEVELOPMENT"?'<span class="v4-status">Explorative Entwicklungsdaten</span>':"";
const caution='<p class="v4-warning">Nach Anpfiff berechnet. Dies ist keine echte Pre Match Empfehlung.</p>';
const rows=()=>arr(st.stability?.ranked).slice().sort((x,y)=>Number(x.rank)-Number(y.rank));
const read=id=>arr(st.reads?.fixtures).find(x=>x.fixture_id===id);
const rank=id=>arr(st.stability?.ranked).find(x=>x.fixture_id===id);
const matched=id=>arr(st.run?.matches).some(x=>x.fixture_id===id);
async function loadExtra(type,id){
 const index=await fetch(type+"/index.json",{cache:"no-store"});if(!index.ok)throw Error("Index HTTP "+index.status);
 const p=(await index.json())?.entries?.[id];if(!p)return null;
 if(!(new RegExp("^"+type+"/[\\w.-]+\\.json$")).test(String(p.file)))throw Error("Ungültiger Dateipfad");
 const resp=await fetch(p.file,{cache:"force-cache"});if(!resp.ok)throw Error("Datei HTTP "+resp.status);
 const doc=await resp.json();
 if(doc.publication_id!==id ||(type==="stability"?!Array.isArray(doc.ranked)||doc.schema!=="ECOBET_FAVOURITE_STABILITY_V1":!Array.isArray(doc.fixtures)||doc.schema!=="ECOBET_READS_PUBLIC_V1"))throw Error("Ungültiges Schema oder Run Zuordnung");
 return doc;
}
async function selectRun(){
 const id=$("run-choice")?.value;if(!id || id===st.id)return;
 st.id=id;st.run=null;st.stability=null;st.reads=null;st.failed={};st.expanded=false;st.league="ALL";st.team="ALL";st.tier="ALL";st.detail=null;
 renderRanking();
 try{
  const r=await fetch("runs/"+encodeURIComponent(id)+".json",{cache:"force-cache"});if(!r.ok)throw Error("Run HTTP "+r.status);
  const run=await r.json();if(st.id!==id)return;st.run=run;renderRanking();
 }catch(err){if(st.id===id){st.failed.run=err.message;renderRanking();}return}
 await Promise.all(["stability","reads"].map(async t=>{
  try{const d=await loadExtra(t,id);if(st.id!==id)return;st[t]=d}
  catch(err){if(st.id!==id)return;st.failed[t]=err.message}
  if(st.id===id){renderRanking();decorateCards();decorateReport();window.EV41?.refresh?.()}
 }));
}
function topMatch(id){
 if(!matched(id))return;
 $("run-league").value="";$("run-league").dispatchEvent(new Event("change",{bubbles:true}));
 document.querySelector('[data-page="analysen"]')?.click();
 const button=[...document.querySelectorAll("#match-list [data-match]")].find(b=>b.dataset.match===id);
 button?.click();
}
function optionList(items,val,all){return '<option value="ALL">'+esc(all)+'</option>'+items.map(([x,y])=>'<option value="'+esc(x)+'" '+(x===val?"selected":"")+'>'+esc(y)+'</option>').join("")}
function filterUI(){
 const x=rows(),league=[...new Set(x.map(r=>r.competition))].sort().map(s=>[s,s]),teams=new Map();
 x.forEach(r=>[r.home,r.away].forEach(t=>{if(t)teams.set(norm(t),t)}));
 return '<div class="v4-filter"><label>Wettbewerb<select data-v4-filter="league">'+optionList(league,st.league,"Alle Wettbewerbe")+'</select></label><label>Mannschaft<select data-v4-filter="team">'+optionList([...teams].sort((a,b)=>a[1].localeCompare(b[1],"de")),st.team,"Alle Teams")+'</select></label><label>Stabilität<select data-v4-filter="tier">'+optionList([["HOCH","Hoch"],["MITTEL","Mittel"],["NIEDRIG","Niedrig"]],st.tier,"Alle Stufen")+'</select></label></div>';
}
function rankRow(r){
 const time=st.stability?.fixture_timing?.[r.fixture_id];
 return '<article class="v4-rank-row"><div class="v4-rank-head"><b class="v4-num">#'+esc(r.rank)+'</b><span class="v4-tier v4-'+esc(String(r.stability?.tier).toLowerCase())+'">'+esc(label(r.stability?.tier))+'</span><small>Score '+esc(r.stability?.score)+' · '+esc(r.coverage?.four?.text||"—")+' Szenarien</small></div>'+
 '<div class="v4-competition">'+logo(r.competition,"competition")+'<small>'+esc(locale(r.kickoff_utc))+'</small></div>'+
 '<div class="v4-teams">'+logo(r.home)+'<span>gegen</span>'+logo(r.away)+'</div>'+
 '<div class="v4-market"><b>'+market(r.favourite)+'</b><small>FAVOURITE Quelle: '+esc(r.favourite_source||"—")+'</small></div>'+
 '<p class="v4-reason">'+esc(r.reason||"Keine Begründung")+'</p>'+
 (after(time)?'<small class="v4-late">Nach Anpfiff berechnet</small>':"")+
 '<button class="btn secondary small v4-open" data-v4-match="'+esc(r.fixture_id)+'" type="button" '+(matched(r.fixture_id)?"":"disabled")+'>'+(matched(r.fixture_id)?"Matchanalyse öffnen":"Spiel nicht zuordenbar")+'</button></article>';
}
function renderRanking(){
 if(window.EV41?.ranking)return window.EV41.ranking({root:$("v4-ranking"),st,onOpen:topMatch});
 const root=$("v4-ranking");if(!root)return;
 if(!st.id){root.innerHTML='<div class="notice">Lade Run Auswahl …</div>';return}
 if(!st.stability){root.innerHTML='<div class="notice">'+(st.failed.stability?"Ranking nicht ladbar: "+esc(st.failed.stability):"Für diesen Run noch keine Stabilitätsrangliste verfügbar.")+'</div>';return}
 const all=rows(),shown=(st.expanded?all.filter(r=>(st.league==="ALL"||r.competition===st.league)&&(st.team==="ALL"||norm(r.home)===st.team||norm(r.away)===st.team)&&(st.tier==="ALL"||r.stability?.tier===st.tier)):all.slice(0,5));
 const late=all.filter(r=>after(st.stability?.fixture_timing?.[r.fixture_id])).length;
 root.innerHTML='<div class="v4-ranking-heading"><div><div class="eyebrow">Modellinternes Ranking · '+esc(st.id)+'</div><h3>FAVOURITE Stabilitätsrangliste</h3><p>Keine statistisch validierte Trefferwahrscheinlichkeit. Der Score ist ein Vergleichswert und keine Prozentangabe.</p></div>'+exploratory(st.stability)+'</div>'+
 (st.stability.data_status_note?'<p class="small muted">'+esc(st.stability.data_status_note)+'</p>':"")+
 (late?'<p class="v4-warning">'+late+' von '+all.length+' Spielen wurden nach Anpfiff analysiert und dürfen nicht als historische Pre Match Tipps gelten.</p>':"")+
 '<div class="v4-controls"><b>'+all.length+' Platzierungen · '+(st.expanded?"Vollständige Liste":"Top 5")+'</b><button id="v4-expand" class="btn secondary small" type="button">'+(st.expanded?"Auf die ersten fünf reduzieren":"Alle Spiele anzeigen")+'</button></div>'+
 (st.expanded?filterUI():"")+
 '<div class="v4-rank-list">'+(shown.length?shown.map(rankRow).join(""):'<p>Keine Spiele für die gewählten Filter.</p>')+'</div>'+
 '<p class="small muted">Die ursprüngliche Rangfolge bleibt bei allen Filtern erhalten. Die bisherigen historischen Top Reads bleiben im Performance Bereich verfügbar.</p>';
 $("v4-expand").onclick=()=>{st.expanded=!st.expanded;st.league="ALL";st.team="ALL";st.tier="ALL";renderRanking()};
 root.querySelectorAll("[data-v4-filter]").forEach(x=>x.onchange=()=>{st[x.dataset.v4Filter]=x.value;renderRanking()});
 root.querySelectorAll("[data-v4-match]").forEach(x=>x.onclick=()=>topMatch(x.dataset.v4Match));
}
function decorateCards(){
 if(!st.run)return;
 document.querySelectorAll("#match-list article.ev3-match").forEach(c=>{
  const id=c.querySelector("[data-match]")?.dataset.match,foot=c.querySelector(".foot");
  if(!id||!foot||c.querySelector(".v4-card-info"))return;
  const r=rank(id),d=read(id);if(!r&&!d)return;
  const info=document.createElement("div");info.className="v4-card-info";
  const pill=s=>'<span class="v4-chip">'+esc(s)+'</span>';
  info.innerHTML=(r?pill("Rang #"+r.rank+" · "+label(r.stability?.tier)):"")+
  (d?.direction?.status==="READ"?pill("Richtung: "+(d.direction.read)):"")+
  (d?.goal_range?.status==="READ"?pill("Torbereich: "+d.goal_range.read):"")+
  (d?.owner_favourite?.selected?pill("Zusatz Favourite: "+d.owner_favourite.selected.read):"")+
  (after(d?.timing?.status)||after(st.stability?.fixture_timing?.[id])?pill("Nach Anpfiff"):"");
  foot.before(info);
 });
}
function readCard(title,read,status,coverage,evidence,desc){
 return '<article class="v4-read-card"><small>'+esc(title)+'</small><strong>'+esc(read||"Keine Lesart")+'</strong><div class="v4-tags"><span>'+esc(label(status))+'</span>'+(coverage?'<span>'+esc(label(coverage))+'</span>':"")+(evidence?'<span>Evidenz '+esc(label(evidence))+'</span>':"")+'</div>'+(desc?'<p>'+esc(desc)+'</p>':"")+'</article>';
}
function contentFor(id){
 const d=read(id),r=rank(id);
 if(!d&&!r)return '<div class="notice">Für dieses Spiel noch keine Zusatzanalyse verfügbar.</div>';
 const dir=d?.direction,goal=d?.goal_range,owner=d?.owner_favourite;
 const body=d?'<div class="v4-reads">'+
 readCard("Direction Read",dir?.status==="READ"?dir.read:"Keine Richtungslesart",dir?.status,dir?.coverage_status,dir?.evidence,dir?.covered_by?"Bereits von "+arr(dir.covered_by.roles).join(", ")+" abgedeckt: "+dir.covered_by.expression:"")+
 readCard("Goal Range Read",goal?.status==="READ"?goal.read:"Kein Torbereich",goal?.status,goal?.coverage_status,goal?.evidence,goal?.covered_by?"Abgedeckt durch "+arr(goal.covered_by.roles).join(", ")+": "+goal.covered_by.expression:"")+
 readCard("Owner Favourite (zusätzlich)",owner?.selected?.read||"Kein zusätzlicher Owner Favourite",owner?.status,null,owner?.selected?.evidence,(owner?.selected?.source?"Herkunft: "+(owner.selected.source==="DIRECTION"?"Direction Read":"Goal Range Read")+". ":"")+(owner?.reason||""))+
 '</div>':"";
 return exploratory(st.reads||st.stability)+(after(d?.timing?.status)||after(st.stability?.fixture_timing?.[id])?caution:"")+
 '<p class="small muted">Zusatzlesarten sind keine Änderung der originalen FAVOURITE, SAFE, BALANCED und AGGRESSIVE Predictions.</p>'+
 body+(r?'<div class="v4-context">Stabilität: Rang <b>#'+esc(r.rank)+'</b> · '+esc(label(r.stability?.tier))+' · Score '+esc(r.stability?.score)+' · '+esc(r.coverage?.four?.text||"—")+' Szenarien</div>':"")+
 '<p class="small muted">Evidenz und Stabilitätsscore sind keine statistisch validierten Trefferwahrscheinlichkeiten.</p>';
}
function decorateReport(){
 const root=$("report"),nav=root?.querySelector(".report-tabs"),article=root?.querySelector(".report-article"),id=st.detail;
 if(!id||!nav||!article||!st.run||!matched(id))return;
 window.EV41?.overview?.({root,st,id});
 const signature=st.id+"|"+id+"|"+!!st.reads+"|"+!!st.stability;
 let section=root.querySelector("#v4-reads-section");
 if(section?.dataset.signature===signature)return;
 if(!section){section=document.createElement("section");section.id="v4-reads-section";section.className="report-section";const bet=root.querySelector("#betting");bet?bet.before(section):article.append(section)}
 section.dataset.signature=signature;
 section.innerHTML='<div class="eyebrow">ECOBET Zusatzlesarten</div><h3>Direction, Goal Range und Owner Favourite</h3>'+contentFor(id);
 if(!nav.querySelector('[data-tab="v4-reads-section"]')){
  const button=document.createElement("button");button.dataset.tab="v4-reads-section";button.type="button";button.textContent="Zusatzreads";button.setAttribute("aria-selected","false");
  button.onclick=()=>{root.querySelectorAll(".report-section").forEach(x=>x.classList.toggle("active",x.id==="v4-reads-section"));nav.querySelectorAll("[data-tab]").forEach(x=>{const yes=x===button;x.classList.toggle("active",yes);x.setAttribute("aria-selected",yes?"true":"false")})};
  const b=nav.querySelector('[data-tab="betting"]');b?b.before(button):nav.append(button);
 }
}
function start(){
 $("v4-historic").onclick=()=>{document.querySelector('[data-page="performance"]')?.click();document.querySelector('[data-perf="topreads"]')?.click()};
 document.addEventListener("click",evt=>{const btn=evt.target.closest?.("[data-match]");if(btn)st.detail=btn.dataset.match;if(evt.target.closest?.("#back-matches"))st.detail=null},true);
 $("run-choice")?.addEventListener("change",()=>{queueMicrotask(selectRun)});
 $("run-day")?.addEventListener("change",()=>{queueMicrotask(()=>{st.id=null;selectRun()})});
 new MutationObserver(()=>{if($("run-choice")?.value && $("match-list")?.querySelector("article.ev3-match"))selectRun();decorateCards()}).observe($("match-list"),{childList:true,subtree:false});
 new MutationObserver(()=>decorateReport()).observe($("report"),{childList:true,subtree:true});
 new MutationObserver(()=>{if(!st.id && $("run-choice")?.value && $("match-list")?.children.length)selectRun()}).observe($("run-choice"),{childList:true});
 renderRanking();if($("run-choice")?.value && $("match-list")?.children.length)selectRun();
}
start();
})();