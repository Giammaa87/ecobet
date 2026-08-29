#!/usr/bin/env python3
from __future__ import annotations
import json,re,unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request,urlopen

UA='ECOBET-TeamLogoSync/1.0'
OUT=Path('assets/team-logos'); OUT.mkdir(parents=True,exist_ok=True)
LEAGUES={
 'ENG-Premier League':('England - Premier League','England'),
 'ESP-La Liga':('Spain - La Liga','Spain'),
 'ITA-Serie A':('Italy - Serie A','Italy'),
 'GER-Bundesliga':('Germany - Bundesliga','Germany'),
 'FRA-Ligue 1':('France - Ligue 1','France'),
}
UEFA={
 'UEFA-Champions League':[
 ('AEK Athens','Greece'),('Arsenal','England'),('Aston Villa','England'),('Atlético de Madrid','Spain'),('Barcelona','Spain'),('Bayern München','Germany'),('Bodø/Glimt','Norway'),('Borussia Dortmund','Germany'),('Club Brugge','Belgium'),('Como','Italy'),('Fenerbahçe','Turkey'),('Feyenoord','Netherlands'),('Galatasaray','Turkey'),('Inter','Italy'),('LASK','Austria'),('RB Leipzig','Germany'),('Lens','France'),('Lille','France'),('Liverpool','England'),('Manchester City','England'),('Manchester United','England'),('Napoli','Italy'),('Paris Saint-Germain','France'),('Porto','Portugal'),('PSV Eindhoven','Netherlands'),('Real Betis','Spain'),('Real Madrid','Spain'),('Roma','Italy'),('Sabah','Azerbaijan'),('Shakhtar Donetsk','Ukraine'),('Slavia Praha','Czechia'),('Slovan Bratislava','Slovakia'),('Sporting CP','Portugal'),('VfB Stuttgart','Germany'),('Viking','Norway'),('Villarreal','Spain')],
 'UEFA-Europa League':[
 ('Bayer Leverkusen','Germany'),('Benfica','Portugal'),('Juventus','Italy'),('AC Milan','Italy'),('Lyon','France'),('AZ Alkmaar','Netherlands'),('Olympiacos','Greece'),('Real Sociedad','Spain'),('Marseille','France'),('Ferencváros','Hungary'),('Viktoria Plzeň','Czechia'),('Union Saint-Gilloise','Belgium'),('Dinamo Zagreb','Croatia'),('Red Bull Salzburg','Austria'),('Celtic','Scotland'),('Sparta Praha','Czechia'),('Rennes','France'),('Anderlecht','Belgium'),('Sturm Graz','Austria'),('Lech Poznań','Poland'),('Crystal Palace','England'),('Bournemouth','England'),('Sunderland','England'),('Celje','Slovenia'),('Jagiellonia Białystok','Poland'),('Omonia','Cyprus'),('Celta Vigo','Spain'),('Hoffenheim','Germany'),('Beşiktaş','Turkey'),('Torreense','Portugal'),('Hapoel Beer-Sheva','Israel'),('NEC Nijmegen','Netherlands'),('OFI Crete','Greece'),('Lillestrøm','Norway'),('Levski Sofia','Bulgaria'),('Ararat-Armenia','Armenia')],
 'UEFA-Conference League':[
 ('Atalanta','Italy'),('Braga','Portugal'),('Ajax','Netherlands'),('Freiburg','Germany'),('Monaco','France'),('Copenhagen','Denmark'),('Midtjylland','Denmark'),('Red Star Belgrade','Serbia'),('Gent','Belgium'),('Panathinaikos','Greece'),('Pafos','Cyprus'),('Brighton & Hove Albion','England'),('Lugano','Switzerland'),('Getafe','Spain'),('KuPS Kuopio','Finland'),('Twente','Netherlands'),('Lincoln Red Imps','Gibraltar'),('Borac Banja Luka','Bosnia and Herzegovina'),('Sint-Truidense','Belgium'),('Brann','Norway'),('Hearts','Scotland'),('Kairat Almaty','Kazakhstan'),('Trabzonspor','Turkey'),('Universitatea Craiova','Romania'),('Riga','Latvia'),('Hajduk Split','Croatia'),('Jablonec','Czechia'),('Nordsjælland','Denmark'),('Aarhus','Denmark'),("Inter Club d'Escaldes",'Andorra'),('Thun','Switzerland'),('CSKA Sofia','Bulgaria'),('Kauno Žalgiris','Lithuania'),('Mjällby','Sweden'),('Iberia 1999','Georgia'),('Egnatia','Albania')]
}
ALIASES={
 'inter':['Inter Milan','Internazionale'],'paris saint germain':['PSG','Paris SG'],'bayern munchen':['Bayern Munich'],'atletico de madrid':['Atletico Madrid'],'bodo glimt':['Bodo Glimt'],'rb leipzig':['Leipzig'],'ac milan':['Milan'],'lyon':['Olympique Lyonnais'],'marseille':['Olympique Marseille'],'union saint gilloise':['Union SG'],'red bull salzburg':['Salzburg','RB Salzburg'],'dinamo zagreb':['GNK Dinamo'],'sparta praha':['Sparta Prague'],'slavia praha':['Slavia Prague'],'viktoria plzen':['Viktoria Plzen'],'hapoel beer sheva':["Hapoel Be'er Sheva",'H. Beer-Sheva'],'nec nijmegen':['N.E.C.','NEC'],'red star belgrade':['Crvena Zvezda'],'copenhagen':['FC Copenhagen','København'],'gent':['KAA Gent'],'hearts':['Heart of Midlothian'],'universitatea craiova':['U. Craiova'],'nordsjaelland':['Nordsjælland','FC Nordsjaelland'],'aarhus':['AGF Aarhus','AGF'],'inter club d escaldes':['Inter Escaldes'],'iberia 1999':['Iberia Tbilisi']}
COUNTRY={'Czechia':['czech_republic','czechia'],'Bosnia and Herzegovina':['bosnia_and_herzegovina','bosnia'],'Turkey':['turkey','turkiye']}

def get(url):
 r=Request(url,headers={'User-Agent':UA,'Accept':'application/vnd.github+json'}); return urlopen(r,timeout=45).read()
def js(url): return json.loads(get(url).decode())
def fold(s): return ''.join(c for c in unicodedata.normalize('NFKD',s) if not unicodedata.combining(c))
def norm(s):
 s=fold(s).lower().replace('&',' and '); s=re.sub(r'\b(fc|afc|cf|sc|sv|fk|sk|ac|as|ssc|rc|tsg|vfb|gnk)\b',' ',s); return ' '.join(re.sub(r'[^a-z0-9]+',' ',s).split())
def slug(s): return norm(s).replace(' and ','_').replace(' ','_')

def league_teams():
 out=[]
 for comp,(folder,country) in LEAGUES.items():
  url='https://api.github.com/repos/luukhopman/football-logos/contents/'+quote('logos/'+folder,safe='/')+'?ref=master'
  for x in js(url):
   if x.get('type')=='file' and x['name'].lower().endswith('.png'): out.append((x['name'][:-4],country,comp))
 return out

def svg_index():
 data=js('https://api.github.com/repos/JoseArroyave/football-logos/git/trees/main?recursive=1')
 if data.get('truncated'): raise RuntimeError('SVG tree truncated')
 out=[]
 for x in data['tree']:
  p=x.get('path',''); parts=p.split('/')
  if x.get('type')=='blob' and len(parts)==3 and p.startswith('logos/') and p.lower().endswith('.svg'):
   n=parts[2][:-4].replace('_',' ')
   if 'national team' not in norm(n): out.append((parts[1],n,p))
 return out

def score(name,country,c):
 ctry,n,p=c; wanted={norm(name),*(norm(a) for a in ALIASES.get(norm(name),[]))}; cn=norm(n)
 ns=1.0 if cn in wanted else max(SequenceMatcher(None,w,cn).ratio() for w in wanted)
 for w in wanted:
  if w and (w in cn or cn in w): ns=max(ns,.90+.08*min(len(w),len(cn))/max(len(w),len(cn)))
 allowed={norm(x).replace(' ','_') for x in COUNTRY.get(country,[country])}
 return ns+(.12 if norm(ctry).replace(' ','_') in allowed else -.08)

def main():
 teams={}
 def add(name,country,comp):
  k=(norm(name),country); teams.setdefault(k,{'name':name,'country':country,'competitions':set(),'aliases':set()}); teams[k]['competitions'].add(comp); teams[k]['aliases'].add(name)
 for row in league_teams(): add(*row)
 for comp,rows in UEFA.items():
  for name,country in rows: add(name,country,comp)
 idx=svg_index(); manifest=[]; unresolved=[]
 for t in sorted(teams.values(),key=lambda x:(x['country'],x['name'])):
  ranked=sorted(((score(t['name'],t['country'],c),c) for c in idx),reverse=True,key=lambda z:z[0]); bests,best=ranked[0]
  if bests<1.0:
   unresolved.append({'name':t['name'],'country':t['country'],'competitions':sorted(t['competitions']),'best':{'score':round(bests,4),'path':best[2]}}); continue
  dest=OUT/(slug(t['name'])+'.svg'); raw='https://raw.githubusercontent.com/JoseArroyave/football-logos/main/'+quote(best[2],safe='/'); data=get(raw)
  if b'<svg' not in data[:600].lower() and b'<?xml' not in data[:600].lower(): unresolved.append({'name':t['name'],'error':'not_svg','source':best[2]}); continue
  dest.write_bytes(data)
  manifest.append({'name':t['name'],'country':t['country'],'competitions':sorted(t['competitions']),'aliases':sorted(t['aliases']),'file':str(dest).replace('\\','/'),'source_path':best[2],'match_score':round(bests,4)})
 out={'schema_version':'1.0','record_type':'ecobet_team_logo_manifest','season':'2026/27','counts':{'requested_unique_teams':len(teams),'resolved':len(manifest),'unresolved':len(unresolved)},'teams':manifest}
 (OUT/'manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); (OUT/'unresolved.json').write_text(json.dumps(unresolved,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(out['counts']))
if __name__=='__main__': main()
