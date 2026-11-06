/* ECOBET V4.4 shared calendar, historical settlements and performance drill-down. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=x=>window.EV3?.key?.(x)||String(x||"").toLowerCase().trim();
const arr=x=>Array.isArray(x)?x:[];
const statuses=new Set(["HIT","MISS","PUSH"]);
let initialized=false;

function init({S,get,fillIds,loadRun,navigate}){
 if(initialized)return;
 initialized=true;
 const picker=$("global-run-date"),msg=$("global-date-status");
 if(picker){
  picker.onchange=()=>{
   const day=picker.value,days=S.index?.dates||{};
   if(!days[day]){
    msg.textContent="Für dieses Datum ist kein veröffentlichter Run vorhanden.";
    return;
   }
   msg.textContent="Run vom "+day;
   const runDay=$("run-day");runDay.value=day;
   fillIds();
   loadRun();
   const audit=$("audit-date");if(audit){audit.value=day;S.auditDate=day;}
  };
 }
 for(const node of document.querySelectorAll(".navlogo,.brandline")){
  node.setAttribute("role","button");node.setAttribute("tabindex","0");
  node.setAttribute("aria-label","Zurück zu den Spielanalysen");
  const go=()=>{navigate("analysen");$("report").hidden=true;$("analysis-home").hidden=false;S.detail=null};
  node.addEventListener("click",go);
  node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();go()}});
 }
 attachNativePickers();
}
function calendarSync(S){
 const picker=$("global-run-date");if(!picker||!S.index)return;
 const dates=Object.keys(S.index.dates||{}).sort();
 if(dates.length){picker.min=dates[0];picker.max=dates.at(-1);}
 picker.value=$("run-day")?.value||dates.at(-1)||"";
 const label=$("global-date-status");if(label)label.textContent=picker.value?"Run Datum: "+picker.value:"Kein Lauf ausgewählt";
}
function attachNativePickers(){
 document.querySelectorAll('input[type="date"]').forEach(input=>{
  if(input.dataset.nativeCalendarAttached)return;
  input.dataset.nativeCalendarAttached="true";
  if(input.id==="global-run-date")return;
  const button=document.createElement("button");button.type="button";button.className="v44-calendar-open";
  button.title="Kalender öffnen";button.setAttribute("aria-label","Kalender öffnen");
  button.innerHTML="&#128197;";
  button.onclick=()=>{try{input.showPicker?.()}catch(e){input.focus()}};
  input.insertAdjacentElement("afterend",button);
 });
}

async function hydrateAudit(S,get){
 const runId=S.id;if(!runId||!S.run||!S.odds.length)return;
 S.auditLoadedRun=runId;
 for(const q of S.odds){delete q.auditResult;delete q.matchScore;delete q.auditSource;}
 try{
  const idx=await get("audits/index.json",false);
  const matches=Object.values(idx?.dates||{}).flatMap(arr).filter(x=>x.id===runId);
  matches.sort((a,b)=>String(b.generated_at||"").localeCompare(String(a.generated_at||"")));
  if(!matches.length){S.auditNote="Kein Resultataudit für diesen Run veröffentlicht.";return}
  const pointer=matches[0];
  if(!/^ECOBET_[a-zA-Z0-9_.-]+\.json$/.test(pointer.file||""))throw Error("Auditdateiname nicht verifiziert");
  const doc=await get("audits/"+pointer.file,false);
  if(S.id!==runId)return;
  if(doc?.run_audit_record?.run_id!==runId)throw Error("Resultataudit gehört zu einem anderen Run");
  const byId=new Map(arr(doc.match_audit_records).map(x=>[x.fixture_id,x]).filter(([id])=>!!id));
  let covered=0;
  for(const quote of S.odds){
   const record=byId.get(quote.fixtureId);if(!record)continue;
   const role=quote.role.toLowerCase();
   const model=record.committed_model||{};
   const committed=role==="favourite"?(model.favourite_prediction||model.favourite):model.paths?.[role]?.expression||model[role];
   // No inferred HIT/MISS: a settlement only belongs to an exactly matching original market.
   if(String(committed||"").trim().toLowerCase()!==String(quote.market||"").trim().toLowerCase())continue;
   const assessment=String(record.result_settlement?.[role+"_result"]||"").toUpperCase();
   if(statuses.has(assessment)){quote.auditResult=assessment;covered++}
   const rs=record.result_settlement||{};
   const end=rs.score_90_detail||rs.evidence?.final_90;
   if(end&&Number.isInteger(end.home)&&Number.isInteger(end.away)&&end.home>=0&&end.away>=0)
    quote.matchScore=end.home+":"+end.away;
   quote.auditSource="audits/"+pointer.file;
  }
  S.auditNote=covered+" von "+S.odds.length+" Marktrollen mit verifiziertem Auditresultat";
 }catch(error){
  if(S.id===runId)S.auditNote="Historische Resultate nicht ladbar: "+error.message;
 }
}
function outcome(q){
 const status=q?.auditResult;
 const label=status==="HIT"?"HIT":status==="MISS"?"MISS":status==="PUSH"?"PUSH":"Offen";
 return '<span class="v44-outcome v44-'+(status||"OPEN").toLowerCase()+'">'+label+'</span>';
}
function matchScore(q){
 if(!q?.matchScore)return "";
 return '<span class="v44-final">Endstand '+esc(q.matchScore)+'</span>';
}
function slipSimulation(S,stake){
 const root=$("slip-simulation"),rows=[...S.selection.values()];
 if(!root)return;
 if(!rows.length){root.innerHTML="";return}
 const loss=rows.some(x=>x.auditResult==="MISS"),unknown=rows.some(x=>!statuses.has(x.auditResult));
 const settled=!unknown, effective=rows.reduce((x,q)=>x*(q.auditResult==="MISS"?0:q.auditResult==="PUSH"?1:q.odds),1);
 const payout=loss?0:stake*effective;
 const format=n=>"CHF "+Number(n).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
 const status=loss?"Mindestens ein Tipp verpasst":unknown?"Noch nicht vollständig abgerechnet":"Alle Tipps abgerechnet";
 const message=loss||settled?'<strong>Historische Auszahlung: '+format(payout)+'</strong><span>Nettogewinn: '+format(payout-stake)+'</span>':'<span>Historische Auszahlung noch nicht bestimmbar.</span>';
 root.innerHTML='<div class="v44-slip-status"><b>Historische Wettschein Simulation</b><small>'+esc(status)+'</small>'+message+
 '<small>PUSH zählt mit Quote 1, MISS mit 0. Dies ist eine rückwirkende Simulation mit archivierten Quoten, keine tatsächliche Wette.</small></div>';
}
function performanceDrill(S){
 if(S.perfTab!=="leagues"||!S.performance)return;
 const root=$("performance-body");
 const table=root?.querySelector(".ev3-perf-table");
 if(!table)return;
 const e=window.EV3,settings=e?.settings;
 if(!e||!settings)return;
 const all=e.records(S.performance.audits);
 const comps=[...new Set(all.map(x=>x.competition))].filter(Boolean);
 const visible=all.filter(x=>(settings.league==="ALL"||x.competition===settings.league)&&
 (settings.team==="ALL"||[x.home,x.away].some(n=>norm(n)===settings.team))&&
 (!settings.from||x.day>=settings.from)&&(!settings.to||x.day<=settings.to));
 for(const tr of table.querySelectorAll("tbody tr")){
  const first=tr.cells?.[0],miss=tr.cells?.[3];
  if(!first||!miss)continue;
  const league=comps.find(n=>norm(first.textContent)===norm(n))||comps.find(n=>first.textContent.includes(n));
  const n=Number(miss.textContent.trim());
  if(!league||!Number.isFinite(n)||n<1)continue;
  const expected=visible.filter(x=>x.competition===league&&String(x.rs?.[settings.path+"_result"]||"").toUpperCase()==="MISS").length;
  if(expected!==n)continue;
  miss.innerHTML='<button class="v44-drill" type="button" aria-label="'+esc(n+' verpasste Tipps in '+league+' anzeigen')+'">'+n+' MISS <span>↗</span></button>';
  miss.querySelector("button").onclick=()=>{
   settings.league=league;
   settings.status="MISS";
   S.perfTab="hitmiss";
   document.querySelector('[data-perf="hitmiss"]')?.click();
  };
 }
}
window.EV44={init,calendarSync,attachNativePickers,hydrateAudit,outcome,matchScore,slipSimulation,performanceDrill};
})();
