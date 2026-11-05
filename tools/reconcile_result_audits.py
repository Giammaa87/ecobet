#!/usr/bin/env python3
"""Conservative automatic ECOBET Result Audit recovery.
Uses independently obtained completed fixtures. Never overwrites sealed audits.
If the provider has no unambiguous match, leaves the result pending.
"""
import argparse
import copy
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.path.insert(0,str(Path(__file__).resolve().parent))
import provider_identity_v1 as identity

LEAGUES={"UCL":"uefa.champions","UEL":"uefa.europa","UEC":"uefa.europa.conf",
"ENG":"eng.1","GER":"ger.1","ESP":"esp.1","ITA":"ita.1","FRA":"fra.1",
"POR":"por.1","TUR":"tur.1"}
ALIASES={"psveindhoven":"psv","clubbruggekv":"clubbrugge","fcporto":"porto",
"skSlaviapraha":"slaviaprague","slaviapraha":"slaviaprague",
"borussiadortmund":"dortmund","bvb":"dortmund","sabahfk":"sabah",
"vikingfk":"viking","vikingstavanger":"viking","staderennais":"rennes",
"olympiakos":"olympiacos","manchesterutd":"manchesterunited",
"parissg":"parissaintgermain","shakhtard":"shakhtardonetsk",
"sportingcp":"sporting","sportinglisbon":"sporting",
"lasklinz":"lask","atleticodemadrid":"atleticomadrid",
"bayernmunchen":"bayernmunich","fenerbahceistanbul":"fenerbahce"}
def name(s):
 s=unicodedata.normalize("NFKD",str(s or "")).lower()
 s="".join(c for c in s if c.isalnum() and not unicodedata.combining(c))
 return ALIASES.get(s,s)
def timestamp(s):
 try:return datetime.fromisoformat(str(s).replace("Z","+00:00")).astimezone(timezone.utc)
 except (ValueError,TypeError):return None
def load(p):return json.loads(p.read_text(encoding="utf-8"))
def scoreint(s):
 try:
  n=float(s if not isinstance(s,dict) else s.get("value",s.get("displayValue")))
  return int(n) if n>=0 and n.is_integer() else None
 except (TypeError,ValueError):return None
def fetch(league,date):
 url="https://site.api.espn.com/apis/site/v2/sports/soccer/"+league+"/scoreboard?"+urlencode({"dates":date,"limit":200})
 with urlopen(Request(url,headers={"User-Agent":"ECOBETAuditRecovery/1.0","Accept":"application/json"}),timeout=22) as r:data=json.load(r)
 events=[]
 for event in data.get("events",[]):
  comp=(event.get("competitions") or [{}])[0]
  status=(event.get("status") or {}).get("type") or {}
  if status.get("completed") is not True:continue
  teams={x.get("homeAway"):x for x in comp.get("competitors",[])}
  if set(teams)!={"home","away"}:continue
  sc={side:scoreint(teams[side].get("score")) for side in ("home","away")}
  if any(v is None for v in sc.values()):continue
  n={side:(teams[side].get("team") or {}).get("displayName") or (teams[side].get("team") or {}).get("name") for side in sc}
  if not all(n.values()):continue
  events.append({"names":n,"score":sc,"date":event.get("date") or comp.get("date"),"id":event.get("id"),"url":url})
 return events
def resolve(fx,events):
 kickoff=timestamp(fx.get("kickoff_utc") or fx.get("kickoff"))
 if not kickoff:return None
 matches=[]
 for event in events:
  if any(name(fx.get(side))!=name(event["names"][side]) for side in ("home","away")):continue
  t=timestamp(event.get("date"))
  if not t or abs((t-kickoff).total_seconds())>21600:continue
  matches.append(event)
 if len(matches)==1:return matches[0]
 if matches:return None
 # 05.11.2026: deterministic tolerant fallback (shared with the local audit): same kickoff instant (+-30 min), token-compatible names on BOTH sides, unique-or-pending.
 near=[e for e in events if (timestamp(e.get("date")) and abs((timestamp(e.get("date"))-kickoff).total_seconds())<=1800)]
 event,_=identity.unique_match(fx.get("home"),fx.get("away"),near,lambda e:(e["names"]["home"],e["names"]["away"]))
 return event
def market(expr,fx,sc):
 if not expr or str(expr).upper() in {"NOT_AVAILABLE","ORIGINAL_PREDICTION_HASH_REFERENCE","NO_PREDICTION_TECHNICAL_BLOCKER"}:return "NOT_APPLICABLE"
 s=str(expr).lower().strip()
 def outcome(v,op,limit):
  if v==limit:return "PUSH"
  return "HIT" if (v>limit if op=="over" else v<limit) else "MISS"
 m=re.fullmatch(r"match total (over|under) (\d+(?:\.\d+)?)",s)
 if m:return outcome(sum(sc.values()),m[1],float(m[2]))
 m=re.fullmatch(r"(.+?) team goals (over|under) (\d+(?:\.\d+)?)",s)
 if m:
  side=next((x for x in sc if name(m[1])==name(fx[x])),None)
  if side is None:raise ValueError("Ambiguous team name "+s)
  return outcome(sc[side],m[2],float(m[3]))
 m=re.fullmatch(r"(.+?) team goals (\d+)\s*[-–]\s*(\d+)",s)
 if m:
  side=next((x for x in sc if name(m[1])==name(fx[x])),None)
  if side is None:raise ValueError("Ambiguous corridor team "+s)
  return "HIT" if int(m[2])<=sc[side]<=int(m[3]) else "MISS"
 m=re.fullmatch(r"both teams to score:\s*(yes|no)",s)
 if m:return "HIT" if ((sc["home"]>0 and sc["away"]>0)==(m[1]=="yes")) else "MISS"
 m=re.fullmatch(r"(.+?) draw no bet",s)
 if m:
  side=next((x for x in sc if name(m[1])==name(fx[x])),None)
  if side is None:raise ValueError("Ambiguous DNB team "+s)
  if sc["home"]==sc["away"]:return "PUSH"
  return "HIT" if sc[side]>sc["away" if side=="home" else "home"] else "MISS"
 m=re.fullmatch(r"(.+?) or draw",s) or re.fullmatch(r"draw or (.+)",s)
 if m:
  side=next((x for x in sc if name(m[1])==name(fx[x])),None)
  if side is None:raise ValueError("Ambiguous double-chance team "+s)
  return "HIT" if sc[side]>=sc["away" if side=="home" else "home"] else "MISS"
 m=re.fullmatch(r"(.+?) to win",s)
 if m:
  side=next((x for x in sc if name(m[1])==name(fx[x])),None)
  if side is None:raise ValueError("Ambiguous winner team "+s)
  return "HIT" if sc[side]>sc["away" if side=="home" else "home"] else "MISS"
 raise ValueError("Unsupported market "+s)
def quality(a):
 rs=[x.get("result_settlement") or {} for x in a.get("match_audit_records",[])]
 return (sum(x.get("status")=="SETTLED" for x in rs),
         sum(x.get("favourite_result") in ("HIT","MISS","PUSH") for x in rs),
         -sum(x.get("status")=="PENDING_RESULT" for x in rs),
         a.get("audit_generated_at") or "")
def reconcile(site,days,dry):
 ixpath=site/"audits"/"index.json"
 ix=load(ixpath)
 cache={}
 changed=[]
 warnings=[]
 now=datetime.now(timezone.utc)
 for day,entries in sorted(ix.get("dates",{}).items()):
  if not 0<=(now.date()-datetime.strptime(day,"%Y-%m-%d").date()).days<=days:continue
  candidates=[]
  for e in entries:
   p=site/"audits"/e["file"]
   if p.exists():
    try:candidates.append((quality(load(p)),e,load(p)))
    except (OSError,ValueError) as err:warnings.append(f"{day} unreadable: {err}")
  if not candidates:continue
  _,entry,base=max(candidates,key=lambda x:x[0])
  revision=copy.deepcopy(base)
  corrected=[]
  for m in revision.get("match_audit_records",[]):
   rs=m.get("result_settlement") or {}
   if rs.get("status")!="PENDING_RESULT":continue
   fx=m.get("fixture") or {}
   kickoff=timestamp(fx.get("kickoff_utc") or fx.get("kickoff"))
   prefix=str(m.get("fixture_id") or "")[:3]
   league=LEAGUES.get(prefix)
   if not kickoff or not league or now<kickoff+timedelta(hours=3):continue
   key=(league,kickoff.date().isoformat())
   if key not in cache:
    events=[]
    for delta in (-1,0,1):
     d=(kickoff.date()+timedelta(days=delta)).strftime("%Y%m%d")
     try:events.extend(fetch(league,d))
     except Exception as err:warnings.append(f"{league} {d}: {err}")
    cache[key]=events
   event=resolve(fx,cache[key])
   if event is None:
    warnings.append(f"{day} {m['fixture_id']}: no unique FT matching teams and kickoff")
    continue
   outcomes={}
   try:
    for role in ("favourite","safe","balanced","aggressive"):
     outcomes[role]=market((m.get("committed_model") or {}).get(role),fx,event["score"])
   except ValueError as err:
    warnings.append(f"{day} {m['fixture_id']}: {err}")
    continue
   old=copy.deepcopy(rs.get("evidence"))
   rs["status"]="SETTLED"
   rs["score_90_detail"]=event["score"]
   rs["score_90_plus_stoppage"]=f'{event["score"]["home"]}-{event["score"]["away"]}'
   rs["evidence"]={"provider":"ESPN_SCOREBOARD","evidence_status":"CONFIRMED_INDEPENDENT_FT",
    "identity_status":"MATCHED_STRICT_AUTO","result_status":"FT","event_id":event["id"],
    "fixture_id":m["fixture_id"],"final_90":event["score"],"query":event["url"],
    "retrieved_at":now.isoformat(),"previous_provider_evidence":old}
   rs["result_sources"]=[{"name":"ESPN_SCOREBOARD","status":"CONFIRMED_INDEPENDENT_FT","url":event["url"]}]
   for role,val in outcomes.items():
    rs[role+"_result"]=val
    cm=m["committed_model"]
    if role=="favourite":cm.setdefault("favourite_meta",{})["result"]=val
    elif role in cm.get("paths",{}):cm["paths"][role]["outcome"]=val
   corrected.append(m["fixture_id"])
  if not corrected:continue
  # Integrity: immutable predictions, fixtures, and already settled records are never changed.
  for old,new in zip(base["match_audit_records"],revision["match_audit_records"]):
   if old["fixture"]!=new["fixture"] or old["fixture_id"]!=new["fixture_id"]:raise ValueError("Fixture changed")
   for role in ("favourite","safe","balanced","aggressive"):
    if old["committed_model"].get(role)!=new["committed_model"].get(role):raise ValueError("Prediction changed")
   if old["fixture_id"] not in corrected and old!=new:raise ValueError("Nonpending record changed")
  for role in ("favourite","safe","balanced","aggressive"):
   totals={x:0 for x in ("HIT","MISS","PENDING","PUSH","NOT_APPLICABLE","NSP","UNMAPPABLE","VOID")}
   for m in revision["match_audit_records"]:
    val=m["result_settlement"].get(role+"_result")
    if val not in totals:raise ValueError("Unknown outcome "+str(val))
    totals[val]+=1
   totals["denominator"]=totals["HIT"]+totals["MISS"]
   totals["hit_rate"]=totals["HIT"]/totals["denominator"] if totals["denominator"] else None
   revision["run_audit_record"]["model_kpis"][role]=totals
  statuses=[x["result_settlement"].get("status") for x in revision["match_audit_records"]]
  settled,pending=statuses.count("SETTLED"),statuses.count("PENDING_RESULT")
  revision["run_audit_record"]["audit_coverage"]={"version":"ECOBET_AUDIT_COVERAGE_V1","predictions_total":len(statuses),"settlement_due":settled+pending,
   "settled":settled,"pending":pending,"nsp_no_settlement_required":statuses.count("NSP_NO_SETTLEMENT_REQUIRED"),
   "coverage_pct":(round(100.0*settled/(settled+pending),1) if settled+pending else None),"complete":pending==0,"timezone_day_basis":"Europe/Zurich"}
  revision["audit_generated_at"]=now.isoformat()
  revision["audit_id"]=str(base["audit_id"])+"_AUTO_RECONCILED"
  revision["revision_of"]=base["audit_id"]
  revision["reconciliation"]={"mode":"AUTOMATED_EXTERNAL_FT","source_audit_file":entry["file"],
   "resolved_fixture_ids":corrected,"local_audit_engine_repaired":False}
  digest=hashlib.sha256(json.dumps(revision,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:16]
  filename=f"ECOBET_{day}_RESULT_AUDIT_V24_AUTO_REV_{digest}.json"
  if not dry:
   output=site/"audits"/filename
   if output.exists():raise ValueError("Revision overwrite forbidden "+filename)
   output.write_text(json.dumps(revision,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
   ix["dates"][day].append({"append_only":True,"file":filename,
    "generated_at":revision["audit_generated_at"],"id":revision["audit_id"],
    "kpi":revision["run_audit_record"]["model_kpis"]["favourite"],
    "run_id":revision["run_audit_record"]["run_id"]})
  changed.append({"day":day,"file":filename,"fixtures":corrected,
                  "favourite":revision["run_audit_record"]["model_kpis"]["favourite"]})
 if changed and not dry:
  ix["generated_at"]=now.isoformat()
  ixpath.write_text(json.dumps(ix,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps({"revisions":changed,"unresolved":warnings},ensure_ascii=False))
 if warnings:print(f"WARNING: {len(warnings)} unresolved observations",file=sys.stderr)
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("root",nargs="?",default=".")
 ap.add_argument("--lookback-days",type=int,default=7)
 ap.add_argument("--dry-run",action="store_true")
 args=ap.parse_args()
 reconcile(Path(args.root),args.lookback_days,args.dry_run)
if __name__=="__main__":main()
