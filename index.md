---
layout: home
title: "Research Constellations / 研究の星座"
---

**A living lab notebook.** This site holds research notes, literature memos, and links that are still growing — unfinished ideas are welcome here, and each note shows how mature it is.
For my CV, publications, and projects, see the portfolio site.

**育てていく研究ノート。** このサイトには、書きかけのアイデアも含めた研究ノート・文献メモ・リンクを置いています。各ノートには成熟度（種／育成中／定着）を表示しています。
経歴・業績・プロジェクトはポートフォリオサイトをご覧ください。

→ [Portfolio / CV（ポートフォリオ・業績）](https://sites.google.com/view/ksugimori/CurriculumVitae)

## Recent notes / 最近のノート

<ul class="note-list">
{%- assign recent = site.notes | sort: "date" | reverse -%}
{%- for note in recent limit: 5 -%}
  <li>
    <a href="{{ note.url | relative_url }}">{{ note.title }}</a>
    {%- if note.title_ja %} <span class="ja">／{{ note.title_ja }}</span>{% endif %}
    <small> — {{ note.date | date: site.minima.date_format }}</small>
  </li>
{%- endfor -%}
</ul>

[All notes / すべてのノート →]({{ '/notes/' | relative_url }})

## Sections / 構成

- [Notes / ノート]({{ '/notes/' | relative_url }}) — research notes and diagrams / 研究ノート・図解
- [Links / リンク]({{ '/links/' | relative_url }}) — curated external links / 外部リンク集
- [Conferences / 学会資料]({{ '/confs/' | relative_url }}) — past conference resources / 過去大会リソース
- [Virtual Issue]({{ '/docs/virtual-issue/' | relative_url }}) — curated literature list / 論文リスト
