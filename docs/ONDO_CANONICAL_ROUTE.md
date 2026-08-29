# ONDO canonical route

Status: current route contract after the B promotion decision on 2026-08-30.

| Route | Contract |
| --- | --- |
| `/` | Canonical ONDO product. It mounts the complete former B product directly and owns page metadata, discovery history, and social URLs. |
| `/ondo-b` | Permanent compatibility redirect to `/`. Only allowlisted discovery parameters are carried forward; private, QA, and unknown parameters are dropped. |
| `/ondo-a` | Preserved A/control implementation. It is noindex and never enters the canonical B import graph. |
| `/ondo` | Historical A-compatible entry. It keeps the A implementation reachable for regression tests and existing deep links, while canonicalizing to `/ondo-a`. |

The `ondo-b.*` browser-storage keys and `data-testid` values are intentionally
unchanged. They identify an existing persisted schema and test contract, not a
public URL. Renaming them during route promotion would discard or fork existing
device state.

The isolated production artifact must render the product at `/`, retain the
same `/ondo-b` redirect, emit no retired product routes or QA controls, and keep
both protected historical hosting project identities untouched.

Because the Vinext compatibility runtime does not reliably pass query values to
redirect-only App Router pages, the isolated worker owns `/ondo-b` at the HTTP
boundary. It retains exactly `category`, `city`, `detail`, `editorialPlaceId`,
`q`, `venueId`, and `view` when each value is unique and at most 160 characters.
QA, private, After 19, locale, tab, duplicate, oversized, and unknown values are
dropped before the permanent redirect reaches `/`.

## Deployment boundary

No deployment command may run from this worktree until
`pnpm guard:deploy:ondo-b` succeeds. The guard requires
`ONDO_B_DEPLOY_OWNER=woogieboogie-jl`, a new project identity, and either:

- `ONDO_B_DEPLOY_PROVIDER=sites` with a non-placeholder
  `ONDO_B_SITE_PROJECT_ID`; or
- `ONDO_B_DEPLOY_PROVIDER=vercel` with
  `ONDO_B_VERCEL_SCOPE=woogieboogie-jl` and a newly linked personal Vercel
  project.

The existing protected A project, historical private-B project, local-only
placeholder, and currently team-linked Vercel project are refused. The operator
must also verify the authenticated account is `phenixnet.jl@gmail.com`; that
email identity is intentionally not inferred from a local project JSON file.

The final noindex deployment is unlisted, not access-controlled. This matches
the login-free review requirement; `noindex` must never be described as privacy
or authentication.

## Same-origin state compatibility

The canonical B product keeps its `ondo-b.*` storage namespace and never
changes or deletes A-owned `ondo.*` bytes. On a shared origin only, it may read
the documented legacy Account, After 19, and activity fields once to preserve a
returning visitor's state. This is a one-way additive compatibility seam, not
strict storage isolation. The final separately hosted B site has a distinct
origin and therefore cannot read the protected A site's browser storage.

Historical review receipts that name `/ondo-b` remain immutable evidence of
the route that was reviewed at that time; they are not the current routing
contract.
