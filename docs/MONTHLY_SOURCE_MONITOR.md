# Monthly source monitoring — Stage 1

A separate approval screen is now implemented at `/monitoring/review.html`. See [Editorial approval setup](EDITORIAL_APPROVAL.md). The monitor itself remains read-only: editors prepare proposals and the owner explicitly approves publication. The publishing connection needs its own repository-scoped GitHub token.

## What is implemented

The working register now contains 318 URLs across 12 practice locations, giving 333 location/source observations in a full run. This expanded register takes effect after deployment; the original September production baseline covered 145 URLs and 151 observations. `monitoring/sources.json` contains publisher, category, location coverage, source purpose, coverage limitations and the learning resources that directly link to each source. The register was assembled from the existing resource references, restricted to selected government, regulatory, professional-body and established practice-learning publishers, with additional official news and CPD pages. Inclusion does not imply that a URL is reachable or that every linked document is monitored.

The first successful observation establishes a baseline. Later runs compare normalized article text and links, or feed entries. Navigation and scripts are excluded. Dates in substantive content are retained. PDF files receive a binary fingerprint check with an explicit manual-review limitation. Dynamic training listings are flagged where the returned HTML says events are still loading. JavaScript-only pages, challenges, missing pages, unsupported files, timeouts and oversized responses are failed checks, never “up to date”. There is no browser-rendering service or AI dependency.

News/listing pages provide discovery by reporting new links; the monitor does not recursively crawl or automatically adopt these links into the source register. A portal is not a substitute for separately registering the particular Act, amendment or commencement instrument. Broader source coverage should be refined during editorial review.

Stage 1 never rewrites resources, updates `sourceCheckedAt` or `practiceReviewedAt`, approves a legal interpretation, or publishes content. Unreviewed changes remain flagged in later reports, even if the source is subsequently unchanged. Each report records the last attempt, last successful observation and consecutive failure count. Direct source references identify known affected resources; a full editorial impact assessment belongs to Stage 2.

The 8 September curriculum expansion links its core teaching sources to the register. Newly added URLs receive a baseline on their first successful run after deployment. A completed September batch is not rerun just because the register changes; the normal next scheduled check is 1 October. See `COUNTRY_CURRICULUM_REVIEW.md` for the editorial and source-access review.

## Monthly operation

- `source-monitor-monthly.mts` dispatches on the first day of each month at 06:00 UTC (06:00 GMT / 07:00 BST).
- `source-monitor-worker-background.mts` checks one location per background invocation, sequentially, with a 12-second timeout and 4 MiB maximum response per source. The register validator limits a location to 55 sources. An 11-minute work budget leaves room below Netlify's 15-minute limit.
- Jobs use signed, short-lived payloads; arbitrary source URLs cannot be supplied. The worker rejects unsigned requests before source requests or storage access. Background endpoints acknowledge with HTTP 202 before handler execution, so an HTTP 202 is not proof of a completed check.
- Reports and checkpoints use a strongly consistent, site-scoped Netlify Blobs store, `social-work-source-monitor-v1`. The store persists across deploys. A conditional per-location lease prevents concurrent writes, and completed monthly batches are idempotent.
- Source checkpoints precede state writes. Interrupted batches resume without repeating completed source requests or discarding their evidence. Netlify retries thrown background failures; failed source observations are retained for review, not retried indefinitely. Rerunning the dispatcher resumes incomplete batches. A fully completed batch is not rerun in the same month.
- An uncompleted batch or accepted dispatch older than 16 minutes is shown as interrupted in the report. After a hard timeout, wait at least 14 minutes for the lease to expire before rerunning the monthly function.
- Scheduled and worker execution are gated on an enabled, published production deploy. Deploy previews cannot read or write the production store. Local runs use a separate filesystem store.

## Reviewing reports

Open `/monitoring/`. On the existing local server, this is <http://127.0.0.1:8765/monitoring/> and it automatically loads `output/monitoring/latest.json` after a local run.

The deployed page loads the private report using an access key and a selected month. The key is sent in an Authorization header, held only in the page's memory and never placed in a URL or browser storage. The endpoint returns no-store responses. The report can also be downloaded or opened from a local JSON file. The public page itself contains no private observations. Snapshots and checkpoint bodies are not returned by the report endpoint.

Reports are retained in Blobs by month. Stage 1 does not delete historical evidence automatically and sends no email or other external notifications. Administrators can also inspect function logs and download objects in the Netlify Blobs UI. Later retention or notification rules can be added explicitly.

## Local commands

Requires Node 22.18 or newer and `npm ci`.

```sh
npm run monitor:check
npm run test:monitor
npm run typecheck
npm run monitor:run              # All 12 locations
npm run monitor:run -- wales     # One location
npm run build
```

The local runner writes private state to `.monitor-data/policy-<version>/` and reports to `output/monitoring/`. Changing the extraction policy starts a separate local baseline while preserving prior development observations. Each normal run reuses the active policy's previous successful observations. If a local process was forcibly terminated, check that no monitor is running before removing its `local.lock` file.

`netlify.toml` builds the existing static learning pages and copies public assets into `dist`. The allowlist excludes functions, source registry, snapshots, reports, dependencies, local environment files and developer tools. Use `netlify dev` for platform emulation; production monitoring remains disabled locally by design. Unit tests exercise the core and authorization gates without connecting to the production store.

## Production activation — active

The Netlify project is `social-work-resource`, project ID `69611b33-49e7-4afa-809d-140e1df70f7e`, linked to this checkout. The full country-guide update is published. Monitoring was enabled on 8 September 2026 after the production environment variables were verified and deployment `6aa077de90fe8e510b53f066` went live.

The first production run was triggered through **Run now** at approximately 22:03 UK time. All 12 batches completed and persisted 151 observations: 122 successful baselines and 29 failed source checks, retained for follow-up. A completed batch does not mean all sources were successfully read or professionally reviewed. The next scheduled run is **1 October 2026 at 06:00 UTC / 07:00 UK time**.

Open <https://social-work-resource.netlify.app/monitoring/> and use the monitoring access key to view the September report. The key and downloaded reports are excluded from Git.

Configuration and recovery procedure:

1. Set `MONITOR_TOKEN` to a cryptographically random value of at least 32 characters in Netlify's environment variables, scoped to **Functions** and **production**, marked secret. Keep the value in the owner's password manager for access to the report page. Do not commit or print it in deployment logs.
2. Set `MONITOR_ENABLED=true`, scoped to **Functions** and **production**. No AI/API key or external database is required.
3. Publish the reviewed full build to production. Keep the new source files in the Git repository before resuming Git-based deployment; otherwise a later build from the old branch could remove this implementation.
4. Use **Run now** for `source-monitor-monthly` in Netlify's Functions UI to establish production baselines. Open `/monitoring/`, enter the monitoring key and confirm all 12 batches complete or show an explicit failure. A completed batch can still contain failed source checks.
5. Check that the monthly function appears with its configured schedule. Local tests and a preview do not establish production baselines or activate the schedule.

To pause future dispatches, set `MONITOR_ENABLED=false` and redeploy. Existing reports and snapshots remain in Blobs. A deployed endpoint with this setting will be inactive. Rotate the token through the same environment-variable mechanism and redeploy if needed.

## Verification and first observations

Review preview: <https://6aa074b10b97b9e9d582b349--social-work-resource.netlify.app/>. This deploy includes the full country-guide update and the monitor. It does not replace production or run the monthly job.

All 18 deterministic tests pass for baselines, substantive edits, menu noise, government form layouts, RSS discovery, PDFs, dynamic training listings, blocked/error pages, host restrictions, failed-check history, persistent review flags, idempotency and interrupted writes. Runtime tests cover authorization, signed payloads and production/preview gates. The existing 12-location content validator and 312 generated reading pages also pass. The report page was checked at desktop, 390px and 320px widths, including filters, all-location results, report downloads and access-key error handling. Netlify successfully bundled the scheduled dispatcher, report endpoint and background worker.

The latest live-source check is in `output/monitoring/latest.md` and `latest.json`. The repeat check on 8 September 2026 recorded 151 observations: 133 successful checks with no new change detected and 18 failed checks, all explicitly recorded. Some successful observations also carry PDF or dynamic-content limitations. These are observations, not a new legal review. In particular, a registered Welsh PDF returned HTTP 404 and several publishers blocked server-side requests or required JavaScript. Those remain visible for editorial follow-up; no affected teaching content was silently changed.

## Netlify references

- [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Background Functions](https://docs.netlify.com/build/functions/background-functions/)
- [Blobs persistence, consistency and conditional writes](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
