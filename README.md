<div align="center">

# GitHub Demo Catalog

Small client‑side Next.js (App Router) dashboard that discovers a repository's issue templates, lets you spin up "demo" issues from them, and manages those demo issues (labeled `demo`) with fast feedback, accessibility-first UI, and zero backend.

</div>

## At a Glance

| Category | Highlights |
|----------|------------|
| Data Source | Pure browser usage of GitHub REST via Octokit (no server) |
| Target Repo | Hard‑coded: `octodemo/bootstrap` (changeable in code) |
| Demo Issues | Title prefix `Demo ::`; label `demo`; optional hold label `demo::lifecycle_hold` |
| Feedback | Toast notifications (success / error / info) + optimistic updates |
| Performance | In‑memory template cache + lightweight polling for issues |
| Accessibility | Skip link, semantic roles, aria-live regions, reduced‑motion safe animations |
| Theming | Light/Dark toggle with early flash prevention |

## Current Features

* 🔍 Template discovery for both Issue Form YAML and legacy Markdown templates.
* 🆕 One‑click creation flow opens GitHub's native new‑issue UI with the chosen template.
* 🗂️ Structured demo issues list with:
	* Relative timestamps (e.g. "3m ago").
	* HOLD state badge when `demo::lifecycle_hold` label is applied.
	* Fast close + hold/unhold actions (optimistic for close; label toggle with toast feedback).
	* Automatic periodic refresh (light polling) plus manual Refresh button.
	* Skeleton loaders & subtle spinners to indicate background work (with proper aria semantics).
* 🔔 Toast notification system:
	* Success / error / info variants.
	* Auto‑dismiss (5s) + focusable container for assistive tech.
	* Announces via `role=alert` / `role=status` depending on variant.
* 🧭 Compact stats header showing counts of open and held demo issues.
* 🗂️ Template panel with skeleton placeholders while loading.
* 🌗 Theme toggle with persisted preference (localStorage) and flash‑free early apply script.
* ♻️ Optimistic removal on issue close (undo concept noted in roadmap).
* 🛡️ PAT stored only locally (never leaves the browser except to GitHub API endpoints).
* ♿ Accessibility baseline: skip link, aria‑live regions, accessible labels, reduced‑motion handling, logical heading order, distinguishable focus.
* 🧪 Safe against React Strict Mode double invokes via simple memoized cache.

### Demo Repository Link Extraction

The UI conditionally shows an "Open" button for each demo issue only when a comment exists containing the phrase `Demo Creation Successful` (case‑insensitive). The first GitHub repository URL (`https://github.com/owner/name`) in that comment is parsed and used as the target. If absent or invalid the Open button is hidden. This relies on external automation that posts the provisioning success comment.

See `listUserDemoIssues` in `lib/github.ts` to adapt.

## Personal Access Token (PAT)

The PAT is:
* Entered and stored only in the browser (`localStorage` key: `gh_demo_pat`).
* Used exclusively for authenticated REST calls (Octokit `auth`).
* Never proxied through a custom backend.

Minimum fine‑grained repository permissions:
* Contents: Read
* Issues: Read & Write

Rotate or revoke the token immediately if exposed. To clear credentials use the UI control or manually remove the localStorage key.

## Quick Start

```bash
npm install
npm run dev
```

Navigate to http://localhost:3000 and paste your PAT when prompted.

If you reconfigure the target repository, re‑evaluate needed permissions.

## How It Works

### 1. Template Discovery

Uses the Contents API to list `.github/ISSUE_TEMPLATE` and individually fetch YAML / Markdown template files. YAML Issue Forms: reads `name` + `description` (or `about` fallback). Markdown: optional YAML front‑matter parsed for `name` / `description`.

### 2. Issue Creation Flow

Rather than constructing the issue body client‑side, the app sends you to the GitHub new‑issue UI with `?template=` so you benefit from native validation and form UX. After submitting, the issue will appear automatically (periodic refresh) or immediately after clicking Refresh.

### 3. Listing & State Management

* Filters to open issues labeled `demo` (limit 50) for brevity.
* Hold toggle adds/removes the `demo::lifecycle_hold` label.
* Close action calls the Issues Update endpoint then optimistically removes the item from the UI.
* Basic polling + manual refresh keep data fresh; transient delays are surfaced with a small explanatory message.
* Relative times computed client‑side from `updated_at` / `created_at`.

### 4. Link Extraction

Parses a provisioning success comment for the first repository URL; hides the launch link if criteria not met, avoiding dead ends.

### 5. Architecture

* Framework: Next.js (App Router) + React 18 client components.
* Data: Octokit REST in browser only.
* Styling: Single `app/globals.css` with design tokens, badges, skeletons, toasts, focus utilities.
* State: LocalStorage (PAT, theme, pending ops snapshot) + ephemeral in‑memory template cache.
* Accessibility: ARIA roles (`list`, `listitem`, `status`, `alert`), `aria-busy`, `aria-live=polite/assertive`, skip link, reduced‑motion safe animations, `sr-only` utilities.

### 6. Caching & Rate Limits

Template metadata cached for the session (not persisted). For multi‑repo or heavier usage, consider ETag + conditional requests and/or IndexedDB. Current approach already eliminates redundant Strict Mode fetches.

## Accessibility Details

| Aspect | Implementation |
|--------|----------------|
| Skip Navigation | Visible on focus link jumps to main content |
| Live Updates | `aria-live` + `role=status` wrappers announce background refresh completion |
| Toasts | `role=alert` (errors) / `role=status` (others); auto-dismiss respectful of reduced motion |
| Loading Indicators | Skeletons `aria-hidden` with parent `aria-busy=true` until hydrated |
| Focus Management | High-contrast outline + preserved focus ring (no global outline removal) |
| Reduced Motion | Key animations wrapped in `@media (prefers-reduced-motion: no-preference)` |
| Labels | PAT input uses visually hidden label + `aria-describedby` guidance |

Further enhancements (e.g. `aria-pressed` on hold toggle, high contrast theme) tracked in roadmap.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No templates found | Directory missing or only unsupported files | Add templates under `.github/ISSUE_TEMPLATE` |
| Issue not appearing | Delay before next poll | Click Refresh |
| Link button missing | Success comment absent or malformed | Ensure automation posts provisioning comment |
| Rate limit warnings | Excessive unauthenticated calls | Provide PAT / slow refresh cadence |

## Development

Type check & build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Limitations

* Single repository (no UI to switch yet).
* No pagination (cap at 50 open demo issues).
* Issue form structured body not rendered—metadata only.
* No undo for close / label actions (planned).

## Roadmap

Planned / potential improvements:

* Multi‑repository selector & persistence.
* Undo action in toast for close / hold toggles.
* High contrast / accessible color theme variant.
* `aria-pressed` and better toggle semantics for hold button.
* LocalStorage or IndexedDB template cache with ETag revalidation.
* Retry & exponential backoff helpers for transient API failures.
* GraphQL batching or conditional requests to cut REST round trips.
* Optional lightweight proxy to eliminate PAT exposure in the browser.
* Full issue form body preview rendering.
* Advanced filtering (by age, hold status) & sorting.

## License

MIT
