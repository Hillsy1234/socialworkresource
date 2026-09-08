# England–Wales content map

Prepared: 8 September 2026. Scope: all 26 resources in the existing `resources` registry, plus interactive data and generated outputs. This is an implementation inventory, not approval of the existing legal content or a finished Wales practice guide.

Historical England–Wales mapping: read alongside [the original specification](PILOT_SPECIFICATION.md) and [the source register](WALES_SOURCES.md). Current coverage and final release status are in [FINAL_RELEASE.md](FINAL_RELEASE.md).

## Classification

- **Separate:** create an authored Wales version. Reuse layout, but do not derive the legal guidance through text replacement.
- **Shared + local:** explicitly approve reusable principles, with jurisdiction-specific examples, links and guidance. Whole-file reuse is not presumed safe.
- **Shared website:** keep one organisational page; update scope or privacy wording where the new behaviour requires it.

All Wales resources begin as **not authored**. Sources identified during this audit are starting points; topic-level legal and practice review remains outstanding.

## Complete resource inventory

| Existing resource ID | Current source file | Treatment | Wales work required |
|---|---|---|---|
| `readme` | `README.md` | Separate | Create public start page with Wales scope, available topics and dated alerts. Move developer maintenance instructions into project documentation. |
| `map` | `LEARNING_MAP.md` | Separate | Rebuild the legal decision map and eight-week route around the Welsh care and support framework, safeguarding and learning pathway. W01–W04, W08. |
| `case-route-finder` | `CASE_ROUTE_FINDER.md` | Separate | Update introductory prompts and the underlying questions, results and links. See tool inventory below. W01–W06. |
| `flashcards` | `FLASHCARDS.md` | Separate | Author Wales answers and explanations for the eight topic groups; review shared MCA questions individually. W01–W09. |
| `student-asye-pathway` | `STUDENT_ASYE_PATHWAY.md` | Separate | Display “Student and Newly Qualified Pathway”; use the first-three-years and Consolidation Programme guidance, with eligibility caveats. Do not label it ASYE or claim programme completion. W08. |
| `glossary` | `GLOSSARY.md` | Separate | Provide Welsh practice terms and definitions, including ALN, IDP, relevant regulator and safeguarding terminology. Distinguish superficially similar English terms. W01–W09. |
| `theory-practice` | `THEORY_INTO_PRACTICE.md` | Shared + local | Review theory descriptions for reuse; adapt service structures, language, culture, hypotheses and source links. Avoid presenting a model as nationally required. W10. |
| `children-models` | `CHILDREN_FAMILY_PRACTICE_MODELS.md` | Shared + local | Review model descriptions, training/licensing cautions and local adoption. Replace England statutory context and source prompts; do not assume the same model is commissioned across Wales. W03, W09–W10. |
| `cpd-log` | `CPD_REFLECTION_LOG.md` | Separate | Use current Social Care Wales guidance and Code mapping. Replace SWE submission wording, counters, calendar and defaults. W07. |
| `foundations` | `modules/01-Professional-Foundations.md` | Shared + local | Retain reviewed values, curiosity and analysis material; introduce current Social Care Wales Code and social-worker practice guidance. W07, W10. |
| `care-act` | `modules/02-Care-Act-2014.md` | Separate | Wales topic: “Care and Support in Wales”. Cover the Social Services and Well-being (Wales) Act, assessment, eligibility, carers, advocacy, planning and review. Replace England thresholds and pathways. W01–W02. |
| `mca` | `modules/03-Mental-Capacity-Act-2005.md` | Shared + local | Reuse only reviewed England-and-Wales statutory principles; check local advocacy arrangements, language support, examples and cross-links. W04, W10. |
| `dols` | `modules/04-DoLS-and-Deprivation-of-Liberty.md` | Shared + local | Check legal developments independently; provide Welsh forms, supervisory arrangements and restrictive-practice guidance. Remove Care Act dependencies from Wales examples. W04–W05, W12. |
| `mha` | `modules/05-Mental-Health-Act.md` | Shared + local | Review shared Act content, Welsh Code, Mental Health (Wales) Measure, advocacy, aftercare and service arrangements. Verify commencement by provision and territory. W06, W12. |
| `safeguarding` | `modules/06-Safeguarding-Adults.md` | Separate | Author Welsh adult-at-risk, reporting and enquiry framework and procedural prompts. Replace Section 42 template and routing logic. W01, W03. |
| `children` | `modules/07-Children-Families-and-Transitions.md` | Separate | Review Welsh duties for children, carers and transition; distinguish retained Children Act provisions from Wales-specific care/support duties. Use Welsh safeguarding and ALN guidance. W01, W03, W09. |
| `rights` | `modules/08-Equality-Human-Rights-and-Recording.md` | Shared + local | Review reusable equality, human rights and recording principles; add Welsh-language practice and relevant Welsh duties. Check source applicability, rather than assuming all UK law is identical. W10–W11. |
| `quick-reference` | `practice-tools/quick-reference.md` | Separate | Rebuild all legal map rows, thresholds and red flags; verify consistency with Wales module versions. W01–W06, W09. |
| `templates` | `practice-tools/templates-and-checklists.md` | Separate | Replace care assessment and safeguarding templates; review MCA, best interests, liberty, MHA and supervision templates. Mark as learning prompts, with Wales scope and review date. |
| `printable-tools` | `PRINTABLE_TOOLS.md` | Separate | Update the JavaScript template bodies and download names as well as the article. Include jurisdiction, sources and review dates. |
| `scenarios` | `practice-tools/scenarios.md` | Separate | Adapt seven article scenarios and every interactive workout, including carer stress, coercion, transition and organisational abuse. Write locally reviewed answer prompts. |
| `sources` | `SOURCE_LIBRARY.md` | Separate | Publish a curated Wales source library with topic mapping, applicability and review dates. Keep England sources only where explicitly applicable or labelled comparative. |
| `about-us` | `ABOUT_US.md` | Shared website | Describe the actual pilot coverage and distinguish existing England material from Wales material under development. |
| `contact-us` | `CONTACT_US.md` | Shared website | Keep the existing contact route; add guidance to identify the relevant jurisdiction in resource feedback. Any form change is a later implementation task. |
| `privacy-policy` | `PRIVACY_POLICY.md` | Shared website | Describe remembered jurisdiction, local draft storage, migration and exports accurately; retain existing storage limitations. |
| `terms-of-service` | `TERMS_OF_SERVICE.md` | Shared website | Clarify supported jurisdictions, incomplete coverage and the learning purpose; review any revised legal wording before release. |

Totals: **15 separate resources, 7 shared with local adaptation, 4 shared website pages**.

## Interactive content inventory

The Markdown pages are only part of the content. These identifiers in `script.js` must be handled explicitly.

| Data or function | Current dependency | Required change |
|---|---|---|
| `resources`, `featuredIds` | Fixed England titles, summaries, paths and module set | Read a jurisdiction manifest; map common topics to locally named resources. |
| `flashcardDecks` | Forty cards embedded in JavaScript | Separate card packs with answer sources and review status; derive the displayed count. |
| `routeQuestions`, `routeDetails` | Eight feature prompts with England framework links and actions | Separate route packs; preserve non-diagnostic learning language and validate every target. |
| `theoryLenses`, `hypothesisSignals` | Fixed hypotheses and associated content | Explicitly shared reviewed material, plus local examples and associations. |
| `childPracticeModels`, `childModelSignals` | Fixed model suggestions and practice prompts | Review applicability and statutory references; distinguish suggestions from mandated practice. |
| `glossaryTerms` | Embedded definitions and destinations | Jurisdiction-specific entries; retain only intentionally shared definitions. |
| `scenarioWorkouts` | Embedded facts, questions and model answers | Local answers, relevant legislation and linked modules. |
| `printableTemplates` | Embedded downloadable content | Local template packs; scope and version inside each export. |
| `studentPathwaySteps` | Care Act, Section 42, SEND and ASYE assumptions | Local learning sequence and tasks. W08–W09. |
| `cpdTypes`, `cpdStandards`, CPD rendering/export functions | SWE standards, two-piece/peer counters, November deadline and registration-year calculation | Regulator-specific configuration and forms; preserve historical entry context. W07. |
| `loadDocuments`, `state.documents`, search functions | Loads and searches the entire single registry | Load only the active manifest and its explicitly shared resources; clear stale results on switching. |
| `getInitialResourceId`, `updateResourceUrl`, `openResource` | Resource/hash URLs without jurisdiction | Resolve jurisdiction before resource; preserve old England links and add Back/Forward handling. |
| Read/confidence/CPD storage functions | Three unscoped browser-storage keys | Versioned storage and non-destructive legacy migration, specified in the pilot document. |
| `sourceStatusFor` | One hard-coded review date and England label | Per-resource review records; no synthetic “reviewed today” dates. |

## Other surfaces

- `index.html`: jurisdiction selector, hero summary, sidebar label, search placeholder, alerts, summary counters, title and structured metadata.
- `styles.css`: selector layout, narrow-screen behaviour, keyboard focus and visible context labels.
- `tools/build-seo-pages.mjs`: replace regex extraction of the JavaScript registry with manifest input; remove hard-coded England descriptions and global review date. It currently deletes and rebuilds the whole `learning/` directory, so plan staging and legacy-route preservation before changing it.
- Generated `learning/` pages, `sitemap.xml`, `llms.txt`, `llms-full.txt` and `answer-engine-index.json`: explicitly include jurisdiction and resource review metadata. Exclude drafts from public indexes.
- Marketing/share imagery and static summaries: audit claims and fixed counts when releasing multi-jurisdiction coverage.

## Priority for authoring

1. Care/support, adult safeguarding and CPD: these cannot inherit England-specific behaviour.
2. Professional foundations, student pathway and children/transition: different standards, terminology and pathways.
3. MCA, DoLS, MHA and rights: establish precisely which principles can be shared and which guidance must diverge.
4. Derived tools and learning routes: produce from reviewed topic material, then check each answer and export.
5. Shared theory/models, source library and website copy: align scope, labels and local examples.

This prioritises authoring; it does not make partially reviewed guidance publishable.
