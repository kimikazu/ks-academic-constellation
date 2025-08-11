---
layout: page
title: Notes
permalink: /notes/
---

All research notes.

<ul>
{%- assign notes_sorted = site.notes | sort: "date" | reverse -%}
{%- for note in notes_sorted -%}
  <li>
    <a href="{{ note.url | relative_url }}">{{ note.title }}</a>
    <small> — {{ note.date | date: site.minima.date_format }}</small>
    {%- if note.tags and note.tags.size > 0 -%}
      <br/><small>Tags: 
        {%- for t in note.tags -%}
          <code>{{ t }}</code>{% unless forloop.last %}, {% endunless %}
        {%- endfor -%}
      </small>
    {%- endif -%}
  </li>
{%- endfor -%}
</ul>
