// Node 20+ で実行。作業ディレクトリは docs/virtual-issue を想定
import fs from 'node:fs/promises';
import path from 'node:path';

const CSV = path.resolve('items.csv');
const OUT = path.resolve('items.cache.json');
const REPO_HOST = 'hokuriku.repo.nii.ac.jp';
const EDU_SET_PREFIX = '29';

const splitCsvLine = line => {
  const re=/("([^"]|"")*"|[^,]+)/g; const out=[]; let m;
  while((m=re.exec(line))!==null) out.push(m[0].replace(/^"(.*)"$/,'$1').replace(/""/g,'"'));
  return out.map(s=>s.trim());
};
const isDOI = s => /^10\.\S+\/\S+$/i.test((s||'').trim());
const isHttp = s => /^https?:\/\//i.test(s||'');
const isWekoUrl = u => /\/records?\/\d+/.test(u||'');

const wekoAbs = (id,url)=>{
  if (isHttp(url) && isWekoUrl(url)) return url;
  const m = /\/records?\/(\d+)/.exec(url||''); const id2 = m?m[1] : (/^\d+$/.test(url||'')?url : (/^\d+$/.test(id||'')?id:''));
  return id2 ? `https://${REPO_HOST}/records/${id2}` : '';
};

async function readCsv(){
  const text = await fs.readFile(CSV,'utf8');
  const lines = text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  const header = splitCsvLine(lines.shift()).map(s=>s.toLowerCase());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  return lines.filter(Boolean).map(line=>{
    const c=splitCsvLine(line);
    return {
      id:(c[idx['id']]??'').trim(),
      url:(c[idx['url']]??'').trim(),
      type:(c[idx['type']]??'').trim().toLowerCase(),
      tags:(c[idx['tags']]??'').trim(),
      notes:(c[idx['notes']]??'').trim()
    };
  });
}

async function json(u){ const r=await fetch(u,{redirect:'follow'}); if(!r.ok) throw new Error(`${r.status}`); return r.json(); }

async function metaDOI(doi){
  const steps = [
    ['crossref', `https://api.crossref.org/works/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>({title:j.message?.title?.[0]||'',year:j.message?.issued?.['date-parts']?.[0]?.[0]||'',authors:(j.message?.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', '),journal:j.message?.['container-title']?.[0]||''})],
    ['doi.org-csl', `https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/vnd.citationstyles.csl+json'}, j=>({title:Array.isArray(j.title)?j.title[0]:(j.title||''),year:j.issued?.['date-parts']?.[0]?.[0]||'',authors:(j.author||[]).map(a=>a.family||a.given?[a.given,a.family].filter(Boolean).join(' '):(a.name||'')).join(', '),journal:Array.isArray(j['container-title'])?j['container-title'][0]:(j['container-title']||j['container-title-short']||'')})],
    ['datacite', `https://api.datacite.org/dois/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{const a=j.data?.attributes||{}; return {title:a.titles?.[0]?.title||'',year:a.publicationYear||'',authors:(a.creators||a.contributors||[]).map(p=>[p.givenName,p.familyName,p.name].filter(Boolean)[0]||'').filter(Boolean).join(', '),journal:(a.container?.title)||a.publisher||''};}],
    ['openalex', `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>({title:j.title||'',year:j.publication_year||(j.from_publication_date||'').slice(0,4)||'',authors:(j.authorships||[]).map(x=>x.author?.display_name).filter(Boolean).join(', '),journal:j.host_venue?.display_name||j.primary_location?.source?.display_name||''})]
  ];
  for (const [src,u,h,shape] of steps){
    try{ const j = await json(u,h); return {source:src, meta:shape(j)}; }catch{}
  }
  return {source:'none', meta:{title:'',authors:'',year:'',journal:''}};
}

async function metaWEKO(abs){
  const m = /\/records?\/(\d+)/.exec(abs||''); if(!m) return {source:'weko-json-fail', meta:{title:'',authors:'',year:'',journal:''}, edu:false};
  const api = `${new URL(abs).origin}/records/${m[1]}/export/json`;
  const j = await json(api);
  const md = j.metadata||{};
  const title = ([
    md.item_title,
    md.item_titles?.attribute_value_mlt?.[0]?.subitem_title,
    Array.isArray(j.title)?j.title[0]:j.title,
    md.title
  ].find(Boolean)||'').toString();
  const creators = md.item_creator?.attribute_value_mlt || md.creators || [];
  const names=[]; creators.forEach(c=>{ if(Array.isArray(c.creatorNames)) c.creatorNames.forEach(n=>n?.creatorName&&names.push(n.creatorName)); else if(c.creatorName) names.push(c.creatorName); else if(typeof c.name==='string') names.push(c.name); });
  const authors = names.filter(Boolean).join(', ');
  const bib = md.item_10002_biblio_info_7?.attribute_value_mlt?.[0] || {};
  const issued = bib.bibliographicIssueDates?.bibliographicIssueDate || md.publish_date || md.pubdate?.attribute_value || '';
  const year = (issued||'').toString().slice(0,4);
  const journal = (bib.bibliographic_titles?.[0]?.bibliographic_title) || '';
  const sets = md._oai?.sets || j.metadata?._oai?.sets || [];
  const eduHit = Array.isArray(sets) && sets.some(s=>(s||'').startsWith(EDU_SET_PREFIX));
  return {source:'weko-json'+(eduHit?'+edu':''), meta:{title,authors,year,journal}, edu:eduHit};
}

(async()=>{
  const rows = await readCsv();
  const out=[];
  for (const r of rows){
    const type = r.type || (isDOI(r.id)||isDOI(r.url) ? 'doi' : (isWekoUrl(r.url) ? 'weko' : 'url'));
    if (type==='doi'){
      const doi = r.id && isDOI(r.id) ? r.id : r.url.replace(/^https?:\/\/doi\.org\//i,'');
      const m = await metaDOI(doi);
      out.push({link:`https://doi.org/${encodeURIComponent(doi)}`, display:doi, tags:r.tags, notes:r.notes, source:m.source, meta:m.meta, edu:false});
    }else if (type==='weko'){
      const abs = wekoAbs(r.id,r.url);
      const m = await metaWEKO(abs);
      out.push({link:abs, display:abs||r.url||r.id, tags:r.tags, notes:r.notes, source:m.source, meta:m.meta, edu:m.edu});
    }else{
      out.push({link:isHttp(r.url)?r.url:'', display:r.url||r.id, tags:r.tags, notes:r.notes, source:'url', meta:{title:'',authors:'',year:'',journal:''}, edu:false});
    }
  }
  await fs.writeFile(OUT, JSON.stringify(out,null,2));
  console.log('wrote', OUT, 'items:', out.length);
})();
