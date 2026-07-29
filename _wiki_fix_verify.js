// Verify proposed replacement EN titles exist and are not disambiguation pages.
const UA='sociology-map-wiki-audit/1.0 (educational)';
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function q(lang,titles){
  const params=new URLSearchParams({action:'query',prop:'pageprops',ppprop:'disambiguation',titles:titles.join('|'),redirects:'1',format:'json',formatversion:'2'});
  for(let a=0;a<4;a++){try{const r=await fetch(`https://${lang}.wikipedia.org/w/api.php?`+params,{headers:{'User-Agent':UA}});if(!r.ok)throw new Error('HTTP'+r.status);return await r.json();}catch(e){await sleep(700*(a+1));}}
  throw new Error('fail '+lang);
}

// id -> proposed EN title
const cand = {
  // disambiguation fixes
  becker:'Howard S. Becker',
  coleman:'James Samuel Coleman',
  berger:'Peter L. Berger',
  functionalism:'Structural functionalism',
  class_struggle:'Class conflict',
  habitus:'Habitus (sociology)',
  rationalization_concept:'Rationalization (sociology)',
  alienation:"Marx's theory of alienation",
  field:'Field (Bourdieu)',
  deviance:'Deviance (sociology)',
  // missing fixes
  late_modern:'Late modernity',
  world_systems:'World-systems theory',
  dramaturgical:'Dramaturgy (sociology)',
  institutionalism:'New institutionalism',
  social_fact:'Social fact',
  capital_forms:'The Forms of Capital',
  power_knowledge:'Power-knowledge',
  self_presentation:'Impression management',
  gender_system:'Sex/gender distinction',
  social_construction:'Social constructionism',
  cultural_capital:'Cultural capital',
  symbolic_violence:'Symbolic violence',
  core_periphery:'Core–periphery structure',
  emotional_labor:'Emotional labor',
  life_chances:'Life chances',
  digital:'Digital sociology',
  family:'Sociology of the family',
  health:'Sociology of health and illness',
  environment:'Environmental sociology',
  migration:'Migration studies',
  media:'Media studies',
  youth:'Youth studies',
  poverty:'Poverty',
  gender:'Sociology of gender',
  technology:'Science and technology studies',
  psy_decision:'Decision-making',
};

(async()=>{
  const ids=Object.keys(cand);
  const titles=[...new Set(ids.map(i=>cand[i]))];
  const okTitles={}; // title -> status
  for(let i=0;i<titles.length;i+=20){
    const chunk=titles.slice(i,i+20);
    const data=await q('en',chunk);
    const redir={},norm={};
    (data.query.redirects||[]).forEach(r=>redir[r.from]=r.to);
    (data.query.normalized||[]).forEach(r=>norm[r.from]=r.to);
    const pages={};(data.query.pages||[]).forEach(p=>pages[p.title]=p);
    chunk.forEach(t=>{
      let rt=norm[t]||t; if(redir[rt])rt=redir[rt];
      const pg=pages[rt];
      if(!pg||pg.missing) okTitles[t]='MISSING';
      else if(pg.pageprops&&'disambiguation'in pg.pageprops) okTitles[t]='DISAMBIG';
      else okTitles[t]=(rt!==t)?('OK(redir->'+rt+')'):'OK';
    });
    await sleep(300);
  }
  let good=0,bad=0;
  console.log('=== CANDIDATE VERIFICATION ===');
  ids.forEach(id=>{
    const t=cand[id]; const s=okTitles[t];
    const flag=s.startsWith('OK')?'✓':'✗';
    if(s.startsWith('OK'))good++;else bad++;
    console.log(`  ${flag} ${id.padEnd(24)} "${t}"  => ${s}`);
  });
  console.log(`\ngood: ${good}  bad: ${bad}`);
})();
