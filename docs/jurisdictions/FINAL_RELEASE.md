# Final learning-guide release

Release: 8 September 2026. This document supersedes the earlier completion claims, local status and pilot specification for current release status.

The local app contains twelve selectable locations: England, Wales, Scotland, Northern Ireland, Ireland, Aotearoa New Zealand, New South Wales, Victoria, Ontario, British Columbia, California and New York. The selector is beneath the main navigation. No public deployment was performed during finalisation.

## What final means

Each manifest has `releaseStatus: "final"`. This is a final educational release, not a claim of comprehensive legal coverage, regulator approval or independent professional certification. Practice review is recorded separately; no new independent reviewer or review date has been invented. A missing practice review is disclosed in the Source Library, not used as a draft label.

The six Australian, Canadian and US packs cover the named states and provinces only. The modules give topic-specific practice enquiry, local source starting points and recording prompts. Exact thresholds, forms, commencement and local responsibilities must be established from the applicable official sources for live work.

## Corrections made during final review

- Removed copied Welsh statutes, glossary definitions, court references, false regulator names and fabricated URLs from the ten expanded packs' tools.
- Re-authored their eight flashcard decks, route explanations, glossary, eight fictional scenarios, ten downloads and student activities.
- Replaced generic one-paragraph supporting pages with section-specific instructions, learning maps, source libraries, privacy information and terms.
- Expanded the six state/province module sets with distinct local professional and source context.
- Corrected repeated location headings and New Zealand terminology copied into other countries.
- Corrected reflection save, reload, export and print routing for every non-England location, including saved-entry labels and professional metadata.
- Replaced England-specific search hints and qualification labels outside England.
- Preserved existing static URLs with explicit slugs, and added every location index to the sitemap.
- Retired the earlier generators that localised material by replacing country names. Maintain the final manifests and Markdown resources directly.
- Clarified Northern Ireland's partially commenced capacity legislation.

## Build and verification

Run `node tools/build-seo-pages.mjs` and `node tools/check-jurisdictions.mjs`. The build produces 312 reading pages and twelve location indexes. Validation checks structure, tool links, final release status, duplicated headings, known copied legal claims, download labels and sitemap coverage.

Browser checks are in `tools/browser-checks/final-release.js`, with existing recovery and storage suites alongside it. They use an isolated Playwright session and synthetic records; the user's live learning records are not changed. Evidence is retained under `output/playwright/`.

Results: 782 browser assertions passed across twelve locations, plus 139 existing completion/recovery assertions. The legacy-storage and blocked-storage suite passed. All eleven non-England reflection exports retained discussion and next-action fields. The final link audit identified four obsolete URLs in Scotland and Ireland; these were replaced with current official pages.

External source-link reachability is a transport check, not proof of legal accuracy. The Source Library distinguishes official starting points from checked legal provisions. Some government websites restrict automated access.
