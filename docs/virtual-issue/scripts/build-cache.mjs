// Node 20+ / working dir: docs/virtual-issue
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
  const m = /\/records?\/(\d+)/.exec(url||'');
  const id2 = m ? m[1] : (/^\d+$/.test(url||'') ? url : (/^\d+$/.test(id||'') ? id : ''));
  return id2 ? `https://${REPO_HOST}/records/${id2}` : '';
};

async function readCsv(){
  const text = await fs.readFile(CSV,'utf8');
  const lines = text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  if (!lines.length) return [];
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

async function json(u, headers){ const r=await fetch(u,{redirect:'follow',headers}); if(!r.ok) throw new Error(`${r.status}`); return r.json(); }

/* ---------------- keywords helpers ---------------- */
const SEP=/[,;|／・、，\s　]/; // 多言語区切り + 空白
function normalizeKeywords(arr){
  const flat = (arr||[]).flatMap(v=>{
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(SEP);
  }).map(s=>s.trim())
    .filter(Boolean)
    // ノイズ除去（1文字は除外、汎用語は軽く除外）
    .filter(k => k.length >= 2 && !/^(研究|報告|論文|序|はじめに|まとめ|検討|事例|考察|教育|紀要)$/i.test(k));

  const seen=new Set(), out=[];
  for (const k of flat){
    const key=k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key); out.push(k);
    if (out.length>=16) break; // 上限
  }
  return out;
}

// 深掘りで "keyword/subject/件名/キーワード/タグ" を拾う（WEKO はフィールド名が揺れる）
function deepCollectKeywords(obj, out=[]){
  if (!obj || typeof obj !== 'object') return out;
  for (const [k,v] of Object.entries(obj)){
    const key = k.toLowerCase();
    const isKW = /(keyword|subject|件名|キーワード|タグ|テーマ)/i.test(k);
    if (isKW){
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) out.push(...v);
      else if (typeof v === 'object'){
        // よくある subitem_keyword / subitem_subject / attribute_value_mlt など
        if (Array.isArray(v.attribute_value_mlt)){
          out.push(...v.attribute_value_mlt.map(x=>x?.subitem_keyword||x?.subitem_subject||x).filter(Boolean));
        }else{
          // オブジェクトの文字列値をかき集める
          for (const vv of Object.values(v)){
            if (typeof vv === 'string') out.push(vv);
            else if (Array.isArray(vv)) out.push(...vv);
          }
        }
      }
    }
    if (typeof v === 'object') deepCollectKeywords(v, out);
  }
  return out;
}

// タグ/ノート/タイトルから最後の保険を作る
function fallbackKeywords({tags, notes, title}){
  const base = [];
  if (tags) base.push(tags);
  if (notes) base.push(notes);
  // タイトルは名詞抽出が無いとノイズになりがちなので、全角スペースや「・」「—」で軽く分割
  if (title) base.push(String(title).split(/[・—\-:：\s　]/).filter(Boolean).slice(0,6).join(','));
  return normalizeKeywords(base);
}

/* ---------------- metadata (DOI) ---------------- */
async function metaDOI(doi){
  const steps = [
    ['crossref', `https://api.crossref.org/works/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const m=j.message||{};
      const kws = normalizeKeywords(m.subject||[]);
      return {meta:{title:m.title?.[0]||'',year:m.issued?.['date-parts']?.[0]?.[0]||'',authors:(m.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', '),journal:m['container-title']?.[0]||''}, keywords:kws};
    }],
    ['doi.org-csl', `https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/vnd.citationstyles.csl+json'}, j=>{
      const kw = j.keyword || j.keywords || j.categories;
      const kws = normalizeKeywords(Array.isArray(kw)?kw:String(kw||''));
      return {meta:{title:Array.isArray(j.title)?j.title[0]:(j.title||''),year:j.issued?.['date-parts']?.[0]?.[0]||'',authors:(j.author||[]).map(a=>a.family||a.given?[a.given,a.family].filter(Boolean).join(' '):(a.name||'')).join(', '),journal:Array.isArray(j['container-title'])?j['container-title'][0]:(j['container-title']||j['container-title-short']||'')}, keywords:kws};
    }],
    ['datacite', `https://api.datacite.org/dois/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const a=j.data?.attributes||{};
      const kws = normalizeKeywords((a.subjects||[]).map(s=>s.subject));
      return {meta:{title:a.titles?.[0]?.title||'',year:a.publicationYear||'',authors:(a.creators||a.contributors||[]).map(p=>[p.givenName,p.familyName,p.name].filter(Boolean)[0]||'').filter(Boolean).join(', '),journal:(a.container?.title)||a.publisher||''}, keywords:kws};
    }],
    ['openalex', `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const kws = normalizeKeywords((j.concepts||[]).slice(0,12).map(c=>c.display_name));
      return {meta:{title:j.title||'',year:j.publication_year||(j.from_publication_date||'').slice(0,4)||'',authors:(j.authorships||[]).map(x=>x.author?.display_name).filter(Boolean).join(', '),journal:j.host_venue?.display_name||j.primary_location?.source?.display_name||''}, keywords:kws};
    }]
  ];
  for (const [source,u,h,shape] of steps){
    try{ const j = await json(u,h); const shaped=shape(j); return {source, meta:shaped.meta, keywords:shaped.keywords}; }catch{}
  }
  return {source:'none', meta:{title:'',authors:'',year:'',journal:''}, keywords:[]};
}

/* ---------------- metadata (WEKO) ---------------- */
async function metaWEKO(abs){
  const m = /\/records?\/(\d+)/.exec(abs||''); if(!m) return {source:'weko-json-fail', meta:{title:'',authors:'',year:'',journal:''}, keywords:[], edu:false};
  const api = `${new URL(abs).origin}/records/${m[1]}/export/json`;
  const j = await json(api);
  const md = j.metadata||{};

  // title
  const title = ([
    md.item_title,
    md.item_titles?.attribute_value_mlt?.[0]?.subitem_title,
    Array.isArray(j.title)?j.title[0]:j.title,
    md.title
  ].find(Boolean)||'').toString();

  // authors
  const creators = md.item_creator?.attribute_value_mlt || md.creators || [];
  const names=[]; creators.forEach(c=>{
    if(Array.isArray(c.creatorNames)) c.creatorNames.forEach(n=>n?.creatorName&&names.push(n.creatorName));
    else if(c.creatorName) names.push(c.creatorName);
    else if(typeof c.name==='string') names.push(c.name);
  });
  const authors = names.filter(Boolean).join(', ');

  // year/journal
  const bib = md.item_10002_biblio_info_7?.attribute_value_mlt?.[0] || {};
  const issued = bib.bibliographicIssueDates?.bibliographicIssueDate || md.publish_date || md.pubdate?.attribute_value || '';
  const year = (issued||'').toString().slice(0,4);
  const journal = (bib.bibliographic_titles?.[0]?.bibliographic_title) || '';

  // ---- keywords from WEKO ----
  // 代表的フィールド + 深掘りスキャン
  const candidates = [
    md.item_keywords?.attribute_value_mlt?.map(x=>x.subitem_keyword),
    md.item_keyword?.attribute_value_mlt?.map(x=>x.subitem_keyword),
    md.item_subject?.attribute_value_mlt?.map(x=>x.subitem_subject),
    md.keywords, md.keyword, md.subject, j.keywords, j.subject
  ];
  const deep = deepCollectKeywords(md);
  const keywords0 = normalizeKeywords(candidates.flat().concat(deep));
  // 教育インデックス
  const sets = md._oai?.sets || j.metadata?._oai?.sets || [];
  const eduHit = Array.isArray(sets) && sets.some(s=>(s||'').startsWith(EDU_SET_PREFIX));

  return {
    source:'weko-json'+(eduHit?'+edu':''),
    meta:{title,authors,year,journal},
    keywords: keywords0,
    edu:eduHit
  };
}

/* ---------------- main ---------------- */
(async()=>{
  const rows = await readCsv();
  const out=[];
  for (const r of rows){
    const type = r.type || (isDOI(r.id)||isDOI(r.url) ? 'doi' : (isWekoUrl(r.url) ? 'weko' : 'url'));
    if (type==='doi'){
      const doi = r.id && isDOI(r.id) ? r.id : r.url.replace(/^https?:\/\/doi\.org\//i,'');
      const m = await metaDOI(doi);
      const kw = m.keywords.length ? m.keywords : fallbackKeywords({tags:r.tags, notes:r.notes, title:m.meta.title});
      out.push({link:`https://doi.org/${encodeURIComponent(doi)}`, display:doi, tags:r.tags, notes:r.notes, source:m.source, meta:m.meta, keywords:kw, edu:false});
    }else if (type==='weko'){
      const abs = wekoAbs(r.id,r.url);
      const m = await metaWEKO(abs);
      const kw = m.keywords.length ? m.keywords : fallbackKeywords({tags:r.tags, notes:r.notes, title:m.meta.title});
      out.push({link:abs, display:abs||r.url||r.id, tags:r.tags, notes:r.notes, source:m.source, meta:m.meta, keywords:kw, edu:m.edu});
    }else{
      const kw = fallbackKeywords({tags:r.tags, notes:r.notes, title:''});
      out.push({link:isHttp(r.url)?r.url:'', display:r.url||r.id, tags:r.tags, notes:r.notes, source:'url', meta:{title:'',authors:'',year:'',journal:''}, keywords:kw, edu:false});
    }
  }
  await fs.writeFile(OUT, JSON.stringify(out,null,2));
  console.log('wrote', OUT, 'items:', out.length);
})();
