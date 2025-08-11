---
layout: page
title: Links
permalink: /links/
---

Curated link collections by category.

{%- assign by_category = site.links | group_by: "category" -%}
{%- for grp in by_category -%}
### {{ grp.name }}
<ul>
  {%- assign items = grp.items | sort: "title" -%}
  {%- for item in items -%}
    <li>
      <a href="{{ item.url }}" target="_blank" rel="noopener">{{ item.title }}</a>
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
