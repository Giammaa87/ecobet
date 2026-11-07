/* ECOBET V4.5: evidence-only HIT/MISS drilldowns and Favourite source clarity. */
(()=>{"use strict";
 const a=x=>Array.isArray(x)?x:[];
 const E=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const key=x=>window.EV3?.key?.(x)||String(x||"").toLowerCase().trim();
 const statuses=new Set(["HIT","MISS","PUSH"]);
 const valid=r=>!!(r?.home&&r?.away);
 const common=(r,s)=>valid(r)&&(s.league==="ALL"||r.competition===s.league)&&
  (s.team==="ALL"||[r.home,r.away].some(t=>key(t)===s.team))&&
  (!s.from||r.day>=s.from)&&(!s.to||r.day<=s.to);
 const filter=(rows,s,includeStatus=true)=>rows.filter(r=>common(r,s)&&
  (!includeStatus||s.status==="ALL"||String(r.rs?.[s.path+"_result"]||"").toUpperCase()===s.status));
 const selectedStatus=(r,path)=>String(r.rs?.[path+"_result"]||"").toUpperCase();
 const textMarket=x=>{
  if(typeof x==="string")return x.trim();
  if(x&&typeof x==="object")return String(x.expression||x.pick||"").trim();
  return "";
 };
 const expression=(r,role)=>{
  const model=r.model||{},path=model.paths?.[role];
  if(role==="favourite")return textMarket(model.favourite_prediction)||textMarket(model.favourite);
  return textMarket(model[role])||textMarket(path?.expression);
 };
 const equivalents=(r)=>{
  const fav=expression(r,"favourite");
  if(!fav)return "Nicht dokumentiert";
  const source=["safe","balanced","aggressive"].filter(role=>{
   const market=expression(r,role);return market&&market.toLowerCase()===fav.toLowerCase();
  }).map(x=>x.toUpperCase());
  if(source.length)return source.join(" + ")+" (gleicher Markt)";
  const documented=["safe","balanced","aggressive"].some(role=>!!expression(r,role));
  return documented?"Kein identischer Modellpfad":"Pfad nicht dokumentiert";
 };
 const fmtMarket=x=>{
  if(!x)return "Nicht dokumentiert";
  if(/^(1X|X2|12|1|X|2)$/.test(x))return E(x);
  return E(x)
   .replace(/^Match Total Under (\d+(?:\.\d+)?)$/i,"Unter $1 Tore")
   .replace(/^Match Total Over (\d+(?:\.\d+)?)$/i,"Über $1 Tore")
   .replace(/^Both Teams To Score: Yes$/i,"BTTS: Ja")
   .replace(/^Both Teams To Score: No$/i,"BTTS: Nein");
 };
 const badge=status=>{
  const v=statuses.has(status)?status:"OFFEN";
  return '<span class="v45-outcome v45-'+v.toLowerCase()+'">'+v+'</span>';
 };
 const pathCell=(r,role)=>{
  const expressionValue=expression(r,role);
  return '<div class="v45-market"><b>'+fmtMarket(expressionValue)+'</b><span>'+badge(selectedStatus(r,role))+'</span></div>';
 };
 const makeRow=(r,path)=>{
  const choice=expression(r,path);
  return '<tr><td>'+E(r.day)+'</td><td><b>'+E(r.home)+' – '+E(r.away)+'</b></td>'+
   '<td>'+E(r.competition)+'</td>'+
   '<td><b>'+path.toUpperCase()+'</b><div>'+badge(selectedStatus(r,path))+'</div></td>'+
   '<td><strong>'+fmtMarket(choice)+'</strong></td>'+
   '<td><div class="v45-fav"><b>'+fmtMarket(expression(r,"favourite"))+'</b>'+badge(selectedStatus(r,"favourite"))+'</div>'+
    '<small>'+E(equivalents(r))+'</small></td>'+
   '<td>'+pathCell(r,"safe")+'</td>'+
   '<td>'+pathCell(r,"balanced")+'</td>'+
   '<td>'+pathCell(r,"aggressive")+'</td></tr>';
 };
 const asRows=S=>window.EV3?.records?.(S.performance?.audits)||[];
 function decorateLeagues(S,root,s,rows){
  const table=root.querySelector(".ev3-perf-table");
  if(!table)return;
  const grouped=new Map();
  for(const r of filter(rows,s,false)){
   if(!grouped.has(r.competition))grouped.set(r.competition,[]);
   grouped.get(r.competition).push(r);
  }
  for(const tr of table.querySelectorAll("tbody tr")){
   const leagueText=tr.cells?.[0]?.textContent?.trim();
   const matched=[...grouped.keys()].find(x=>x===leagueText);
   if(!matched)continue;
   for(const [index,status] of [[2,"HIT"],[3,"MISS"]]){
    const cell=tr.cells?.[index],number=Number(cell?.textContent?.trim());
    if(!cell||!Number.isFinite(number)||number<1)continue;
    const expected=grouped.get(matched).filter(r=>selectedStatus(r,s.path)===status).length;
    if(expected!==number)continue;
    cell.innerHTML='<button class="v45-drill v45-'+status.toLowerCase()+'" type="button" title="'+E(matched+' '+status+' anzeigen')+'">'+number+' '+status+' <span>↗</span></button>';
    cell.querySelector("button").onclick=()=>{
      s.league=matched;
      s.status=status;
      S.perfTab="hitmiss";
      document.querySelector('[data-perf="hitmiss"]')?.click();
    };
   }
  }
  const unknown=rows.filter(r=>r.competition==="Unbekannt"&&valid(r)).length;
  const heading=document.createElement("p");heading.className="v45-quality-note";
  heading.textContent="HIT und MISS sind anklickbar. Die Detailauswertung enthält den gewählten Modellpfad, den tatsächlichen Markt und die Resultate aller vier ECOBET Pfade. "+(unknown?unknown+" eindeutig benannte Spiele bleiben mangels gesicherter Wettbewerbszuordnung als «Unbekannt» ausgewiesen. ":"")+"Nicht identifizierbare alte Leerbelege werden nicht als Partien gezählt.";
  const after=root.querySelector(".ev3-performance-filters");if(after)after.insertAdjacentElement("afterend",heading);
 }
 function decorateHitMiss(S,root,s,rows){
  const full=filter(rows,s,true).slice().sort((x,y)=>y.day.localeCompare(x.day)||x.home.localeCompare(y.home,"de"));
  const tables=root.querySelectorAll(".ev3-perf-table");
  // Replace only the previously capped 100-row *details* table; keep the grouped overview.
  const old=tables[tables.length-1];if(old&&tables.length>=2)old.closest(".table-wrap")?.remove();
  const section=document.createElement("section");section.className="v45-hits-panel";
  const total=full.length,hit=full.filter(r=>selectedStatus(r,s.path)==="HIT").length,miss=full.filter(r=>selectedStatus(r,s.path)==="MISS").length,push=full.filter(r=>selectedStatus(r,s.path)==="PUSH").length;
  section.innerHTML='<div class="v45-title"><h3>Ausgewertete Wetten und Modellpfade</h3>'+
    '<p>'+total+' Partien · '+hit+' HIT · '+miss+' MISS · '+push+' PUSH · Auswahl: '+E(s.path.toUpperCase())+
    '. Die Zeile bewertet den oben gewählten Modellpfad. Die weiteren Pfade stehen zum Vergleich daneben.</p></div>'+
    '<div class="v45-table-wrap"><table class="v45-table"><thead><tr><th>Datum</th><th>Partie</th><th>Liga</th><th>Bewerteter Pfad</th>'+
    '<th>Bewerteter Markt</th><th>FAVOURITE Markt und gleiche Pfade</th><th>SAFE</th><th>BALANCED</th><th>AGGRESSIVE</th></tr></thead><tbody>'+
    (full.length?full.map(r=>makeRow(r,s.path)).join(""):'<tr><td colspan="9">Keine Spiele mit diesem Filter.</td></tr>')+
    '</tbody></table></div><p class="v45-quality-note">FAVOURITE «gleicher Markt» bezeichnet nur eine eindeutige Marktübereinstimmung und nicht zwingend eine dokumentierte Auswahlherkunft. Bei alten Audits können einzelne Modellpfade fehlen. Fehlende Resultate bleiben «OFFEN» und werden nicht als MISS gezählt.</p>';
  root.appendChild(section);
 }
 function decorate(S){
  const root=document.getElementById("performance-body"),ev=window.EV3,s=ev?.settings;
  if(!root||!ev||!s||!S?.performance)return;
  const rows=asRows(S);
  if(S.perfTab==="leagues")decorateLeagues(S,root,s,rows);
  if(S.perfTab==="hitmiss")decorateHitMiss(S,root,s,rows);
 }
 window.EV45={decorate,expression,equivalents,filter};
})();
