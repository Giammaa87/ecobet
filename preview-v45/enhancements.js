
/* ECOBET V3 UI recovery: read-only presentation from published GitHub records. */
(function(){
"use strict";
const escape=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val=x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))?null:Number(x);
const num=(x,n=1)=>val(x)==null?"—":val(x).toLocaleString("de-CH",{minimumFractionDigits:n,maximumFractionDigits:n});
const clean=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const aliases={fcbayernmunchen:"bayernmunich",bayernmunchen:"bayernmunich",bayernmunich:"bayernmunich",
manchesterunited:"manchesterunited",manchesterutd:"manchesterunited",manutd:"manchesterunited",
psv:"psveindhoven",psveindhoven:"psveindhoven",
clubbrugge:"clubbrugge",clubbruges:"clubbrugge",
atleticodemadrid:"atleticomadrid",atleticomadrid:"atleticomadrid",
internazionale:"inter",internazionalemilano:"inter",intermilan:"inter",inter:"inter",
afcbournemouth:"bournemouth",bournemouth:"bournemouth",tottenhamhotspur:"tottenham",tottenham:"tottenham",spurs:"tottenham",
asroma:"roma",roma:"roma",parissaintgermain:"parissg",parissg:"parissg",psg:"parissg",
brightonhovealbion:"brighton",brighton:"brighton",fcbarcelona:"barcelona",barcelona:"barcelona",
feyenoordrotterdam:"feyenoord",feyenoord:"feyenoord",
fcbayern:"bayernmunich",borussiadortmund:"borussiadortmund",bvb:"borussiadortmund"};
const key=x=>aliases[clean(x)]||clean(x);
const canonComp=x=>{const s=String(x||"");if(/champions league/i.test(s))return"UEFA Champions League";if(/europa league/i.test(s))return"UEFA Europa League";if(/conference league/i.test(s))return"UEFA Conference League";if(/premier league/i.test(s))return"Premier League";if(/bundesliga/i.test(s))return"Bundesliga";if(/serie a/i.test(s))return"Serie A";if(/la liga/i.test(s))return"La Liga";if(/ligue 1/i.test(s))return"Ligue 1";return s||"Unbekannt"};
let teamMap=new Map(),leagueMap=new Map(),initTask=null,formIndexTask=null;const formCache=new Map(),formLoading=new Set();
function loadLogos(){
 if(initTask)return initTask;
 initTask=(async()=>{
 const urls=["logos/assets/team-logos/manifest.json?v=20261106","logos/assets/competition-logos/manifest.json?v=20261106"];
 const data=await Promise.all(urls.map(async u=>{const r=await fetch(u);if(!r.ok)throw Error("Logo Manifest HTTP "+r.status);return r.json()}));
 for(const x of data[0].teams||[])for(const name of [x.name,...(x.aliases||[])])if(name)teamMap.set(key(name),x.file);
 for(const x of data[1].competitions||[])for(const name of [x.name,x.id,...(x.aliases||[])])if(name)leagueMap.set(key(canonComp(name)),x.path);
 return {teams:teamMap.size,competitions:leagueMap.size};
 })();
 return initTask;
}
function initials(s){return String(s||"").split(/\s+/).filter(Boolean).slice(0,2).map(t=>t.charAt(0)).join("").toUpperCase()||"•"}
function emblem(name,kind="team",size="sm"){
 const file=kind==="competition"?leagueMap.get(key(canonComp(name))):teamMap.get(key(name));
 const css=kind==="competition"?"league":"team";
 const txt=escape(initials(name));
 return '<span class="ev3-logo '+css+" "+size+'" aria-hidden="true"><span class="ev3-logo-initials">'+txt+'</span>'+
 (file?'<img loading="lazy" alt="" src="'+escape(file)+'" onload="this.previousElementSibling.style.display=\'none\'" onerror="this.remove()">':"")+'</span>';
}
function entity(name,kind="team",size="sm"){return '<span class="ev3-entity">'+emblem(name,kind,size)+'<span>'+escape(name||"Unbekannt")+'</span></span>'}
function localeResult(x){const v=String(x||"").toUpperCase();return v==="HIT"?"HIT":v==="MISS"?"MISS":v==="PUSH"?"PUSH":"Offen"}
function chip(x){const v=String(x||"").toUpperCase(),css=v==="HIT"?"hit-chip":v==="MISS"?"miss-chip":v==="PUSH"?"push-chip":"unsettled-chip";return '<span class="'+css+'">'+escape(localeResult(v))+'</span>'}
function dot(x){const v=String(x||"").toUpperCase(),css=v==="HIT"?"hit":v==="MISS"?"miss":"push";return '<span class="dot '+css+'" title="'+escape(localeResult(v))+'">'+(v==="HIT"?"✓":v==="MISS"?"✕":"–")+'</span>'}
function rate(x){const n=x.hit+x.miss;return n?num(100*x.hit/n,1)+" %":"—"}
function scores(rows,field="favourite_result"){let x={hit:0,miss:0,push:0,other:0};for(const r of rows){const z=String(r.rs?.[field]||"").toUpperCase();if(z==="HIT")x.hit++;else if(z==="MISS")x.miss++;else if(z==="PUSH")x.push++;else x.other++}return x}
function rowOfAudit(a,r){
 const f=r.fixture||{},ts=Date.parse(f.kickoff_utc||f.kickoff||"");
 const auditDate=a.run_audit_record?.date_range?.from||a.audit_generated_at?.slice(0,10)||"";
 const runDate=String(a.run_audit_record?.run_id||"").match(/20\d{2}-\d{2}-\d{2}/)?.[0]||auditDate;
 const kickoffDay=Number.isFinite(ts)?new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ts)):runDate;
 const day=kickoffDay||auditDate;
 const home=f.home||"",away=f.away||"";
 const fixtureId=r.match_id||"";
 const stable=key(home)+"|"+key(away)+"|"+day+"|"+String(f.kickoff||"").slice(11,16);
 return {key:stable,home,away,day,auditDate,kickoff:ts||0,competition:canonComp(f.competition||r.competition_metadata?.competition_name||""),
 model:r.committed_model||{},rs:r.result_settlement||{},raw:r,fixtureId,
 updated:Date.parse(a.audit_generated_at||"")||Date.parse(auditDate)||0};
}
function dedupe(raw){
 // One fixture and kickoff represents one actual prediction event. Prefer decided records over pending replays.
 const m=new Map();
 for(const r of raw){const old=m.get(r.key);if(!old){m.set(r.key,r);continue}
 const rank=x=>{const v=String(x.rs?.favourite_result||"").toUpperCase();return ["HIT","MISS","PUSH"].includes(v)?3:v==="PENDING"?1:0};
 if(rank(r)>rank(old)||rank(r)===rank(old)&&r.updated>old.updated)m.set(r.key,r);
 }
 return [...m.values()].sort((a,b)=>a.day.localeCompare(b.day)||a.key.localeCompare(b.key));
}
function records(audits){return dedupe((audits||[]).flatMap(a=>(a.match_audit_records||[]).map(r=>rowOfAudit(a,r)))).filter(r=>r.home&&r.away)}
const settings={league:"ALL",team:"ALL",path:"favourite",from:"",to:"",sort:"count",min:1,status:"ALL",teamSearch:""};
let perfData=null,perfChange=null,perfTab="cockpit";
function setPerfContext(rows,tab,change){perfData=rows;perfTab=tab;perfChange=change;}
function selectedRows(includeStatus=true){
 let rows=perfData||[];
 if(settings.league!=="ALL")rows=rows.filter(x=>x.competition===settings.league);
 if(settings.team!=="ALL")rows=rows.filter(x=>[x.home,x.away].some(n=>key(n)===settings.team));
 if(settings.from)rows=rows.filter(x=>x.day>=settings.from);
 if(settings.to)rows=rows.filter(x=>x.day<=settings.to);
 if(includeStatus&&settings.status!=="ALL")rows=rows.filter(x=>String(x.rs?.[settings.path+"_result"]||"").toUpperCase()===settings.status);
 return rows;
}
function uniq(items){return [...new Set(items)].filter(Boolean).sort((a,b)=>a.localeCompare(b,"de"))}
function filters(){
 const rows=perfData||[];
 const leagues=uniq(rows.map(x=>x.competition));
 const teams=uniq(rows.filter(x=>settings.league==="ALL"||x.competition===settings.league).flatMap(x=>[x.home,x.away]));
 const ids=new Map();for(const x of teams)if(!ids.has(key(x)))ids.set(key(x),x);
 const teamList=[...ids.entries()].sort((a,b)=>a[1].localeCompare(b[1],"de"));
 const opts=(items,sel,allLabel,byKey=false)=>'<option value="ALL">'+allLabel+'</option>'+items.map(x=>{const name=byKey?x[1]:x,id=byKey?x[0]:x;return '<option value="'+escape(id)+'" '+(id===sel?"selected":"")+'>'+escape(name)+'</option>'}).join("");
 return '<section class="panel ev3-performance-filters"><div class="ev3-filter-heading"><div><strong>Performance Filter</strong><p>Wettbewerb, Mannschaft, Zeitraum und Modellpfad frei kombinieren. Gilt für alle neun Kategorien.</p></div><button type="button" class="btn secondary small" id="ev3-clear-filters">Zurücksetzen</button></div><div class="ev3-filter-grid">'+
 '<label>Wettbewerb<select data-pfilter="league">'+opts(leagues,settings.league,"Alle Wettbewerbe")+'</select></label>'+
 '<label>Mannschaft<select data-pfilter="team">'+opts(teamList,settings.team,"Alle Teams",true)+'</select></label>'+
 '<label>Modellpfad<select data-pfilter="path">'+["favourite","safe","balanced","aggressive"].map(p=>'<option value="'+p+'" '+(settings.path===p?"selected":"")+'>'+p.toUpperCase()+'</option>').join("")+'</select></label>'+
 '<label>Settlement<select data-pfilter="status">'+[["ALL","Alle Ergebnisse"],["HIT","Nur HIT"],["MISS","Nur MISS"],["PUSH","Nur PUSH"],["PENDING","Offen"]].map(([id,n])=>'<option value="'+id+'" '+(settings.status===id?"selected":"")+'>'+n+'</option>').join("")+'</select></label>'+
 '<label>Von<input type="date" data-pfilter="from" value="'+escape(settings.from)+'"></label><label>Bis<input type="date" data-pfilter="to" value="'+escape(settings.to)+'"></label>'+
 '<label>Sortierung<select data-pfilter="sort">'+[["count","Meiste Spiele"],["rate","Beste Trefferquote"],["worst","Niedrigste Trefferquote"],["name","Name A–Z"],["recent","Neueste zuerst"]].map(([id,n])=>'<option value="'+id+'" '+(settings.sort===id?"selected":"")+'>'+n+'</option>').join("")+'</select></label>'+
 '<label>Mindestanzahl Ergebnisse<input type="number" min="1" max="100" data-pfilter="min" value="'+settings.min+'"></label></div></section>';
}
function bindFilters(root){
 root.querySelectorAll("[data-pfilter]").forEach(input=>input.addEventListener("change",()=>{
 const k=input.dataset.pfilter,v=input.value;settings[k]=k==="min"?Math.max(1,Number(v)||1):v;
 if(k==="league")settings.team="ALL";
 if(perfChange)perfChange();
 }));
 const b=root.querySelector("#ev3-clear-filters");if(b)b.onclick=()=>{Object.assign(settings,{league:"ALL",team:"ALL",path:"favourite",from:"",to:"",sort:"count",min:1,status:"ALL"});perfChange?.()};
}
function group(rows,getName){const m=new Map();for(const r of rows){const n=getName(r)||"Nicht klassifiziert";if(!m.has(n))m.set(n,[]);m.get(n).push(r)}return [...m].map(([name,items])=>({name,items,s:scores(items,settings.path+"_result")})).filter(x=>x.s.hit+x.s.miss+x.s.push>=settings.min).sort((a,b)=>settings.sort==="rate"?((b.s.hit+b.s.miss?b.s.hit/(b.s.hit+b.s.miss):-1)-(a.s.hit+a.s.miss?a.s.hit/(a.s.hit+a.s.miss):-1)):settings.sort==="worst"?((a.s.hit+a.s.miss?a.s.hit/(a.s.hit+a.s.miss):2)-(b.s.hit+b.s.miss?b.s.hit/(b.s.hit+b.s.miss):2)):settings.sort==="name"?a.name.localeCompare(b.name,"de"):settings.sort==="recent"?(b.items.at(-1)?.day||"").localeCompare(a.items.at(-1)?.day||""):b.items.length-a.items.length);}
function table(headers,rows){return '<div class="table-wrap"><table class="compare ev3-perf-table"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>'}
function tableGroups(groups,kind="team"){
 return table([kind==="team"?"Mannschaft":kind==="league"?"Wettbewerb":"Markt","Spiele","HIT","MISS","PUSH","Trefferquote"],groups.map(x=>
 '<tr><td>'+(kind==="league"?entity(x.name,"competition"):kind==="team"?entity(x.name,"team"):escape(x.name))+'</td><td>'+x.items.length+'</td><td class="ev3-number-neutral">'+x.s.hit+'</td><td class="ev3-number-neutral">'+x.s.miss+'</td><td class="ev3-number-neutral">'+x.s.push+'</td><td><b class="ev3-rate '+((x.s.hit+x.s.miss)&&x.s.hit/(x.s.hit+x.s.miss)<0.5?"bad":"good")+'">'+rate(x.s)+'</b></td></tr>'))}
function kpi(label,value,colour="blue",description=""){return '<article class="stat-tile panel kpi-'+colour+'"><small>'+label+'</small><strong>'+value+'</strong><span>'+description+'</span></article>'}
function hitOverview(rows){
 const s=scores(rows,settings.path+"_result");
 return '<div class="stat-tiles">'+kpi("HIT",String(s.hit),"neutral")+kpi("MISS",String(s.miss),"neutral")+kpi("Trefferquote",rate(s),"hit")+kpi("Fehlerquote",s.hit+s.miss?num(100*s.miss/(s.hit+s.miss),1)+" %":"—","miss")+'</div>';
}
function trendChart(rows){
 const days=group(rows,x=>x.day).sort((a,b)=>a.name.localeCompare(b.name)).slice(-28);
 const max=Math.max(1,...days.map(x=>x.s.hit+x.s.miss+x.s.push));
 return '<div class="panel analytics-panel"><h3>HIT / MISS im Zeitverlauf</h3><div class="bar-chart">'+days.map(x=>{
 const n=x.s.hit+x.s.miss+x.s.push,h=Math.max(3,120*n/max),percent=v=>n?100*v/n:0;
 return '<div class="bar-column" title="'+escape(x.name)+' · '+x.s.hit+' HIT · '+x.s.miss+' MISS"><div class="stack" style="height:'+h+'px"><i style="height:'+percent(x.s.push)+'%;background:#f6c869"></i><i style="height:'+percent(x.s.miss)+'%;background:#ff788b"></i><i style="height:'+percent(x.s.hit)+'%;background:#36e6ab"></i></div><small>'+escape(x.name.slice(5))+'</small></div>';
 }).join("")+'</div><div class="legend"><span><i style="background:var(--green)"></i>HIT</span><span><i style="background:var(--rose)"></i>MISS</span><span><i style="background:var(--amber)"></i>PUSH</span></div></div>';
}
function simpleDots(rows){
 const outcomes=rows.filter(x=>["HIT","MISS","PUSH"].includes(String(x.rs?.[settings.path+"_result"]||"").toUpperCase())).slice(-5);
 return '<span class="ev3-momentum-dots">'+Array(Math.max(0,5-outcomes.length)).fill('<span class="dot ev3-empty">·</span>').join("")+outcomes.map(x=>dot(x.rs[settings.path+"_result"])).join("")+'</span>';
}
async function loadFormIndex(){if(!formIndexTask)formIndexTask=(async()=>{const p=await (await fetch("team-form/latest.json")).json();const r=await fetch("team-form/"+p.index_file);if(!r.ok)throw Error("Team-Form Index");return (await r.json()).records||[]})();return formIndexTask}
async function loadTeamForm(names){
 const index=await loadFormIndex();
 const byName=new Map();
 for(const row of index){
   const id=key(row.name);
   if(!byName.has(id))byName.set(id,[]);
   byName.get(id).push(row);
 }
 for(const options of byName.values())options.sort((a,b)=>b.date.localeCompare(a.date));
 const needed=[...new Map(names.map(n=>[key(n),n])).values()].map(name=>({name,id:key(name)})).filter(x=>!formCache.has(x.id)&&!formLoading.has(x.id));
 for(let i=0;i<needed.length;i+=6)await Promise.all(needed.slice(i,i+6).map(async x=>{
   const candidates=(byName.get(x.id)||[]).slice(0,5);
   if(!candidates.length){formCache.set(x.id,{none:true,reason:"NO_INDEX_REFERENCE"});return;}
   formLoading.add(x.id);let fallback=null,selected=null;
   try{
    for(const rec of candidates){
      try{
       const response=await fetch(rec.ref);
       if(!response.ok)continue;
       const doc=await response.json();
       const history=(doc.match_history?.matches||[]).filter(r=>r.d&&["W","D","L"].includes(r.res)).sort((a,b)=>a.d.localeCompare(b.d)).slice(-5);
       const state=doc.feature_state||{};
       const candidate={date:rec.date,ref:rec.ref,n:state.last5_all_competitions_n??history.length,history,reported:history.length,older:rec.date!==candidates[0].date};
       if(!fallback||history.length>fallback.reported)fallback=candidate;
       if(history.length===5){selected=candidate;break;}
      }catch(e){/* older indexed record might have been archived; try next candidate */}
    }
    const chosen=selected||fallback;
    formCache.set(x.id,chosen||{none:true,reason:"NO_READABLE_MATCH_HISTORY"});
   }finally{formLoading.delete(x.id);}
 }));
}
function formDots(name){
 const f=formCache.get(key(name));if(!f)return '<span class="small muted">Formdaten laden …</span>';
 if(f.none)return '<span class="small muted">Keine verifizierte L5 Form</span>';
 const rows=f.history||[];
 return '<span class="ev3-momentum-dots">'+Array(Math.max(0,5-rows.length)).fill('<span class="dot ev3-empty">·</span>').join("")+
 rows.map(r=>'<span class="dot '+(r.res==="W"?"hit":r.res==="L"?"miss":"push")+'" title="'+escape(r.d+" · "+r.gf+":"+r.ga)+'">'+(r.res==="W"?"S":r.res==="L"?"N":"U")+'</span>').join("")+'</span><small class="dim">Formstand '+escape(f.date)+(f.older?" · älterer vollständiger Snapshot":"")+(rows.length<5?" · "+rows.length+"/5 verfügbar":"")+'</small>';
}
function dedupedMomentum(rows){
 const teams=new Map();
 for(const r of rows){
  const settled=String(r.rs?.[settings.path+"_result"]||"").toUpperCase();
  if(!["HIT","MISS","PUSH"].includes(settled))continue;
  for(const name of [r.home,r.away]){if(!name)continue;const k=key(name);if(!teams.has(k))teams.set(k,{id:k,name,items:[],leagues:new Set()});const t=teams.get(k);
   // Display most recent canonical name; avoid truncating to "FC Bayern München".
   if(name.length>t.name.length&&name.length<35)t.name=name;
   t.items.push(r);t.leagues.add(r.competition);
  }
 }
 return [...teams.values()].map(t=>{t.items=t.items.sort((a,b)=>a.day.localeCompare(b.day)||a.kickoff-b.kickoff);t.recent=t.items.filter(r=>["HIT","MISS","PUSH"].includes(String(r.rs?.[settings.path+"_result"]||"").toUpperCase())).slice(-5);t.s=scores(t.recent,settings.path+"_result");return t})
 .filter(t=>t.items.length>=settings.min)
 .sort((a,b)=>settings.sort==="rate"?(b.s.hit/(b.s.hit+b.s.miss)||0)-(a.s.hit/(a.s.hit+a.s.miss)||0):settings.sort==="worst"?(a.s.hit/(a.s.hit+a.s.miss)||0)-(b.s.hit/(b.s.hit+b.s.miss)||0):settings.sort==="name"?a.name.localeCompare(b.name,"de"):settings.sort==="recent"?(b.items.at(-1)?.day||"").localeCompare(a.items.at(-1)?.day||""):b.items.length-a.items.length);
}
function momentumHTML(rows){
 const teams=dedupedMomentum(rows);
 const visible=teams.slice(0,80);
 const items=visible.map(t=>'<tr><td>'+entity(t.name)+'</td><td><span class="ev3-strong-number">'+t.items.length+'</span></td><td>'+formDots(t.name)+'</td><td>'+simpleDots(t.recent)+'</td><td>'+rate(t.s)+'</td><td>'+t.s.hit+' HIT / '+t.s.miss+' MISS</td></tr>');
 return '<div class="ev3-subhead"><h3>Teamform und ECOBET Momentum</h3><p>Links die sportliche Last Five Form aus den Mannschaftssnapshots, rechts die fünf jüngsten eindeutig entschiedenen ECOBET Favourites. Offene Ergebnisse und doppelte Auditstände werden nicht als zusätzliche Treffer gezählt.</p></div>'+
 table(["Team","Historische Predictions","Sportliche Last Five","ECOBET letzte fünf","HIT Quote","Bilanz"],items)+
 (teams.length>80?'<p class="small muted">Angezeigt: 80 von '+teams.length+' Teams. Nutze die Liga und Mannschaftsfilter für weitere Vereine.</p>':"");
}
function renderPerformance(root,origRows,tab,change){
 setPerfContext(origRows,tab,change);
 const t=tab||"cockpit";
 const rows=t==="momentum"?selectedRows(false):selectedRows(),groupStatus=settings.path+"_result";
 let html='<div class="ev3-filter-info">'+rows.length+' eindeutige Fixture Records im aktuellen Filter. Mehrfach publizierte Prüfstände sind bereinigt. Pfad: '+settings.path.toUpperCase()+'.</div>';
 if(t==="cockpit"){const pf=["favourite","safe","balanced","aggressive"];const breakdown=pf.map(path=>{const x=scores(rows,path+"_result");return kpi(path.toUpperCase(),rate(x),(x.hit+x.miss)&&x.hit<x.miss?"miss":"hit",x.hit+" HIT · "+x.miss+" MISS · "+x.push+" PUSH")}).join("");html+=hitOverview(rows)+'<div class="ev3-subhead"><h3>Alle vier Modellpfade im Vergleich</h3><p>SAFE, BALANCED, AGGRESSIVE und FAVOURITE werden aus demselben gefilterten Spielbestand berechnet.</p></div><div class="stat-tiles">'+breakdown+'</div><div class="performance-grid">'+trendChart(rows)+'<div class="panel analytics-panel"><h3>Trefferquote nach Wettbewerb</h3>'+tableGroups(group(rows,x=>x.competition).slice(0,10),"league")+'</div></div>';}
 else if(t==="trends")html+=hitOverview(rows)+trendChart(rows)+table(["Datum","Spiele","HIT","MISS","PUSH","Quote"],group(rows,x=>x.day).sort((a,b)=>b.name.localeCompare(a.name)).map(g=>'<tr><td>'+escape(g.name)+'</td><td>'+g.items.length+'</td><td>'+g.s.hit+'</td><td>'+g.s.miss+'</td><td>'+g.s.push+'</td><td>'+rate(g.s)+'</td></tr>'));
 else if(t==="markets")html+=hitOverview(rows)+tableGroups(group(rows,x=>x.model?.[settings.path==="favourite"?"favourite_prediction":settings.path]||"Markt nicht im Audit"),"market");
 else if(t==="leagues")html+=hitOverview(rows)+tableGroups(group(rows,x=>x.competition),"league");
 else if(t==="hitmiss")html+=hitOverview(rows)+tableGroups(group(rows,x=>x.home+" – "+x.away),"market")+
 table(["Datum","Spiel","Liga","Markt","Resultat"],rows.filter(r=>settings.status==="ALL"||r.rs?.[groupStatus]===settings.status).slice(-100).reverse().map(r=>'<tr><td>'+escape(r.day)+'</td><td>'+entity(r.home)+" – "+entity(r.away)+'</td><td>'+entity(r.competition,"competition")+'</td><td>'+escape(r.model?.[settings.path==="favourite"?"favourite_prediction":settings.path]||"—")+'</td><td>'+chip(r.rs?.[groupStatus])+'</td></tr>'));
 else if(t==="momentum")html+=hitOverview(rows)+momentumHTML(rows);
 else if(t==="topreads"){const eligible=rows.filter(r=>r.raw?.top_read_rank!=null||r.raw?.topread_rank!=null||r.raw?.top_read_tier!=null);html+='<div class="notice">Top Reads werden ausschliesslich angezeigt, wenn ein vor Spielbeginn gespeicherter Rank oder Tier im Audit vorhanden ist. Eine nachträgliche Auswahl aus Treffern wäre kein gültiger Test.</div>'+hitOverview(eligible)+tableGroups(group(eligible,r=>r.raw.top_read_tier||r.raw.top_read_rank||r.raw.topread_rank),"market")}
 else if(t==="nsp"){const no=rows.filter(r=>String(r.model?.favourite_prediction||r.model?.favourite||"").includes("NO_STABLE_PREDICTION")||(r.model?.flags||[]).includes("NSP"));html+=hitOverview(no)+tableGroups(group(no,r=>r.competition),"league")}
 else if(t==="scores"){const counted=rows.filter(r=>r.raw?.score_cluster_audit&&Object.keys(r.raw.score_cluster_audit).length);const tests=["cluster_hit","modal_score_hit","score_band_hit"];html+='<div class="stat-tiles">'+tests.map((k,i)=>kpi(["Cluster Treffer","Exakter Modalscore","Score Band Treffer"][i],String(counted.filter(r=>r.raw.score_cluster_audit[k]===true).length),"blue")).join("")+kpi("Scoreline Audits",String(counted.length),"amber")+'</div>'+table(["Kennzahl","Treffer","Geprüft"],tests.map((k,i)=>'<tr><td>'+["Cluster","Modalscore","Score Band"][i]+'</td><td>'+counted.filter(r=>r.raw.score_cluster_audit[k]===true).length+'</td><td>'+counted.filter(r=>typeof r.raw.score_cluster_audit[k]==="boolean").length+'</td></tr>'))}
 root.innerHTML=filters()+html;
 bindFilters(root);
 if(t==="momentum"){const teams=dedupedMomentum(rows).slice(0,80).map(x=>x.name);loadTeamForm(teams).then(()=>{if(perfTab===t&&root.isConnected)root.querySelectorAll(".ev3-team-form").forEach(()=>{}) ;const body=root.querySelector(".ev3-momentum-reload");if(body)body.remove();const tbody=root.querySelector(".ev3-perf-table tbody");if(tbody){const trs=tbody.querySelectorAll("tr");trs.forEach((tr,i)=>{if(i>=teams.length)return;const cell=tr.children[2];if(cell)cell.innerHTML=formDots(teams[i]);})}}).catch(()=>{})}
}
window.EV3={loadLogos,entity,emblem,clean,key,canonComp,records,renderPerformance,formDots,settings};
})();
