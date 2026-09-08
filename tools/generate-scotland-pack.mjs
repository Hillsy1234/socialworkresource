// ARCHIVED: country-name replacement is not a valid localisation workflow.
throw new Error("This scaffold is retired. Edit the maintained country manifest and resources, then run the build and checks.");
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "content/wales/manifest.json"), "utf8"));
const directory = join(root, "content/scotland/resources");
mkdirSync(directory, { recursive: true });

const modules = {
  foundations: `# Professional Foundations — Scotland

## Purpose

Use the Scottish Social Services Council (SSSC) Codes of Practice as the professional anchor for social service work in Scotland. The revised Codes took effect on 1 May 2024. They set expectations for workers and employers, including rights, dignity, communication, accountability, safe practice and learning.

## Person-centred Scottish practice

Start with the person’s outcomes, preferred communication and relationships. Ask what matters, what support is wanted and how the person understands risk. Scottish practice may involve a local authority, Health and Social Care Partnership, NHS service, housing provider, police or Children’s Reporter. Identify each body’s role instead of treating “social services” as one route.

## Recording and supervision

Separate the person’s account, observed facts, information from others and professional analysis. Record the legal or policy basis, alternatives, proportionality, disagreement and review. Use supervision to test assumptions and check which Scottish statute or national guidance applies.

## Sources

- [SSSC Codes of Practice](https://www.sssc.uk.com/standards/codes-of-practice/)
- [SSSC registration guidance](https://www.sssc.uk.com/registration/managing-my-registration/)
`,
  "care-support": `# Social care and support — Scotland

## Start with the Scottish framework

Scottish community care is shaped by the Social Work (Scotland) Act 1968, the Social Care (Self-directed Support) (Scotland) Act 2013, the Carers (Scotland) Act 2016 and local Health and Social Care Partnership arrangements. There is no Scottish Care Act equivalent. Identify the specific duty, local eligibility policy and route for the person’s circumstances.

## Self-directed Support

The 2013 Act and current statutory guidance cover adults, children, young carers and adult carers. Discuss the person’s outcomes and the available SDS options, including direct payments, individual service funds, arranged support and a mix. Explain budgets and charging separately from the assessment of needs. Check local policy and updated guidance before giving operational advice.

## Carers and participation

Assess the cared-for person and carer positions distinctly. Explore the carer’s own outcomes, willingness and sustainability. Consider independent advocacy, communication, accessible information and the person’s support network. Record how the person influenced the plan and what happens if arrangements fail.

## Sources

- [Scottish social-work legislation register](https://www.socialwork.gov.scot/publications/2026/02/social-work-legislation)
- [Self-directed Support statutory guidance](https://www.gov.scot/publications/statutory-guidance-accompany-social-care-self-directed-support-scotland-act-2013-updated-2025/)
`,
  mca: `# Capacity and decision-making — Scotland

## Scottish capacity framework

The Adults with Incapacity (Scotland) Act 2000 provides the Scottish framework for intervention in the financial and welfare affairs of adults who lack capacity for a relevant decision. Do not import the England and Wales MCA section test or terminology without checking the Scottish Act and Code of Practice.

## Practice sequence

Define the decision, support communication and participation, identify the person’s wishes and values, and establish the evidence for incapacity in relation to that decision. Identify whether a welfare attorney, guardian, intervention order or other authority exists. Consider necessity, benefit, least restriction and review. The Office of the Public Guardian and the Mental Welfare Commission publish relevant guidance.

## Safeguarding interface

Adult Support and Protection applies whether or not an adult has capacity. Coercion, undue pressure and financial harm require careful enquiry. A capacity finding does not by itself authorise every intervention or settle an adult-protection decision.

## Sources

- [Adults with Incapacity (Scotland) Act guidance](https://www.gov.scot/policies/independent-living/adults-with-incapacity/)
- [Adult Support and Protection capacity guidance](https://www.gov.scot/publications/adult-support-protection-scotland-act-2007-guidance-general-practice/pages/32/)
`,
  dols: `# Liberty and restrictive practice — Scotland

## Use the Scottish route

DoLS is an England and Wales framework. In Scotland, examine the Adults with Incapacity (Scotland) Act 2000, welfare guardianship or intervention orders, the Mental Health (Care and Treatment) (Scotland) Act 2003, and human-rights safeguards. Describe the actual arrangements rather than relying on a label.

## Assessment questions

What restrictions operate, how often and for how long? Can the person leave? What do they say about the arrangement? What support would enable participation? Is the proposed intervention necessary, beneficial and least restrictive? Identify the decision-maker, legal authority, representation and review route. Seek specialist advice where Article 5 may be engaged.

## Sources

- [Adults with Incapacity Scotland](https://www.gov.scot/policies/independent-living/adults-with-incapacity/)
- [Mental Welfare Commission](https://www.mwcscot.org.uk/)
`,
  mha: `# Mental health — Scotland

## Scottish legislation

The Mental Health (Care and Treatment) (Scotland) Act 2003 provides the main compulsory-care framework, with the Mental Health (Scotland) Act 2015 making further changes. Use the current Scottish Code of Practice, Mental Health Tribunal safeguards and local multidisciplinary pathways.

## Social work role

Explore the person’s account, communication, social circumstances, risks, strengths and alternatives. Identify the role of the mental health officer, medical practitioners, named person, independent advocacy and tribunal process. A diagnosis alone does not determine compulsory measures. Record why the proposed intervention is necessary and why less restrictive options would or would not work.

## Interface

Separate mental-health compulsion from welfare decisions, physical healthcare, accommodation and adult protection. The Adults with Incapacity Act and Adult Support and Protection Act may also be relevant, but each has its own purpose and authority.

## Sources

- [Scottish mental-health law and guidance](https://www.gov.scot/policies/mental-health/mental-health-law/)
- [Mental Welfare Commission](https://www.mwcscot.org.uk/)
`,
  safeguarding: `# Adult Support and Protection — Scotland

## The three criteria

Under the Adult Support and Protection (Scotland) Act 2007, an adult at risk is an adult who is unable to safeguard their own wellbeing, property, rights or other interests; is at risk of harm; and is more vulnerable to harm because of disability, mental disorder, illness or physical or mental infirmity. Capacity is not one of the three criteria.

## Enquiry and protection

Councils have duties to make enquiries where the statutory conditions and possible intervention are present. Consider the person’s wishes, communication, participation, benefit and least restriction. Council officers have specific statutory functions. Use the revised 2022 Code, local adult-protection committee procedures and multi-agency information-sharing arrangements.

## Practice exercise

Fictional case: Isla’s nephew controls her money and remains in the room during every conversation. Arrange safe private communication, record the evidence and consider undue pressure. Do not treat apparent agreement as resolving the concern. Identify the referral, immediate protection, advocacy, capacity and review questions.

## Sources

- [Scottish Government adult support and protection overview](https://www.gov.scot/policies/social-care/adult-support-and-protection/)
- [2022 ASP Code of Practice](https://www.gov.scot/publications/adult-support-protection-scotland-act-2007-code-practice-3/pages/4/)
`,
  children: `# Children, families and hearings — Scotland

## Scottish framework

Children’s practice includes the Children (Scotland) Act 1995, Children’s Hearings (Scotland) Act 2011, Getting it right for every child (GIRFEC), the Children and Young People (Scotland) Act 2014 and relevant protection guidance. Do not substitute an English child-protection or court route.

## Hearings and voice

A Children’s Hearing is a decision-making forum for compulsory measures of supervision. The child’s views, age, maturity, safety, wellbeing and rights must be addressed. Explain the purpose of meetings, advocacy and legal representation in language the child can understand. Coordinate education, health, family support, disability and transitions.

## Learning exercise

Fictional case: Mairi is 15 and worried about a proposed move. Record her account separately from adult reports, identify immediate safety questions, check whether a hearing or child-protection process is relevant and agree who will explain the next step to her.

## Sources

- [Children’s Hearings Scotland](https://www.chscotland.gov.uk/)
- [Scottish Government children’s hearings guidance](https://www.gov.scot/policies/independent-living/childrens-hearings/)
`,
  rights: `# Rights, participation and recording — Scotland

## Rights-based practice

Use the SSSC Code, Human Rights Act, Equality Act, UNCRC duties where applicable and Scottish national standards to structure participation. Ask how the person communicates, what language or format works and what support is needed to express a view.

## Proportionality

For any restriction or protective action, record the purpose, legal basis, evidence, alternatives, benefit, least restrictive option, the person’s wishes and the review route. Distinguish disagreement from risk evidence and professional analysis.

## Sources

- [SSSC Codes](https://www.sssc.uk.com/standards/codes-of-practice/)
- [National Care Service Charter and law](https://www.gov.scot/publications/national-care-service-charter-law/)
`
};

const shared = new Set(["readme", "map", "case-route-finder", "flashcards", "student-pathway", "glossary", "theory-practice", "children-models", "cpd-log", "foundations", "care-act", "mca", "dols", "mha", "safeguarding", "children", "rights", "quick-reference", "templates", "printable-tools", "scenarios", "sources", "about-us", "contact-us", "privacy-policy", "terms-of-service"]);
const replacement = { "care-act": "care-support", "student-asye-pathway": "student-pathway" };
const resources = source.resources.map((resource) => {
  const id = resource.id;
  const targetId = id === "care-act" ? "care-support" : id;
  const title = { "care-support": "Social Care and Support in Scotland", "student-pathway": "Student and Newly Qualified Pathway — Scotland", "children-models": "Children and Family Practice Models — Scotland", "theory-practice": "Theory Into Practice — Scotland" }[targetId] || resource.title.replaceAll("Wales", "Scotland").replaceAll("Welsh", "Scottish").replaceAll("Wales", "Scotland");
  const text = modules[targetId] || `# ${title}\n\nUse this Scotland learning section with the relevant Scottish legislation, national guidance, local procedures and SSSC Code. Start with the person’s account, identify the statutory route, record evidence and alternatives, and agree a review point. This is a learning aid and does not replace local supervision or legal advice.\n\n[Scottish legislation register](https://www.socialwork.gov.scot/publications/2026/02/social-work-legislation)\n`;
  const path = `content/scotland/resources/${id}.md`;
  writeFileSync(join(root, path), text);
  return { ...resource, id, title, path, topicId: replacement[id] || id, jurisdiction: "scotland", sourceCheckedAt: "2026-09-08", practiceReviewedAt: null, status: "source-checked", summary: `${title}. Scottish sources, practice questions and recording prompts.` };
});

function replaceIds(value) {
  if (Array.isArray(value)) return value.map(replaceIds);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, replaceIds(val)]));
  if (typeof value !== "string") return value;
  return value.replaceAll("Wales", "Scotland").replaceAll("Welsh", "Scottish").replaceAll("wales", "Scotland").replaceAll("care-act", "care-support").replaceAll("student-asye-pathway", "student-pathway");
}

const pack = { ...source, id: "scotland", label: "Scotland practice guide", version: "2026-09-08-1", hero: "Explore social work in Scotland: adult support and protection, capacity, mental health, self-directed support, children’s hearings and professional practice.", alerts: ["Use Scottish legislation, national guidance and local Health and Social Care Partnership procedures.", "The revised SSSC Codes of Practice apply from May 2024.", "Adult Support and Protection, Adults with Incapacity and Scottish mental-health law have distinct routes."], resources, ...Object.fromEntries(["featuredIds", "routeQuestions", "routeDetails", "flashcardDecks", "glossaryTerms", "theoryLenses", "hypothesisSignals", "childPracticeModels", "childModelSignals", "scenarioWorkouts", "printableTemplates", "studentPathwaySteps"].map(key => [key, replaceIds(source[key])])) , toolCount: 9 };
pack.featuredIds = ["foundations", "care-support", "mca", "dols", "mha", "safeguarding", "children", "rights"];
writeFileSync(join(root, "content/scotland/manifest.json"), `${JSON.stringify(pack, null, 2)}\n`);
console.log(`Generated Scotland pack: ${resources.length} resources, ${pack.flashcardDecks.reduce((n, d) => n + d.cards.length, 0)} cards.`);
