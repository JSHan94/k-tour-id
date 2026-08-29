# ONDO Visual Excellence Checklist

This is the release checklist for the reference-led visual redesign. A flow is
complete only when its weakest required state scores at least 8.5/10. Passing
functional tests or having no visible defect is necessary, but is not visual
approval.

## Fixed direction

Apple supplies the interaction and material baseline. ONDO's warm living-atlas
cartography is the brand layer. Other products donate patterns only; they do not
donate unsupported product claims.

| # | Connected flow | Pattern references | Status |
|---|---|---|---|
| 1 | Guest onboarding | Arc | Implemented · candidate revalidation pending |
| 2 | Korea overview and city selection | Polarsteps | Implemented · candidate revalidation pending |
| 3 | City map, Pulse, filters and list | Mapstr + Beli | Implemented · candidate revalidation pending |
| 4 | Japanese story to source/place | The Infatuation + Apple Guides | Implemented · candidate revalidation pending |
| 5 | Place peek and full detail | Apple Place Card + Airbnb | Implemented · candidate revalidation pending |
| 6 | Tables, 19+, join and chat | Timeleft | Implemented · candidate revalidation pending |
| 7 | Local Signal contribution | Apple contribution + Strava | Implemented · candidate revalidation pending |
| 8 | Travel Pass, Wallet, offer and receipt | Apple Wallet | Implemented · candidate revalidation pending |
| 9 | My Korea trip memory | Polarsteps | Implemented · candidate revalidation pending |
| 10 | Settings and device controls | Apple Settings + Arc | Implemented · candidate revalidation pending |

## Definition of done for every flow

- [ ] The information hierarchy can be explained as one decision, one primary
      action and one secondary action in the first useful viewport.
- [ ] The reference pattern is visible in composition, rhythm, material,
      interaction and motion—not only in color, radius or shadow.
- [ ] The flow reads as ONDO rather than a collage of reference products.
- [ ] Mobile 320x720 and 390x844 are designed first; no important CTA is hidden
      by the dock or pushed below avoidable explanatory copy.
- [ ] Short landscape 844x390 is a deliberate composition, not a compressed
      portrait layout.
- [ ] Desktop 1440x1000 uses the available canvas intentionally and does not
      center a stretched phone column in dead space.
- [ ] English, Korean and Japanese retain the same hierarchy without clipping,
      ellipsis of essential truth, orphan glyphs or mixed-language labels.
- [ ] Controls are at least 44px, visible product text is at least 12px, and
      keyboard focus is branded and unambiguous.
- [ ] Pointer-open states have no sticky browser-blue focus ring; keyboard focus
      remains visible.
- [ ] Motion has a clear entrance, transition or completion role and respects
      reduced-motion.
- [ ] Empty, loading, ready, selected, error, retry, cancelled, completed and
      restored states use the same visual system.
- [ ] Browser history, focus, Escape, scroll position and exact return context
      remain correct.
- [ ] Existing actions, state transitions, testids, routes and persistence
      contracts are preserved unless a product change is separately approved.
- [ ] No official record, editorial content, Pulse signal, Table plan, Local
      Signal, identity result or OOKRW Test state impersonates another domain.
- [ ] Before/after production captures exist for EN/KO/JA at 320, 390, 844 and
      1440 for every required state.
- [ ] Independent product, traveler and visual reviews find no P0-P3 issue.
- [ ] The user approves the connected journey before the next journey begins.

## Scoring rubric

Each required state is scored independently. A flow fails if any required state
is below 8.5, regardless of its average.

1. Brand distinctiveness and emotional pull — 20%
2. Decision hierarchy and comprehension — 20%
3. Typography and content measure — 15%
4. Spacing, rhythm and responsive composition — 15%
5. Material, elevation and color discipline — 10%
6. Interaction, motion and tactile feedback — 10%
7. Truth, accessibility and state continuity — 10%

## Active journey: Explore

The Explore journey is one connected product experience:

`Korea atlas -> city map/list -> Japanese editorial -> Place`

### 2. Korea overview — Polarsteps pattern

- [ ] Korea is the primary visual object, not a report header followed by cards.
- [ ] Seoul, Busan and Jeju read as equal geographic anchors with clear relative
      placement and one pin/material/interaction grammar.
- [ ] The first view contains no printed count, methodology ribbon, floating
      info control or internal status sentence. One compact localized type
      label distinguishes Directory from Editorial without color dependence;
      exact counts remain semantic and surface when a downstream decision needs
      them.
- [ ] Jeju remains editorial and has no official count. Only eight exact
      VISITKOREA place-page/embedded-map verified points are mapped; the two
      pending candidates remain source links with no pin or place action.
- [ ] City selection feels like entering a journey, with camera/atlas continuity
      into the selected city.
- [ ] Source methodology is progressive and never outranks city choice.
- [ ] Back/forward/direct URL restores the correct atlas anchor and focus.

Required states: overview, city focused/pressed, history return, narrow
portrait, short landscape and desktop. Source truth is verified semantically on
the atlas and visibly in the downstream directory/editorial provenance path.

### 3. City canvas — Mapstr + Beli pattern

- [ ] Map is the default decision canvas on all supported viewports.
- [ ] Pulse uses one restrained aura/core/label grammar; official clusters remain
      neutral and cannot be mistaken for Pulse.
- [ ] Search, filters, location, Map/List and key form one compact control system.
- [ ] Labels remain associated with their marker and never collide with each
      other, clusters, chrome or viewport edges.
- [ ] List rows carry the same Pulse hierarchy and selection energy as the map,
      rather than becoming generic directory rows.
- [ ] Loading retains intentional map feedback; error exposes a complete List and
      Retry path; location denied/unsupported has a contextual recovery.
- [ ] Selection moves naturally map -> peek -> detail and List -> peek -> detail.

Required states: loading, ready, selected, key collapsed/open, Map/List, search,
filtered/empty/reset, location states, tile error/retry and return from Place.

### 4. Japanese editorial — Infatuation + Apple Guides pattern

- [ ] Stories feel embedded in the city map, not attached as a separate feed.
- [ ] A strong image and concise hook explain why the story matters before source
      mechanics or verification language.
- [ ] The first view shows a small, curated set; remaining stories and Jeju
      collections use deliberate progressive disclosure.
- [ ] Source identity, date, verification, sponsorship and rights remain
      reachable without making the card look like a research console.
- [ ] ONDO-original imagery is credited as ONDO artwork; publishers are credited
      only as story sources.
- [ ] Pending place edges clearly lead to the original source only. Directions,
      Save, Table and payment are absent until exact place verification.
- [ ] Verified Jeju edges use one internal editorial Place surface and remain
      separate from official records, Pulse, Table, Local Signal and commerce.
- [ ] Open/close makes the underlying map inert and restores focus/context.

Required states: city marker collapsed/open, featured story, multi-source story,
remaining stories, Jeju sources, source-open failure and return.

### 5. Place — Apple Place Card + Airbnb pattern

- [ ] Place identity, district and Pulse decision are understandable in one glance.
- [ ] The sheet has a place-specific visual or cartographic sense of context; it
      is not only a legal/data ledger.
- [ ] Directions is the sole primary action; Save and Details are secondary.
- [ ] Table, meal benefit and Local Signal are contextual modules that preserve
      their separate truth domains.
- [ ] Official Korean name, navigation transliteration and licence boundary are
      clear but progressively disclosed.
- [ ] Peek is compact and map-preserving; detail is editorial and composed on
      desktop rather than a stretched mobile sheet.
- [ ] Loading/error/save-failure/retry/saved states use the same visual grammar.
- [ ] Close, Escape, history and exact opener focus restoration remain correct.

Required states: peek, detail, saved, save error/retry, source evidence, Pulse
evidence, action modules, alternatives and exact return from every child flow.

## Later connected journeys

### 1. Guest onboarding — Arc

- [x] Value -> intent -> preferences is directional, compact and narrative.
- [x] EN/KO/JA switching is immediate and visually stable.
- [x] Source truth is one progressive disclosure, not the emotional hero.
- [x] Guest and primary completion both land on the same Explore hierarchy.
- [x] Storage failure preserves the current draft and exposes one persistent,
      localized recovery action without covering source or dietary truth.
- [x] Settings reset failure is recoverable in place; successful reset preserves
      locale, saved places and activity while clearing setup fields only.

Required states sealed: value, intent, preferences, skip/Escape failure,
repeated storage failure, Settings reset failure and reset re-entry for EN/KO/JA
at 320x720, 390x844, 844x390 and 1440x1000.

### 6. Tables and 19+ — Timeleft

- [x] Event identity, time, seats and participation energy lead the composition.
- [x] Detail becomes an itinerary and participation flow, not a metadata form.
- [x] Join remains visible; After19 is a branded private checkpoint.
- [x] Chat emphasizes participant presence and the composer while safety remains
      reachable but subordinate.
- [x] Real-clock expiry renews the exact Table, Place and draft return envelope.
- [x] Join and leave change state only after durable plan storage succeeds;
      failures keep the truthful current state and expose recovery.
- [x] Report, Block and Leave each own focus, Escape, confirmation and return;
      no action leaks through the active safety dialog.
- [x] Messages, photos, check-in, feedback and safety state remain tab-local;
      only the planned Table persists to My Korea on this device.
- [x] Report and feedback receipts explicitly create no external report, public
      rating, reputation, booking, venue transmission or payment claim.

Required states sealed: invitation, detail, After19 intro/review/failure/expiry,
join storage failure, joined, chat, send failure/retry, photo ready/MIME/size
failure, check-in, feedback receipt, My Korea/reload/exact Table return,
Report/Block/Undo, Leave/cancel/storage failure for EN/KO/JA at 320x720,
390x844, 844x390 and 1440x1000.

### 7. Local Signal — Apple contribution + Strava

- [x] Place context and signal choices lead; optional note/photo remain optional.
- [x] Signal selection has immediate visual response without changing public Pulse.
- [x] Photo is a tactile object with clear prepare/replace/remove recovery.
- [x] Completion feels like a private contribution receipt, not an upload success.
- [x] Person consent is a short-lived, exact place-and-draft envelope; close,
      venue change, traversal, reload and real-clock expiry invalidate it.
- [x] MIME, size, preparation and corrupt-media failures preserve the previous
      good preview and expose the same reachable retry decision.
- [x] Posting and updating are durable-first; failures retain the draft and do
      not mutate public Pulse, ranking, map markers or official facts.
- [x] Device history and evidence remain the same bounded 12-item intersection
      in memory, storage, reload and My Korea.
- [x] Note and photo are discarded on close and never imply upload, provider,
      public reputation or a shared observation.

Required states sealed: initial, selected note, photo ready/remove, MIME/size/
prepare/corrupt replacement recovery, Person consent/cancel/failure/unavailable/
expiry/ready, post/update storage failure, posted/update receipt, Back/Forward,
reload, My Korea and exact Place return, Settings clear failure for EN/KO/JA at
320x720, 390x844, 844x390 and 1440x1000.

### 8. Travel Pass and Wallet — Apple Wallet

- [x] Travel Pass and wallet are memorable, distinct objects with honest test
      semantics.
- [x] Offer review foregrounds quote, benefit delta and one sticky action.
- [x] Paid and refunded receipts are visually distinct completion objects.
- [x] No visual treatment implies a real credential, money, chain or provider.
- [x] Account, Person, 19+, Wallet and Payment remain independent readiness axes.
- [x] Accepted and declined benefits preserve exact 19/41 and 22/38 test
      amounts; refund restores 60 and only the benefit actually used.
- [x] Pay and refund are durable-first, fail closed on malformed references and
      restore paired zero-sum ledgers deterministically after reload.
- [x] Processing cancel, policy ineligible/minimum/expiry, failure,
      insufficient balance and storage errors retain an honest same-Place
      recovery instead of visually completing.
- [x] Wallet activity and My Korea return to the exact canonical Place without
      exposing QA outcome or ledger controls.

Required states sealed: Travel Pass disconnected, prepare info/failure/ready,
Wallet paid/reload, recommended/accepted/declined/consented offer, policy
ineligible/below-minimum/expired, deterministic processing, payment failure,
insufficient balance, payment/refund storage error, accepted/declined receipt,
refund, My Korea paid/refunded and exact Place return for EN/KO/JA at 320x720,
390x844, 844x390 and 1440x1000.

### 9. My Korea — Polarsteps

- [x] The newest active trip artifact leads; empty history does not outrank it.
- [x] A Korea memory map visualizes unique saved/recent/planned/contributed/
      receipt place evidence without inventing routes or synced travel history.
- [x] Plans, signals, official places, editorial places and receipts form a
      coherent device-local journey timeline with explicit truth boundaries.
- [x] Exact official Place, editorial Place, Table and receipt return preserves
      state across reload.

### 10. Settings — Apple Settings + Arc

- [x] Current EN/KO/JA language and preference count are immediately understandable.
- [x] Editing is progressive and tactile rather than a wall of controls.
- [x] Device data scope and destructive clear action are transparent and calm.
- [x] Settings retains ONDO material and type while using familiar native patterns.

## Release record

- Current candidate: implementation integrated; production-fixed focused
  verification is green, while the full visual census and CLEAN 2/2 remain open.
- Peer-sealed flow: Guest onboarding at `7555b133` (72 required state frames,
  all >=8.5, P0=P1=P2=P3=0, Arc 13/13, restoration/geometry 8/8,
  contracts 174/174)
- Peer-sealed flows: Explore 2–5 at `5deef49` (all required states >=8.5,
  P0=P1=P2=P3=0, V3 6/6, contracts 172/172)
- Peer-sealed flow: Tables/19+/Join/Chat at `33722b9` (264 required state
  frames, all >=8.5, P0=P1=P2=P3=0, focused mobile 5/5, desktop 5/5,
  social direction 19/19, contracts 178/178)
- Peer-sealed flow: Local Signal at `f0107c1` (264 required state frames plus
  nine successor recovery frames and 66 stable desktop evidence frames, all
  >=8.5, P0=P1=P2=P3=0, focused 14/14, contracts 191/191, optimized build
  GREEN)
- Peer-sealed flow: Travel Pass/Wallet/offer/receipt at `7f92ecd` (288 required
  state frames, all >=8.5, P0=P1=P2=P3=0, focused 14/14, contracts 205/205,
  optimized build GREEN)
- Historical peer seals above remain evidence for their exact listed SHAs only;
  they do not count as CLEAN review of the current candidate.
- User approval of the final connected candidate: pending a stable private URL.
