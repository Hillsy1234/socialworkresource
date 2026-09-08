"""Publish authored teaching notes and their linked learning companions together."""
import hashlib
import importlib
import json
import re
from pathlib import Path
from common import TOPICS

ROOT = Path(__file__).resolve().parents[2]
DATE = '2026-09-08'
PACKS = ['scotland', 'northern-ireland', 'ireland', 'new-zealand', 'australia-nsw', 'australia-victoria', 'canada-ontario', 'canada-british-columbia', 'united-states-california', 'united-states-new-york', 'wales']

def write(path, text):
    (ROOT / path).write_text('\n'.join(line.rstrip() for line in text.rstrip().splitlines()) + '\n')

def links(sources):
    return '\n'.join(f"- [{s['title']}]({s['url']})" for s in sources)

def bullets(lines):
    return '\n'.join('- ' + line for line in lines)

registry = json.loads((ROOT / 'monitoring/sources.json').read_text())
obsolete = 'https://www.gov.wales/sites/default/files/publications/2021-08/atisn15305doc6.pdf'
registry['sources'] = [s for s in registry['sources'] if s['url'] != obsolete]
registered = {s['url']: s for s in registry['sources']}
coverage = []

for jurisdiction in PACKS:
    module_path = Path(__file__).parent / (jurisdiction.replace('-', '_') + '.py')
    if not module_path.exists():
        raise FileNotFoundError(module_path)
    data = importlib.import_module(jurisdiction.replace('-', '_')).DATA
    assert set(data) == set(TOPICS), jurisdiction
    manifest_path = f'content/{jurisdiction}/manifest.json'
    m = json.loads((ROOT / manifest_path).read_text())
    if jurisdiction == 'wales':
        m.setdefault('professionalBody', 'Social Care Wales')
    resources = {r['id']: r for r in m['resources']}
    label = m['label']
    scenarios, cards = [], []
    quick = [f'# Practice reference — {label}', '\nUse alongside the full modules and current official sources. Each entry separates the local framework, action and review.']
    library = [f'# Source Library — {label}', '\n## Professional starting point', f"\n{m['professionalBody']}", '\n## Official sources by topic']
    card_text = [f'# Learning Flashcards — {label}', '\nAnswer before revealing the response in the interactive workspace. These cards accompany the full local modules.']
    case_text = [f'# Scenario Workouts — {label}', '\nAll cases are fictional learning exercises. Explain your evidence and reasoning before reading the discussion.']
    pathway = [f'# Student Learning Pathway — {label}', '\nWork through each topic using its official sources, then complete the case and recording exercise.']
    for topic, d in data.items():
        assert all(d.get(k) for k in ['legal', 'steps', 'rights', 'case', 'answer', 'pitfall', 'sources'])
        r = resources[topic]
        common = TOPICS[topic]
        title = r['title']
        original = None
        if d.get('preserve'):
            original = (ROOT / r['path']).read_text().split('\n<!-- curriculum-expansion -->')[0]
            original = original.replace(obsolete, 'https://www.legislation.gov.uk/mwa/2010/7/part/3')
            # Retain the sources supporting Wales's existing, more detailed lessons.
            for source_title, source_url in re.findall(r'\[([^\]]+)\]\((https://[^\s]+)\)', original):
                if not any(s['url'] == source_url for s in d['sources']):
                    d['sources'].append(dict(title=source_title, url=source_url, category='policy'))
        text = f'''# {title}

## Learning outcomes

{common['outcome']}

## Local legislation, policy and professional framework

{d['legal']}

{common['teaching']}

## Apply the local pathway

{bullets(d['steps'])}

## Rights, challenge and review

{d['rights']}

## Worked learning example

Fictional case: {d['case']}

Before reading the discussion, identify the relevant decision, the missing evidence and the person who can lawfully act.

### Discussion and reasoning

{d['answer']}

### Common error to avoid

{d['pitfall']}

## Recording and supervision exercise

Use the matching printable prompt to make a short record for this case. Include:

{bullets(common['record'])}

Ask a supervisor to identify a missing fact that could change your conclusion. Revise the plan to show who will obtain that fact and what happens while it remains uncertain.

## Official sources and currency

{links(d['sources'])}

Editorial expansion: 8 September 2026. The sources support the distinctions taught here; check their current text, amendments, commencement and applicable local procedure before operational use. Independent practitioner review has not been recorded.
'''
        if d.get('preserve'):
            # Add targeted detail without duplicating Wales's existing lesson sequence.
            text = original.rstrip() + f'''

<!-- curriculum-expansion -->

## Further local practice detail

{d['legal']}

### Decision pathway

{bullets(d['steps'])}

### Challenge and review in this pathway

{d['rights']}

### Additional worked case

Fictional case: {d['case']}

{d['answer']}

Common error to avoid: {d['pitfall']}

### Sources for the expanded lesson

{links(d['sources'])}

Editorial expansion: 8 September 2026. Check current law, commencement and local procedure before operational use. Independent practitioner review has not been recorded.
'''
        write(r['path'], text)
        r['summary'] = common['outcome']
        r['editorialExpandedAt'] = DATE
        # No claim of professional review or complete provision-by-provision verification.
        r['practiceReviewedAt'] = None
        paragraphs = d['legal'].split('\n\n')
        deck = dict(id=topic, title=title, cards=[
            dict(prompt=f'Which local framework anchors this topic in {label}?', answer=paragraphs[0]),
            dict(prompt='Which distinction must be kept clear?', answer=paragraphs[-1]),
            dict(prompt='What are the key local actions?', answer=' '.join(d['steps'])),
            dict(prompt='How can the person participate or challenge the decision?', answer=d['rights']),
            dict(prompt='What common error should you avoid?', answer=d['pitfall']),
        ])
        cards.append(deck)
        if jurisdiction != 'wales':
            for term in m['glossaryTerms'][:8]:
                if term['link'] == topic:
                    term['definition'] = paragraphs[0]

        prompts = ['Which local framework and decision-maker apply?', 'What evidence and support could change the next step?', 'How will the person participate, challenge and obtain review?']
        scenarios.append(dict(title=title, summary=d['case'], routes=[topic, 'rights', 'sources'] if topic != 'rights' else ['rights', 'foundations', 'sources'], prompts=prompts, reveal=d['answer']))
        m['routeDetails'][topic] = dict(title=title, action=d['steps'][0], record=' '.join(d['steps'][1:]) + ' ' + d['rights'])
        for step in m['studentPathwaySteps']:
            if step['resource'] == topic:
                step['task'] = f"{d['steps'][0]} Work through the fictional case and explain: {d['pitfall']}"
        template_alias = {'carer': 'care-support', 'capacity': 'mca', 'best-interests': 'mca', 'adult-safeguarding': 'safeguarding', 'liberty': 'dols', 'mental-health': 'mha', 'children-transition': 'children'}
        for template in m['printableTemplates']:
            if template_alias.get(template['id'], template['id']) == topic:
                template['summary'] = common['outcome']
                template['body'] = f"{template['title']}\n{label} practice guide\nLearning prompt, not an official statutory form. Use fictional or anonymised information.\n\nLocal framework:\n{d['legal']}\n\nLocal pathway:\n" + '\n'.join(d['steps']) + '\n\nRecording prompts:\n' + '\n\n'.join(f'{i+1}. {p}\nNotes:' for i, p in enumerate(common['record'])) + f"\n\nChallenge and review:\n{d['rights']}\n\nSources:\n" + '\n'.join(s['url'] for s in d['sources']) + '\n'
        quick.extend([f'\n## {title}', d['legal'], '\n' + bullets(d['steps']), '\n' + d['rights'], '\n' + links(d['sources'])])
        library.extend([f'\n### {title}', links(d['sources'])])
        card_text.extend([f'\n## {title}'] + [f"\n### {c['prompt']}\n\n{c['answer']}" for c in deck['cards']])
        case_text.extend([f'\n## {title}', d['case'], '\n' + bullets(prompts), '\n### Discussion\n\n' + d['answer']])
        pathway.extend([f'\n## {title}', d['steps'][0], '\nRead the module, explain the common error, then complete its case and printable prompt.'])
        for s in d['sources']:
            url = s['url']
            if url not in registered:
                from urllib.parse import urlparse
                host = urlparse(url).hostname
                discovery = urlparse(url).path in ['', '/', '/omhweb/guidance/', '/programs/adult-svcs/', '/programs/cps/'] or 'repository/' in url or 'legislation-bills-' in url
                registered[url] = dict(id=hashlib.sha256(url.encode()).hexdigest()[:16], url=url, title=s['title'], publisher=host, category=s['category'], kind='discovery' if discovery else 'document', jurisdictions=[], references=[], coverageNote='Checks this specific official source URL. Linked documents and commencement changes require editorial review; inclusion does not certify legal completeness.')
            item = registered[url]
            if jurisdiction not in item['jurisdictions']:
                item['jurisdictions'].append(jurisdiction)
                item['jurisdictions'].sort()
            ref = dict(jurisdiction=jurisdiction, id=topic, title=title, path=r['path'])
            if not any(x['jurisdiction'] == jurisdiction and x['id'] == topic for x in item['references']):
                item['references'].append(ref)
        coverage.append(dict(jurisdiction=jurisdiction, topic=topic, path=r['path'], words=len(re.findall(r'\b[\w’]+\b', text)), localFramework=True, localActions=True, challengeRoute=True, workedCase=True, recordingExercise=True, sourceUrls=[s['url'] for s in d['sources']], editorialExpandedAt=DATE, practiceReviewedAt=None))
    if jurisdiction != 'wales':
        glossary = [f'# Practice Glossary — {label}', 'Use each definition with its linked full lesson and official sources.']
        for term in m['glossaryTerms']:
            glossary.extend([f"## {term['term']}", term['definition']])
        write(resources['glossary']['path'], '\n\n'.join(glossary))
    currency_alerts = {
        'ireland': 'The Mental Health Act 2026 has been enacted. Check commencement for each provision before changing the operative pathway.',
        'new-zealand': 'The new Mental Health Act is scheduled to commence on 1 July 2028; use the current 1992 framework until the applicable change takes effect.',
        'northern-ireland': 'The capacity legislation is partly commenced. Use the current June 2026 interim liberty guidance with the operative provisions.',
        'united-states-california': 'Use the expanded grave-disability criteria and current county procedures; older food, clothing and shelter summaries are incomplete.',
        'united-states-new-york': 'Current emergency-admission guidance includes essential-needs grounds. Apply the exact admission route and safeguards.'
    }
    if jurisdiction in currency_alerts:
        m['alerts'][0] = currency_alerts[jurisdiction]
    m['flashcardDecks'] = cards
    m['scenarioWorkouts'] = scenarios
    m['version'] = '2026-09-08-curriculum-2'
    write(manifest_path, json.dumps(m, ensure_ascii=False, indent=2))
    library.extend(['\n## How to verify a rule', 'Identify territorial scope, current consolidated text, amendments and commencement, then the applicable statutory guidance and service procedure. An enactment announcement or portal is not proof that every provision is in force.', '\n## Editorial status', 'Final learning-guide release. Core lessons and linked learning tools were expanded on 8 September 2026. Independent practitioner review has not been recorded. Monthly monitoring flags source changes for editorial assessment and does not automatically rewrite legal guidance.'])
    for resource_id, sections in [('quick-reference', quick), ('sources', library), ('flashcards', card_text), ('scenarios', case_text), ('student-pathway', pathway)]:
        write(resources[resource_id]['path'], '\n\n'.join(sections))

registry['sources'] = sorted(registered.values(), key=lambda s: s['id'])
write('monitoring/sources.json', json.dumps(registry, ensure_ascii=False, indent=2))
write('docs/COUNTRY_CURRICULUM_COVERAGE.json', json.dumps(dict(editorialDate=DATE, scope='Eight core teaching topics and linked learning tools. Structural coverage is not certification of all applicable law or independent practitioner review.', topics=coverage), ensure_ascii=False, indent=2))
print(f'Expanded {len(coverage)} topics across {len(set(r["jurisdiction"] for r in coverage))} locations; {len(registry["sources"])} monitored source URLs.')
