# Research Standard — The Unseen Past

The research gate is the pipeline's first and hardest gate. An episode with weak sources cannot be saved by good
animation. Spend the time here: a 5-minute episode makes 8–15 material factual claims, and every one of them will
be on screen with the channel's name under it.

## Source hierarchy

| Priority | Source type | Examples |
|---|---|---|
| 1 | Primary evidence | Parliamentary inquiries, court records, census records, factory inspector reports, inquest testimony |
| 2 | Museum & archive collections | National Archives (UK), British Library, Wellcome Collection, Library of Congress |
| 3 | Academic books & journals | Peer-reviewed history, university press monographs |
| 4 | Established historical institutions | UK Parliament Living Heritage, museum education pages |
| 5 | General articles & other YouTube | Topic discovery only — never cited as evidence |

Rule of thumb: Priority 1 gives you facts, Priority 2 gives you quotable evidence, Priority 3–4 gives you context
and framing, Priority 5 gives you nothing you may put in `research.json`.

## Mandatory research.json fields

See `schemas/research.schema.json`. Every episode must produce this file before scripting.

Required fields:

- `core_claim` — one falsifiable sentence
- `period` — { start_year, end_year }
- `location` — { city, region, country }
- `key_dates` — array of { date, event, source_id }
- `named_figures` — array of { name, role, source_id } (may be empty)
- `primary_sources` — at least 2 items, each with { source_id, title, institution, url, priority (1 or 2), quote_or_excerpt }
- `secondary_sources` — 1–3 items, priority 3 or 4
- `documented_facts` — array of statements with source_id
- `reconstructed_elements` — array of elements that are illustration, not evidence
- `composite_characters` — array (may be empty); if present, each must be flagged in script and on-screen
- `asset_licenses` — array of { asset_url, license, attribution_required }

Target size for a 300 s episode: 8–15 `documented_facts`, 2–4 `primary_sources`, 5–8 `key_dates`. Fewer facts than
8 and Act 3 (How It Worked, 90 s) will have nothing visual to explain.

## Worked citation line

A `primary_sources` entry, as it should actually look:

```json
{
  "source_id": "S1",
  "title": "Report of the Select Committee on the Chimney Sweepers Regulation Bill, minutes of evidence",
  "institution": "UK Parliament",
  "url": "https://www.parliament.uk/about/living-heritage/",
  "priority": 1,
  "quote_or_excerpt": "Montague Cole, master sweep, asked whether boys were put up flues while the chimney was still hot: 'It has been done, I am sorry to say.'"
}
```

And the script cites it inline: `"George Brewster was sent up a flue at Cambridge in 1875 [S1] …"`. The citation
system is the point: `validate-script` rejects any `[S#]` that does not resolve.

## Rejection rules

The skill must refuse to proceed to scripting if:

- Fewer than 2 primary sources exist
- The core claim cannot be tied to a specific source
- Any borrowed asset lacks a license entry
- Composite characters are not explicitly flagged as reconstructed
- A `documented_facts` entry has no resolvable `source_id`

Output exactly: `INSUFFICIENT SOURCES — cannot proceed to scripting`, and list what is missing.

## Source traps

- **OCR-mangled newspaper quotes.** 19th-century newspaper digitisations (British Newspaper Archive mirrors, Chronicling
  America) are OCR'd, and the OCR breaks on old type: "chimney" becomes "chimnev", "shan't" becomes "shau't", column
  order scrambles. Never quote a digitised newspaper verbatim without checking the OCR against the page image — and
  if you cannot see the image, paraphrase and mark the fact as paraphrase, not quotation.
- **A fact repeated is not a fact sourced.** Five blogs repeating "phosphorus necrosis was called 'phossy jaw'"
  all descend from one source. Trace to the oldest thing you can reach (the 1862 Annual Report of the Inspector of
  Factories, not the website that mentions it).
- **Secondary sources drift on numbers.** Death tolls and ages mutate between retellings (the matchgirls' strike is
  "1,400 women" and "over 1,500" depending on the source). Record the number only from the priority 1–2 source, and
  keep the exact wording of its claim in `quote_or_excerpt`.
- **Dates need a time zone of context.** "The Factory Act banned child labour" — which one? 1833 (textile factories),
  1842 (mines), 1844, 1847, 1878? Name the act and the year in `key_dates` or the script will assert the wrong one.
- **Borrowed images are licensed per-asset, not per-collection.** A public-domain scan on a modern website may still
  be cited under the site's licence; record the asset URL and its licence, not the site's homepage.
- **Anachronism lives in the sources too.** A Victorian illustration engraved decades after the event is a
  reconstruction of its subject — treat it as `reconstructed_elements`, never as period evidence of appearance.

## Research destinations

- UK Parliament: Living Heritage — https://www.parliament.uk/about/living-heritage/
- The National Archives (UK) — https://www.nationalarchives.gov.uk/
- British Library — https://www.bl.uk/
- Wellcome Collection — https://wellcomecollection.org/
- Library of Congress Free to Use — https://www.loc.gov/free-to-use/
- Wikimedia Commons — https://commons.wikimedia.org/ (verify per-asset license)

When access fails (paywalls, dead links), record what you could verify and what you could not. A fact you could not
verify does not go in the script, full stop.
