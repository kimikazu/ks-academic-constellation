---
layout: page
title: Links
permalink: /links/
---

Curated link collections by category.

{%- comment -%}
カテゴリ未設定が混ざっても崩れないようにデフォルトカテゴリを当てる
{%- endcomment -%}
{%- assign by_category = site.links | group_by_exp: "i", "i.category | default: 'Uncategorized'" -%}
{% for grp in by_category %}

### {{ grp.name }}
<ul>
  {%- assign items = grp.items | sort: "title" -%}
  {%- for item in items -%}
    {%- assign href = item.href | default: item.url -%}
    {%- assign is_external = href contains '://' -%}
    {%- if is_external -%}
      {%- assign final = href -%}
      {%- assign extra = ' target="_blank" rel="noopener"' -%}
    {%- else -%}
      {%- assign final = href | relative_url -%}
      {%- assign extra = '' -%}
    {%- endif -%}
    <li>
      <a href="{{ final }}"{{ extra }}>{{ item.title | default: '(no title)' }}</a>
      {%- if item.tags and item.tags.size > 0 -%}
        <small> —
        {%- for t in item.tags -%}
          <code>{{ t }}</code>{% unless forloop.last %}, {% endunless %}
        {%- endfor -%}
        </small>
      {%- endif -%}
    </li>
  {%- endfor -%}
</ul>
{%- endfor -%}
