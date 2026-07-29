const fs=require('fs');
const audit=require('./_wiki_audit_result.json');

// id -> verified new title
const NEW = {
  becker:'Howard S. Becker',
  coleman:'James Samuel Coleman',
  berger:'Peter L. Berger',
  functionalism:'Structural functionalism',
  class_struggle:'Class struggle',
  habitus:'Habitus (sociology)',
  rationalization_concept:'Rationalization (sociology)',
  alienation:"Marx's theory of alienation",
  field:'Field theory (sociology)',
  deviance:'Deviance (sociology)',
  late_modern:'Late modernity',
  world_systems:'World-systems theory',
  dramaturgical:'Dramaturgy (sociology)',
  institutionalism:'New institutionalism',
  social_fact:'Social fact',
  capital_forms:'Social capital',
  power_knowledge:'Power-knowledge',
  self_presentation:'Impression management',
  gender_system:'Sex\u2013gender distinction',
  social_construction:'Social constructionism',
  cultural_capital:'Cultural capital',
  symbolic_violence:'Symbolic violence',
  core_periphery:'Core\u2013periphery structure',
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

function toUrl(title){
  return 'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
}

// map id -> old url
const oldById={};
[...audit.dis,...audit.miss].forEach(x=>{ oldById[x.id]=x.wiki; });

let html=fs.readFileSync('sociology-map.html','utf8');
const report=[];
let failed=0;
for(const id of Object.keys(NEW)){
  const oldUrl=oldById[id];
  if(!oldUrl){ console.log('NO OLD URL for',id); failed++; continue; }
  const newUrl=toUrl(NEW[id]);
  // replace with trailing quote delimiter to avoid prefix collisions
  let done=false;
  for(const q of ["'",'"']){
    const from=oldUrl+q, to=newUrl+q;
    const cnt=html.split(from).length-1;
    if(cnt===1){ html=html.replace(from,to); report.push({id,oldUrl,newUrl,q}); done=true; break; }
    else if(cnt>1){ console.log('AMBIGUOUS('+cnt+')',id,from); failed++; done=true; break; }
  }
  if(!done){ console.log('NO MATCH',id,oldUrl); failed++; }
}

if(failed){ console.log('\nFAILED:',failed,'— NOT writing file.'); process.exit(1); }
fs.writeFileSync('sociology-map.html',html);
console.log('Applied',report.length,'wiki fixes:');
report.forEach(r=>console.log('  '+r.id.padEnd(24)+' -> '+r.newUrl));
