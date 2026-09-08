# Monthly web-search discovery

Web search supplements the 318 registered source URLs. It discovers leads for editorial review; it cannot promise to find every legislative, policy or practice change. It never writes learning content, registers a new source, creates an update proposal or approves publication.

## Coverage and operation

- All 12 practice locations get eight fixed queries: legislation/amendments/commencement, policy, guidance/consultations, professional standards, training/CPD and court decisions, plus government and regulator/professional-body searches without date filters.
- Six queries use a rolling 90-day window ending on the date that location's batch first starts. Resuming a batch preserves that date window. Dates use publication/update metadata, not commencement dates. Two queries include undated/older pages. Country targeting and region names improve relevance but are not proof of local applicability. Searches currently use English.
- Tavily basic search returns up to 20 results per query with no offset pagination. The report flags queries that return the full 20 results, because additional results may exist. Normal ceiling: 96 requests per month. Successful responses are saved and reused on resume. Each query has at most three attempts per month; a persistent monthly counter also enforces an absolute ceiling of 288 attempted requests. Basic depth is explicitly set; automatic parameters, generated answers and raw-page extraction are disabled.
- One signed background worker handles searches sequentially, with a 1.1-second pause per request. A production-only lease prevents concurrent search batches. The existing scheduler dispatches this alongside the direct source-monitor workers at 06:00 UTC on the first of each month.
- The worker checkpoints pages and location reports, stops after an 11-minute work budget, and stops making requests when credentials, billing or rate limits fail. The dashboard shows partial coverage. Rerun `source-monitor-monthly` from Netlify to resume; completed source checks and completed search pages are reused. After three failed attempts on a page, investigate manually; the next month has its own attempt budget.
- Search URLs, titles, short snippets, provider dates and query evidence are stored privately in site-scoped Netlify Blobs under `discovery/`. No search results or credentials are part of the public build. URL duplicates are merged within each location. First-found dates persist; rediscovered leads remain reviewable and are not automatically dismissed.
- New results are not fetched or recursively crawled. A result on a registered publisher's host is labelled as such, not certified as authoritative. Provider dates are not legislation effective dates.

## Activation

The implementation is disabled until configured. Existing `MONITOR_TOKEN` and `MONITOR_ENABLED` settings continue to work.

1. Create a [Tavily account](https://app.tavily.com/) on the free Researcher plan. It includes 1,000 monthly credits with no credit card required. Keep pay-as-you-go and paid upgrades off. No paid plan is enabled or purchased by this code.
2. Add these environment variables in Netlify, scoped to **Functions**, **production**:

   | Variable | Value |
   | --- | --- |
   | `TAVILY_API_KEY` | Your Tavily API key; mark as secret |
   | `DISCOVERY_ENABLED` | `true` |

   Keep the key out of chat, source control and client-side variables. The monitoring password and GitHub publishing token are different credentials and cannot perform web searches.
3. Publish the implementation through GitHub main, then redeploy after changing environment variables.
4. Run `source-monitor-monthly` once from Netlify Functions to establish the first search report. An HTTP 202 means the background invocation was accepted; confirm completed/partial query coverage on `/monitoring/` using the existing monitoring access key.
5. Inspect one live batch's results and failure/limit messages before relying on the schedule. Automated tests use fictional provider responses; validate the actual credential separately before activation.

[Tavily pricing](https://www.tavily.com/pricing) and [credit costs](https://docs.tavily.com/documentation/api-credits), checked 9 September 2026: the free plan includes 1,000 monthly credits; a basic query uses one credit. The 96 normal queries, or the 288-attempt ceiling including retries, fit within that allowance if it is not consumed by other account activity. Account limits and search failures stop the job and remain visible. Netlify usage is separate.

## Reviewing findings

Open the existing monitoring dashboard and choose the month and location. Source observations and web-search findings are separate sections. Review query failures and result limits as well as candidate links. “No findings” is not a statement that nothing changed. A batch marked complete means all planned bounded queries finished, not that the web was exhaustively checked.

For each lead, read the original source, check the publisher, jurisdiction, status, commencement and relevance, and assess all affected learning resources. If it is new and relevant, add it to `monitoring/sources.json` using the existing register schema and approved publisher checks. Prepare a content-update branch and metadata as described in [EDITORIAL_APPROVAL.md](EDITORIAL_APPROVAL.md). The existing approval screen publishes only a prepared, validated proposal after the owner approves it.

There is no candidate approve/dismiss state or automatic proposal writer. Search reports remain available by month; reviewing a later report does not clear earlier findings. Keep the editorial decision in the proposal or review records.

The initial authenticated report includes at most 50 search findings per location to stay within response limits. Use **Load all [location] findings** to retrieve the rest with the same access key. “Download report” saves the currently loaded results and their full counts; load all relevant findings first for a complete export.

## Local review and verification

`npm run test:monitor` includes discovery coverage, sanitization, retry/checkpoint and authentication tests. `npm run typecheck` validates the function integration. `npm run build` preserves the private/public boundary.

A fictional local demonstration can be generated with `node tools/create-discovery-demo.mjs`, then viewed at `http://127.0.0.1:8765/monitoring/?demo=discovery`. The ignored fixture is excluded from production. Demo mode is restricted to loopback hosts and does not call a search provider or modify real reports.

Provider reference: [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search).
