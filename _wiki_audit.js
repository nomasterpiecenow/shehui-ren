const fs = require('fs');
const list = JSON.parse(fs.readFileSync('_wiki_list.json','utf8'));

function parseWiki(url){
  // e.g. https://zh.wikipedia.org/wiki/Title  or  https://en.wikipedia.org/wiki/Title
  const m = url.match(/https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)$/);
  if(!m) return null;
  return { lang:m[1], title:decodeURIComponent(m[2].replace(/_/g,' ')) };
}

const UA = 'sociology-map-wiki-audit/1.0 (educational knowledge graph validation)';

async function queryBatch(lang, titles){
  // titles: array of decoded titles (max 50)
  const api = `https://${lang}.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action:'query', prop:'pageprops', ppprop:'disambiguation',
    titles: titles.join('|'), redirects:'1', format:'json', formatversion:'2'
  });
  let lastErr;
  for(let attempt=0; attempt<4; attempt++){
    try {
      const res = await fetch(api+'?'+params.toString(), { headers:{ 'User-Agent':UA } });
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    } catch(e){ lastErr=e; await sleep(800*(attempt+1)); }
  }
  throw lastErr;
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async ()=>{
  const noWiki = list.filter(n=>!n.wiki);
  const parsed = [];
  const bad = [];
  for(const n of list){
    if(!n.wiki) continue;
    const p = parseWiki(n.wiki);
    if(!p){ bad.push({...n, issue:'URL_UNPARSEABLE'}); continue; }
    parsed.push({ node:n, ...p });
  }

  // group by lang
  const byLang = {};
  parsed.forEach(p=>{ (byLang[p.lang]=byLang[p.lang]||[]).push(p); });

  const problems = [];

  for(const lang of Object.keys(byLang)){
    const items = byLang[lang];
    // build title -> items map (multiple nodes can share a title in theory)
    const CHUNK = lang==='zh' ? 12 : 40;
    for(let i=0;i<items.length;i+=CHUNK){
      const chunk = items.slice(i,i+CHUNK);
      const titles = [...new Set(chunk.map(c=>c.title))];
      let data;
      try { data = await queryBatch(lang, titles); }
      catch(e){ console.log('  ! query error', lang, e.message); await sleep(1000); continue; }

      const norm = {}; // normalized title -> resolved info
      const redirects = {}; // from -> to
      (data.query.redirects||[]).forEach(r=>{ redirects[r.from]=r.to; });
      const normalized = {};
      (data.query.normalized||[]).forEach(r=>{ normalized[r.from]=r.to; });
      const pages = {};
      (data.query.pages||[]).forEach(pg=>{ pages[pg.title]=pg; });

      function resolve(title){
        let t = normalized[title]||title;
        if(redirects[t]) t = redirects[t];
        return t;
      }

      chunk.forEach(c=>{
        const resolved = resolve(c.title);
        const pg = pages[resolved];
        const rec = { id:c.node.id, name:c.node.name, disc:c.node.disc, cat:c.node.cat, wiki:c.node.wiki, title:c.title };
        if(!pg || pg.missing){
          problems.push({ ...rec, issue:'MISSING_PAGE', resolved });
        } else if(pg.pageprops && 'disambiguation' in pg.pageprops){
          problems.push({ ...rec, issue:'DISAMBIGUATION', resolved });
        } else if(redirects[normalized[c.title]||c.title]){
          // redirect (not necessarily bad, but flag for info)
          problems.push({ ...rec, issue:'REDIRECT', resolved });
        }
      });
      await sleep(300);
    }
  }

  if(noWiki.length) console.log('Nodes WITHOUT wiki:', noWiki.map(n=>n.id+'('+n.disc+')').join(', '));
  if(bad.length) console.log('Unparseable URLs:', bad.map(n=>n.id).join(', '));

  const dis = problems.filter(p=>p.issue==='DISAMBIGUATION');
  const miss = problems.filter(p=>p.issue==='MISSING_PAGE');
  const redir = problems.filter(p=>p.issue==='REDIRECT');

  console.log('\n=== AUDIT RESULT ===');
  console.log('checked:', parsed.length, ' problems:', dis.length+miss.length);
  console.log('\n-- DISAMBIGUATION ('+dis.length+') --');
  dis.forEach(p=>console.log(`  [${p.disc}/${p.cat}] ${p.id} "${p.name}" -> ${p.wiki}`));
  console.log('\n-- MISSING ('+miss.length+') --');
  miss.forEach(p=>console.log(`  [${p.disc}/${p.cat}] ${p.id} "${p.name}" -> ${p.wiki}  (resolved: ${p.resolved})`));
  console.log('\n-- REDIRECT (info, '+redir.length+') --');
  redir.forEach(p=>console.log(`  [${p.disc}/${p.cat}] ${p.id} "${p.name}" : ${p.title} => ${p.resolved}`));

  fs.writeFileSync('_wiki_audit_result.json', JSON.stringify({ dis, miss, redir, noWiki, bad }, null, 2));
})();
