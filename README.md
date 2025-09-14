# GitHub Demo Catalog

Client-side Next.js (App Router) application that enumerates a repository's issue templates, lets you quickly create "demo" issues from them, and tracks those demo issues (labeled `demo`) for easy launching or closing.

## Features

* Pure client-side usage of the GitHub REST API via Octokit (no backend server).
* Repository fixed to `octodemo/bootstrap` for simplicity.
* Discovers both Issue Form YAML templates and legacy Markdown templates.
* Creates demo issues with predictable title prefix `Demo ::` and label `demo`.
* Lists only your open demo issues (filtered by authenticated user once resolved) with quick open / close actions.
* Extracts the first GitHub repository URL found in body or first comment to deep-link into demo repos.
* Light/Dark theme toggle.
* Caching of template metadata in-memory per session (reduces repeated API calls under React Strict Mode dev re-renders).

## Personal Access Token (PAT) & Security

The PAT is:
* Entered and stored only in the browser (`localStorage` key `gh_demo_pat`).
* Used exclusively for authenticated REST calls from the client (Octokit with `auth`).
* Never sent to any custom server—only to the GitHub API endpoints.

Recommended minimal fine-grained token permissions (for the single target repo):
* Contents: Read (to list and read template files)
* Issues: Read & Write (to create/close demo issues)

Revoke or regenerate the token immediately if exposed. To "logout" the app, use the UI control or remove the key from browser storage.

## Quick Start

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and paste your fine‑grained PAT.

If you change the target repository in code, ensure you also adjust required token scopes.

## How It Works

### Issue Template Discovery

The application enumerates `.github/ISSUE_TEMPLATE` using the GitHub Contents API: `GET /repos/{owner}/{repo}/contents/.github/ISSUE_TEMPLATE`.

For each file with an extension in `(.yml|.yaml|.md)` it then retrieves the file's content (again via the Contents API, not the `download_url`) and parses:
* YAML Issue Form templates: reads `name`, `description` (or `about` fallback). Structured `body` fields are not rendered in the UI.
* Markdown templates: optional YAML front‑matter (fields: `name`, `about`/`description`); remainder kept as body text.

This avoids relying on raw unauthenticated file URLs and ensures consistent authentication / rate limit usage. It also future‑proofs against private repo usage where raw URLs may fail without proper token context.

### Creating a Demo Issue

Creation opens the GitHub UI (template picker) in a new tab: 

`https://github.com/octodemo/bootstrap/issues/new?template=<filename>`

You finalize and submit there. A delayed refresh (or manual reload) pulls it back into the dashboard. (Earlier iterations created issues directly via API; browser-based UX was chosen to preserve the full template/form experience.)

### Demo Issues Listing

* Only issues labeled `demo` are fetched (open state) to keep the list lean.
* Once your user login is known, results are optionally filtered to issues you created.
* Repository URL extraction uses a simple regex against issue body + first comment.
* Close action calls the Issues Update endpoint to set `state=closed`.

### Architecture Overview

* UI: Next.js App Router + client components.
* Data Access: Octokit REST (authenticated) from the browser only.
* Caching: Simple in-memory (window-scoped) cache for template list keyed by `owner/repo`.
* Styling: Global CSS (`app/globals.css`) + lightweight component structure.
* Strict Mode: Enabled (`reactStrictMode: true`) causing double invoke of some effects in dev—cache mitigates duplicate template enumeration.

### Caching & Rate Limits

Templates are read once per session unless you refresh the page (cache is not persisted). For larger sets or multi-repo expansion, consider adding `localStorage` with an ETag to revalidate. Current approach already reduces redundant network calls induced by React Strict Mode.

### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No templates found | Directory missing or only non-supported files present | Add templates to `.github/ISSUE_TEMPLATE` |
| 404s on raw URLs (older builds) | Stale bundle using `download_url` fetch | Hard refresh / clear cache; new code uses API content |
| Hitting rate limits | Using unauthenticated requests or very frequent refresh | Provide PAT / add simple debouncing |
| Issue not appearing after creation | Delay before refresh elapsed too soon | Click manual refresh (planned feature) |

### Development Notes

Build & type check:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

### Limitations

* Single hard-coded repository (no multi-repo UI yet).
* No pagination for issue list (limited to 50 open demo issues).
* Issue form structured fields are not reconstructed; only metadata is shown.

## Future Improvements

* Multi-repository selector & persistence.
* LocalStorage or IndexedDB cache with ETag revalidation.
* Retry & exponential backoff utilities for transient GitHub API errors.
* GraphQL batching to reduce per-file content requests.
* Optional server proxy mode to avoid exposing PAT entirely.
* Full issue form preview rendering.
* Manual refresh buttons for templates & issues.

## License

MIT
