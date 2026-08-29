# ONDO Product-wide Visual Reset Plan

Status: approved direction implemented in the current Sleek B candidate;
full automatic gates and two independent CLEAN review rounds remain pending.

This document preserves the approved plan and records the decisions used during
implementation. It is not evidence of release approval by itself.

## 1. Why this reset exists

The current product has accumulated strong individual surfaces, but it still
explains too much of its own machinery. Source boundaries, Pulse methodology,
record counts, status names and internal walkthrough language often compete
with the travel decision. The result is visually warm but overly beige,
text-heavy and card-heavy.

The target is a modern white-and-black travel product in which the traveler
understands the next decision from composition, imagery, marker behavior and
iconography before reading explanatory copy. Plum, coral and apricot remain as
ONDO heat and editorial accents; they stop tinting every background.

This reset must not repeat the earlier mistake of achieving simplicity by
deleting PRD functions, states, truth boundaries or exact return paths.

## 2. Non-negotiable product freeze

- The five top-level paths remain Explore, My Korea, Tables, ID · Wallet and
  Settings until a separate information-architecture decision is approved.
- Guest Explore remains available without account, identity, eKYC, 19+ or
  payment gating.
- Account, Person, 19+, identity credential and Payment remain distinct axes.
- Seoul and Busan official LOCALDATA records remain separate from Pulse,
  Japanese editorial and Jeju research.
- Pending editorial records cannot become Place pins, Directions, Save, Table
  or payment actions without an exact verified place edge.
- Tables retain invitation, detail, After19, join, chat, media, check-in,
  feedback, Report, Block, Leave and every recovery state.
- Local Signal retains tags, optional note/photo, Person result, media
  preparation/replacement errors, device-only persistence and exact return.
- OOKRW Test remains non-live, non-money, non-stablecoin, non-chain and
  provider-free. Every payment, receipt and refund state remains reachable.
- Browser history, focus, Escape, scroll restoration, persistence allowlists,
  action names, testids and canonical IDs remain unchanged unless explicitly
  versioned in a separate product decision.
- Legally required basemap attribution remains visible and accessible. It may
  be styled compactly, but it may not be removed.

## 3. New visual direction

### 3.1 Color and material

| Role | Direction |
|---|---|
| App canvas | Near-white, not cream or yellow |
| Primary text/action | Near-black with high contrast |
| Secondary surfaces | Neutral white/soft gray with restrained borders |
| Pulse heat | Plum → coral → apricot, used only for heat and selection |
| Editorial | Plum or ink accent, never official-record blue |
| Success | Muted green reserved for completed local actions |
| Warning/error | Rust/red used only for real recovery states |

Global warm tint should be reduced by roughly 70–80 percent. Warmth moves to
photography, map texture, Pulse aura and small accent objects instead of every
sheet and card.

### 3.2 Typography and numeric formatting

- Use one clear display scale and one compact utility scale; remove multiple
  competing eyebrow/status/body treatments.
- Headers reserve real top breathing room at 320 and 390.
- Use tabular numerals for counts, balances, prices and references.
- Use locale-aware grouping where it has meaning, such as `22,000 KRW`.
- Do not add a meaningless comma to `60 OOKRW Test`; improve its readability
  through baseline, unit size, alignment and contrast.
- Visible product copy remains at least 12px; primary mobile body remains 15–17px.

### 3.3 Spacing and density

- Adopt an 8pt rhythm with 4pt optical corrections.
- Standard phone edge inset: 16px at 320, 20px at 390.
- Related controls share one container and baseline. Floating controls may not
  use arbitrary offsets that create mismatched whitespace.
- First useful viewport shows one decision, one primary action and at most one
  secondary action.
- Short landscape is a separate composition, never a squeezed portrait screen.

### 3.4 Icon and navigation system

- Commission an ONDO-specific icon family with consistent stroke, optical size
  and selected state.
- Desktop rail may become icon-first with localized hover/focus tooltips and
  programmatic names. Selected context must remain unmistakable.
- Mobile labels are removed only when recognition tests prove the icon is
  unambiguous; familiar bottom navigation cannot become an icon guessing game.
- Replace duplicated information buttons with contextual key or source actions.

## 4. Direct response to the ten supplied screenshots

| Screenshot feedback | Decision | Planned treatment |
|---|---|---|
| 1. Filter/location/story spacing is irregular | Accept | Recompose the map chrome on one grid. Filters, location and editorial marker get explicit lanes and equal optical gaps at 320/390/844/1440. |
| 2. City header has no breathing room and status copy is noisy | Accept | Increase header inset. Remove the visible `Curated Pulse active/선별 Pulse 운영 중` line from default chrome; retain an accessible/selected-state status elsewhere. |
| 3. `91 · Peak` is too literal | Accept with truth guard | Default map communicates heat with aura, scale, contrast and restrained motion. Numeric score/level moves to selection, list and accessible name; it is not deleted from the model. |
| 4. Pulse key occupies too much space | Accept | Replace the full-width row with a compact floating key: gradient + `Pulse`. Tap opens a concise key; methodology remains a deeper disclosure. |
| 5. Record count/List/info consume a full row | Mostly accept | Merge count and Map/List into compact chrome. Remove the standalone info button if the key/source action owns the same job. Keep legally required map attribution in a minimal corner treatment. |
| 6. Desktop rail should rely on better icons | Accept with accessibility guard | Produce distinct ONDO icons, compact the rail and reveal localized labels on hover/focus/selection. Preserve 44px targets and screen-reader names. |
| 7. Current ONDO mark looks temporary | Accept | Create a real logo exploration board, then deliver a vector master, wordmark, app icon, favicon and dark/light variants. |
| 8. Large source card is not useful in the main decision | Accept as relocation, not deletion | Remove it from the first decision surface. Keep source identity, date and limitations in the city/detail provenance path and in programmatic truth; legally required basemap attribution remains on the live map. |
| 9. Large Korea-map methodology sheet overwhelms geography | Accept | Remove the atlas legend/info control. Seoul, Busan and Jeju use one equal anchor grammar with only a compact localized type label (`Directory/Editorial`); counts and methodology remain semantic or downstream. |
| 10. Balance number is hard to scan | Accept | Rebuild balance as a financial display object with tabular numerals, clearer unit hierarchy and aligned status/action. Apply grouping only to values that require it. |

## 5. Copy reduction policy

Every visible string is assigned one of four classes before implementation.

1. **Decision-critical** — needed to choose or act now. Always visible.
2. **Truth-critical** — prevents material misunderstanding. Visible, but compact.
3. **Provenance/methodology** — needed for trust or audit. Progressively disclosed.
4. **Internal self-description** — explains how ONDO was built without helping
   the traveler. Delete candidate.

No text is removed merely because it is long. The audit records whether it is
kept, visualized, shortened, folded or deleted, and which test/state protects it.

### Examples

| Current content | Class | Proposed handling |
|---|---|---|
| `Curated Pulse active` | Internal/status duplication | Remove from default header; express active heat visually and retain selected-state/a11y truth. |
| `91 · Peak` on every marker | Decision truth presented too literally | Aura-first default; show number on selection/list/detail. |
| `400 public records` | Context, occasionally useful | Omit from the Korea overview. Preserve exact counts in semantic city anchors and show them in the directory/result or source context where they become actionable. |
| LOCALDATA source date and limitations | Truth/provenance | Keep in the city/detail provenance path and failure recovery. Never delete. |
| OpenFreeMap/OpenStreetMap attribution | Legal provenance | Compact map-corner attribution. Never delete. |
| `One Pulse`, driver methodology | Methodology | One concise key; full explanation folded. |

## 6. Page-by-page retention and simplification map

### Flow 1 — Onboarding and K-Tour ID setup

**Keep:** guest value → intent → preferences, EN/KO/JA, skip, storage recovery,
Settings reset and ungated Explore.

**Add back after PRD restoration review:** an optional K-Tour ID setup branch
containing identity-method selection, Passport eKYC for short-term travelers,
normalized evidence and OpenDID credential issuance/status.

**Simplify:** one human story and one primary decision per step. Source truth is
one compact disclosure. The identity branch is progressive and never blocks
guest browsing.

**Visual media:** one diverse traveler hero or small group, clearly editorial
and not an identity subject.

### Flow 2 — Korea overview

**Keep:** Seoul, Busan and Jeju geography; official/editorial distinction;
history/focus/direct URL.

**Visualize:** geography, journey route and three equal city anchors. The atlas
does not print record counts, editorial counts, status prose or methodology on
the cards. It expresses destination choice through position, pin, material and
state; one localized type label prevents official/editorial meaning from relying
on color alone. Exact counts remain in accessible names and typed attributes,
then become visible in the city/result/source context.

**Fold:** full source scope and map methodology into the downstream
directory/detail provenance path. Do not add a floating atlas info control.

**Delete candidates:** repeated `200 official records` sentences and duplicated
category-normalization explanations outside the source drawer.

### Flow 3 — City map, Pulse, filters and list

**Keep:** map default, search, filters, location, Map/List, loading/error/retry,
selection, Pulse evidence and official clusters.

**Visualize:** Pulse heat through aura/scale/motion; official clusters through a
neutral grammar.

**Compact:** city header, filter rail, result count, key and list toggle.

**Fold:** score methodology, source mechanics and confidence/freshness details.

**Delete candidates:** default header status sentence, repeated legend prose and
standalone information action when the compact key already owns it.

### Flow 4 — Japanese editorial

**Keep:** city-context marker, source links, TOP stories, supporting stories,
Jeju collections, pending-place boundary and inert map behavior.

**Lead with:** art, hook and source identity.

**Fold:** verification, sponsorship, rights and cross-source mechanics.

**Delete candidates:** repeated workbench language such as `being checked` when
one collection-level pending boundary already states it.

### Flow 5 — Place

**Keep:** identity, Pulse, official record, Directions, Save, Table, 19+, Local
Signal, benefit, source evidence, errors and exact returns.

**Lead with:** place identity, spatial context and one primary action.

**Visualize:** Pulse and saved state with objects/icons; keep official truth as a
compact label.

**Fold:** transliteration explanation, licence limitations and long provenance.

### Flow 6 — Tables, After19 and chat

**Keep:** every invitation, join, gate, chat, media, safety and recovery state.

**Lead with:** people, time, seats and plan. Use real-feeling synthetic traveler
portraits only as fictional participants, never as verified users.

**Visualize:** participant presence, itinerary and progress.

**Fold:** safety and no-booking boundary after a concise always-visible line.

### Flow 7 — Local Signal

**Keep:** tags, note, photo, Person, post/update, device evidence and recoveries.

**Lead with:** large tactile signal choices and current Place context.

**Visualize:** selected signals and device-local completion.

**Fold:** media and persistence methodology while preserving one concise
`nothing uploads` truth line.

### Flow 8 — Travel Pass, Wallet and local test commerce

**Keep:** all sealed disconnected/ready/policy/payment/receipt/refund states and
exact returns.

**Lead with:** a clear Travel Pass object, balance and next action.

**Visualize:** benefit delta, test receipt and restored state.

**Compact:** repeated non-live truth into a consistent local-test badge and one
short venue boundary. It must remain visible wherever real-money confusion is
possible.

**Do not reintroduce:** connection, payment, refund, FX, credential or venue
acceptance language that implies a live service.

### Flow 9 — My Korea

**Keep:** saved, recent, Tables, Local Signal and local test receipts/refunds;
empty/populated/reload/exact returns.

**Lead with:** current trip narrative or newest meaningful artifact.

**Visualize:** a journey timeline and place/photo moments rather than a stack of
administrative cards.

**Fold:** storage boundaries into one device-data explanation.

### Flow 10 — Settings

**Keep:** EN/KO/JA, discovery preferences, onboarding reset, device data scope,
clear confirmation/failure and all preservation semantics.

**Lead with:** current language and the few settings people change most.

**Use icons for:** category recognition, not for replacing consequential labels.

**Fold:** long data-scope explanations and source details. Destructive actions
remain explicit and text-labeled.

## 7. OpenDID and Passport eKYC restoration

The original repository documents confirm this is not an invented new idea.
The architecture and developer handoff define three separate proofing paths:

| Traveler | Initial proofing | Credential result |
|---|---|---|
| Korean | Mobile ID through OmniOne CX | Private K-Tour service credential |
| Registered foreign resident | Mobile residence-card path through CX | Private K-Tour service credential |
| Short-term visitor | Separate Passport eKYC provider: NFC/OCR + face/liveness | Private `KTourVisitorCredential` |

OpenDID is the issuance, holder, status and presentation infrastructure. It is
not the Passport eKYC provider, a government ID issuer, a visa or a residence
permit.

### Implemented simulated onboarding structure

1. **Explore as a guest** remains the fastest default and never invokes eKYC.
2. **Set up K-Tour ID** is an optional branch with a visible environment label.
3. Choose identity method based on traveler situation; unsupported providers
   explain why they are unavailable.
4. Purpose-specific consent shows requester, required evidence, retention and
   exact return before capture/handoff.
5. Passport path separates document capture/NFC, face/liveness and provider
   result. No raw document or biometric is placed in general app storage.
6. Normalize the provider result into minimal `IdentityEvidence`.
7. Issue or simulate issuance of the private K-Tour credential through OpenDID.
8. Show holder delivery, credential type, issuer, expiry/status and a clear
   `private service credential — not government ID/visa` boundary.
9. Return to the original onboarding or gated action with exact focus/context.

### Required states

- method available/unavailable
- consent, cancel and decline
- document permission denied
- OCR/NFC preparation and retry
- document mismatch/unsupported document
- face/liveness failure and retry
- provider processing, timeout, callback failure and expiry
- normalized evidence success
- OpenDID issuer unavailable, issuance retry and holder-delivery failure
- credential ready, expired, suspended/revoked and reissue
- browser reload, back/forward and exact return

### Environment decision and current boundary

- **Actual adapter (deferred):** requires selected Passport eKYC provider, OpenDID issuer,
  holder/verifier/status environment, callback security and retention policy.
- **SIMULATED walkthrough (selected for this candidate):** every step and result
  says `SIMULATED`; it displays no real provider, verified identity or live VC.
  Guest Explore stays ungated and the walkthrough stores no document, face,
  provider result or credential in device persistence.

The current UI does not silently substitute OmniOne CX for Passport eKYC. A
future real-adapter change requires a separate environment and privacy decision.

## 8. Logo, icon and human-image asset plan

### Logo

Create three concept directions before choosing one:

1. **Contour O** — an O formed by a journey contour and one Pulse point.
2. **Compass Pulse** — a restrained orientation mark with a warm pulse core.
3. **Korea path monogram** — an abstract route/atlas object without flag or
   government-seal implications.

Image generation may be used for concept exploration. The selected mark must
be rebuilt and optically corrected as vector artwork; raster AI output is not
the production logo. Deliverables: symbol, wordmark, lockup, monochrome,
light/dark, 16–512px app icons and clear-space rules.

### People

Generate a small coherent fictional cast for:

- onboarding travel aspiration
- Tables invitation/chat presence
- My Korea trip memory

Do not place generated faces on official-record pins, eKYC capture/results,
credential surfaces or anything that could imply a real verified person.
Maintain the existing synthetic-asset disclosure and do not infer nationality,
identity or eligibility from appearance.

## 9. Execution record and remaining order

1. Freeze a current 320/390/844/1440 screenshot census for all 10 flows.
2. Produce a white/black direction board and logo/icon/people concept board.
3. Produce the copy disposition sheet: keep, visualize, shorten, fold, remove.
4. Approve the OpenDID/eKYC environment and journey contract.
5. Implement shared tokens and chrome first: canvas, type, spacing, icons, nav,
   sheet materials and motion.
6. Implement Explore/map simplification as one connected flow.
7. Implement onboarding + optional K-Tour ID branch without gating guest Explore.
8. Revalidate already sealed Tables, Local Signal and Wallet under the new
   shared shell; do not rewrite their state machines.
9. Finish My Korea and Settings in the approved white/black system.
10. Run the full functional and visual matrix before release.

Items 1–9 have been implemented in the current candidate without deleting the
underlying PRD states. Item 10 remains the release boundary: exact automated
gates, a frozen evidence tuple, two independent CLEAN review rounds, and only
then a new personal private deployment.

## 10. Acceptance gates

- Every required state scores at least 8.5 in EN/KO/JA at 320, 390, 844 and 1440.
- First useful viewport has one understandable decision and no avoidable
  methodology wall.
- Essential actions and truth remain reachable with JavaScript, keyboard,
  pointer and screen reader.
- No text below 12px and no control below 44px.
- Legal attribution and high-risk truth remain present.
- Existing PRD action/state/testid/persistence/history contracts remain green.
- Removed-copy audit proves every deletion is redundant or internal, not a
  deleted feature or safety boundary.
- All generated imagery has a source, rights mode and non-identity boundary.
- OpenDID/eKYC environment labels match actual integration evidence.
- Independent product, traveler and visual reviewers report P0=P1=P2=P3=0.

## 11. Decisions to bring to the user

No input is needed to prepare the boards and audits. Implementation waits for
three explicit selections:

1. OpenDID/eKYC: actual configured adapter or clearly simulated walkthrough.
2. Logo direction: Contour O, Compass Pulse or Korea path monogram.
3. Human imagery: photographic editorial, stylized 3D or refined illustration.

The user reviews those boards before the reset begins.
