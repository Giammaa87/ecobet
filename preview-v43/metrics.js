/* ECOBET V4.3: Historical Top Reads performance, based on PRE-KICKOFF ranking snapshots. */
(()=>{"use strict";
 const a=x=>Array.isArray(x)?x:[];
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const key=x=>window.EV3?.key?.(x)||String(x||"").toLowerCase();
 const groups=[{lo:1,hi:5},{lo:6,hi:10},{lo:11,hi:15},{lo:16,hi:20},{lo:21,hi:25},{lo:26,hi:30}];
 const cache=new Map();let seq=0;
 const pct=(hit,miss)=>hit+miss?(100*hit/(hit+miss)).toLocaleString("de-CH",{minimumFractionDigits:1,maximumFractionDigits:1})+" %":"—";
 async function indexes(get){
  if(cache.has("stable"))return cache.get("stable");
  const pending=(async()=>{
   const idx=await get("stability/index.json",false);
   const pointers=Object.values(idx.entries||{}).filter(x=>/^stability\/[\w.-]+\.json$/.test(x.file||""));
   const docs=await Promise.all(pointers.map(async p=>{
    try{const doc=await get(p.file);return doc.schema==="ECOBET_FAVOURITE_STABILITY_V1"?doc:null}
    catch(e){return null}
   }));
   return docs.filter(Boolean);
  })();
  cache.set("stable",pending);
  try{return await pending}catch(e){cache.delete("stable");throw e}
 }
 function filt(s,fixture,settings){
  if(settings?.league && settings.league!=="ALL" && String(fixture.competition)!==String(settings.league))return false;
  if(settings?.team&&settings.team!=="ALL"&&!([fixture.home,fixture.away].some(name=>key(name)===settings.team)))return false;
  const dt=String(s.run_date||"");
  if(settings?.from&&dt<settings.from||settings?.to&&dt>settings.to)return false;
  return true;
 }
 async function renderTopReadsPerformance({root,rows,get,isCurrent}){
  if(!root)return;
  const token=++seq;
  for(const n of [...root.children])if(!n.classList?.contains("ev3-performance-filters"))n.remove();
  const host=document.createElement("section");host.className="v43-perf-report";
  host.innerHTML='<div class="notice">Die historischen Pre Match Rankings und verifizierten Audits werden abgeglichen …</div>';
  root.appendChild(host);
  try{
   const docs=await indexes(get);
   if(token!==seq||!host.isConnected||!isCurrent())return;
   const settings=window.EV3?.settings||{};
   const results=new Map();
   for(const row of a(rows)){
    const id=row.raw?.fixture_id||row.raw?.result_settlement?.evidence?.fixture_id;
    if(!id)continue;
    const prior=results.get(id),current=String(row.rs?.favourite_result||"").toUpperCase();
    if(!prior||(["HIT","MISS","PUSH"].includes(current)&&!["HIT","MISS","PUSH"].includes(String(prior.rs?.favourite_result||"").toUpperCase())))results.set(id,row);
   }
   const included=[],excluded=[];
   for(const d of docs)for(const r of a(d.ranked)){
    const timing=d.fixture_timing?.[r.fixture_id],kickoff=Date.parse(r.kickoff_utc),created=Date.parse(d.generated_at_utc);
    if(timing!=="PRE_KICKOFF"||!Number.isFinite(created)||!Number.isFinite(kickoff)||created>kickoff){
      excluded.push({...r,reason:"Ranking nicht vor Anpfiff archiviert",run:d.publication_id});
      continue;
    }
    if(!filt(d,r,settings))continue;
    const audited=results.get(r.fixture_id),result=String(audited?.rs?.favourite_result||"").toUpperCase();
    const verdict=["HIT","MISS","PUSH"].includes(result)?result:"OFFEN";
    if(settings.status&&settings.status!=="ALL"&&settings.status!==verdict)continue;
    included.push({...r,verdict,run:d.publication_id,provenance:d.data_status});
   }
   const display=groups.filter(g=>included.some(r=>r.rank>=g.lo&&r.rank<=g.hi)||g.lo<=30);
   const tr=g=>{
    const v=included.filter(r=>r.rank>=g.lo&&r.rank<=g.hi),
    hit=v.filter(r=>r.verdict==="HIT").length,miss=v.filter(r=>r.verdict==="MISS").length,
    push=v.filter(r=>r.verdict==="PUSH").length,open=v.filter(r=>r.verdict==="OFFEN").length;
    return '<tr><td><b>'+g.lo+' bis '+g.hi+'</b></td><td>'+v.length+'</td><td class="v43-hit">'+hit+'</td><td class="v43-miss">'+miss+'</td><td>'+push+'</td><td>'+open+'</td><td><b class="'+(hit+miss?"v43-rate":"")+'">'+pct(hit,miss)+'</b></td></tr>';
   };
   const n=included.length,hit=included.filter(r=>r.verdict==="HIT").length,miss=included.filter(r=>r.verdict==="MISS").length,
   open=included.filter(r=>r.verdict==="OFFEN").length,push=included.filter(r=>r.verdict==="PUSH").length;
   host.innerHTML='<div class="v43-perf-title"><div><h3>Top Reads · Trefferquote nach Ranggruppen</h3><p>Ränge 1 bis 5, 6 bis 10, 11 bis 15 usw. Auswertung nur aus Rankings, die nachweislich vor Spielbeginn gespeichert wurden.</p></div></div>'+
   '<div class="v43-perf-summary"><span><b>'+n+'</b> Vor Anpfiff archiviert</span><span><b>'+hit+'</b> HIT</span><span><b>'+miss+'</b> MISS</span><span><b>'+open+'</b> Offen</span><span><b>'+pct(hit,miss)+'</b> Trefferquote</span></div>'+
   '<div class="v43-perf-table"><table><thead><tr><th>Ranggruppe</th><th>Prognosen</th><th>HIT</th><th>MISS</th><th>PUSH</th><th>Offen</th><th>Trefferquote</th></tr></thead><tbody>'+display.map(tr).join("")+'</tbody></table></div>'+
   '<p class="small muted">Trefferquote = HIT / (HIT + MISS). PUSH und offene Resultate zählen nicht im Nenner. Nach Spielbeginn berechnete Rankings ('+excluded.length+' Einträge im aktuellen Archiv) sind aus der Trefferstatistik ausgeschlossen. Automatische unvalidierte Rankings sind als vorläufige Modellbewertungen zu verstehen.</p>'+
   (!hit&&!miss?'<p class="notice">Noch keine abgeschlossenen, eindeutig zugeordneten Settlements für die vor Anpfiff archivierten Rankings. Die Quote bleibt korrekt als «—» angezeigt.</p>':"")+
   (n?'<details class="v43-detail"><summary>Einzelspiele und Rangquellen anzeigen ('+n+')</summary><div class="v43-perf-table"><table><thead><tr><th>Run</th><th>Rang</th><th>Spiel</th><th>Favourite</th><th>Status</th></tr></thead><tbody>'+
   included.sort((x,y)=>x.run.localeCompare(y.run)||x.rank-y.rank).map(x=>'<tr><td>'+esc(x.run)+'</td><td>'+x.rank+'</td><td>'+esc(x.home)+' – '+esc(x.away)+'</td><td>'+esc(x.favourite||"—")+'</td><td>'+esc(x.verdict)+'</td></tr>').join("")+'</tbody></table></div></details>':"");
  }catch(error){
   if(token===seq&&isCurrent()&&host.isConnected)host.innerHTML='<div class="notice warn">Die historische Ranggruppenstatistik konnte nicht geladen werden: '+esc(error.message||String(error))+'</div>';
  }
 }
 window.EV43={renderTopReadsPerformance};
})();