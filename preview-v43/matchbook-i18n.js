/* ECOBET: display-only, immutable-source-bound Match Book translation adapter. */
(function(){
 "use strict";
 const fields=["thesis","match","home","away","prime","counter","cluster"];
 const asText=x=>typeof x==="string"?x:"";
 const getOriginal=p=>{
  const q=p&&typeof p==="object"?p:{};
  return {
   thesis:asText(q.match_thesis?.summary||q.decision_explanation?.thesis_summary),
   match:asText(q.match_book?.summary||q.decision_explanation?.thesis_summary),
   home:asText(q.team_books?.home?.state_summary),
   away:asText(q.team_books?.away?.state_summary),
   prime:asText(q.worlds?.primary?.description||q.decision_explanation?.primary_world_summary),
   counter:asText(q.worlds?.competing?.description||q.decision_explanation?.competing_world_summary),
   cluster:asText(q.decision_explanation?.cluster_summary),
   risks:Array.isArray(q.worlds?.tail_breaks)?q.worlds.tail_breaks.map(x=>asText(x?.description)).filter(Boolean):[]
  };
 };
 async function resolve(args){
  const {runId,fixtureId,stage,prediction,get,legacy}=args;
  const hash=stage?.publication_identity?.content_hash;
  if(runId&&hash&&typeof get==="function"){
   try{
    const doc=await get("translations/matchbooks/"+runId+".json");
    const text=doc?.fixtures?.[fixtureId];
    if(doc?.schema_version==="ECOBET_MATCHBOOK_TRANSLATION_V1"&&
       doc.publication_id===runId&&doc.language==="de-CH"&&
       doc.translation_status==="EDITORIALLY_TRANSLATED_FROM_FROZEN_SOURCE"&&
       doc.source_stage12_content_hash===hash&&
       text&&fields.every(key=>asText(text[key]).trim().length>0)){
      return {...text,__language:"de",__source:"FROZEN_STAGE12_TRANSLATION"};
    }
   }catch(err){/* Not every historical run has a translated artifact. */}
  }
  if(legacy&&fields.every(key=>asText(legacy[key]).trim().length>0))
   return {...legacy,__language:"de",__source:"EARLIER_EDITORIAL_TRANSLATION"};
  return {...getOriginal(prediction),__language:"en",__source:"FROZEN_STAGE12_ENGLISH"};
 }
 window.ECOBET_DE_ADAPTER={resolve};
})();