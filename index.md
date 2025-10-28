---
layout: home
title: Research Constellations
---

Welcome to my academic development portfolio. This site connects research threads, curated resources, and working notes—helping me see how seemingly distant ideas form a coherent constellation.

## Latest research notes
{%- assign latest_notes = site.notes | sort: "date" | reverse | slice: 0, 3 -%}
{%- if latest_notes.size > 0 -%}
<ul>
{%- for note in latest_notes -%}
  <li>
    <a href="{{ note.url | relative_url }}">{{ note.title }}</a>
    <small>({{ note.date | date: site.minima.date_format }})</small>
    {%- if note.tags and note.tags.size > 0 -%}
      —
      {%- for t in note.tags -%}
        <code>{{ t }}</code>{% unless forloop.last %}, {% endunless %}
      {%- endfor -%}
    {%- endif -%}
  </li>
{%- endfor -%}
</ul>
<p><a href="{{ '/notes/' | relative_url }}">Browse all notes →</a></p>
{%- else -%}
<p>No notes published yet.</p>
{%- endif -%}

## Curated link collections
<p>Selected organizations, research programs, and reference materials that guide my practice.</p>
{%- assign grouped_links = site.links | group_by_exp: "link", "link.category | default: 'Uncategorized'" -%}
<div class="link-grid">
  {%- for group in grouped_links -%}
    <section class="link-card">
      <h3>{{ group.name }}</h3>
      <ul>
        {%- assign sorted_links = group.items | sort: "title" -%}
        {%- for item in sorted_links -%}
          <li>
            <a href="{{ item.href }}" target="_blank" rel="noopener">{{ item.title }}</a>
            {%- if item.tags and item.tags.size > 0 -%}
              <small>
                {%- for t in item.tags -%}
                  <code>{{ t }}</code>{% unless forloop.last %}, {% endunless %}
                {%- endfor -%}
              </small>
            {%- endif -%}
          </li>
        {%- endfor -%}
      </ul>
    </section>
  {%- endfor -%}
</div>
<p><a href="{{ '/links/' | relative_url }}">View the full directory →</a></p>

## Tools & datasets
- <a href="{{ '/docs/virtual-issue/' | relative_url }}">Virtual issue builder</a> — DOI-driven reading list that caches metadata via GitHub Actions
- <a href="{{ '/docs/index.html' | relative_url }}">Literature dashboard</a> — quick search through curated CSV references

## Contact
- GitHub: <https://github.com/kimikazu>
- Website: <https://sites.google.com/view/ksugimori/>
