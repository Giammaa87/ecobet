/* ECOBET V4.1: compact read-only presentation. No predictions or prices are altered. */
(()=>{"use strict";
const arr=x=>Array.isArray(x)?x:[];
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>String(x??"");
const fmt=x=>x!=null&&x!==""&&Number.isFinite(Number(x))?Number(x).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:3}):"—";
const ztime=x=>{const d=new Date(x);return Number.isNaN(+d)?"Zeit unbekannt":new Intl.DateTimeFormat("de-CH",{timeZone:"Europe/Zurich",day:"2-digit",month:"2-digit",hour:"2-digit"}).format(d)};
const entity=(v,kind="team")=>window.EV3?.entity?.(v,kind,"sm")||esc(v);
const norm=x=>window.EV3?.key?.(x)||text(x).toLowerCase().trim();
const label=x=>({HOCH:"Hoch",MITTEL:"Mittel",NIEDRIG:"Niedrig",GREEN:"Grün",YELLOW:"Gelb",RED:"Rot",STRONG:"Stark",MEDIUM:"Mittel",WEAK:"Schwach"})[x]||text(x)||"—";
const market=x=>esc(text(x||"Nicht verfügbar").replace(/^Both Teams To Score: Yes$/i,"Beide Teams treffen: Ja").replace(/^Both Teams To Score: No$/i,"Beide Teams treffen: Nein").replace(/^Match Total (Over|Under) ([\d.]+)$/i,(_,d,n)=>(d==="Over"?"Über ":"Unter ")+n+" Tore insgesamt").replace(/^(.+) Team Goals (Over|Under) ([\d.]+)$/i,(_,n,d,v)=>n+(d==="Over"?" über ":" unter ")+v+" Teamtore").replace(/^(.+) Team Goals (\d+)[–-](\d+)$/i,(_,n,lo,hi)=>n+" "+lo+" bis "+hi+" Tore").replace(/^(.+) Draw No Bet$/i,"$1 ohne Remis").replace(/^(.+) to win$/i,"Sieg $1"));
const read=(st,id)=>arr(st?.reads?.fixtures).find(x=>x.fixture_id===id)||null;
const rank=(st,id)=>arr(st?.stability?.ranked).find(x=>x.fixture_id===id)||null;
const code=x=>x?.status==="READ" && x.read?text(x.read):"—";
const extra=(st,id)=>{const d=read(st,id);return {direction:code(d?.direction),range:code(d?.goal_range),owner:text(d?.owner_favourite?.selected?.read)||"—",timing:d?.timing?.status}};
const after=(st,id)=>read(st,id)?.timing?.status==="AFTER_KICKOFF"||st?.stability?.fixture_timing?.[id]==="AFTER_KICKOFF";
let rankId="",reasons=new Set(),boardRefresh=null,boardRunId="",openedBoardRows=new Set();
function option(items,sel,placeholder){return '<option value="ALL">'+esc(placeholder)+'</option>'+items.map(([v,n])=>'<option value="'+esc(v)+'" '+(v===sel?"selected":"")+'>'+esc(n)+'</option>').join("")}
function ranking({root,st,onOpen}){
 if(!root)return;
 if(!st?.id){root.innerHTML='<div class="notice">Run wird geladen.</div>';return}
 if(!st.stability){root.innerHTML='<div class="notice">'+(st.failed?.stability?"Stabilitätsranking nicht ladbar: "+esc(st.failed.stability):"Für diesen Run noch keine Stabilitätsrangliste verfügbar.")+'</div>';return}
 if(rankId!==st.id){rankId=st.id;reasons=new Set()}
 const all=arr(st.stability.ranked).slice().sort((a,b)=>Number(a.rank)-Number(b.rank));
 const unr=arr(st.stability.not_evaluable).filter(x=>x?.fixture_id&&!all.some(r=>r.fixture_id===x.fixture_id));
 const allTotal=all.length+unr.length;
 const visible=st.expanded?all.filter(r=>(st.league==="ALL"||r.competition===st.league)&&(st.team==="ALL"||norm(r.home)===st.team||norm(r.away)===st.team)&&(st.tier==="ALL"||r.stability?.tier===st.tier)):all.slice(0,5);
 const leagues=[...new Set([...all,...unr].map(x=>x.competition).filter(Boolean))].sort().map(x=>[x,x]),teams=new Map();
 [...all,...unr].forEach(x=>[x.home,x.away].forEach(n=>{if(n)teams.set(norm(n),n)}));
 const filters=st.expanded?'<div class="v41-filters"><label>Liga<select data-v4-filter="league">'+option(leagues,st.league,"Alle Ligen")+'</select></label><label>Team<select data-v4-filter="team">'+option([...teams].sort((a,b)=>a[1].localeCompare(b[1],"de")),st.team,"Alle Teams")+'</select></label><label>Stabilität<select data-v4-filter="tier">'+option([["HOCH","Hoch"],["MITTEL","Mittel"],["NIEDRIG","Niedrig"]],st.tier,"Alle Stufen")+'</select></label></div>':"";
 const notRanked=unr.filter(r=>(st.league==="ALL"||r.competition===st.league)&&(st.team==="ALL"||norm(r.home)===st.team||norm(r.away)===st.team)&&(st.tier==="ALL"));
 const openUnranked=st.expanded?notRanked:notRanked.slice(0,Math.max(0,5-visible.length));
 const unrankedRow=r=>'<tr class="v41-rank-main v43-unranked"><td data-label="Rang">—</td><td data-label="Spiel"><div class="v41-clubs">'+entity(r.home)+' – '+entity(r.away)+'</div><small>'+entity(r.competition,"competition")+' · '+esc(ztime(r.kickoff_utc))+'</small></td><td data-label="FAVOURITE">'+market(r.favourite)+'</td><td data-label="Stabilität"><span class="v43-unranked-tag">Nicht auswertbar</span><small>Kein Rang / Score</small></td><td data-label="Zusatz Reads"><div class="v41-mini-grid"><span><b>D</b> '+esc(extra(st,r.fixture_id).direction)+'</span><span><b>Range</b> '+esc(extra(st,r.fixture_id).range)+'</span><span><b>Owner</b> '+esc(extra(st,r.fixture_id).owner)+'</span></div></td><td data-label="Details"><small>Für diesen Favourite ist keine gültige Rangbewertung vorhanden.</small></td></tr>';
 const row=r=>{
  const id=text(r.fixture_id),x=extra(st,id),tier=text(r.stability?.tier),opened=reasons.has(id),matched=arr(st.run?.matches).some(m=>m.fixture_id===id);
  const reads='<span class="v41-mini"><b>D</b> '+esc(x.direction)+'</span><span class="v41-mini"><b>Range</b> '+esc(x.range)+'</span><span class="v41-mini"><b>Owner</b> '+esc(x.owner)+'</span>';
  return '<tr class="v41-rank-main"><td data-label="Rang" class="v41-rank-num">#'+esc(r.rank)+'</td>'+
   '<td data-label="Spiel"><div class="v41-clubs">'+entity(r.home)+' <span>–</span> '+entity(r.away)+'</div><small>'+entity(r.competition,"competition")+' · '+esc(ztime(r.kickoff_utc))+'</small></td>'+
   '<td data-label="FAVOURITE"><b>'+market(r.favourite)+'</b><small>Quelle: '+esc(r.favourite_source||"—")+'</small></td>'+
   '<td data-label="Stabilität"><span class="v41-tier v41-'+esc(tier.toLowerCase())+'">'+esc(label(tier))+'</span><small>Score '+esc(r.stability?.score??"—")+' · '+esc(r.coverage?.four?.text||"—")+'</small></td>'+
   '<td data-label="Zusatz Reads"><div class="v41-mini-grid">'+reads+'</div></td>'+
   '<td data-label="Details" class="v41-row-actions"><button class="btn secondary small" data-v41-match="'+esc(id)+'" type="button" '+(matched?"":"disabled")+'>Analyse</button> <button class="v41-disclose" data-v41-explain="'+esc(id)+'" aria-expanded="'+opened+'" type="button">'+(opened?"Schliessen":"Erklärung")+'</button></td></tr>'+
   '<tr class="v41-reason" data-v41-reason="'+esc(id)+'" '+(opened?"":"hidden")+'><td colspan="6"><p><b>Begründung:</b> '+esc(r.reason||"Nicht dokumentiert")+'</p>'+(after(st,id)?'<p class="v41-warning">Nach Anpfiff erzeugt. Keine echte Pre Match Empfehlung.</p>':"")+'<p>Der modellinterne Score ist keine statistisch validierte Trefferwahrscheinlichkeit.</p></td></tr>';
 };
 const late=all.filter(x=>after(st,x.fixture_id)).length,explore=st.stability.data_status==="EXPLORATORY_DEVELOPMENT",unvalidated=st.stability.data_status==="AUTOMATIC_UNVALIDATED";
 root.innerHTML='<div class="v41-heading"><div><h3>FAVOURITE Stabilitätsranking</h3><p>Rangierte Spiele auf einen Blick. Nicht auswertbare Spiele bleiben sichtbar und bekommen keine erfundene Platzierung.</p></div>'+(explore?'<span class="v41-dev">Explorative Entwicklungsdaten</span>':unvalidated?'<span class="v41-dev">Automatisch berechnet · noch nicht validiert</span>':"")+'</div>'+
 (late?'<p class="v41-warning">'+late+' von '+all.length+' Bewertungen wurden nach Anpfiff erzeugt und sind keine historischen Pre Match Empfehlungen.</p>':"")+
 '<div class="v41-controls"><b>'+all.length+' bewertet / '+allTotal+' Spiele · '+(st.expanded?"Vollständige Liste":"Erste fünf Spiele")+'</b><button id="v4-expand" class="btn secondary small" type="button">'+(st.expanded?"Auf die ersten fünf reduzieren":"Alle Spiele anzeigen")+'</button></div>'+
 filters+'<div class="v41-rank-wrap"><table class="v41-rank-table"><thead><tr><th>Rang</th><th>Spiel</th><th>FAVOURITE</th><th>Stabilität</th><th>Zusatz Reads</th><th>Details</th></tr></thead><tbody>'+(visible.length||openUnranked.length?visible.map(row).join("")+openUnranked.map(unrankedRow).join(""):'<tr><td colspan="6">Keine Spiele für diese Auswahl.</td></tr>')+'</tbody></table></div><p class="small muted">D = Direction Read. Alle Zusatz Reads werden unverändert aus den veröffentlichten Daten übernommen.</p>';
 root.querySelector("#v4-expand").onclick=()=>{st.expanded=!st.expanded;st.league="ALL";st.team="ALL";st.tier="ALL";ranking({root,st,onOpen})};
 root.querySelectorAll("[data-v4-filter]").forEach(el=>el.onchange=()=>{st[el.dataset.v4Filter]=el.value;ranking({root,st,onOpen})});
 root.querySelectorAll("[data-v41-match]").forEach(el=>el.onclick=()=>onOpen(el.dataset.v41Match));
 root.querySelectorAll("[data-v41-explain]").forEach(el=>el.onclick=()=>{const id=el.dataset.v41Explain;reasons.has(id)?reasons.delete(id):reasons.add(id);const tr=[...root.querySelectorAll("[data-v41-reason]")].find(x=>x.dataset.v41Reason===id);if(tr)tr.hidden=!reasons.has(id);el.setAttribute("aria-expanded",String(reasons.has(id)));el.textContent=reasons.has(id)?"Schliessen":"Erklärung"});
}
function overview({root,st,id}){
 const panel=root?.querySelector("#uebersicht");if(!panel)return;
 const d=read(st,id),r=rank(st,id);if(!d&&!r)return;
 const x=extra(st,id);
 const one=(title,value)=>'<span class="v41-overview-item"><small>'+title+'</small><b>'+esc(value)+'</b></span>';
 const content='<div class="v41-overview-title"><b>Zusatz Reads</b><small>Modellinterne Zusatzanalyse. Der originale ECOBET Favourite bleibt unverändert.</small></div><div class="v41-overview-items">'+one("Direction",x.direction)+one("Goal Range",x.range)+one("Owner Favourite",x.owner)+(r?one("Stabilität","#"+r.rank+" · "+label(r.stability?.tier)):"")+'</div>'+(after(st,id)?'<p class="v41-warning">Diese Zusatzanalyse wurde nach Anpfiff erzeugt und ist keine Pre Match Empfehlung.</p>':"");
 let box=panel.querySelector(".v41-overview");
 if(!box){box=document.createElement("div");box.className="v41-overview";const dashboard=panel.querySelector(".report-dashboard");dashboard?dashboard.after(box):panel.append(box)}
 if(box.innerHTML!==content)box.innerHTML=content;
}
function quoteCell(q,opts){
 if(!q)return '<span class="v41-none">—</span>';
 const picked=opts.selection?.get(q.fixtureId)?.key===q.key,source=(q.source_provider||"BSD")+(q.retrieved_after_kickoff?" (Archiv)":"");
 return '<div class="v41-quote"><span class="v41-quote-market">'+market(q.market)+'</span><div class="v41-quote-control"><strong class="'+(q.available?"v41-quote-price":"v41-quote-empty")+'">'+(q.available?fmt(q.odds):"—")+'</strong>'+
 (q.available?'<button type="button" class="v41-pick '+(picked?"selected":"")+'" data-v41-pick="'+esc(q.key)+'" aria-label="'+(picked?"Entfernen":"Hinzufügen")+': '+esc(q.role)+' '+esc(q.match?.home)+' gegen '+esc(q.match?.away)+'">'+(picked?"✓":"+")+'</button>':"")+'</div><small>'+(q.available?esc(source)+' · '+esc(ztime(q.updated)):"Keine verifizierte Quote")+'</small></div>';
}
function quoteTable(opts){
 const root=opts.root;if(!root)return;boardRefresh=opts.refresh;
 const currentRun=opts.run?.run?.publication_id||"";
 if(currentRun!==boardRunId){openedBoardRows.clear();boardRunId=currentRun;}
 const by=new Map();arr(opts.rows).forEach(q=>{if(!by.has(q.fixtureId))by.set(q.fixtureId,[]);by.get(q.fixtureId).push(q)});
 const matches=arr(opts.run?.matches).filter(m=>by.has(m.fixture_id));
 const row=m=>{
  const q=by.get(m.fixture_id),role=x=>q.find(v=>v.role===x),x=extra(opts.context,m.fixture_id),amp=text(m.ampel||"YELLOW").toUpperCase();
  const reads='<div class="v41-reads"><span><b>D</b> '+esc(x.direction)+'</span><span><b>Range</b> '+esc(x.range)+'</span><span><b>Owner</b> '+esc(x.owner)+'</span></div>';
  const isOpen=openedBoardRows.has(m.fixture_id);
  return '<tr class="v41-board-row '+(isOpen?"v41-expanded":"")+'" data-v41-fixture="'+esc(m.fixture_id)+'"><td data-label="Spiel" class="v41-game"><div class="v41-game-name"><span class="v41-ampel v41-ampel-'+esc(amp.toLowerCase())+'">'+esc(label(amp))+'</span><b>'+entity(m.home)+' <span>–</span> '+entity(m.away)+'</b></div><small>'+esc(m.competition||"")+" · "+esc(ztime(m.kickoff))+'</small><button class="v41-mobile-expand" type="button" data-v41-toggle="'+esc(m.fixture_id)+'" aria-expanded="'+isOpen+'">'+(isOpen?"Weitere Pfade schliessen":"Weitere Pfade anzeigen")+'</button></td>'+
  '<td data-path="SAFE" data-label="SAFE">'+quoteCell(role("SAFE"),opts)+'</td><td data-path="BALANCED" data-label="BALANCED">'+quoteCell(role("BALANCED"),opts)+'</td><td data-path="AGGRESSIVE" data-label="AGGRESSIVE">'+quoteCell(role("AGGRESSIVE"),opts)+'</td><td data-path="FAVOURITE" data-label="FAVOURITE">'+quoteCell(role("FAVOURITE"),opts)+'</td><td data-path="READS" data-label="Zusatz Reads">'+reads+(x.timing==="AFTER_KICKOFF"?'<small class="v41-read-pricing">Nach Anpfiff berechnet · Entwicklungsdaten</small>':'')+'<small class="v41-read-pricing">Keine separate Read Quote im aktuellen Datensatz</small></td></tr>';
 };
 root.classList.add("v41-board");
 root.innerHTML=matches.length?'<p class="v41-board-help">Eine Partie pro Zeile. <b>+</b> fügt die angezeigte Quote deinem Wettschein hinzu. Maximal ein Markt pro Spiel.</p><div class="v41-board-wrap"><table class="v41-board-table"><thead><tr><th>Spiel & Ampel</th><th>SAFE</th><th>BALANCED</th><th>AGGRESSIVE</th><th>FAVOURITE</th><th>Zusatz Reads</th></tr></thead><tbody>'+matches.map(row).join("")+'</tbody></table></div><p class="small muted">BSD und API Football liefern historische, exakt zugeordnete Quoten. API Football (Archiv) bedeutet: später abgerufen, aber mit Anbieterzeitstempel vor Anpfiff. Für zusätzliche Direction, Range und Owner Reads werden keine Quoten geschätzt.</p>':'<div class="notice">Keine Partien für die gewählten Filter.</div>';
 root.querySelectorAll("[data-v41-pick]").forEach(el=>el.onclick=()=>{const q=arr(opts.full).find(v=>v.key===el.dataset.v41Pick);if(q?.available)opts.toggle(q)});
 root.querySelectorAll("[data-v41-toggle]").forEach(el=>el.onclick=()=>{const tr=el.closest("tr"),isOpen=tr.classList.toggle("v41-expanded");isOpen?openedBoardRows.add(el.dataset.v41Toggle):openedBoardRows.delete(el.dataset.v41Toggle);el.setAttribute("aria-expanded",String(isOpen));el.textContent=isOpen?"Weitere Pfade schliessen":"Weitere Pfade anzeigen"});
}
function refresh(){if(document.querySelector("#page-board.active"))boardRefresh?.()}
window.EV41={ranking,overview,quoteTable,extra,refresh};
})();