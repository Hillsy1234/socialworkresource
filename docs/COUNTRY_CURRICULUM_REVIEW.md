# Country curriculum expansion — 8 September 2026

## Delivered scope

Expanded all eight core topics in the eleven locations outside England: Wales, Scotland, Northern Ireland, Ireland, New Zealand, New South Wales, Victoria, Ontario, British Columbia, California and New York. England remains the structural reference. Wales's existing detailed lessons were retained and supplemented; the other ten brief topic pages were replaced with fuller teaching material.

Every topic now includes a local legal/professional framework, practical actions, participation and challenge routes, a worked fictional case with reasoning, recording prompts and official sources. The shared teaching sections cover assessment and reasoning skills; the jurisdiction-specific rules and cases are separately authored. The ten replacement packs have lessons of roughly 690–870 words; the supplemented Welsh lessons are roughly 910–1,350 words. Length describes the expansion and is not the acceptance test for legal completeness.

Linked resources were updated together: 440 flashcards, 88 scenarios, student pathways, route-finder detail, quick references, source libraries and relevant printable templates. The ten previously brief glossaries now explain their core topics using the local framework. Country-specific currency alerts highlight material transition points. Static reading pages, location indexes and downloadable text versions have been rebuilt. The selector, flag design and existing site structure are retained. Flashcards now grow to fit either face instead of clipping longer answers.

The guides retain their final learning-guide labels. `editorialExpandedAt` records this expansion; `practiceReviewedAt` remains null because no independent practitioner review has been recorded. The deliverable establishes a common teaching structure and substantially greater local detail, not exhaustive equivalence in every legal provision, specialism or service procedure.

## Legal distinctions addressed

The lessons distinguish country, state and provincial frameworks, including supported decisions and representative authority; care assessment versus funding and delivery; restrictions versus lawful authority; psychiatric detention versus treatment authority; and reporting duties versus voluntary referrals. Examples address Scotland's AWI and adult-protection framework, Northern Ireland's partial commencement, Irish decision support, New Zealand's current and future mental-health regimes, Australian national funding alongside state safeguards, Ontario/BC differences in treatment authority, and current California/New York mental-health criteria.

Primary statutes, regulator material and government guidance informed the expansion. Enactment announcements are separated from commencement. In particular, Ireland's 2026 mental-health changes require provision-specific commencement checks, Northern Ireland's capacity Act is not treated as wholly operative, and New Zealand's replacement mental-health legislation is described as a future framework. Current June 2026 liberty guidance is reflected in the Wales and Northern Ireland additions. These examples do not constitute an exhaustive commencement audit of every linked enactment.

## Source coverage and access

The monitoring registry now has 318 unique URLs across twelve locations, producing 333 location/source observations. Its largest location has 40 sources, within the existing 55-source limit. Every source explicitly listed for the 88 expanded lessons is linked to its relevant topic in the registry. Monitoring continues to flag changes for editorial review; it does not automatically rewrite or publish legal guidance.

An automated access audit covered the 216 distinct URLs cited by the expanded lessons: 150 returned usable text or a PDF fingerprint; 66 require manual checking (33 HTTP 403 responses, 23 pages without sufficient readable content, eight timeouts and two connection failures). Some of these publishers were accessible through web research despite blocking the monitoring client. No retained lesson URL returned HTTP 404 in this audit. Two broken Irish document references were removed or replaced with the operative consent-policy page and the public-sector-duty statute. An obsolete Welsh PDF was replaced with the relevant legislation.

`COUNTRY_CURRICULUM_SOURCE_ACCESS.json` records each attempt and its time, including failures. A successful response establishes accessibility, not currency, legal applicability or independent verification. Failed responses are not marked as checked in resource metadata. Specialist/local procedures and linked documents outside the curated register still require editorial assessment.

## Validation and review

- Production build passed: jurisdiction validation, curriculum coherence, 312 static reading pages and the public-only output.
- Curriculum coherence passed for all 88 lessons, matching cases, cards, learning pathways and registered sources.
- Browser checks passed: 390 assertions across all twelve locations, including all 312 resources, country-specific template downloads and card flipping. All 880 expanded card faces fitted at desktop and 320px widths without content overflow. No JavaScript errors were recorded in this run.
- Monitoring registry validation, all 18 monitoring tests and TypeScript checking passed.
- The older comprehensive browser script stopped at the native print-dialog interaction. Its full print/reflection regression is not claimed as passed in this review; the focused curriculum checks above completed. Browser printing logic was not changed.

The authored input lives in `tools/curriculum/`; `python3 tools/curriculum/apply.py` synchronises lessons and companions. Run `npm run build` after an editorial change. The build includes `tools/check-curriculum.mjs` to catch mismatches between lessons, learning tools and monitoring references.

## Publication status

Review completed locally before GitHub submission. The checks above do not establish production deployment success. Production's existing September baseline is historical evidence for the earlier registry. After deployment, newly registered URLs receive their first successful baseline in a subsequent run. A completed September monthly batch is not rerun merely because the register changed; the next normal scheduled check is 1 October.
