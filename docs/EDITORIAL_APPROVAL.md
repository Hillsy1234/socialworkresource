# Review, approval and publication

Web-search discovery is also implemented as an optional, separately configured extension. See [WEB_SEARCH_DISCOVERY.md](WEB_SEARCH_DISCOVERY.md) for coverage, activation and the review process.

The review page is `/monitoring/review.html`, linked from the source-monitoring dashboard. It uses the existing monitoring access key. Anyone with this key can approve or reject proposals after the separate publishing connection is enabled; it is an owner/admin credential, not a general report-sharing password.

## Owner workflow

1. Open the monthly report and review the changes or failed source checks.
2. Have the editor investigate the source, confirm territorial scope and commencement, and prepare a focused update covering the affected lessons and companion tools.
3. Open **Review and approve proposed updates**, enter the monitoring key and select a proposal.
4. Read what changes, why, when it applies, the sources and the complete file comparisons. Failed tests, incomplete comparisons, conflicting branches and changed versions block approval.
5. Confirm the review and choose **Approve and publish**, or **Reject this proposal**.
6. Approval merges the displayed version to GitHub `main`. Netlify's existing Git connection builds and publishes it. The screen refreshes publication status for up to five minutes; **Refresh status** can check again later. Rejection closes the proposal without merging.

“Approved and merged” is separate from “Live”. The live release marker must confirm the merged commit. If a later release contains that commit in its history, the screen explains that later edits may supersede it. Missing markers, failed builds, paused publishing and inaccessible services never produce a false “Live” result. Check the Netlify deploy log if publication remains unconfirmed.

The monitor still does not generate legal edits automatically. No AI model, external notification service or automatic acceptance of legal interpretations is included. Source-monitoring flags remain historical evidence and are not silently cleared by an approval; the proposal and its published commit provide the separate editorial decision record. A new source change still needs another review.

## One-time activation

The Git connection was checked on 8 September 2026: `Hillsy1234/socialworkresource`, production branch `main`, with commit `6106ef5` published. The new approval service additionally needs a server-side GitHub credential; the desktop's GitHub login is not copied to Netlify.

Create a fine-grained personal access token owned by the repository owner, restricted to **socialworkresource** only:

- **Contents: Read and write** — merge the approved update.
- **Pull requests: Read and write** — read comparisons and close rejected proposals.
- **Actions: Read** — verify the content-validation workflow.
- **Metadata: Read** — included automatically.

Choose an expiry and renew the token before it expires. No account-wide repository access, workflow-write permission or organization administration permission is needed. Do not put the credential in a URL, Git, chat, public browser storage or a frontend environment variable.

In Netlify → social-work-resource → Project configuration → Environment variables, add:

| Key | Value | Scope and context |
| --- | --- | --- |
| `EDITORIAL_GITHUB_TOKEN` | The fine-grained token | Functions only; production; mark secret |
| `EDITORIAL_ENABLED` | `true` | Functions only; production |

The implementation task set `EDITORIAL_ENABLED=true` for production Functions. The GitHub token remains the owner-supplied activation step. Keep the existing `MONITOR_TOKEN` and `MONITOR_ENABLED` settings. Publish a new production deployment after setting the variables. Opening the review page without this setup gives an explicit configuration message; it cannot merge anything. Preview deploys and local function emulation cannot approve production proposals. The local demonstration described below uses fictional data and no publishing requests.

The `Content review validation` GitHub Actions workflow must be present on `main` before creating an update branch. Confirm Actions is enabled for the repository and Netlify builds from `main` are not paused. The service uses GitHub's ordinary merge endpoint and does not bypass branch protection or required reviews.

## Preparing a proposal

Use an editor-controlled branch beginning `codex/content-update-`, based on current `main`. Update authored data in `tools/curriculum/` when applicable, regenerate companions with `python3 tools/curriculum/apply.py`, and run `npm run build`. Commit all matching source and generated changes together, then push that branch. The validation workflow runs on the exact pushed commit.

Prepare a local JSON file with these fields:

```json
{
  "title": "Describe the concrete learning-content update",
  "summary": "Explain what changes in the lessons and tools.",
  "reason": "Explain the reviewed source evidence and why the current content needs changing.",
  "commencement": "State the relevant country/state, whether the change is in force, and when it applies.",
  "sourceIds": ["an-existing-id-from-monitoring/sources.json"]
}
```

Use the IDs of the existing monitored sources that led to the proposal. Register additional sources within the proposal where needed, while retaining those initiating source IDs in the review record. Do not include identifiable case records or secrets: GitHub proposals follow the repository's visibility, which is independent of the private monitoring dashboard.

`npm run editorial:prepare -- path/to/proposal.json` validates the review metadata and writes `output/editorial/proposal.md`. It does not modify GitHub. Add `--submit` after committing and pushing the appropriate branch to open a ready-for-review pull request. The helper checks the repository, clean checkout, remote commit and allowed file paths; it never merges. Existing proposals can be amended in GitHub, but a changed title, review explanation, base, commit or patch invalidates a previous review digest and requires reloading the comparison.

The browser approval route is limited to this repository, `main`, same-repository update branches, up to 150 files and complete text comparisons up to 800,000 characters. Allowed edits are jurisdiction resources, authored curriculum inputs, generated reading/index files, source registry and curriculum review records. Runtime code, workflows, approval code, executable generator logic and general technical changes must use a separate technical review. GitHub may omit very large patches; split such proposals before browser approval.

## Audit and recovery

An approval/rejection request is written to the existing private Netlify Blobs store before the GitHub mutation. It records the proposal number (in the key), action, timestamp, head/base commit and review digest under `editorial/<proposal>/<head>`. Because the monitoring key is shared owner access, the actor is recorded as “Monitoring access-key holder”, not an invented personal identity.

GitHub remains authoritative about whether the merge or closure occurred. If a connection fails during approval, refresh the proposal before retrying. Already merged proposals reconcile without attempting another merge. A failed audit write prevents publication. The API requires the monitoring key, enabled published production context and a same-origin JSON decision with an explicit confirmation. Tokens remain server-side or in the access field's page memory; comparisons and source titles are rendered as text.

## Validation and local demonstration

- `npm run test:editorial` — approval integrity, access gates, stale versions, checks, missing comparisons, rejection, audit failure, retry and publication status.
- `npm run test:monitor` and `npm run typecheck` — existing monitor and function regression checks.
- `npm run build` — content coherence and public-only output, including a production commit marker at `/release.json`.
- `npm run editorial:demo` — creates ignored fictional data for `http://127.0.0.1:8765/monitoring/review.html?demo=1`. The demonstration is local-only and cannot publish. Its data is excluded from `dist`.
- `tools/browser-checks/editorial.js` — Playwright checks with intercepted publishing requests, covering mobile widths, exact-version submission, validation blocks, rejection, publication status, text escaping and clearing access.

No live content proposal was merged to test this feature. Final end-to-end activation requires the repository-scoped token and a genuine reviewed proposal.

References: [GitHub merge API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request), [workflow-run verification](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-workflow), [Netlify Git deployment](https://docs.netlify.com/build/git-workflows/overview/).
