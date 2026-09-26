---
layout: page
title: "Notes / ノート"
permalink: /notes/
---

Research notes in progress — ideas, diagrams, and literature memos. Each note shows its maturity.
育成中の研究ノート（アイデア・図解・文献メモ）です。各ノートに成熟度を表示しています。

{% assign L = site.data.labels -%}
<p><small>
{%- for s in L.status -%}
<span class="note-badge note-status-{{ s[0] }}" title="{{ s[1].hint }}">{{ s[1].en }} / {{ s[1].ja }}</span>
{%- endfor -%}
</small></p>

<ul class="note-list">
{%- assign notes_sorted = site.notes | sort: "date" | reverse -%}
{%- for note in notes_sorted -%}
  {%- assign t = L.type[note.type] -%}
  {%- assign s = L.status[note.status] -%}
  <li>
    <a href="{{ note.url | relative_url }}">{{ note.title }}</a>
    {%- if note.title_ja %}<br/><span class="ja">{{ note.title_ja }}</span>{% endif %}
    <br/><small>
      {{ note.date | date: site.minima.date_format }}
      {%- if note.updated %} (upd. {{ note.updated | date: site.minima.date_format }}){% endif %}
      {%- if t %} · {{ t.en }} / {{ t.ja }}{% endif -%}
      {%- if s %} · <span class="note-badge note-status-{{ note.status }}">{{ s.en }} / {{ s.ja }}</span>{% endif -%}
      {%- if note.tags and note.tags.size > 0 %} ·
        {% for tag in note.tags %}<code>{{ tag }}</code>{% unless forloop.last %}, {% endunless %}{% endfor %}
      {%- endif %}
    </small>
  </li>
{%- endfor -%}
</ul>
