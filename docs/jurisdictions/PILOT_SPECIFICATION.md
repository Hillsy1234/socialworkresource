# England–Wales pilot specification

Historical design record. Current coverage and final release status are documented in [FINAL_RELEASE.md](FINAL_RELEASE.md). The final learning-guide release is separate from professional review and public deployment status.

Prepared: 8 September 2026. Status: first-stage specification complete; implementation and Wales authoring not started.

The pilot will let a social worker choose where they practise and receive a consistent set of learning resources for England or Wales. Country selection must affect the articles, tools, search, downloads and professional-development guidance together.

Supporting documents: [complete content map](CONTENT_MAP.md) and [Wales source register](WALES_SOURCES.md).

## 1. Scope and decisions

- Retain the existing static HTML/CSS/JavaScript application. No new framework, account system, database or AI-generated live legal advice is required.
- Pilot jurisdictions: England (`england`) and Wales (`wales`). Design identifiers to accommodate nations and, later, states/provinces; do not force every jurisdiction into a sovereign-country model.
- Keep the eight broad topic groups, while giving each jurisdiction appropriate module titles and content. Wales care/support must not appear under a Care Act heading.
- Initial Wales copy will be in English, with official Welsh-language source links where available. Store content language independently from jurisdiction so reviewed Welsh translations can be added later. Selecting Wales does not imply Welsh-language translation.
- Retain the existing adult-social-work emphasis and children/family/transition coverage. The pilot does not claim to be an exhaustive guide to every specialist practice area.
- Present local policy and cross-border issues as matters to check. Country selection alone cannot establish the governing law or responsible authority for a particular case.
- Complete a local working preview before publication. Only reviewed resources are eligible for public availability; unfinished topics display their actual status.

## 2. User experience

Place a labelled native select, “Where do you practise?”, at the top of the learning workspace above search/navigation. Keep the current jurisdiction visible while reading and expose the control directly on small screens. Use written names rather than flags alone.

Example presentation:

```text
Where do you practise?  [ Wales ▾ ]
Wales practice guide · Content language: English

Care and support | Mental capacity | Safeguarding | CPD
```

The selection is explicit; no IP-based or device-language inference is needed. On a first visit with no jurisdiction in the URL or stored preference, retain England for continuity and display it clearly.

When switching:

1. Save any in-progress CPD form to its originating jurisdiction as a local draft before replacing the view. If saving is unavailable, keep the form and show an actionable save/export message; do not discard it.
2. Load the destination manifest and its content into temporary state. During loading, disable practice actions and announce progress.
3. Once loaded, replace jurisdiction, resource registry, articles, route data, search index, glossary, alerts and counters together. Prevent old requests from overwriting a more recent selection.
4. Stay on the equivalent broad topic where it exists. Otherwise show the destination overview or an explicit unavailable-topic message. Clear prior route answers, flashcard state and search results; do not reinterpret them silently.
5. Update the URL and remembered preference, visibly announce the change and retain sensible keyboard focus.

If loading fails, retain the previous working pack with its previous label and offer retry. Never show England tool results beneath a Wales heading. An unsupported jurisdiction must show “not available” and a way to choose a supported location, without pretending the request succeeded.

## 3. Content structure

Introduce an explicit manifest consumed by both the browser and the static-page generator. Keep shared material opt-in: a missing Wales file must not fall back to England.

Proposed structure (to be created during implementation):

```text
content/
  jurisdictions.json
  shared/                         # Only explicitly reviewed shared material
  england/
    manifest.json
    resources/
    tools/
  wales/
    manifest.json
    resources/
    tools/
```

Each resource needs a stable ID, broad `topicId`, title, summary, group, source path, language, applicable jurisdictions, publication status, content version, source references and review record. Shared entries must explicitly declare applicability. Record `sourceCheckedAt` separately from `practiceReviewedAt`; a file-generation date is neither.

Tool packs cover routes, flashcards, glossary, templates, scenarios, student learning steps, theory/model associations and CPD configuration. Every answer or route must reference a reviewed resource/source and resolve within the active manifest. Dynamic totals must reflect available content, not the current hard-coded 26/8/40 counts.

Use broad topic keys such as `care-support`, `mental-capacity`, `liberty`, `mental-health`, `adult-safeguarding` and `children-transition` for switching. Preserve current England resource IDs, including `care-act`, as compatibility aliases rather than repurposing them as Welsh statute names.

## 4. URLs and generated pages

The interactive URL should carry both values, for example `/?jurisdiction=wales&resource=care-support#readerSection`.

Resolution order:

1. Explicit jurisdiction in a valid link wins over browser preference.
2. A legacy resource/section/hash link without jurisdiction resolves to England, preserving its original meaning.
3. A bare homepage uses the remembered jurisdiction, or England when none is stored.

Preserve old England `learning/` links. Add jurisdiction-scoped generated routes such as `/learning/wales/care-and-support.html`; choose canonical England routes and compatibility aliases in the generator without breaking existing bookmarks. Set correct jurisdiction metadata and review dates on HTML pages and AI-facing indexes. Distinguish jurisdiction from language; do not invent a language tag to encode Wales.

Draft topics are excluded from public navigation/search/indexes except deliberate availability notices. Local previews may expose drafts with prominent status labels. Browser Back/Forward must restore the matching pack and resource, including unsaved-form protection.

## 5. Progress and CPD data preservation

Existing keys are `socialWorkerResourceRead`, `socialWorkerResourceConfidence` and `socialWorkerResourceCpdEntries`. They have no jurisdiction metadata.

Add a versioned storage schema. Store progress/confidence per jurisdiction and resource. CPD entries need a stable ID, originating jurisdiction, regulator, schema/content version and creation/update dates alongside their existing fields. Preserve the standards labels/version associated with an old entry so later code changes do not reinterpret it.

Migration must be idempotent and non-destructive:

- Read and validate legacy values without rewriting them.
- Copy legacy data into the new England namespace, retaining all original entry fields. Set the migration-complete marker only after the new data is written and read back successfully.
- Keep legacy keys as rollback data. If storage is blocked, full or malformed, continue with a clear recovery/export path and do not claim successful saving.
- Repeated loads must not duplicate CPD entries or migrate England completion into Wales. Existing entries may be viewed from an all-jurisdictions history, but must retain their original regulator/context.

The Wales CPD mode is a reflective record, aligned with current Social Care Wales guidance. It must not display SWE counters, an automatic November deadline, a required historical hours target or a claim that it submits to a regulator. W07 documents the source basis. Confirm final required fields against current guidance during authoring; optional learning-duration notes may remain personal records.

## 6. Content authoring and maintenance

The inventory contains 15 resources needing separate versions, 7 needing shared material plus local adaptation, and 4 shared website pages. That classification is the scope baseline; it is not a shortcut around reviewing individual claims.

For each topic: draft from current official sources, verify legal applicability and commencement, review practice examples, then update dependent tools. A practitioner familiar with the jurisdiction should review local pathways and terminology before a topic is labelled practice-reviewed. Leave the reviewer record unset until this happens; do not manufacture approval.

Use explicit content states: `draft`, `source-checked`, `practice-reviewed`, `published`, `withdrawn`. A published topic requires both recorded source checks and practice review. Proposed maintenance cadence: review legal alerts monthly, the full pilot quarterly, and affected topics whenever an authoritative change is identified. This is an editorial recommendation, not a scheduled automation created by this task.

All exports should name the jurisdiction, resource version and review date. Shared website/privacy pages need their own review record. Include cross-border caveats at relevant topics rather than implying that switching countries resolves case-specific responsibility.

## 7. Delivery sequence

| Step | Concrete output | Completion condition |
|---|---|---|
| 1 — Inventory and specification | These three documents, all resources mapped, source gaps recorded | Complete in this task. |
| 2 — England extraction | Manifest loader, data packs, topic mapping and legacy aliases | Existing England navigation, tools, links and saved records still behave correctly. |
| 3 — Selector and storage | Working local jurisdiction selection, atomic loading, URL resolution and migration | Switching/error/history tests pass using clearly marked preview data. |
| 4 — Wales authoring | Eight topic modules, local learning material and complete tool packs | Sources and practice review recorded; unavailable material is explicit. |
| 5 — Generated pages and validation | Consistent interactive/static content, source metadata, exports and legacy links | Acceptance checks below pass; draft exclusions verified. |
| 6 — User preview | Working local preview with completion/coverage report | User can inspect England and Wales end to end before publication. |

Prioritise care/support, safeguarding and CPD authoring first. The initial engineering work can proceed independently of unresolved topic reviews. The release dependency is reviewed Wales content, not a new backend.

## 8. Acceptance checks for implementation

| Check | Expected result |
|---|---|
| Existing visitor | Old read/confidence/CPD data survives migration in England; original keys retained; repeated migration creates no duplicates. |
| Explicit Wales link with saved England preference | Wales loads; the correct resource and sources appear. |
| Legacy Care Act link with saved Wales preference | Opens England Care Act content, visibly labelled England. |
| Wales care/support or safeguarding route | Uses the reviewed Welsh pack and sources; no England Section 42 action or Care Act assessment template leaks into the result. |
| Wales CPD mode | No SWE standard numbers, SWE targets/deadline or mandatory old hours target; historic England entries retain original context. |
| Search, glossary and flashcards | Only active or explicitly shared approved content appears; links and totals are correct. |
| Switching with an edited CPD form | Original draft survives; storage failure prevents destructive navigation and gives recovery guidance. |
| Rapid switching or network failure | No mixed jurisdiction state, stale response overwrite or misleading heading. |
| Unsupported/incomplete topic | Clear unavailable status; no silent England fallback. |
| Back/Forward and refresh | URL, selected pack and resource stay consistent. |
| Downloads and printed CPD | Correct jurisdiction, review/version metadata and original CPD context; readable print output. |
| Generated learning/AI pages | Correct jurisdiction metadata, preserved legacy links and no draft practice content in public indexes. |
| Keyboard and mobile | Selector labelled and operable by keyboard; visible focus, announced loading/result states and no horizontal overflow at 320px. |
| England regression | Existing route finder, reader, CPD save/export and learning tools still work. |

Use focused automated checks for manifest completeness, reference integrity, URL resolution, storage migration and pack isolation. Use browser checks for switching, mobile layout, form preservation and print output. Legal/source review remains a separate content check; passing code tests cannot establish legal accuracy.

## 9. Open work and assumptions

- Current Wales CPD FAQs/renewal details, amended statutory provisions, 2026 liberty/MHA changes and cross-border arrangements still require topic-level verification (see W07, W11 and W12).
- Wales professional reviewer has not been assigned. Source research and engineering can proceed; the practice-review record must reflect actual review before publication.
- Full Welsh-language translation, other UK nations and overseas jurisdictions follow the pilot; the data structure supports them without implying current coverage.
- This task changes documentation only. It does not change the live site, generate new public learning pages or publish a country selector.
