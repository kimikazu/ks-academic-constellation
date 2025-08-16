---
layout: page
title: Links
permalink: /links/
---

Curated link collections by category. <br><br>

{%- assign by_category = site.links | group_by: "category" -%}
{%- for grp in by_category -%}
### {{ grp.name }}
<ul>
  {%- assign items = grp.items | sort: "title" -%}
  {%- for item in items -%}
    {%- assign href = item.href | default: item.url -%}
    {%- comment %} 外部か内部かを判定 {% endcomment -%}
    {%- if href contains '://' -%}
      {%- assign final = href -%}
    {%- else -%}
      {%- assign final = href | relative_url -%}
    {%- endif -%}
    <li>
      <a href="{{ final }}" {%- if href contains '://' -%} target="_blank" rel="noopener"{%- endif -%}>{{ item.title }}</a>
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
