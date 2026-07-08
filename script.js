const resources = [
  {
    id: "readme",
    title: "Start Here",
    group: "Start",
    path: "README.md",
    code: "00",
    accent: "#1f7a73",
    summary: "Orientation, law-watch notes, and the core practice formula for the whole pack."
  },
  {
    id: "map",
    title: "Learning Map",
    group: "Start",
    path: "LEARNING_MAP.md",
    code: "Map",
    accent: "#287c8f",
    summary: "A study route, decision map, and 8-week programme for building confidence."
  },
  {
    id: "case-route-finder",
    title: "Case Route Finder",
    group: "Practice Tools",
    path: "CASE_ROUTE_FINDER.md",
    code: "Route",
    accent: "#1f7a73",
    summary: "A guided route-checker for matching case facts to legal frameworks and recording points."
  },
  {
    id: "flashcards",
    title: "Learning Flashcards",
    group: "Learning Tools",
    path: "FLASHCARDS.md",
    code: "Cards",
    accent: "#cf7258",
    summary: "Module-by-module flashcards for quick revision, supervision prompts, and student refreshers."
  },
  {
    id: "student-asye-pathway",
    title: "Student and ASYE Pathway",
    group: "Start",
    path: "STUDENT_ASYE_PATHWAY.md",
    code: "ASYE",
    accent: "#5d9a68",
    summary: "A guided pathway for students, newly qualified social workers, and practice educators."
  },
  {
    id: "glossary",
    title: "Practice Glossary",
    group: "Learning Tools",
    path: "GLOSSARY.md",
    code: "A-Z",
    accent: "#8a638f",
    summary: "Plain-English practice terms for legal literacy, recording, supervision, and revision."
  },
  {
    id: "cpd-log",
    title: "CPD and Reflection Log",
    group: "Learning Tools",
    path: "CPD_REFLECTION_LOG.md",
    code: "CPD",
    accent: "#c5902d",
    summary: "A private browser-based reflection log for learning notes, supervision questions, and next actions."
  },
  {
    id: "foundations",
    title: "Professional Foundations",
    group: "Modules",
    path: "modules/01-Professional-Foundations.md",
    code: "01",
    accent: "#4f8a66",
    summary: "Values, standards, analysis, supervision, professional curiosity, and evidence."
  },
  {
    id: "care-act",
    title: "Care Act 2014",
    group: "Modules",
    path: "modules/02-Care-Act-2014.md",
    code: "02",
    accent: "#cf7258",
    summary: "Assessment, eligibility, wellbeing, advocacy, carers, planning, and review."
  },
  {
    id: "mca",
    title: "Mental Capacity Act 2005",
    group: "Modules",
    path: "modules/03-Mental-Capacity-Act-2005.md",
    code: "03",
    accent: "#287c8f",
    summary: "Decision-specific capacity, support, best interests, IMCA, restraint, and records."
  },
  {
    id: "dols",
    title: "DoLS and Deprivation of Liberty",
    group: "Modules",
    path: "modules/04-DoLS-and-Deprivation-of-Liberty.md",
    code: "04",
    accent: "#c5902d",
    summary: "DoLS, Court authorisation, objection, consent, and the 2026 legal update."
  },
  {
    id: "mha",
    title: "Mental Health Act",
    group: "Modules",
    path: "modules/05-Mental-Health-Act.md",
    code: "05",
    accent: "#5f7896",
    summary: "Civil sections, AMHP analysis, MCA/DoLS interface, Section 117, and reform watch."
  },
  {
    id: "safeguarding",
    title: "Safeguarding Adults",
    group: "Modules",
    path: "modules/06-Safeguarding-Adults.md",
    code: "06",
    accent: "#c85f5b",
    summary: "Section 42, Making Safeguarding Personal, self-neglect, domestic abuse, and enquiries."
  },
  {
    id: "children",
    title: "Children, Families, and Transitions",
    group: "Modules",
    path: "modules/07-Children-Families-and-Transitions.md",
    code: "07",
    accent: "#5d9a68",
    summary: "Whole-family practice, children in need, child protection, SEND, young carers, and transition."
  },
  {
    id: "rights",
    title: "Equality, Human Rights, and Recording",
    group: "Modules",
    path: "modules/08-Equality-Human-Rights-and-Recording.md",
    code: "08",
    accent: "#8a638f",
    summary: "Equality, reasonable adjustments, human rights analysis, anti-oppressive practice, and records."
  },
  {
    id: "quick-reference",
    title: "Quick Reference",
    group: "Practice Tools",
    path: "practice-tools/quick-reference.md",
    code: "Tool",
    accent: "#1f7a73",
    summary: "A fast legal map, threshold checks, risk flags, and decision reminders."
  },
  {
    id: "templates",
    title: "Templates and Checklists",
    group: "Practice Tools",
    path: "practice-tools/templates-and-checklists.md",
    code: "Tool",
    accent: "#cf7258",
    summary: "Reusable assessment, safeguarding, MCA, best interests, supervision, and risk templates."
  },
  {
    id: "printable-tools",
    title: "Printable Tools",
    group: "Practice Tools",
    path: "PRINTABLE_TOOLS.md",
    code: "Print",
    accent: "#c5902d",
    summary: "Downloadable and printable practice prompts for assessments, MCA, safeguarding, and supervision."
  },
  {
    id: "scenarios",
    title: "Practice Scenarios",
    group: "Practice Tools",
    path: "practice-tools/scenarios.md",
    code: "Cases",
    accent: "#287c8f",
    summary: "Applied scenarios for supervision, ASYE learning, workshops, and private study."
  },
  {
    id: "sources",
    title: "Source Library",
    group: "Sources",
    path: "SOURCE_LIBRARY.md",
    code: "Refs",
    accent: "#5f7896",
    summary: "Official and authoritative links for checking current law, guidance, and standards."
  },
  {
    id: "about-us",
    title: "About Us",
    group: "Website",
    path: "ABOUT_US.md",
    code: "About",
    accent: "#4f8a66",
    summary: "Daily Mindset Moments, Raymond Hill, the mission, and the wider product ecosystem."
  },
  {
    id: "contact-us",
    title: "Contact Us",
    group: "Website",
    path: "CONTACT_US.md",
    code: "Contact",
    accent: "#cf7258",
    summary: "Contact Daily Mindset Moments CIC about the resource, partnerships, and practical AI builds."
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    group: "Website",
    path: "PRIVACY_POLICY.md",
    code: "Privacy",
    accent: "#287c8f",
    summary: "How this resource handles local progress data, contact enquiries, and external links."
  },
  {
    id: "terms-of-service",
    title: "Terms of Service",
    group: "Website",
    path: "TERMS_OF_SERVICE.md",
    code: "Terms",
    accent: "#5f7896",
    summary: "Use of the learning resource, legal disclaimer, acceptable use, and external services."
  }
];

const contentVersion = "26";
const featuredIds = ["foundations", "care-act", "mca", "dols", "mha", "safeguarding", "children", "rights"];

const cpdTypes = [
  "Supervision",
  "Training course",
  "Reading or research",
  "Learning from a case",
  "Peer discussion",
  "Policy or guidance update",
  "Webinar, podcast, or lecture",
  "Reflective practice",
  "Other"
];

const cpdStandards = [
  {
    id: "4.1",
    short: "Feedback",
    text: "Incorporate feedback from a range of sources, including people with lived experience."
  },
  {
    id: "4.2",
    short: "Supervision",
    text: "Use supervision and feedback to critically reflect and identify learning needs."
  },
  {
    id: "4.3",
    short: "Research and frameworks",
    text: "Keep practice up to date and record how research, theories, and frameworks inform judgement."
  },
  {
    id: "4.4",
    short: "Subject knowledge",
    text: "Demonstrate good subject knowledge and awareness of current issues and social policy."
  },
  {
    id: "4.5",
    short: "Learning culture",
    text: "Contribute to an open and creative learning culture to discuss, reflect, and share best practice."
  },
  {
    id: "4.6",
    short: "Impact",
    text: "Reflect on learning activities and evidence the impact of CPD on practice quality."
  },
  {
    id: "4.7",
    short: "Recording",
    text: "Record learning and reflection regularly and in line with Social Work England CPD guidance."
  },
  {
    id: "4.8",
    short: "Values and ethics",
    text: "Reflect on values and challenge the impact they have on practice."
  }
];

const flashcardDecks = [
  {
    id: "foundations",
    title: "Professional Foundations",
    cards: [
      {
        prompt: "What should professional curiosity help a social worker do?",
        answer: "Look beyond the first account, test assumptions, notice patterns, and ask respectful questions about risk, strengths, culture, relationships, and lived experience."
      },
      {
        prompt: "What is the purpose of supervision in complex practice?",
        answer: "To create space for reflection, legal reasoning, emotional impact, risk analysis, accountability, and clear next steps."
      },
      {
        prompt: "What does strengths-based practice avoid?",
        answer: "It avoids treating optimism as evidence. It recognises agency, relationships, culture, and resources while still analysing needs and risks."
      },
      {
        prompt: "What should good recording show?",
        answer: "The person's voice, relevant evidence, analysis, options considered, legal basis, rationale, dissent, and review plan."
      },
      {
        prompt: "Why is anti-oppressive practice not a separate task?",
        answer: "Because power, discrimination, access, culture, communication, trauma, and rights shape every assessment, plan, and professional decision."
      }
    ]
  },
  {
    id: "care-act",
    title: "Care Act 2014",
    cards: [
      {
        prompt: "What is the central organising principle of the Care Act?",
        answer: "The person's wellbeing, including dignity, control, protection from abuse, relationships, participation, accommodation, and contribution to society."
      },
      {
        prompt: "When should a Care Act assessment be offered?",
        answer: "When it appears an adult may have needs for care and support, regardless of whether those needs are likely to be eligible."
      },
      {
        prompt: "What is the eligibility route under the Care Act?",
        answer: "Needs arise from or relate to impairment or illness, the adult cannot achieve specified outcomes, and this has a significant impact on wellbeing."
      },
      {
        prompt: "When is an independent advocate required?",
        answer: "When the person would have substantial difficulty being involved and there is no appropriate person to support their involvement."
      },
      {
        prompt: "What should a Care Act plan make clear?",
        answer: "Eligible needs, outcomes, support, personal budget where relevant, contingency, risk management, review arrangements, and how wellbeing is promoted."
      }
    ]
  },
  {
    id: "mca",
    title: "Mental Capacity Act 2005",
    cards: [
      {
        prompt: "What is the starting presumption under the MCA?",
        answer: "A person is presumed to have capacity unless it is established that they lack capacity for the specific decision at the specific time."
      },
      {
        prompt: "What must be done before concluding a person lacks capacity?",
        answer: "All practicable steps must be taken to support the person to make the decision, unless those steps are unsuccessful."
      },
      {
        prompt: "What are the four functional abilities in a capacity assessment?",
        answer: "Understand relevant information, retain it long enough, use or weigh it, and communicate the decision by any means."
      },
      {
        prompt: "What does best interests decision-making require?",
        answer: "Consider the person's wishes, feelings, beliefs, values, least restrictive options, relevant circumstances, consultation, and whether capacity may return."
      },
      {
        prompt: "When might an IMCA be needed?",
        answer: "For certain serious decisions when the person lacks capacity and has no appropriate family or friend to consult, subject to the statutory criteria."
      }
    ]
  },
  {
    id: "dols",
    title: "DoLS and Deprivation of Liberty",
    cards: [
      {
        prompt: "Where can DoLS authorisation apply?",
        answer: "In hospitals and care homes where there is reason to believe Article 5 may be engaged and the person lacks relevant capacity."
      },
      {
        prompt: "What is the least restrictive principle asking practitioners to do?",
        answer: "Choose the option that interferes least with the person's rights and freedom while still meeting the necessary aim."
      },
      {
        prompt: "Why must deprivation of liberty analysis be carefully evidenced?",
        answer: "Because Article 5 protects liberty. Restrictions, consent, capacity, objection, purpose, duration, supervision, and practical reality all matter."
      },
      {
        prompt: "When might the Court of Protection be needed?",
        answer: "For community deprivation of liberty, serious disputes, complex best interests decisions, or situations outside ordinary DoLS authorisation."
      },
      {
        prompt: "Why should practitioners check current deprivation of liberty law?",
        answer: "Because the legal approach changed in 2026. Practitioners must follow current law, statutory updates, local policy, and legal advice."
      }
    ]
  },
  {
    id: "mha",
    title: "Mental Health Act",
    cards: [
      {
        prompt: "What is the broad purpose of the Mental Health Act?",
        answer: "To provide a legal framework for compulsory assessment or treatment of mental disorder when the statutory criteria are met."
      },
      {
        prompt: "What does an AMHP bring to MHA decision-making?",
        answer: "Independent social perspective, least restrictive analysis, rights focus, family and community context, risk analysis, and scrutiny of alternatives."
      },
      {
        prompt: "Why is the MHA and MCA interface important?",
        answer: "Because practitioners must choose the correct legal route for mental disorder treatment, care, capacity, objection, deprivation of liberty, and safeguards."
      },
      {
        prompt: "What is Section 117 aftercare?",
        answer: "A joint duty to provide aftercare for eligible people detained under qualifying MHA sections, linked to needs arising from mental disorder."
      },
      {
        prompt: "Why must practitioners check MHA reform updates?",
        answer: "Because the Mental Health Act 2025 is implemented in phases, so practitioners must check what is currently in force."
      }
    ]
  },
  {
    id: "safeguarding",
    title: "Safeguarding Adults",
    cards: [
      {
        prompt: "What are the three Section 42 enquiry trigger questions?",
        answer: "Does the adult have care and support needs, are they experiencing or at risk of abuse or neglect, and are they unable to protect themselves because of those needs?"
      },
      {
        prompt: "What does Making Safeguarding Personal require?",
        answer: "Work with the person to understand desired outcomes, rights, risk, consent, safety, control, and what protection means to them."
      },
      {
        prompt: "Why is consent important in adult safeguarding?",
        answer: "Because adults with capacity usually make their own decisions, but information-sharing or action may still be justified in specific risk or public interest situations."
      },
      {
        prompt: "What should a safeguarding plan include?",
        answer: "Desired outcomes, protective actions, roles, risk controls, contingency, review arrangements, communication needs, and escalation routes."
      },
      {
        prompt: "Why can self-neglect be complex?",
        answer: "It may involve autonomy, capacity, trauma, mental disorder, executive functioning, environmental risk, coercion, and serious harm."
      }
    ]
  },
  {
    id: "children",
    title: "Children, Families, and Transitions",
    cards: [
      {
        prompt: "What does whole-family practice mean?",
        answer: "Understanding the adult, child, carer, family network, risks, strengths, relationships, and how each person's needs affect the others."
      },
      {
        prompt: "Why are transitions important in social work?",
        answer: "Young people may move between children's and adults' systems, so planning should start early and keep outcomes, rights, education, health, care, and family roles connected."
      },
      {
        prompt: "What should practitioners consider for young carers?",
        answer: "The caring role, impact on wellbeing and education, hidden responsibilities, family support, assessment rights, and appropriate services."
      },
      {
        prompt: "What is a key risk in transition planning?",
        answer: "The young person falling between services because eligibility, responsibility, timing, or information-sharing is unclear."
      },
      {
        prompt: "Why does safeguarding children knowledge matter in adult practice?",
        answer: "Adult needs, mental health, domestic abuse, substance use, disability, or care pressures may affect children and family safety."
      }
    ]
  },
  {
    id: "rights",
    title: "Equality, Human Rights, and Recording",
    cards: [
      {
        prompt: "What is the purpose of reasonable adjustments?",
        answer: "To remove or reduce disadvantage for disabled people so they can access assessment, communication, services, decisions, and participation fairly."
      },
      {
        prompt: "Why should human rights analysis be explicit?",
        answer: "Because decisions may affect liberty, private and family life, dignity, discrimination, safety, and fair process."
      },
      {
        prompt: "What does proportionate recording mean?",
        answer: "Recording enough evidence, analysis, rationale, and review detail to justify the decision without unnecessary or irrelevant information."
      },
      {
        prompt: "What should be recorded when views differ?",
        answer: "The different views, evidence, professional analysis, how disagreement was considered, and the reason for the final decision."
      },
      {
        prompt: "How does equality analysis strengthen practice?",
        answer: "It helps identify barriers, discrimination, communication needs, cultural context, power imbalance, and steps needed for fair involvement."
      }
    ]
  }
];

const routeQuestions = [
  {
    id: "care-needs",
    label: "The adult may have care and support needs, or a carer may need support.",
    detail: "Assessment, prevention, carers, advocacy, eligibility, care planning, or review may be relevant.",
    routes: ["care-act", "quick-reference", "templates"]
  },
  {
    id: "capacity",
    label: "There is a decision-specific capacity concern.",
    detail: "The person may need support to decide, a capacity assessment, best interests decision, or IMCA consideration.",
    routes: ["mca", "templates", "rights"]
  },
  {
    id: "restrictions",
    label: "Restrictions, close supervision, restraint, locked doors, medication, or not being free in practice are present.",
    detail: "Consider deprivation of liberty, least restriction, objection, consent, and the correct authorisation route.",
    routes: ["dols", "mca", "quick-reference"]
  },
  {
    id: "mental-health-crisis",
    label: "Mental disorder, serious risk, hospital assessment or treatment, and compulsion may be needed.",
    detail: "Consider whether the Mental Health Act assessment pathway is indicated, alongside MCA for other decisions.",
    routes: ["mha", "mca", "templates"]
  },
  {
    id: "abuse-neglect",
    label: "Abuse, neglect, self-neglect, domestic abuse, exploitation, or coercion may be present.",
    detail: "Consider Section 42, consent, capacity, information sharing, advocacy, and protection planning.",
    routes: ["safeguarding", "templates", "rights"]
  },
  {
    id: "child-family",
    label: "A child, young carer, family member, transition issue, SEND, or whole-family risk is relevant.",
    detail: "Adult practice may need to connect with children's safeguarding, transition, SEND, and young carers frameworks.",
    routes: ["children", "safeguarding", "rights"]
  },
  {
    id: "rights-equality",
    label: "Equality, communication, discrimination, liberty, family life, dignity, or participation is central.",
    detail: "Use equality and human rights analysis to strengthen involvement, proportionality, recording, and challenge routes.",
    routes: ["rights", "mca", "quick-reference"]
  },
  {
    id: "recording-supervision",
    label: "The case needs clearer recording, supervision, legal reasoning, or defensible decision-making.",
    detail: "Use the core practice formula, templates, source library, and reflection log to structure analysis.",
    routes: ["foundations", "templates", "cpd-log", "sources"]
  }
];

const routeDetails = {
  "care-act": {
    title: "Care Act 2014",
    action: "Check appearance of need, assessment duties, eligibility, wellbeing, advocacy, carers, prevention, plan, review, and ordinary residence where relevant.",
    record: "Record the person's outcomes, needs, strengths, risks, eligibility analysis, advocacy position, carer position, options, rationale, and review."
  },
  mca: {
    title: "Mental Capacity Act 2005",
    action: "Identify the specific decision, support the person to decide, assess capacity only where needed, and use best interests if capacity is lacking.",
    record: "Record relevant information, support provided, the functional test, causative link, wishes and feelings, consultation, options, and least restrictive reasoning."
  },
  dols: {
    title: "DoLS and Deprivation of Liberty",
    action: "Map restrictions, consent, objection, capacity for residence/care, setting, duration, effects, and whether DoLS or Court advice is needed.",
    record: "Record the care arrangements, person's wishes, restrictions, less restrictive options, authorisation route, review date, and advice sought."
  },
  mha: {
    title: "Mental Health Act",
    action: "Consider mental disorder, risk, purpose of detention, need for hospital assessment or treatment, alternatives, nearest relative/nominated person position, and least restriction.",
    record: "Record risk, alternatives, legal criteria considered, consultation, person's views, family position, AMHP reasoning, and interface with MCA/DoLS."
  },
  safeguarding: {
    title: "Safeguarding Adults",
    action: "Check whether Section 42 criteria are reasonably suspected and consider Making Safeguarding Personal, consent, capacity, coercion, advocacy, and immediate safety.",
    record: "Record the concern, adult's desired outcomes, criteria analysis, consent/capacity, information sharing, enquiry plan, protection plan, and review."
  },
  children: {
    title: "Children, Families, and Transitions",
    action: "Check whether children, young carers, SEND, transition, family safety, or children's safeguarding pathways need to be considered alongside adult work.",
    record: "Record the child's voice, family context, referrals, transition timing, parental/carer roles, information sharing, and joint working."
  },
  rights: {
    title: "Equality, Human Rights, and Recording",
    action: "Check reasonable adjustments, communication, discrimination, Article 5 liberty, Article 8 family/private life, dignity, proportionality, and involvement.",
    record: "Record barriers, adjustments, rights engaged, proportionality, options, challenge routes, and how the person's voice shaped the decision."
  },
  foundations: {
    title: "Professional Foundations",
    action: "Use professional curiosity, supervision, evidence, strengths, anti-oppressive practice, and clear analysis before choosing an intervention.",
    record: "Record facts, analysis, uncertainty, supervision, actions, review, and what would change your view."
  },
  templates: {
    title: "Templates and Checklists",
    action: "Use structured prompts to prevent missing legal thresholds, capacity, consent, advocacy, risk, review, or rationale.",
    record: "Copy the relevant template into your local recording system and adapt it to policy, supervision, and the person's circumstances."
  },
  "quick-reference": {
    title: "Quick Reference",
    action: "Use the one-stop legal map when you need a fast route check before going into deeper guidance.",
    record: "Record which framework was considered, why it was selected or ruled out, and what source or supervisor checked your reasoning."
  },
  "cpd-log": {
    title: "CPD and Reflection Log",
    action: "Capture learning, uncertainty, supervision questions, and next actions while the case analysis is fresh.",
    record: "Keep reflections anonymised and do not enter identifiable case details into learning notes."
  },
  sources: {
    title: "Source Library",
    action: "Use official and authoritative sources when a case is live, contested, complex, or legally sensitive.",
    record: "Record the source checked, date checked, policy or legal advice used, and any uncertainty."
  }
};

const glossaryTerms = [
  { term: "Adult at risk", definition: "A shorthand phrase often used for an adult who may have care and support needs, may be experiencing or at risk of abuse or neglect, and may be unable to protect themselves because of those needs.", link: "safeguarding", section: "section-42-duty" },
  { term: "Advocacy", definition: "Support to help a person be involved in decisions, express views, understand information, and challenge decisions where needed.", link: "care-act", section: "independent-advocacy" },
  { term: "AMHP", definition: "Approved Mental Health Professional. A trained professional with specific responsibilities under the Mental Health Act, including independent social perspective and least restrictive analysis.", link: "mha", section: "amhp-role" },
  { term: "Authorisation", definition: "A lawful approval for arrangements that would otherwise interfere with rights, such as DoLS authorisation or Court of Protection authorisation.", link: "dols", section: "dols-assessments" },
  { term: "Best interests", definition: "The decision-making process used under the MCA when a person lacks capacity for a specific decision. It must consider wishes, feelings, beliefs, values, consultation, and least restriction.", link: "mca", section: "best-interests" },
  { term: "Care and support needs", definition: "Needs that may arise from physical, mental, sensory, cognitive, or other impairment or illness and may affect daily living outcomes.", link: "care-act", section: "assessment-duty" },
  { term: "Carer's assessment", definition: "A Care Act assessment for a carer who may have support needs, including willingness and ability to continue caring and impact on wellbeing.", link: "care-act", section: "carers" },
  { term: "Coercion", definition: "Pressure, control, intimidation, or manipulation that can undermine apparent consent, choice, or free expression.", link: "safeguarding", section: "consent-and-information-sharing" },
  { term: "Decision-specific capacity", definition: "Capacity is assessed for the specific decision at the specific time, not as a general status.", link: "mca", section: "key-rule" },
  { term: "Defensible recording", definition: "Recording that shows facts, evidence, analysis, law or policy considered, options, rationale, dissent, and review.", link: "rights", section: "defensible-decision-making" },
  { term: "Deprivation of liberty", definition: "A serious restriction of liberty requiring careful legal analysis, least restrictive thinking, and the correct authorisation route where Article 5 is engaged.", link: "dols", section: "current-position-july-2026" },
  { term: "DoLS", definition: "Deprivation of Liberty Safeguards. A statutory process for authorising deprivation of liberty in hospitals and care homes where the legal criteria are met.", link: "dols", section: "when-to-consider-dols" },
  { term: "Eligible needs", definition: "Needs that meet the Care Act eligibility framework after considering impairment or illness, inability to achieve specified outcomes, and significant impact on wellbeing.", link: "care-act", section: "eligibility" },
  { term: "Human rights analysis", definition: "A structured check of rights such as liberty, family life, dignity, life, non-discrimination, and fair process.", link: "rights", section: "human-rights-act" },
  { term: "IMCA", definition: "Independent Mental Capacity Advocate. A safeguard for certain serious decisions where a person lacks capacity and has no appropriate person to consult.", link: "mca", section: "imca" },
  { term: "Least restrictive option", definition: "The option that meets the legitimate aim while interfering least with the person's rights, freedoms, relationships, and autonomy.", link: "mca", section: "the-five-principles" },
  { term: "Making Safeguarding Personal", definition: "A person-led approach to safeguarding that focuses on the adult's views, desired outcomes, rights, safety, and control.", link: "safeguarding", section: "making-safeguarding-personal" },
  { term: "Mental disorder", definition: "The Mental Health Act uses this broad concept when considering assessment or treatment under the Act. Practitioners must check current law, Code of Practice, and local policy.", link: "mha", section: "core-principles-in-practice" },
  { term: "Ordinary residence", definition: "A Care Act concept used to decide which local authority is responsible for meeting eligible needs in some situations.", link: "care-act", section: "ordinary-residence-and-moving-areas" },
  { term: "Person-centred", definition: "Practice that keeps the person's voice, outcomes, rights, culture, relationships, strengths, and lived experience central.", link: "foundations", section: "core-social-work-tasks" },
  { term: "Professional curiosity", definition: "The habit of respectfully looking beyond first accounts, testing assumptions, noticing patterns, and seeking missing information.", link: "foundations", section: "professional-curiosity" },
  { term: "Proportionality", definition: "A rights-based test of whether an intervention is suitable, necessary, and balanced against the impact on the person.", link: "rights", section: "human-rights-act" },
  { term: "Reasonable adjustments", definition: "Changes that reduce disadvantage for disabled people and support fair access, communication, assessment, and involvement.", link: "rights", section: "reasonable-adjustments" },
  { term: "Section 42 enquiry", definition: "A Care Act safeguarding duty to make or cause enquiries where the statutory criteria are reasonably suspected.", link: "safeguarding", section: "section-42-duty" },
  { term: "Section 117 aftercare", definition: "A joint aftercare duty for people detained under qualifying Mental Health Act sections, linked to needs arising from mental disorder.", link: "mha", section: "section-117-aftercare" },
  { term: "Self-neglect", definition: "A complex safeguarding and wellbeing concern involving serious neglect of personal care, health, home environment, or safety.", link: "safeguarding", section: "self-neglect" },
  { term: "Substantial difficulty", definition: "A Care Act advocacy concept covering serious difficulty understanding, retaining, using or weighing information, or communicating views.", link: "care-act", section: "independent-advocacy" },
  { term: "Transition assessment", definition: "Assessment for young people or carers approaching adulthood where likely adult care and support needs may arise.", link: "children", section: "transition-to-adulthood" },
  { term: "Wellbeing", definition: "A broad Care Act concept covering dignity, physical and mental health, protection from abuse, control, relationships, accommodation, participation, and contribution to society.", link: "care-act", section: "core-principle-wellbeing" }
];

const scenarioWorkouts = [
  {
    title: "Care Act and Carer Stress",
    summary: "Falls, home support, carer strain, prevention, and staying at home safely.",
    routes: ["care-act", "templates"],
    prompts: ["What appears to need assessment?", "How would you explore carer willingness and sustainability?", "What preventive support could reduce crisis?"],
    reveal: "Do not treat 'I want to stay home' as the whole plan. Analyse needs, outcomes, carer impact, contingency, equipment, therapy, respite, and review."
  },
  {
    title: "Capacity and Unwise Decision",
    summary: "Diabetes, grief, risk-taking, and the difference between incapacity and an unwise decision.",
    routes: ["mca", "care-act", "rights"],
    prompts: ["What is the exact decision?", "What support has been offered?", "What evidence shows use or weighing?"],
    reveal: "Risk-taking is not proof of incapacity. Look at the functional test, emotional context, support, grief, mental health, and alternative care responses."
  },
  {
    title: "DoLS After the 2026 Judgment",
    summary: "Care home restrictions, fluctuating dementia, sedating medication, leaving, and objection.",
    routes: ["dols", "mca"],
    prompts: ["What restrictions are in place?", "What are the person's wishes and feelings?", "Which authorisation route may be needed?"],
    reveal: "Use a multifactorial assessment, explore consent and objection carefully, and seek DoLS or legal advice where Article 5 may be engaged."
  },
  {
    title: "MHA, MCA, or DoLS?",
    summary: "A&E crisis, psychosis, risk, wanting to leave, and choosing the correct legal route.",
    routes: ["mha", "mca", "dols"],
    prompts: ["What is the purpose of detention?", "Is mental health assessment or treatment required?", "What can MCA still cover?"],
    reveal: "Do not use MCA/DoLS to avoid the MHA where detention for mental health assessment or treatment is required. Keep least restriction and immediate safety in view."
  },
  {
    title: "Adult Safeguarding and Coercion",
    summary: "Care and support needs, financial control, coercion, apparent refusal, and safe enquiry.",
    routes: ["safeguarding", "mca", "rights"],
    prompts: ["Are Section 42 criteria reasonably suspected?", "Can apparent refusal be relied upon?", "How will you speak to the adult safely?"],
    reveal: "Coercion can undermine apparent consent. Explore private conversation, capacity, information sharing, immediate safety, advocacy, and desired outcomes."
  },
  {
    title: "Transition",
    summary: "Young person aged 17, EHCP, short breaks, adulthood planning, and voice.",
    routes: ["children", "care-act", "mca"],
    prompts: ["Is a transition assessment needed?", "What needs to happen before age 18?", "How will the young person's voice be supported?"],
    reveal: "Transition should start early enough to be useful and connect housing, education, occupation, relationships, health, care, family, and MCA from 16."
  },
  {
    title: "Organisational Abuse",
    summary: "Care home concerns, pressure damage, blanket restrictions, records, and multi-agency response.",
    routes: ["safeguarding", "dols", "mca"],
    prompts: ["Is this individual safeguarding, organisational safeguarding, or both?", "What immediate protection is needed?", "Which records and partners matter?"],
    reveal: "Patterns matter. Consider safeguarding, commissioning, CQC, police, MCA, DoLS, provider action, family communication, and individual protection plans."
  }
];

const printableTemplates = [
  {
    id: "care-act-template",
    title: "Care Act Assessment Prompt",
    fileName: "care-act-assessment-prompt.txt",
    body: `Care Act Assessment Prompt

1. Person's own words and outcomes
2. Communication, accessibility, advocacy, and reasonable adjustments
3. Current situation, strengths, networks, and community links
4. Daily living outcomes and impact on wellbeing
5. Carer position and carer's assessment
6. Capacity, consent, and information sharing
7. Risk, safeguarding, and contingency
8. Eligibility analysis
9. Plan, personal budget or direct payment where relevant
10. Review and what would trigger earlier review`
  },
  {
    id: "mca-template",
    title: "MCA Capacity and Best Interests Prompt",
    fileName: "mca-capacity-best-interests-prompt.txt",
    body: `MCA Capacity and Best Interests Prompt

Decision:
Relevant information:
Support provided:
Understand:
Retain:
Use or weigh:
Communicate:
Causative link:
Conclusion:

If the person lacks capacity:
Wishes and feelings:
Beliefs and values:
Options:
Consultation:
Least restrictive option:
Decision and rationale:
Review:`
  },
  {
    id: "safeguarding-template",
    title: "Section 42 Safeguarding Prompt",
    fileName: "section-42-safeguarding-prompt.txt",
    body: `Section 42 Safeguarding Prompt

Concern:
Adult's views and desired outcomes:
Care and support needs:
Abuse, neglect, or risk:
Unable to protect because of needs:
Immediate safety:
Capacity and consent:
Advocacy:
Information sharing:
Decision:
Enquiry plan:
Protection plan:
Review:`
  },
  {
    id: "dols-template",
    title: "Deprivation of Liberty Route Prompt",
    fileName: "deprivation-of-liberty-route-prompt.txt",
    body: `Deprivation of Liberty Route Prompt

Person and setting:
Care arrangements:
Capacity for residence/care:
Restrictions:
Duration, effects, and manner:
Wishes and feelings:
Objection or acceptance:
Consent analysis:
Less restrictive options:
Possible authorisation route:
Advice needed:
Review:`
  },
  {
    id: "supervision-template",
    title: "Supervision Reflection Prompt",
    fileName: "supervision-reflection-prompt.txt",
    body: `Supervision Reflection Prompt

Case or learning theme:
Person's voice:
Key facts:
Uncertainty:
Legal framework:
Rights and equality issues:
Risk and protective factors:
Options:
Preferred plan:
What I need from supervision:
Next action:
Review point:`
  }
];

const studentPathwaySteps = [
  { title: "Start With Values and Evidence", resource: "foundations", task: "Write one short case formulation using facts, analysis, law, plan, and review." },
  { title: "Learn the Care Act Spine", resource: "care-act", task: "Map needs, outcomes, eligibility, advocacy, carer position, and review in one mock case." },
  { title: "Practise Decision-Specific Capacity", resource: "mca", task: "Write one capacity assessment and identify what support was provided first." },
  { title: "Understand Liberty and Restriction", resource: "dols", task: "List restrictions, wishes and feelings, consent, objection, setting, and authorisation route." },
  { title: "Know When MHA May Be Needed", resource: "mha", task: "Compare MHA, MCA, and DoLS in one crisis scenario." },
  { title: "Apply Safeguarding Thinking", resource: "safeguarding", task: "Make a Section 42 threshold decision and draft desired outcomes." },
  { title: "Connect Family and Transition", resource: "children", task: "Identify adult, child, carer, young carer, SEND, and transition issues." },
  { title: "Record Rights-Based Analysis", resource: "rights", task: "Record equality, human rights, proportionality, rationale, and review." }
];

function getInitialResourceId() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("resource") || params.get("section") || window.location.hash.replace("#", "");
  return resources.some((resource) => resource.id === requested) ? requested : "readme";
}

function updateResourceUrl(id, targetSection = "") {
  if (!window.history?.replaceState) {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("resource", id);
  url.hash = targetSection || "readerSection";
  window.history.replaceState(null, "", url);
}

const state = {
  activeId: getInitialResourceId(),
  query: "",
  documents: new Map(),
  read: new Set(JSON.parse(localStorage.getItem("socialWorkerResourceRead") || "[]")),
  confidence: JSON.parse(localStorage.getItem("socialWorkerResourceConfidence") || "{}")
};

const navList = document.querySelector("#navList");
const moduleCards = document.querySelector("#moduleCards");
const contentView = document.querySelector("#contentView");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const sidebarSearchResults = document.querySelector("#sidebarSearchResults");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const markReadButton = document.querySelector("#markReadButton");
const readerMarkReadButton = document.querySelector("#readerMarkReadButton");
const activeGroup = document.querySelector("#activeGroup");
const activeTitle = document.querySelector("#activeTitle");
const activeSummary = document.querySelector("#activeSummary");
const sourceStatus = document.querySelector("#sourceStatus");
const confidenceSelect = document.querySelector("#confidenceSelect");
const sectionToc = document.querySelector("#sectionToc");
const siteHeader = document.querySelector(".site-header");
const mobileNavToggle = document.querySelector("#mobileNavToggle");

function setMobileNavigation(open) {
  if (!siteHeader || !mobileNavToggle) {
    return;
  }
  siteHeader.classList.toggle("nav-open", open);
  mobileNavToggle.setAttribute("aria-expanded", String(open));
  mobileNavToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  const protectedLinks = [];
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const token = `@@LINK_${protectedLinks.length}@@`;
    protectedLinks.push(`<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`);
    return token;
  });
  text = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
  text = text.replace(/@@LINK_(\d+)@@/g, (_, index) => protectedLinks[Number(index)] || "");
  return text;
}

function highlightText(value, query) {
  const safeValue = escapeHtml(value);
  const words = query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!words.length) {
    return safeValue;
  }

  return safeValue.replace(new RegExp(`(${words.join("|")})`, "gi"), "<mark>$1</mark>");
}

function slugify(value, fallback) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => inlineMarkdown(cell.trim()));
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = null;
  let inCode = false;
  let codeLines = [];
  const headingCounts = new Map();

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.includes("|") && lines[i + 1] && isTableDivider(lines[i + 1])) {
      closeList();
      const headers = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      html.push("<table><thead><tr>");
      headers.forEach((header) => html.push(`<th>${header}</th>`));
      html.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        html.push("<tr>");
        row.forEach((cell) => html.push(`<td>${cell}</td>`));
        html.push("</tr>");
      });
      html.push("</tbody></table>");
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const rawTitle = heading[2];
      const baseSlug = slugify(rawTitle, `section-${i}`);
      const count = headingCounts.get(baseSlug) || 0;
      headingCounts.set(baseSlug, count + 1);
      const id = count ? `${baseSlug}-${count + 1}` : baseSlug;
      html.push(`<h${level} id="${id}">${inlineMarkdown(rawTitle)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*-\s+(.*)$/);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return html.join("\n");
}

function renderModuleCards() {
  const cards = featuredIds
    .map((id) => resources.find((resource) => resource.id === id))
    .filter(Boolean);

  moduleCards.innerHTML = cards.map((resource) => `
    <button class="module-card${resource.id === state.activeId ? " active" : ""}" data-open="${resource.id}" style="--accent: ${resource.accent}">
      <span class="module-card-top">
        <span class="module-card-code">${resource.code}</span>
        <span class="module-card-kind">${resource.group}</span>
      </span>
      <span>
        <h3>${resource.title}</h3>
        <p>${resource.summary}</p>
      </span>
    </button>
  `).join("");
}

async function loadDocuments() {
  await Promise.all(resources.map(async (resource) => {
    const response = await fetch(`${resource.path}?v=${contentVersion}`);
    if (!response.ok) {
      throw new Error(`Could not load ${resource.path}`);
    }
    const markdown = await response.text();
    state.documents.set(resource.id, {
      ...resource,
      markdown,
      html: renderMarkdown(markdown),
      plain: markdown.replace(/[#*`>|-]/g, " ").replace(/\s+/g, " ").trim()
    });
  }));
}

function renderNav() {
  const grouped = resources.reduce((acc, resource) => {
    if (!acc.has(resource.group)) {
      acc.set(resource.group, []);
    }
    acc.get(resource.group).push(resource);
    return acc;
  }, new Map());

  navList.innerHTML = "";
  grouped.forEach((items, group) => {
    const groupLabel = document.createElement("div");
    groupLabel.className = "nav-group";
    groupLabel.textContent = group;
    navList.appendChild(groupLabel);

    items.forEach((resource) => {
      const button = document.createElement("button");
      button.className = `nav-button${resource.id === state.activeId ? " active" : ""}`;
      button.dataset.open = resource.id;
      button.innerHTML = `
        <span class="nav-title">${resource.title}</span>
        <span class="nav-status" aria-label="${state.read.has(resource.id) ? "Read" : "Unread"}">${state.read.has(resource.id) ? "Done" : ""}</span>
      `;
      navList.appendChild(button);
    });
  });
}

function renderActiveResource(documentData) {
  activeGroup.textContent = documentData.group;
  activeTitle.textContent = documentData.title;
  activeSummary.textContent = documentData.summary;
  renderSourceStatus(documentData);
  if (confidenceSelect) {
    confidenceSelect.value = state.confidence[documentData.id] || "not-started";
  }
}

function sourceStatusFor(documentData) {
  if (documentData.group === "Website") {
    return {
      label: "Website info",
      text: "Last reviewed 7 July 2026. For live enquiries, use the contact route and privacy/terms pages."
    };
  }

  if (documentData.id === "sources") {
    return {
      label: "Source library",
      text: "Use official sources, statutory guidance, local policy, supervision, and legal advice for live cases."
    };
  }

  return {
    label: "Practice source check",
    text: "England focus. Last reviewed 7 July 2026. Check current law, statutory guidance, local policy, supervision, and legal advice for live cases."
  };
}

function renderSourceStatus(documentData) {
  if (!sourceStatus) {
    return;
  }
  const status = sourceStatusFor(documentData);
  sourceStatus.innerHTML = `
    <span>${status.label}</span>
    <span>${status.text}</span>
  `;
}

function contactFormMarkup() {
  return `
    <section class="contact-form-panel" aria-labelledby="contactFormTitle">
      <div>
        <span class="panel-kicker">Contact Form</span>
        <h2 id="contactFormTitle">Send an enquiry</h2>
        <p>Share the reason for your message, and Daily Mindset Moments CIC will be able to respond from the same enquiry flow used on the main website.</p>
      </div>
      <form class="contact-form" action="https://formspree.io/f/xeorybzb" method="POST">
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="form-honeypot">
        <input type="hidden" name="_subject" value="Social Worker Resource enquiry">
        <div class="form-grid">
          <label class="form-field">
            <span>Name</span>
            <input type="text" name="name" autocomplete="name" required>
          </label>
          <label class="form-field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required>
          </label>
          <label class="form-field">
            <span>Organisation</span>
            <input type="text" name="organisation" autocomplete="organization">
          </label>
          <label class="form-field">
            <span>Enquiry type</span>
            <select name="project_type" required>
              <option value="">Select one</option>
              <option>Social work learning resource</option>
              <option>AI product build</option>
              <option>Workflow automation</option>
              <option>Marketing and content system</option>
              <option>Community or social impact platform</option>
              <option>Partnership conversation</option>
            </select>
          </label>
          <label class="form-field full-span">
            <span>Message</span>
            <textarea name="message" rows="6" required></textarea>
          </label>
        </div>
        <label class="form-consent">
          <input type="checkbox" name="contact_consent" value="yes" required>
          <span>I agree to be contacted about this enquiry.</span>
        </label>
        <button class="form-submit" type="submit">Send enquiry</button>
      </form>
    </section>
  `;
}

function routeFinderMarkup() {
  return `
    <section class="tool-panel route-finder-panel" aria-labelledby="routeFinderTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Decision Support</span>
        <h2 id="routeFinderTitle">Case Route Finder</h2>
        <p>Select the facts that appear relevant. The tool will suggest practice routes, recording points, and sections to open next. It is a learning aid, not legal advice.</p>
      </div>
      <div class="route-question-grid">
        ${routeQuestions.map((question) => `
          <label class="route-question">
            <input type="checkbox" data-route-answer="${question.id}">
            <span>
              <strong>${escapeHtml(question.label)}</strong>
              <small>${escapeHtml(question.detail)}</small>
            </span>
          </label>
        `).join("")}
      </div>
      <div class="tool-actions">
        <button class="secondary-tool-button" type="button" data-route-reset>Clear route check</button>
      </div>
      <div id="routeFinderResults" class="route-results" aria-live="polite"></div>
    </section>
  `;
}

function renderRouteFinderResults() {
  const resultsElement = document.querySelector("#routeFinderResults");
  if (!resultsElement) {
    return;
  }

  const selected = [...document.querySelectorAll("[data-route-answer]:checked")]
    .map((input) => routeQuestions.find((question) => question.id === input.dataset.routeAnswer))
    .filter(Boolean);

  if (!selected.length) {
    resultsElement.innerHTML = `
      <div class="empty-state">
        <strong>No route selected yet.</strong>
        <p>Choose one or more case features above to build a practice route. Complex cases often involve more than one framework.</p>
      </div>
    `;
    return;
  }

  const scores = new Map();
  selected.forEach((question) => {
    question.routes.forEach((routeId, index) => {
      scores.set(routeId, (scores.get(routeId) || 0) + (3 - Math.min(index, 2)));
    });
  });

  const recommendations = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([routeId, score]) => ({ id: routeId, score, ...routeDetails[routeId] }))
    .filter((route) => route.title);

  resultsElement.innerHTML = `
    <div class="route-summary">
      <span class="panel-kicker">Suggested Route</span>
      <h3>${recommendations.length} linked framework${recommendations.length === 1 ? "" : "s"}</h3>
      <p>Use this as a prompt for analysis, supervision, and recording. Always check local procedure and legal advice for live cases.</p>
    </div>
    <div class="route-card-grid">
      ${recommendations.map((route, index) => {
        const resource = resources.find((item) => item.id === route.id);
        return `
          <article class="route-card" style="--accent: ${resource?.accent || "#287c8f"}">
            <span class="route-rank">${index + 1}</span>
            <h3>${escapeHtml(route.title)}</h3>
            <p><strong>Check:</strong> ${escapeHtml(route.action)}</p>
            <p><strong>Record:</strong> ${escapeHtml(route.record)}</p>
            ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}">Open ${escapeHtml(resource.title)}</button>` : ""}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function glossaryMarkup() {
  const letters = ["All", ...new Set(glossaryTerms.map((item) => item.term[0].toUpperCase()))].sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b));
  return `
    <section class="tool-panel glossary-panel" aria-labelledby="glossaryTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Practice Language</span>
        <h2 id="glossaryTitle">Search the glossary</h2>
        <p>Use plain-English definitions for revision, supervision, and confident recording. For live cases, check the full source section and local policy.</p>
      </div>
      <label class="tool-search">
        <span>Find a term</span>
        <input id="glossarySearch" type="search" placeholder="Capacity, Section 42, advocacy..." autocomplete="off">
      </label>
      <div class="glossary-letters" aria-label="Glossary letters">
        ${letters.map((letter) => `
          <button type="button" class="${letter === "All" ? "active" : ""}" data-glossary-letter="${letter}">${letter}</button>
        `).join("")}
      </div>
      <div id="glossaryResults" class="glossary-grid" aria-live="polite"></div>
    </section>
  `;
}

function renderGlossary(query = "", letter = "All") {
  const resultsElement = document.querySelector("#glossaryResults");
  if (!resultsElement) {
    return;
  }

  document.querySelectorAll("[data-glossary-letter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.glossaryLetter === letter);
  });

  const normalisedQuery = query.trim().toLowerCase();
  const terms = glossaryTerms
    .filter((item) => letter === "All" || item.term.toUpperCase().startsWith(letter))
    .filter((item) => !normalisedQuery || `${item.term} ${item.definition}`.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.term.localeCompare(b.term));

  resultsElement.innerHTML = terms.length ? terms.map((item) => {
    const resource = resources.find((resourceItem) => resourceItem.id === item.link);
    const sectionAttribute = item.section ? ` data-section="${escapeHtml(item.section)}"` : "";
    return `
      <article class="glossary-card">
        <h3>${escapeHtml(item.term)}</h3>
        <p>${escapeHtml(item.definition)}</p>
        ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}"${sectionAttribute} aria-label="Open ${escapeHtml(item.term)} in ${escapeHtml(resource.title)}">Open related section</button>` : ""}
      </article>
    `;
  }).join("") : `
    <div class="empty-state">
      <strong>No glossary term found.</strong>
      <p>Try a wider term such as capacity, safeguarding, advocacy, rights, or assessment.</p>
    </div>
  `;
}

function scenarioHubMarkup() {
  return `
    <section class="tool-panel scenario-hub" aria-labelledby="scenarioHubTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Scenario Workout</span>
        <h2 id="scenarioHubTitle">Interactive practice scenarios</h2>
        <p>Use these cards for supervision, ASYE learning, workshops, or private study. Think first, then reveal the practice points.</p>
      </div>
      <div class="scenario-grid">
        ${scenarioWorkouts.map((scenario, index) => `
          <article class="scenario-card">
            <div>
              <span class="scenario-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(scenario.title)}</h3>
              <p>${escapeHtml(scenario.summary)}</p>
            </div>
            <ul>
              ${scenario.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
            </ul>
            <div class="scenario-routes">
              ${scenario.routes.map((routeId) => {
                const resource = resources.find((item) => item.id === routeId);
                return resource ? `<button type="button" data-open="${resource.id}">${escapeHtml(resource.title)}</button>` : "";
              }).join("")}
            </div>
            <button class="scenario-toggle" type="button" data-scenario-toggle="${index}" aria-expanded="false">Reveal learning points</button>
            <div class="scenario-reveal" hidden>
              <strong>Learning point</strong>
              <p>${escapeHtml(scenario.reveal)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function cpdLogMarkup() {
  const today = new Date().toISOString().slice(0, 10);
  const registrationYear = currentRegistrationYearLabel();
  return `
    <section class="tool-panel cpd-panel" aria-labelledby="cpdToolTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Social Work England CPD Drafting Space</span>
        <h2 id="cpdToolTitle">CPD and reflection log</h2>
        <p>Draft Social Work England-style CPD records here, then copy your final entries into your Social Work England online account. Notes stay only in this browser on this device.</p>
      </div>
      <div class="cpd-storage-notice">
        <strong>Save a copy before relying on this log.</strong>
        <p>CPD drafts are stored in this browser on this device. They should remain after a normal refresh, but they can disappear if browser data is cleared, private browsing is used, workplace systems reset storage, or you change device or browser. Export the text file or use Print / Save as PDF for your own records.</p>
      </div>
      <div class="swe-cpd-summary" aria-label="Social Work England CPD requirements">
        <div>
          <strong>2 pieces</strong>
          <span>Minimum CPD records each registration year.</span>
        </div>
        <div>
          <strong>1 peer reflection</strong>
          <span>At least one CPD piece must include peer reflection.</span>
        </div>
        <div>
          <strong>30 November</strong>
          <span>Record CPD in your Social Work England online account by the annual deadline.</span>
        </div>
      </div>
      <div id="cpdRequirementStatus" class="cpd-requirement-status" aria-live="polite"></div>
      <form class="cpd-form">
        <div class="form-grid">
          <label class="form-field">
            <span>CPD activity title</span>
            <input type="text" name="title" placeholder="MCA assessment refresher, Section 42 supervision, case law reading..." required>
          </label>
          <label class="form-field">
            <span>Date of CPD activity</span>
            <input type="date" name="activityDate" value="${today}" required>
          </label>
          <label class="form-field">
            <span>Type of CPD</span>
            <select name="type" required>
              ${cpdTypes.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}
            </select>
          </label>
          <label class="form-field">
            <span>Registration year</span>
            <input type="text" name="registrationYear" value="${escapeHtml(registrationYear)}" required>
          </label>
          <fieldset class="full-span standard-checkbox-grid">
            <legend>Which parts of CPD standard 4 does this activity meet?</legend>
            <p>Social Work England's online form normally selects 4.6 and 4.7 when you record CPD. Select any others that genuinely apply.</p>
            <div>
              ${cpdStandards.map((standard) => `
                <label class="checkbox-field">
                  <input type="checkbox" name="standards" value="${standard.id}" ${["4.6", "4.7"].includes(standard.id) ? "checked" : ""}>
                  <span><strong>${standard.id} ${escapeHtml(standard.short)}</strong>${escapeHtml(standard.text)}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>
          <label class="form-field full-span">
            <span>Describe what you have learnt from doing this CPD activity</span>
            <textarea name="learning" rows="7" class="word-count-field" data-word-count-field="learning" aria-describedby="learningWordCount" placeholder="What did you learn? What changed in your knowledge, thinking, values, legal reasoning, or confidence?" required></textarea>
            <small class="word-guidance">Social Work England suggests around 250 to 500 words.</small>
            <small id="learningWordCount" class="word-count" data-word-count="learning">0 words</small>
          </label>
          <label class="form-field full-span">
            <span>Reflect on the positive impact this CPD has had or will have</span>
            <textarea name="impact" rows="7" class="word-count-field" data-word-count-field="impact" aria-describedby="impactWordCount" placeholder="How has this helped, or how will it help, your practice and the people you work with?" required></textarea>
            <small class="word-guidance">Think about people with lived experience, carers, families, colleagues, students, or the profession.</small>
            <small id="impactWordCount" class="word-count" data-word-count="impact">0 words</small>
          </label>
          <fieldset class="full-span peer-reflection-panel">
            <legend>Peer reflection</legend>
            <label class="checkbox-field peer-toggle">
              <input type="checkbox" name="peerReflectionIncluded" value="yes">
              <span><strong>This entry includes peer reflection</strong>Use this when you have discussed the CPD activity with a peer, manager, or another professional.</span>
            </label>
            <div class="form-grid">
              <label class="form-field">
                <span>Peer role or relationship</span>
                <input type="text" name="peerRole" placeholder="Team manager, colleague, AMHP, practice educator...">
              </label>
              <label class="form-field">
                <span>Date discussed</span>
                <input type="date" name="peerDate">
              </label>
              <label class="form-field full-span">
                <span>What did you learn from discussing this CPD with a peer?</span>
                <textarea name="peerLearning" rows="5" placeholder="Keep this anonymised. Do not record the peer's name or identifiable case details."></textarea>
              </label>
            </div>
          </fieldset>
          <label class="form-field full-span">
            <span>Next action or evidence note</span>
            <textarea name="action" rows="3" placeholder="What will you check, read, practise, discuss in supervision, or change in recording?"></textarea>
          </label>
        </div>
        <p class="cpd-submit-note">This is a private draft log. It does not submit anything to Social Work England, and it should not contain identifiable case information.</p>
        <div class="tool-actions">
          <button class="form-submit" type="submit">Save CPD draft</button>
          <button class="secondary-tool-button" type="button" data-export-cpd>Export CPD drafts</button>
          <button class="secondary-tool-button" type="button" data-print-cpd>Print / Save as PDF</button>
        </div>
      </form>
      <div id="confidenceOverview" class="confidence-overview"></div>
      <div id="cpdEntries" class="cpd-entry-list" aria-live="polite"></div>
    </section>
  `;
}

function getCpdEntries() {
  return JSON.parse(localStorage.getItem("socialWorkerResourceCpdEntries") || "[]");
}

function saveCpdEntries(entries) {
  localStorage.setItem("socialWorkerResourceCpdEntries", JSON.stringify(entries));
}

function currentRegistrationYearLabel(date = new Date()) {
  const year = date.getFullYear();
  const startYear = date.getMonth() === 11 ? year : year - 1;
  return `1 December ${startYear} to 30 November ${startYear + 1}`;
}

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function updateWordCount(field) {
  const target = document.querySelector(`[data-word-count="${field.dataset.wordCountField}"]`);
  if (!target) {
    return;
  }

  const count = countWords(field.value);
  const advice = count < 250
    ? "aim for more detail"
    : count <= 500
      ? "within SWE guidance range"
      : "consider tightening";
  target.textContent = `${count} words, ${advice}`;
  target.dataset.wordCountStatus = count < 250 ? "low" : count <= 500 ? "ready" : "high";
}

function updateAllWordCounts() {
  document.querySelectorAll("[data-word-count-field]").forEach(updateWordCount);
}

function cpdEntryTitle(entry) {
  return entry.title || entry.focus || "Untitled CPD activity";
}

function cpdEntryLearning(entry) {
  return entry.learning || entry.reflection || "";
}

function cpdEntryImpact(entry) {
  return entry.impact || "";
}

function cpdEntryType(entry) {
  return entry.type || entry.confidence || "Reflection";
}

function cpdEntryIncludesPeer(entry) {
  return Boolean(entry.peerReflectionIncluded || entry.peerLearning);
}

function selectedStandardsFor(entry) {
  if (Array.isArray(entry.standards)) {
    return entry.standards;
  }
  return [];
}

function standardLabel(id) {
  const standard = cpdStandards.find((item) => item.id === id);
  return standard ? `${standard.id} ${standard.short}` : id;
}

function renderCpdRequirementStatus() {
  const status = document.querySelector("#cpdRequirementStatus");
  if (!status) {
    return;
  }

  const entries = getCpdEntries();
  const peerCount = entries.filter(cpdEntryIncludesPeer).length;
  const hasMinimumPieces = entries.length >= 2;
  const hasPeerReflection = peerCount >= 1;
  const isReady = hasMinimumPieces && hasPeerReflection;

  status.innerHTML = `
    <div class="cpd-status-card ${hasMinimumPieces ? "ready" : ""}">
      <strong>${entries.length}/2</strong>
      <span>${hasMinimumPieces ? "Minimum CPD pieces drafted" : "Draft at least 2 separate CPD pieces"}</span>
    </div>
    <div class="cpd-status-card ${hasPeerReflection ? "ready" : ""}">
      <strong>${peerCount}/1</strong>
      <span>${hasPeerReflection ? "Peer reflection included" : "Add peer reflection to at least 1 piece"}</span>
    </div>
    <div class="cpd-status-card ${isReady ? "ready" : ""}">
      <strong>${isReady ? "Ready" : "Drafting"}</strong>
      <span>${isReady ? "Copy final entries into your SWE online account" : "This browser log is not your SWE submission"}</span>
    </div>
  `;
}

function renderCpdEntries() {
  const entryList = document.querySelector("#cpdEntries");
  if (!entryList) {
    return;
  }

  renderCpdRequirementStatus();
  const entries = getCpdEntries();
  entryList.innerHTML = entries.length ? `
    <div class="entry-list-head">
      <span class="panel-kicker">Saved CPD Drafts</span>
      <strong>${entries.length} saved</strong>
    </div>
    ${entries.map((entry) => `
      <article class="cpd-entry">
        <div>
          <h3>${escapeHtml(cpdEntryTitle(entry))}</h3>
          <span>${escapeHtml(entry.activityDate || entry.date || "")} | ${escapeHtml(cpdEntryType(entry))}${entry.registrationYear ? ` | ${escapeHtml(entry.registrationYear)}` : ""}</span>
        </div>
        ${selectedStandardsFor(entry).length ? `
          <div class="standard-pill-row" aria-label="Selected CPD standards">
            ${selectedStandardsFor(entry).map((standard) => `<span>${escapeHtml(standardLabel(standard))}</span>`).join("")}
          </div>
        ` : ""}
        <div class="cpd-entry-section">
          <strong>Learning</strong>
          <p>${escapeHtml(cpdEntryLearning(entry))}</p>
        </div>
        ${cpdEntryImpact(entry) ? `
          <div class="cpd-entry-section">
            <strong>Impact on practice and people</strong>
            <p>${escapeHtml(cpdEntryImpact(entry))}</p>
          </div>
        ` : ""}
        ${cpdEntryIncludesPeer(entry) ? `
          <div class="cpd-entry-section peer-note">
            <strong>Peer reflection${entry.peerRole ? ` with ${escapeHtml(entry.peerRole)}` : ""}${entry.peerDate ? ` on ${escapeHtml(entry.peerDate)}` : ""}</strong>
            ${entry.peerLearning ? `<p>${escapeHtml(entry.peerLearning)}</p>` : "<p>Peer reflection included. Add what you learnt from the discussion before copying to Social Work England.</p>"}
          </div>
        ` : ""}
        ${entry.action ? `<p><strong>Next:</strong> ${escapeHtml(entry.action)}</p>` : ""}
        <button type="button" data-delete-cpd="${entry.id}">Delete</button>
      </article>
    `).join("")}
  ` : `
    <div class="empty-state">
      <strong>No CPD drafts saved yet.</strong>
      <p>Add a Social Work England-style draft after reading a module, completing a scenario, or discussing learning in supervision.</p>
    </div>
  `;
}

function confidenceLabel(value) {
  return {
    "not-started": "Not started",
    learning: "Learning",
    confident: "Confident",
    supervision: "Needs supervision"
  }[value] || "Not started";
}

function renderConfidenceOverview() {
  const overview = document.querySelector("#confidenceOverview");
  if (!overview) {
    return;
  }

  const tracked = resources.filter((resource) => resource.group !== "Website");
  const counts = tracked.reduce((acc, resource) => {
    const value = state.confidence[resource.id] || "not-started";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  overview.innerHTML = `
    <div class="entry-list-head">
      <span class="panel-kicker">Confidence Tracker</span>
      <strong>${counts.confident || 0} confident</strong>
    </div>
    <div class="confidence-grid">
      ${["not-started", "learning", "confident", "supervision"].map((key) => `
        <div>
          <strong>${counts[key] || 0}</strong>
          <span>${confidenceLabel(key)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function exportCpdLog() {
  const entries = getCpdEntries();
  const content = entries.length
    ? entries.map((entry) => [
      `CPD activity title: ${cpdEntryTitle(entry)}`,
      `Date saved: ${entry.date || ""}`,
      `Date of CPD activity: ${entry.activityDate || ""}`,
      `Registration year: ${entry.registrationYear || ""}`,
      `Type of CPD: ${cpdEntryType(entry)}`,
      `CPD standard parts selected: ${selectedStandardsFor(entry).map(standardLabel).join(", ")}`,
      "",
      "Describe what you have learnt from doing this CPD activity:",
      cpdEntryLearning(entry),
      "",
      "Reflect on and describe the positive impact the CPD has had or will have on your practice and the people you work with:",
      cpdEntryImpact(entry),
      "",
      `Peer reflection included: ${cpdEntryIncludesPeer(entry) ? "Yes" : "No"}`,
      `Peer role or relationship: ${entry.peerRole || ""}`,
      `Date discussed with peer: ${entry.peerDate || ""}`,
      "What you learnt from discussing this CPD with a peer:",
      entry.peerLearning || "",
      "",
      `Next action: ${entry.action || ""}`
    ].join("\n")).join("\n\n---\n\n")
    : "No CPD drafts saved yet.";
  downloadTextFile("social-worker-resource-cpd-log.txt", content);
}

function cpdPrintableEntryMarkup(entry, index) {
  return `
    <article class="entry">
      <h2>${index + 1}. ${escapeHtml(cpdEntryTitle(entry))}</h2>
      <dl>
        <div><dt>Date saved</dt><dd>${escapeHtml(entry.date || "")}</dd></div>
        <div><dt>Date of CPD activity</dt><dd>${escapeHtml(entry.activityDate || "")}</dd></div>
        <div><dt>Registration year</dt><dd>${escapeHtml(entry.registrationYear || "")}</dd></div>
        <div><dt>Type of CPD</dt><dd>${escapeHtml(cpdEntryType(entry))}</dd></div>
        <div><dt>CPD standard parts selected</dt><dd>${escapeHtml(selectedStandardsFor(entry).map(standardLabel).join(", "))}</dd></div>
        <div><dt>Peer reflection included</dt><dd>${cpdEntryIncludesPeer(entry) ? "Yes" : "No"}</dd></div>
      </dl>
      <h3>Describe what you have learnt from doing this CPD activity</h3>
      <p>${escapeHtml(cpdEntryLearning(entry))}</p>
      <h3>Reflect on and describe the positive impact the CPD has had or will have</h3>
      <p>${escapeHtml(cpdEntryImpact(entry))}</p>
      ${cpdEntryIncludesPeer(entry) ? `
        <h3>What you learnt from discussing this CPD with a peer</h3>
        <p><strong>Peer role or relationship:</strong> ${escapeHtml(entry.peerRole || "")}</p>
        <p><strong>Date discussed:</strong> ${escapeHtml(entry.peerDate || "")}</p>
        <p>${escapeHtml(entry.peerLearning || "")}</p>
      ` : ""}
      ${entry.action ? `
        <h3>Next action or evidence note</h3>
        <p>${escapeHtml(entry.action)}</p>
      ` : ""}
    </article>
  `;
}

function printCpdLog() {
  const entries = getCpdEntries();
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    window.print();
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-GB");
  const body = entries.length
    ? entries.map(cpdPrintableEntryMarkup).join("")
    : "<p>No CPD drafts saved yet.</p>";

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Social Worker Resource CPD Drafts</title>
        <style>
          body {
            margin: 0;
            color: #213134;
            font-family: Arial, sans-serif;
            line-height: 1.55;
          }

          main {
            max-width: 860px;
            margin: 0 auto;
            padding: 34px 28px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }

          h2 {
            color: #287c8f;
            font-size: 20px;
            margin-top: 24px;
          }

          h3 {
            color: #213134;
            font-size: 15px;
            margin: 18px 0 6px;
          }

          .notice {
            border-left: 5px solid #c5902d;
            background: #fff7df;
            margin: 20px 0;
            padding: 12px 14px;
          }

          .entry {
            break-inside: avoid;
            border-top: 1px solid #d8e5dc;
            margin-top: 22px;
            padding-top: 12px;
          }

          dl {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 18px;
            margin: 12px 0;
          }

          dt {
            color: #41555a;
            font-weight: 700;
          }

          dd {
            margin: 0;
          }

          p {
            white-space: pre-wrap;
          }

          @media print {
            main {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Social Worker Resource CPD Drafts</h1>
          <p>Generated ${escapeHtml(generatedDate)}. These are private draft notes for copying into the Social Work England online account where appropriate.</p>
          <div class="notice">
            <strong>Storage reminder:</strong> these drafts are saved in this browser on this device. Keep an exported or PDF copy if you need a reliable record.
          </div>
          ${body}
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printableToolsMarkup() {
  return `
    <section class="tool-panel printable-panel" aria-labelledby="printableTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Practice Toolkit</span>
        <h2 id="printableTitle">Download or print practice prompts</h2>
        <p>These prompts are for learning, supervision, and drafting. Adapt them to local recording systems, policy, and the person you are working with.</p>
      </div>
      <div class="tool-actions">
        <button class="secondary-tool-button" type="button" data-print-page>Print this page</button>
        <button class="secondary-tool-button" type="button" data-download-all-tools>Download all prompts</button>
      </div>
      <div class="download-grid">
        ${printableTemplates.map((template) => `
          <article class="download-card">
            <h3>${escapeHtml(template.title)}</h3>
            <p>${escapeHtml(template.body.split("\n").slice(2, 5).join(" "))}</p>
            <button class="inline-open" type="button" data-download-template="${template.id}">Download prompt</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function downloadTextFile(fileName, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function studentPathwayMarkup() {
  return `
    <section class="tool-panel pathway-panel" aria-labelledby="pathwayTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Student and ASYE Route</span>
        <h2 id="pathwayTitle">Build confidence step by step</h2>
        <p>Use this route for placement learning, ASYE evidence, supervision preparation, and practice educator conversations.</p>
      </div>
      <div class="pathway-steps">
        ${studentPathwaySteps.map((step, index) => {
          const resource = resources.find((item) => item.id === step.resource);
          return `
            <article class="pathway-step" style="--accent: ${resource?.accent || "#287c8f"}">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.task)}</p>
              ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}">Open ${escapeHtml(resource.title)}</button>` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function countFlashcards() {
  return flashcardDecks.reduce((count, deck) => count + deck.cards.length, 0);
}

function flashcardsMarkup() {
  const totalCards = countFlashcards();
  return `
    <section class="flashcards-panel" aria-labelledby="flashcardsTitle">
      <div class="flashcards-head">
        <div>
          <span class="panel-kicker">Learning Deck</span>
          <h2 id="flashcardsTitle">Module flashcards</h2>
          <p>${totalCards} revision cards across ${flashcardDecks.length} modules. Filter by module, flip each card, and use the prompts for recall practice.</p>
        </div>
        <div class="flashcards-summary" aria-label="Flashcard summary">
          <strong>${totalCards}</strong>
          <span>cards</span>
        </div>
      </div>
      <div class="flashcard-filters" aria-label="Choose flashcard module">
        <button class="flashcard-filter active" data-flashcard-filter="all">All Modules</button>
        ${flashcardDecks.map((deck) => `
          <button class="flashcard-filter" data-flashcard-filter="${deck.id}">${deck.title}</button>
        `).join("")}
      </div>
      <div id="flashcardDeck" class="flashcard-grid" aria-live="polite"></div>
    </section>
  `;
}

function renderFlashcards(filter = "all") {
  const deckElement = document.querySelector("#flashcardDeck");
  if (!deckElement) {
    return;
  }

  const selectedDecks = filter === "all"
    ? flashcardDecks
    : flashcardDecks.filter((deck) => deck.id === filter);
  const cards = selectedDecks.flatMap((deck) => deck.cards.map((card, index) => ({ ...card, deck, index })));

  document.querySelectorAll(".flashcard-filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.flashcardFilter === filter);
  });

  deckElement.innerHTML = cards.map((card, index) => `
    <button class="flashcard" type="button" data-flip-card aria-pressed="false" style="--accent: ${resources.find((resource) => resource.id === card.deck.id)?.accent || "#4f8a66"}">
      <span class="flashcard-inner">
        <span class="flashcard-face flashcard-front" aria-hidden="false">
          <span class="flashcard-meta">
            <span>${card.deck.title}</span>
            <span>${String(index + 1).padStart(2, "0")} / ${cards.length}</span>
          </span>
          <span class="flashcard-content">
            <span class="flashcard-label">Prompt</span>
            <strong>${escapeHtml(card.prompt)}</strong>
          </span>
          <span class="flashcard-toggle">Flip card</span>
        </span>
        <span class="flashcard-face flashcard-back" aria-hidden="true">
          <span class="flashcard-meta">
            <span>${card.deck.title}</span>
            <span>${String(index + 1).padStart(2, "0")} / ${cards.length}</span>
          </span>
          <span class="flashcard-content">
            <span class="flashcard-label">Answer</span>
            <span>${escapeHtml(card.answer)}</span>
          </span>
          <span class="flashcard-toggle">Show prompt</span>
        </span>
      </span>
    </button>
  `).join("");
}

function enhanceResource(documentData) {
  if (documentData.id === "case-route-finder") {
    contentView.insertAdjacentHTML("beforeend", routeFinderMarkup());
    renderRouteFinderResults();
  }
  if (documentData.id === "contact-us") {
    contentView.insertAdjacentHTML("beforeend", contactFormMarkup());
  }
  if (documentData.id === "cpd-log") {
    contentView.insertAdjacentHTML("beforeend", cpdLogMarkup());
    renderConfidenceOverview();
    renderCpdEntries();
    updateAllWordCounts();
  }
  if (documentData.id === "flashcards") {
    contentView.insertAdjacentHTML("beforeend", flashcardsMarkup());
    renderFlashcards();
  }
  if (documentData.id === "glossary") {
    contentView.insertAdjacentHTML("beforeend", glossaryMarkup());
    renderGlossary();
  }
  if (documentData.id === "printable-tools" || documentData.id === "templates") {
    contentView.insertAdjacentHTML("beforeend", printableToolsMarkup());
  }
  if (documentData.id === "scenarios") {
    contentView.insertAdjacentHTML("afterbegin", scenarioHubMarkup());
  }
  if (documentData.id === "student-asye-pathway") {
    contentView.insertAdjacentHTML("beforeend", studentPathwayMarkup());
  }
}

function renderToc() {
  const headings = [...contentView.querySelectorAll("h2, h3")].slice(0, 14);
  if (!headings.length) {
    sectionToc.innerHTML = "<h3>Section Contents</h3><p>No sub-sections in this page.</p>";
    return;
  }

  sectionToc.innerHTML = `
    <h3>Section Contents</h3>
    ${headings.map((heading) => `
      <a class="toc-link" href="#${heading.id}">${heading.textContent}</a>
    `).join("")}
  `;
}

function scrollToElementWithOffset(element) {
  if (!element) {
    return;
  }
  const headerHeight = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
  const stickyHeader = window.matchMedia("(max-width: 980px)").matches
    ? document.querySelector(".sidebar")
    : null;
  const offset = headerHeight + (stickyHeader ? stickyHeader.getBoundingClientRect().height : 0) + 18;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function scrollToReaderSection() {
  scrollToElementWithOffset(document.querySelector("#readerSection"));
}

function scrollToContentSection(sectionId) {
  const target = sectionId ? document.getElementById(sectionId) : null;
  if (!target) {
    scrollToReaderSection();
    return;
  }
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  scrollToElementWithOffset(target);
}

function openResource(id, shouldScroll = true, targetSection = "") {
  const documentData = state.documents.get(id);
  if (!documentData) {
    return;
  }

  state.activeId = id;
  state.query = "";
  searchInput.value = "";
  renderSearch();
  contentView.innerHTML = documentData.html;
  enhanceResource(documentData);
  renderActiveResource(documentData);
  renderToc();
  renderNav();
  renderModuleCards();
  renderProgress();
  if (shouldScroll) {
    updateResourceUrl(id, targetSection);
    if (targetSection) {
      scrollToContentSection(targetSection);
    } else {
      scrollToReaderSection();
    }
  }
}

function renderProgress() {
  const count = state.read.size;
  progressText.textContent = `${count} of ${resources.length} sections read`;
  progressBar.style.width = `${Math.round((count / resources.length) * 100)}%`;
  markReadButton.textContent = state.read.has(state.activeId) ? "Current section read" : "Mark current section read";
  readerMarkReadButton.textContent = state.read.has(state.activeId) ? "Section read" : "Mark section read";
  if (confidenceSelect) {
    confidenceSelect.value = state.confidence[state.activeId] || "not-started";
  }
  renderConfidenceOverview();
}

function persistRead() {
  localStorage.setItem("socialWorkerResourceRead", JSON.stringify([...state.read]));
}

function persistConfidence() {
  localStorage.setItem("socialWorkerResourceConfidence", JSON.stringify(state.confidence));
}

function getSearchMatches(query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) {
    return [];
  }

  return [...state.documents.values()]
    .map((documentData) => {
      const haystack = `${documentData.title} ${documentData.summary} ${documentData.plain}`.toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      const titleHit = terms.some((term) => documentData.title.toLowerCase().includes(term));
      const summaryHit = terms.some((term) => documentData.summary.toLowerCase().includes(term));
      return {
        ...documentData,
        score: matchedTerms.length + (titleHit ? 3 : 0) + (summaryHit ? 2 : 0)
      };
    })
    .filter((documentData) => documentData.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 10);
}

function snippetFor(text, query) {
  const lower = text.toLowerCase();
  const firstTerm = query.toLowerCase().split(/\s+/).find((term) => lower.includes(term)) || query.toLowerCase();
  const start = Math.max(0, lower.indexOf(firstTerm) - 90);
  const end = Math.min(text.length, start + 220);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}

function renderSearch() {
  const query = state.query.trim();
  if (query.length < 2) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    sidebarSearchResults.hidden = true;
    sidebarSearchResults.innerHTML = "";
    return;
  }

  const matches = getSearchMatches(query);

  searchResults.hidden = false;
  searchResults.innerHTML = `
    <div class="search-results-header">
      <span class="panel-kicker">Live Search</span>
      <h2>${matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"} for "${escapeHtml(query)}"` : `No results for "${escapeHtml(query)}"`}</h2>
      <p>${matches.length ? "Matching sections are shown below. Open a result to read the full learning page." : "Try a different term such as capacity, safeguarding, DoLS, eligibility, Section 42, or best interests."}</p>
    </div>
    ${matches.length ? `
      <div class="results-grid">
        ${matches.map((match) => `
          <article class="search-result-card">
            <button data-open="${match.id}">
              <span class="result-meta">${match.group} / ${match.code}</span>
              <h3>${highlightText(match.title, query)}</h3>
              <p>${highlightText(snippetFor(`${match.summary} ${match.plain}`, query), query)}</p>
            </button>
          </article>
        `).join("")}
      </div>
    ` : ""}
  `;

  sidebarSearchResults.hidden = false;
  sidebarSearchResults.innerHTML = `
    <div class="sidebar-search-title">${matches.length ? "Matches" : "No matches"}</div>
    ${matches.length ? matches.slice(0, 5).map((match) => `
      <button class="sidebar-result-button" data-open="${match.id}">
        <span>${highlightText(match.title, query)}</span>
        <small>${highlightText(snippetFor(`${match.summary} ${match.plain}`, query), query)}</small>
      </button>
    `).join("") : `<p>Try "capacity", "DoLS", "safeguarding", or "Care Act".</p>`}
  `;
}

document.addEventListener("click", (event) => {
  const mobileToggle = event.target.closest("#mobileNavToggle");
  if (mobileToggle) {
    setMobileNavigation(!siteHeader?.classList.contains("nav-open"));
    return;
  }

  if (siteHeader?.classList.contains("nav-open") && !event.target.closest(".site-header")) {
    setMobileNavigation(false);
  }

  const routeReset = event.target.closest("[data-route-reset]");
  if (routeReset) {
    document.querySelectorAll("[data-route-answer]").forEach((input) => {
      input.checked = false;
    });
    renderRouteFinderResults();
    return;
  }

  const glossaryLetter = event.target.closest("[data-glossary-letter]");
  if (glossaryLetter) {
    const search = document.querySelector("#glossarySearch");
    renderGlossary(search?.value || "", glossaryLetter.dataset.glossaryLetter);
    return;
  }

  const scenarioToggle = event.target.closest("[data-scenario-toggle]");
  if (scenarioToggle) {
    const card = scenarioToggle.closest(".scenario-card");
    const reveal = card?.querySelector(".scenario-reveal");
    if (reveal) {
      const isOpen = reveal.hidden;
      reveal.hidden = !isOpen;
      scenarioToggle.setAttribute("aria-expanded", String(isOpen));
      scenarioToggle.textContent = isOpen ? "Hide learning points" : "Reveal learning points";
    }
    return;
  }

  const templateDownload = event.target.closest("[data-download-template]");
  if (templateDownload) {
    const template = printableTemplates.find((item) => item.id === templateDownload.dataset.downloadTemplate);
    if (template) {
      downloadTextFile(template.fileName, template.body);
    }
    return;
  }

  const downloadAllTools = event.target.closest("[data-download-all-tools]");
  if (downloadAllTools) {
    downloadTextFile(
      "social-worker-practice-prompts.txt",
      printableTemplates.map((template) => template.body).join("\n\n====================\n\n")
    );
    return;
  }

  const printPage = event.target.closest("[data-print-page]");
  if (printPage) {
    window.print();
    return;
  }

  const exportCpd = event.target.closest("[data-export-cpd]");
  if (exportCpd) {
    exportCpdLog();
    return;
  }

  const printCpd = event.target.closest("[data-print-cpd]");
  if (printCpd) {
    printCpdLog();
    return;
  }

  const deleteCpd = event.target.closest("[data-delete-cpd]");
  if (deleteCpd) {
    const entries = getCpdEntries().filter((entry) => entry.id !== deleteCpd.dataset.deleteCpd);
    saveCpdEntries(entries);
    renderCpdEntries();
    return;
  }

  const filterButton = event.target.closest("[data-flashcard-filter]");
  if (filterButton) {
    renderFlashcards(filterButton.dataset.flashcardFilter);
    return;
  }

  const flashcard = event.target.closest("[data-flip-card]");
  if (flashcard) {
    const isFlipped = flashcard.classList.toggle("flipped");
    flashcard.setAttribute("aria-pressed", String(isFlipped));
    const front = flashcard.querySelector(".flashcard-front");
    const back = flashcard.querySelector(".flashcard-back");
    if (front && back) {
      front.setAttribute("aria-hidden", String(isFlipped));
      back.setAttribute("aria-hidden", String(!isFlipped));
    }
    return;
  }

  const opener = event.target.closest("[data-open]");
  if (opener) {
    openResource(opener.dataset.open, true, opener.dataset.section || "");
    setMobileNavigation(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteHeader?.classList.contains("nav-open")) {
    setMobileNavigation(false);
    mobileNavToggle?.focus();
  }
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSearch();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#glossarySearch")) {
    const activeLetter = document.querySelector("[data-glossary-letter].active")?.dataset.glossaryLetter || "All";
    renderGlossary(event.target.value, activeLetter);
  }
  if (event.target.matches("[data-word-count-field]")) {
    updateWordCount(event.target);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-route-answer]")) {
    renderRouteFinderResults();
  }
});

document.addEventListener("submit", (event) => {
  if (!event.target.matches(".cpd-form")) {
    return;
  }
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const entries = getCpdEntries();
  entries.unshift({
    id: String(Date.now()),
    date: new Date().toLocaleDateString("en-GB"),
    title: String(formData.get("title") || "").trim(),
    activityDate: String(formData.get("activityDate") || "").trim(),
    registrationYear: String(formData.get("registrationYear") || "").trim(),
    type: String(formData.get("type") || "").trim(),
    standards: formData.getAll("standards").map((standard) => String(standard)),
    learning: String(formData.get("learning") || "").trim(),
    impact: String(formData.get("impact") || "").trim(),
    peerReflectionIncluded: formData.get("peerReflectionIncluded") === "yes",
    peerRole: String(formData.get("peerRole") || "").trim(),
    peerDate: String(formData.get("peerDate") || "").trim(),
    peerLearning: String(formData.get("peerLearning") || "").trim(),
    action: String(formData.get("action") || "").trim()
  });
  saveCpdEntries(entries);
  form.reset();
  updateAllWordCounts();
  renderCpdEntries();
});

if (confidenceSelect) {
  confidenceSelect.addEventListener("change", (event) => {
    state.confidence[state.activeId] = event.target.value;
    persistConfidence();
    renderProgress();
  });
}

markReadButton.addEventListener("click", () => {
  state.read.add(state.activeId);
  persistRead();
  renderNav();
  renderModuleCards();
  renderProgress();
});

readerMarkReadButton.addEventListener("click", () => {
  state.read.add(state.activeId);
  persistRead();
  renderNav();
  renderModuleCards();
  renderProgress();
});

contentView.innerHTML = '<p class="loading">Loading resource...</p>';

loadDocuments()
  .then(() => {
    renderNav();
    renderModuleCards();
    renderProgress();
    openResource(state.activeId, false);
  })
  .catch((error) => {
    contentView.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  });
