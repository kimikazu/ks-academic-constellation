---
layout: page
title: Search
permalink: /search/
---

<label for="q">サイト内検索</label><br>
<input id="q" type="search" placeholder="キーワードを入力" style="width:100%;padding:.6rem;margin:.3rem 0;">
<div id="results"></div>

<!-- Fuse.js（CDN） -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7"></script>

<script>
(async function(){
  const res = await fetch('{{ "/search.json" | relative_url }}');
  const data = await res.json();

  // Fuse 設定（日本語向け：位置無視＆曖昧一致を少し弱める）
  const fuse = new Fuse(data, {
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    threshold: 0.3,                 // 0に近いほど厳密
    keys: ['title', 'content', 'tags']
  });

  const input = document.getElementById('q');
  const out   = document.getElementById('results');

  // クエリから事前入力 ?q=...
  const params = new URLSearchParams(location.search);
  if (params.get('q')) input.value = params.get('q');

  function excerpt(text, q){
    if (!text) return '';
    const i = text.indexOf(q);
    const start = Math.max(0, i - 40);
    const end   = Math.min(text.length, (i<0?0:i) + 160);
    return (start>0?'…':'') + text.slice(start, end) + (end<text.length?'…':'');
  }

  function render(q){
    if (!q) { out.innerHTML = '<p>キーワードを入力してください。</p>'; return; }
    const hits = fuse.search(q).slice(0, 50);
    out.innerHTML = hits.map(h => {
      const item = h.item;
      const ex = excerpt(item.content, q);
      return `
        <article style="margin:.8rem 0;border-bottom:1px solid #eee;padding-bottom:.6rem">
          <h3 style="margin:.2rem 0">
            <a href="${item.url}">${item.title}</a>
          </h3>
          <div style="color:#666;font-size:.9rem">
            ${item.collection ? '['+item.collection+'] ' : ''}${item.updated??''}
          </div>
          <p style="margin:.4rem 0 0">${ex.replaceAll(q, '<mark>'+q+'</mark>')}</p>
        </article>`;
    }).join('') || '<p>該当なし。</p>';
  }

  input.addEventListener('input', e => render(e.target.value.trim()));
  render(input.value.trim());
})();
</script>
