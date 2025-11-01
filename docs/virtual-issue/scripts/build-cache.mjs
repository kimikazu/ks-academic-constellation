// Node 20+ / working dir: docs/virtual-issue
import fs from 'node:fs/promises';
import path from 'node:path';

const CSV = path.resolve('items.csv');
const OUT = path.resolve('items.cache.json');
const REPO_HOST = 'hokuriku.repo.nii.ac.jp';    // 既定のWEKOホスト（ID→URL化用）
const EDU_SET_PREFIX = '29';
const LANG_PREF = ['ja', 'jpn', 'ja-jp', 'jp'];

const SEP=/[,;|／・、，\s　]/;
const looksJa = s => /[\u3040-\u30ff\u3400-\u9fff]/.test(String(s||''));
const isDOI = s => /^10\.\S+\/\S+$/i.test((s||'').trim());
const isHttp = s => /^https?:\/\//i.test(s||'');
const isWekoUrl = u => /\/records?\/\d+/.test(u||'');

const splitCsvLine = line => {
  const re=/("([^"]|"")*"|[^,]+)/g; const out=[]; let m;
  while((m=re.exec(line))!==null) out.push(m[0].replace(/^"(.*)"$/,'$1').replace(/""/g,'"'));
  return out.map(s=>s.trim());
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
async function text(u, headers){ const r=await fetch(u,{redirect:'follow',headers}); if(!r.ok) throw new Error(`${r.status}`); return {url:r.url, body:await r.text()}; }

const wekoAbs = (id,url)=>{
  if (isHttp(url) && isWekoUrl(url)) return url;
  const m = /\/records?\/(\d+)/.exec(url||'');
  const id2 = m ? m[1] : (/^\d+$/.test(url||'')?url : (/^\d+$/.test(id||'')?id:''));
  return id2 ? `https://${REPO_HOST}/records/${id2}` : '';
};

/* ---------- keywords ---------- */
function normalizeKeywords(arr){
  const flat = (arr||[]).flatMap(v=>{
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(SEP);
  }).map(s=>s.trim())
    .filter(Boolean)
    .filter(k => k.length >= 2 && !/^(研究|報告|論文|序|はじめに|まとめ|検討|事例|考察|教育|紀要)$/i.test(k));
  const seen=new Set(), out=[];
  for (const k of flat){
    const key=k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key); out.push(k);
    if (out.length>=16) break;
  }
  return out;
}
function deepCollectKeywords(obj, out=[]){
  if (!obj || typeof obj !== 'object') return out;
  for (const [k,v] of Object.entries(obj)){
    if (/(keyword|subject|件名|キーワード|タグ|テーマ)/i.test(k)){
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) out.push(...v);
      else if (typeof v === 'object'){
        if (Array.isArray(v.attribute_value_mlt)){
          out.push(...v.attribute_value_mlt.map(x=>x?.subitem_keyword||x?.subitem_subject||x).filter(Boolean));
        }else{
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
function fallbackKeywords({tags, notes, title}){
  const base = [];
  if (tags) base.push(tags);
  if (notes) base.push(notes);
  if (title) base.push(String(title).split(/[・—\-:：\s　]/).filter(Boolean).slice(0,6).join(','));
  return normalizeKeywords(base);
}

/* ---------- WEKO metadata ---------- */
function pickWekoTitle(md, j){
  // 優先順: item_title（単一日本語のことが多い）→ item_titles の ja/未指定 → 先頭
  if (md.item_title) return String(md.item_title);
  const list = md.item_titles?.attribute_value_mlt || [];
  const findByLang = langs => list.find(x => langs.includes(String(x?.subitem_title_language||'').toLowerCase()));
  const ja = findByLang(LANG_PREF);
  const und = list.find(x => !x?.subitem_title_language); // 言語未指定（多くは日本語）
  return String((ja?.subitem_title || und?.subitem_title || list[0]?.subitem_title || j.title || md.title || ''));
}
async function metaWEKO(abs){
  const m = /\/records?\/(\d+)/.exec(abs||''); if(!m) return {source:'weko-json-fail', meta:{title:'',authors:'',year:'',journal:''}, keywords:[], edu:false};
  const api = `${new URL(abs).origin}/records/${m[1]}/export/json`;
  const j = await json(api);
  const md = j.metadata||{};

  const title = pickWekoTitle(md, j);

  const creators = md.item_creator?.attribute_value_mlt || md.creators || [];
  const names=[]; creators.forEach(c=>{
    if(Array.isArray(c.creatorNames)) c.creatorNames.forEach(n=>n?.creatorName&&names.push(n.creatorName));
    else if(c.creatorName) names.push(c.creatorName);
    else if(typeof c.name==='string') names.push(c.name);
  });
  const authors = names.filter(Boolean).join(', ');

  const bib = md.item_10002_biblio_info_7?.attribute_value_mlt?.[0] || {};
  const issued = bib.bibliographicIssueDates?.bibliographicIssueDate || md.publish_date || md.pubdate?.attribute_value || '';
  const year = (issued||'').toString().slice(0,4);
  const journal = (bib.bibliographic_titles?.[0]?.bibliographic_title) || '';

  const candidates = [
    md.item_keywords?.attribute_value_mlt?.map(x=>x.subitem_keyword),
    md.item_keyword?.attribute_value_mlt?.map(x=>x.subitem_keyword),
    md.item_subject?.attribute_value_mlt?.map(x=>x.subitem_subject),
    md.keywords, md.keyword, md.subject, j.keywords, j.subject
  ];
  const deep = deepCollectKeywords(md);
  const keywords = normalizeKeywords(candidates.flat().concat(deep));

  const sets = md._oai?.sets || j.metadata?._oai?.sets || [];
  const eduHit = Array.isArray(sets) && sets.some(s=>(s||'').startsWith(EDU_SET_PREFIX));

  return {source:'weko-json'+(eduHit?'+edu':''), meta:{title,authors,year,journal}, keywords, edu:eduHit};
}

/* ---------- DOI metadata ---------- */
function pickDataCiteTitle(a){
  const list = a.titles || [];
  const normLang = v => String(v||'').toLowerCase();
  const byLang = list.find(t => LANG_PREF.includes(normLang(t.lang || t.language || t['xml:lang'])));
  return (byLang?.title) || (list[0]?.title) || '';
}

async function metaDOI_fromAPIs(doi){
  const steps = [
    ['datacite', `https://api.datacite.org/dois/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const a=j.data?.attributes||{};
      const title = pickDataCiteTitle(a);
      const meta = {
        title,
        year: a.publicationYear || '',
        authors: (a.creators||a.contributors||[]).map(p=>[p.givenName,p.familyName,p.name].filter(Boolean)[0]||'').filter(Boolean).join(', '),
        journal: (a.container?.title) || a.publisher || ''
      };
      const keywords = normalizeKeywords((a.subjects||[]).map(s=>s.subject));
      return {meta, keywords};
    }],
    ['crossref', `https://api.crossref.org/works/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const m=j.message||{};
      // Crossrefは言語付き配列を明示的に返さないことが多い。languageがjaならそのまま。
      const title = (m.title?.[0]) || '';
      const meta = {
        title,
        year: m.issued?.['date-parts']?.[0]?.[0] || '',
        authors: (m.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', '),
        journal: m['container-title']?.[0] || ''
      };
      const keywords = normalizeKeywords(m.subject||[]);
      return {meta, keywords};
    }],
    ['doi.org-csl', `https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/vnd.citationstyles.csl+json'}, j=>{
      // CSL-JSONは multi言語を持つ可能性があるがベンダー依存。ここではそのまま。
      const meta = {
        title: Array.isArray(j.title)? j.title[0] : (j.title||''),
        year: j.issued?.['date-parts']?.[0]?.[0] || '',
        authors: (j.author||[]).map(a=>a.family||a.given?[a.given,a.family].filter(Boolean).join(' '):(a.name||'')).join(', '),
        journal: Array.isArray(j['container-title'])? j['container-title'][0] : (j['container-title']||j['container-title-short']||'')
      };
      const kw = j.keyword || j.keywords || j.categories;
      const keywords = normalizeKeywords(Array.isArray(kw)?kw:String(kw||''));
      return {meta, keywords};
    }],
    ['openalex', `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`, {'Accept':'application/json'}, j=>{
      const meta = {
        title: j.title || '',
        year: j.publication_year || (j.from_publication_date||'').slice(0,4) || '',
        authors: (j.authorships||[]).map(x=>x.author?.display_name).filter(Boolean).join(', '),
        journal: j.host_venue?.display_name || j.primary_location?.source?.display_name || ''
      };
      const keywords = normalizeKeywords((j.concepts||[]).slice(0,12).map(c=>c.display_name));
      return {meta, keywords};
    }],
  ];

  for (const [source,u,h,shape] of steps){
    try{ const j = await json(u,h); const shaped=shape(j); return {source, ...shaped}; }catch{}
  }
  return {source:'none', meta:{title:'',authors:'',year:'',journal:''}, keywords:[]};
}

// DOIの最終着地を追って、日本語タイトルを拾う（WEKOならJSONに切替）
async function metaDOI_tryLanding(doi){
  try{
    const {url, body} = await text(`https://doi.org/${encodeURIComponent(doi)}`);
    // WEKOなら export/json を使って日本語優先取得
    const m = /\/\/[^\/]*repo\.nii\.ac\.jp\/records?\/(\d+)/i.exec(url);
    if (m){
      const abs = `https://${new URL(url).host}/records/${m[1]}`;
      return await metaWEKO(abs);
    }
    // 汎用: citation_title / og:title / <title> を拾う（日本語なら採用）
    const pick = (...res)=>res.find(Boolean);
    const metaTitle =
      (body.match(/<meta[^>]+name=["']citation_title["'][^>]*content=["']([^"']+)/i)||[])[1] ||
      (body.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)/i)||[])[1] ||
      (body.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1] || '';
    if (looksJa(metaTitle)) return {source:'doi-landing', meta:{title:metaTitle, authors:'', year:'', journal:''}, keywords:[] , edu:false};
  }catch{}
  return null;
}

/* ---------- main ---------- */
(async()=>{
  const rows = await readCsv();
  const out=[];
  for (const r of rows){
    const type = r.type || (isDOI(r.id)||isDOI(r.url) ? 'doi' : (isWekoUrl(r.url) ? 'weko' : 'url'));

    if (type==='doi'){
      const doi = r.id && isDOI(r.id) ? r.id : r.url.replace(/^https?:\/\/doi\.org\//i,'');
      // まずAPI群
      let x = await metaDOI_fromAPIs(doi);
      let edu = false;

      // タイトルが英語っぽい場合、日本語が取れるならランディングで補正
      if (!looksJa(x.meta.title)){
        const land = await metaDOI_tryLanding(doi);
        if (land) edu = Boolean(land.edu);
        if (land && looksJa(land.meta.title)) {
          // 既存メタの欠損を補いつつ、タイトルだけ日本語で上書き
          x.meta.title = land.meta.title || x.meta.title;
          // WEKOから追加でキーワード/年/誌名が取れたらマージ
          if (land.meta.journal && !x.meta.journal) x.meta.journal = land.meta.journal;
          if (land.meta.year && !x.meta.year) x.meta.year = land.meta.year;
          if ((land.keywords||[]).length) x.keywords = normalizeKeywords([...(x.keywords||[]), ...land.keywords]);
          x.source = land.source + '+doi';
        }
      }

      const kw = (x.keywords||[]).length ? x.keywords : fallbackKeywords({tags:r.tags, notes:r.notes, title:x.meta.title});
      out.push({
        link:`https://doi.org/${encodeURIComponent(doi)}`,
        display:doi, tags:r.tags, notes:r.notes,
        source:x.source, meta:x.meta, keywords:kw, edu
      });

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
