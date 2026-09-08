# Historical local completion record

Superseded by [FINAL_RELEASE.md](FINAL_RELEASE.md). The coverage and test counts below describe earlier work, not the current release.

Updated: 8 September 2026. This supersedes the earlier pilot status.

Local site: http://127.0.0.1:8765/?jurisdiction=wales&resource=readme

The “Where do you practise?” selector is beneath the main navigation, above the hero. England and Wales are the supported locations. No public deployment has been performed.

## Completed implementation

- Separate England, Wales, Scotland, Northern Ireland, Ireland, Aotearoa New Zealand, New South Wales, Victoria, Ontario, British Columbia, California and New York content manifests, each with 26 populated sections and eight modules.
- Scotland Stage 1 now includes Scottish adult support and protection, Adults with Incapacity, mental health, self-directed support, children’s hearings and SSSC practice content.
- Northern Ireland Stage 2 now includes Mental Capacity Act (Northern Ireland) content, Health and Social Care Trust pathways, adult safeguarding, children’s safeguarding and Northern Ireland-specific practice context.
- Ireland Stage 3 now includes CORU standards, the Assisted Decision-Making (Capacity) Act, Decision Support Service, HSE safeguarding and Tusla Children First content.
- Aotearoa New Zealand Stage 4 now includes SWRB standards and practising certificates, Māori and whānau practice, Oranga Tamariki, capacity, mental health, safeguarding and disability-support content.
- Stage 5 sub-jurisdictions now include New South Wales, Victoria, Ontario, British Columbia, California and New York, each with local legal and professional-context content and separate routes.
- Wales: 40 flashcards, 28 glossary terms, eight worked fictional scenarios and ten downloadable recording prompts.
- Nine interactive tool types: route finder, flashcards, glossary, theory/hypothesis builder, children’s model finder, reflection log, prompt downloads, scenario workouts and learning pathway.
- Wales care/support, safeguarding, capacity, liberty, mental health, children/ALN/transition, rights/language and professional learning content, with official source links.
- Welsh regulator and CPD context; Wales website information and privacy wording reflect local storage and automatic form draft saving.
- Country-specific navigation, search, metadata, module links, alerts and counters.
- Separate progress, confidence and CPD storage; non-destructive migration of legacy England records; unsaved form preservation and blocked-storage recovery.
- Explicit country URLs, equivalent-topic switching, legacy England links, remembered preference and Back/Forward support.
- Atomic country loading: failed manifests or individual documents leave the previous guide intact and allow retry.
- A shared manifest-driven build creates 52 static reading pages, two country indexes, sitemap and country-tagged answer/full-text indexes. Existing England reading-page routes are retained; Wales uses `/learning/wales/`.

## Verification

Run `node tools/build-seo-pages.mjs` then `node tools/check-jurisdictions.mjs` from the project directory. The validator checks resource completeness, tool references, country terminology, download labels and all 52 indexed reading links.

Final run: 139 completion assertions passed, plus the legacy-storage/migration/blocked-storage suite and print-popup/PDF suite. Desktop, 320px mobile and reflection-print screenshots were inspected. Intentional aborted network requests were used to test recovery; no JavaScript exceptions occurred. The browser scripts are retained in `tools/browser-checks/` and run through the Playwright CLI `run-code` command in an isolated session.

Browser checks use synthetic records in an isolated Playwright CLI session, never the user's live browser storage. The completion checks cover every section, interactive tool use, country switching, search, downloads, history, recovery, mobile layout, legacy storage and printing. Screenshots, sample downloads and print PDFs are in `output/playwright/`.

## Content scope and review

Wales is labelled “Wales practice guide”, without a draft label. Core official sources were checked on 8 September 2026. Independent Welsh practitioner review has not been completed and is not implied by source or browser checks. This is a learning guide, not a comprehensive operational manual or a legal certification. Current law, commencement, local pathways and individual circumstances must be checked for live work.

Scotland, Northern Ireland and countries outside the UK are not included. Adding another location requires its own authored content and source review; selecting a country cannot settle cross-border responsibilities. The June 2026 liberty judgment and commencement of mental-health reform are explicitly flagged in the Wales material.
