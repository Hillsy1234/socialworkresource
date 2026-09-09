# Practice Community

The community is a moderated, public learning board covering all 12 practice locations, with an All locations view. It uses Netlify Functions and a separate site-scoped Blobs store (`social-work-community-v1`); it does not add a database service, paid AI provider, member accounts or GitHub login requirements. Public contributions are not reviewed learning resources or verified professional advice.

## Included

- Flagged location selection reuses the existing `practiceLocations` metadata and vendored flag images. The homepage links carry the active location into the community. A community-only selection does not overwrite private CPD or learning preferences.
- Topics, moderated replies, HTTPS resource suggestions, keyword search within the selected month, category filters and month archives. Location views include their own topics and All locations topics. Replies to local topics use that location; shared discussions can have replies from different locations.
- One monthly fictional scenario, shared across all locations. The authored bank has 12 prompts and repeats annually; each selection requires approval. The schedule runs at 06:15 UTC on the first day of each month. Manual preparation is available in the moderator screen and is idempotent.
- Private reporting; moderators can inspect the reported item, approve, reject, remove, close/reopen replies and resolve reports. All publication checks are enforced server-side. An open report does not automatically remove a post.

## Activation on Netlify

1. Deploy the implementation using the existing GitHub/Netlify workflow.
2. Set `COMMUNITY_ENABLED=true` for **Functions**, **production**, then redeploy. The existing `MONITOR_TOKEN` owner key must remain configured (at least 32 characters). The community reuses that established owner authorization, without introducing a new login system or requiring Netlify Identity setup. Never share the owner key with public contributors.
3. Open `/community/moderate.html`, enter the existing monitoring access key and choose **Prepare this month’s scenario**. Review it and approve it to open the first shared discussion.
4. Check a visitor submission, approval, reply and report in production. Empty queues and inactive service messages are distinct from a successful published community. Future scheduled prompts remain pending until approved.

Only enabled, published production deploys can access real community storage; preview deploys fail closed. The flag is an operational kill switch for public and moderator access. Scheduled and manual preparation never override an existing scenario, including a rejected or removed one.

## Privacy, integrity and limits

No email address, account password, case file or CPD entry is collected by the public forms. Contributors choose an unverified display name or pseudonym. Plain-text submissions remain private until approved; only approved topic/reply fields are returned publicly. HTML is rendered as text. Resource URLs are validated as public HTTPS links; the server does not fetch submitted URLs. Moderators verify their suitability before publication.

The owner key is used only in an Authorization header and held in the moderator page, with an explicit clear button. It is never persisted in browser storage. Moderator decisions use ETags and conditional writes to reject stale decisions. Entries are stored separately, avoiding a shared thread document that concurrent replies could overwrite. Queue pointers are written first so interrupted submissions can be safely retried. Publication and removal do not require rebuilding the website.

Removing a topic hides its whole discussion immediately. Rejection/removal erases the selected item's body, display name, title and link; moderation notes/references remain private. Child replies remain stored but inaccessible publicly after parent removal; moderators can remove them separately. No automatic expiry of pending contributions or moderation records is currently promised. Review these regularly, and avoid identifiable information in decision notes. The public rules describe this retention model.

Anti-spam controls include same-origin JSON submissions, a signed time-bound form challenge, honeypot detection, request-size and field-length limits, a server-side limit of 20 submissions per network identifier per UTC day, and separate monthly ceilings of 1,000 contributions and 1,000 reports. Limits count attempts after basic validation; retries can consume allowance. No raw IP address is stored by the application. Daily keyed hashes are stored privately for rate limiting; hosting logs are governed by Netlify. These controls reduce abuse but are not a substitute for active moderation; no CAPTCHA or verified membership is included.

Function-level rate limiting is also configured (60 public requests/minute and 30 moderator requests/minute per IP/domain). Netlify plan usage remains applicable; no claim of unlimited free operation is made. There is no realtime polling, notification email or private messaging. Moderators check the queue and reports manually.

This is designed for a small community. Public responses paginate at 30 items, while server reads are bounded to 2,500 keys per month/thread/queue prefix. Above that bound the service explicitly asks for maintenance rather than silently omitting contributions. Larger archives, rapid concurrent activity, member accounts and sophisticated search should trigger a storage/platform review.

## Local review

Run `npm run build`, then `npm run community:dev`. Open `http://127.0.0.1:8766/community/`. This loopback-only server uses the same domain/HTTP logic with an isolated local store under ignored `output/community/`. It serves only the built public `dist` directory. Fictional demonstration contributions are clearly labelled; no production API, Blobs store or external search provider is called.

The local moderator key is `local-community-review`. This value never grants production access. Local records survive preview restarts. Stop the preview before removing its isolated store if a fresh demonstration is needed.

`npm run test:community` verifies location coverage, approval/privacy boundaries, replies, removal, report handling, URL validation, retry/concurrency behaviour, monthly preparation, pagination, origin/body checks and deployment/auth gates. The build runs these tests so existing CI and Netlify builds validate the new feature. `tools/browser-checks/community.js` exercises the visitor/moderator journey and responsive layout using fictional local data.

The build explicitly includes only the five community UI files. Community libraries, tests, local data, credentials and reports are excluded from the public output.
