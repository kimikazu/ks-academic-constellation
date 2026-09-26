# ks-academic-constellation

A living lab notebook: research notes, literature memos, and links, connected like constellations.
研究テーマや知識を星座のように結びつける、育てていく研究ノート（ラボノート）です。

Site / サイト: https://kimikazu.github.io/ks-academic-constellation/

## Role / 役割

| | Portfolio (Google Sites) | This site / このサイト |
|---|---|---|
| Purpose / 目的 | Finished, evaluated work / 完成した実績を見せる | Work in progress, connected / 考えている途中を残し、つなげる |
| Content / 中身 | CV, publications, projects, contact / 経歴・業績・プロジェクト・連絡先 | Notes, literature memos, diagrams, links, conference resources / ノート・文献メモ・図解・リンク・学会資料 |
| Updates / 更新 | A few times a year / 年に数回 | Small and frequent / 小さく何度も |

Portfolio / CV: https://sites.google.com/view/ksugimori/CurriculumVitae

Rule of thumb: finished and evaluated → portfolio; still growing → here. Do not duplicate; link instead.
判断基準：完成して評価されるもの → ポートフォリオ、育てていくもの → ここ。重複させずリンクでつなぐ。

## Structure / 構成

| Path | Content / 中身 |
|---|---|
| `_notes/` | Research notes (one page each) / 研究ノート（1ノート1ページ） |
| `_links/` | External link records (no individual pages) / 外部リンクの台帳（個別ページなし） |
| `_templates/` | Templates for new notes and links (not published) / 新規作成用テンプレート（非公開） |
| `_data/labels.yml` | Bilingual labels for type and status / 種類・成熟度の英日ラベル |
| `confs.md` | Past conference resources / 過去大会リソース |
| `docs/virtual-issue/` | Literature list built from `items.csv` (auto-built by GitHub Actions) / `items.csv` から自動生成する論文リスト |

## Writing a note / ノートの書き方

Copy `_templates/note.md` to `_notes/YYYY-MM-DD-slug.md` and fill in the front matter.
`_templates/note.md` を `_notes/YYYY-MM-DD-slug.md` にコピーして Front Matter を埋めます。

| Field | Required | Values / 値 |
|---|---|---|
| `title` / `title_ja` | yes / 必須 | English and Japanese titles / 英語・日本語タイトル |
| `date` | yes / 必須 | Created date / 作成日 |
| `updated` | – | Last substantial update / 大きな更新日 |
| `type` | – (default `note`) | `note` `literature` `concept` `conference` `diagram` |
| `status` | – (default `seed`) | `seed` 種 · `growing` 育成中 · `evergreen` 定着 |
| `lang` | – | Main language of the body / 本文の主言語: `ja` `en` `bilingual` |
| `tags` | – | Lowercase, hyphenated English / 英小文字・ハイフン区切り |
| `summary` / `summary_ja` | recommended / 推奨 | One-line summaries / 一行要約 |

The body can be in either language; the other language is covered by the title and summary.
本文はどちらの言語でもよく、もう一方の言語はタイトルと要約で補います。

Diagrams: fenced ` ```mermaid ` blocks are rendered automatically. / Mermaid のコードブロックは自動で図になります。
