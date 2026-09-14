# ONDO canonical route

Status: current route contract, publicly promoted on 2026-09-02.

The post-promotion mobile candidate and its unresolved release evidence are
tracked in
[`ondo-baljajwi/10_MOBILE_RELEASE_CANDIDATE.md`](./ondo-baljajwi/10_MOBILE_RELEASE_CANDIDATE.md).
Historical `/ondo-b` review receipts are not evidence for that newer candidate.

| Route | Contract |
| --- | --- |
| `/` | Canonical ONDO product. It mounts the complete former B product directly and owns page metadata, discovery history, and social URLs. |
| `/ondo-b` | Permanent compatibility redirect to `/`. Only allowlisted discovery parameters are carried forward; private, QA, and unknown parameters are dropped. |
| `/ondo-a`, `/ondo`, and every retired prototype route | Kept only in the development repository for regression coverage. They are absent from the isolated public artifact and return `404` on the deployed ONDO origin. |

The login-free public share origin is
`https://ondo-k-tour-id.vercel.app`. The older
`https://ondo-korea-pulse.vercel.app/ondo-b` address is retained only as a
compatibility entry and reaches the same promoted product through the canonical
`/ondo-b` redirect.

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
`ONDO_B_DEPLOY_OWNER=woogieboogie-jl`, an unprotected project identity, and either:

- `ONDO_B_DEPLOY_PROVIDER=sites` with a non-placeholder
  `ONDO_B_SITE_PROJECT_ID`; or
- `ONDO_B_DEPLOY_PROVIDER=vercel`, authenticated Vercel user
  `jaewook-9643`, no explicit `--scope`, and the exact approved personal
  project `ondo` (`prj_w5rckTz9B1DO55fvVRXjQRy9L5RM`).

The protected A project, historical private-B project, local-only placeholder,
any different Vercel project, and every explicit organization scope are
refused. GitHub publication is likewise limited to
`woogieboogie-jl/ondo`; the `origin` and Ohayo organization remotes are not
release targets.

Vercel builds `pnpm build:vercel:ondo-b`, which first prepares the positive
source allowlist and then builds `.ondo-b-standalone/.next`. A hard artifact
scan admits only `/`, `/ondo-b`, `/api/ondo/venues/[venueId]`, and Next's
internal error routes; it also rejects QA seams and retired product text.
External HTTP probing verifies all retired routes and assets return `404`
before a candidate can be promoted.

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
