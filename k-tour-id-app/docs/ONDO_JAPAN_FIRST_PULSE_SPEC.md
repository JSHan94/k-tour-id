# ONDO Japan-first unified Pulse

Status: `APPROVED FOR P0 · 2026-08-26`

## Product decision

ONDO keeps one public Pulse. Japan-first content momentum is an input to that
Pulse, not a second score, map mode, tab, or nationality filter.

```text
Japan momentum 40% + Korea-local momentum 40% + ONDO momentum 20%
→ one public Pulse (0–100 when confidence is sufficient)
```

The existing five-tab skeleton remains authoritative:

```text
Explore → Place → Directions / Save / Table / 19+ / Meal benefit
My Korea → Tables → ID · Wallet → Settings
```

No sixth Content tab, forced campaign popup, parallel Japan map, or new
checkout/community flow is introduced.

## What changes in P0

### 1. Pulse evidence policy

- `japan-momentum`: verified Japanese creator/editorial/official-tourism
  evidence connected to a place.
- `korea-local-momentum`: local demand/context evidence. Regional TMAP and
  tourism trends may support this driver, but `outsider` must never be renamed
  or inferred as `Japanese`.
- `ondo-momentum`: ONDO's bounded, device-local or curated visit evidence.
- Sponsored or paid-placement evidence is excluded from the score.
- A precise number is published only when every driver is present, dated, and
  verified. Otherwise the public state is `Growing` with no invented number.
- Every accepted reference must match the target canonical venue and the
  driver's allowed source class. IDs and URLs must be unique across drivers.
- Confidence uses independently hosted sources, verification state, source-type
  diversity, recency, and bias review; it is never inferred from count alone.
- Existing numbered demo snapshots are explicitly marked as fixed
  `curated-walkthrough` snapshots. They do not enter the unified weighting and
  are not represented as measured Japan demand or production evidence.
- Internal drivers stay inspectable in progressive disclosure; the primary UI
  always shows one Pulse.

### 2. Japan-first content in the existing Explore skeleton

- Launch content uses the report's nine shortlisted records:
  `C01, C02, C03, C06, C08, C12, C18, C20, C22`.
- Every record keeps its report-linked source URL(s), source type, last-check
  date, sponsorship state, link-only rights mode, and a separate pending
  place-edge state. A hard-coded `sponsored: false` is not verification.
- The Nation/Explore screen shows a compact Japan-first research strip. It is
  not another feed or route.
- A content-to-place action may open the existing Place surface only after a
  canonical place ID, coordinates, and evidence edge are verified.
- Until then, the card remains a research lead and routes only to its existing
  city context; it cannot fabricate a venue, opening hours, Japanese support,
  reservation availability, or partner status.

### 3. Jeju without corrupting the official directory

- Jeju is included immediately as ten editorial seeds from the source report.
- Jeju is labelled `Growing · 10 content-linked candidates`.
- It is not labelled as MOIS LOCALDATA coverage and does not inherit the Seoul
  or Busan `200 official records` claim.
- A native progressive disclosure previews the ten candidates inside Explore.
  There is no new provider state, route, tab, or modal.

### 4. Japanese-first, not Japanese-only

- The audience and content priority are Japan-first.
- Existing guest discovery and EN/KO flows remain intact.
- Full Japanese UI localization is a separate release gate. P0 content records
  carry a Japanese hook, but the product must not claim complete Japanese UI
  support before all decision, consent, error, payment, refund, safety, and
  accessibility copy is translated and regression-tested.

## Source and truth rules

| Evidence | Allowed use | Forbidden inference |
|---|---|---|
| KTO Japanese tourism/content research | audience/category trend and official content-tourism edge | place-level popularity |
| Japanese creator/editorial visit | Japan momentum after original URL/date/place verification | Japanese language support |
| TMAP locals vs outsiders | Korea-local/regional context | outsider = Japanese |
| MOHW medical-tourism totals | category demand context | clinic quality, safety, or recommendation |
| Community posts | discovery lead only | score or verified place fact |
| Paid/sponsored content | clearly separate promotion surface only | Pulse contribution |

The report's J/K 1–5 values remain editorial research notes. They are not
production measurements and are never converted directly into a Pulse score.

## Priority and acceptance

### P0 — release blocking

1. One score; Japan/Korea/ONDO drivers; sponsored exclusion; confidence gate.
2. Nine launch content records and ten Jeju seeds have bounded, typed source,
   date, sponsorship, rights, and place-edge verification states.
3. Explore reuses the current Nation surface and keeps exactly five nav tabs.
4. Jeju truth never uses the official-record source/count claim.
5. Existing Map/Place/Table/After19/Wallet/My Korea actions and test IDs remain.

### P1 — after place-data verification

1. Verify canonical coordinates, official place links, current operating
   status, Japanese support evidence, reservation method, and rights/takedown.
2. Enable content → existing Place and Place → source-content reverse links.
3. Add Japanese UI only as an extension of the existing language control.

### P2 — enrichment, not launch truth

1. Souvenir items and import cautions with dated Japan customs/quarantine data.
2. Beauty/wellness collections under a distinct source type and safety policy.
3. Additional content routes and personalized collections only when they reuse
   My Korea and demonstrate a clear decision benefit.

## Explicit non-goals

- No J-Viral/K-Local toggle.
- No duplicate temperature badges.
- No new content tab.
- No nationality-based tracking or ad targeting.
- No fake coordinates, hours, prices, reservation, language, popularity, or
  partnership claims.
- No change to JIT Person/19+/Payment boundaries.
