# ONDO mobile meaning gate

This is the product-wide review gate for replacing unnecessary prose with
recognisable interaction, state, and imagery without deleting product truth.
Review the mobile surface first at 320, 360, 390, and 430 CSS pixels.

## Text tiers

### A — visible at the decision or result

Keep these visible. An icon may reinforce them but must not replace them.

- the current place, Table, benefit, or payment target
- KRW amount and, when useful, the estimated USD amount
- consent requester, purpose, requested result, and the action being approved
- the predicate currently required: Account, Person, 19+, Payment, or K-Tour ID presentation
- failure, cancellation, expiry, recovery action, and where the user returns
- destructive-action scope
- the six Table facts: time, menu, language, cost, seats, and meeting format
- official versus editorial data, and facts the source does not confirm

### B — progressive disclosure

Keep these one tap away, collapsed by default.

- provider names, OpenDID/DID/VC mechanics, and retention details
- OOKRW, USDC, USDT, network, ledger, operation, and receipt identifiers
- temperature evidence, freshness, confidence, and numeric score
- LOCALDATA/VISITKOREA snapshot, record identifiers, dates, and media credit
- local-only or not-sent implementation boundaries

### C — Labs only

Do not put preview, simulated, test, demo, or architecture language in the
normal product surface. If the demo cannot complete a real external action,
state that fact once at the point where a user could otherwise be misled.

## Visual grammar

- Selected: filled surface plus check; do not repeat “selected” in body copy.
- Temperature: shared ring/halo/meter geometry for Seoul, Busan, and Jeju.
  Jeju may visualise editorial coverage intensity, but remains semantically
  editorial/limited rather than claiming an official Hot/Peak signal.
- Normal location: one labelled status icon. Show prose only for denial,
  offline, unsupported, or another state that needs recovery.
- Navigation and obvious utility actions: pictogram on phones, accessible name
  in the DOM, visible label on larger layouts when it improves recognition.
- Loading: preserve the map underneath; use a short focus/zoom transition and
  reduced-motion fallback instead of a separate explanatory screen.
- Destructive, payment, consent, reporting, blocking, and recovery actions keep
  visible verbs even when accompanied by an icon.

## Flow checklist

| Flow | Visual-first surface | Text that must remain |
| --- | --- | --- |
| First run | persona pictograms, selected states, food-interest chips | current choice and continue/skip action |
| Korea map | live map, city focus points, shared temperature halos | city names; editorial distinction when relevant |
| City map/list | heat/cluster/venue markers, photos in list | search terms, filters, recovery errors |
| Official place | image, temperature meter, action icons | place name, unknown facts, action/result truth |
| Jeju editorial place | same place geometry and visual temperature grammar | editorial/limited source truth |
| My Korea | memory map, activity icons, place imagery | saved object, amount/status, failures |
| Tables | plan icons and participant imagery | six planning facts and report/block/leave verbs |
| Local Signal | camera/media and compact tag states | publish scope, errors, retention disclosure |
| After 19 | moon/neon theme and active state | consent, non-guarantee, failure/expiry |
| Wallet | balance card, funding/payment/receipt sequence | currency, amount, result, provider failure |
| K-Tour ID | document/phone/passport imagery and progress | requested proof, consent, result, failure |
| Just-in-time gate | current requirement and progress only | the action being resumed and any failed result |
| Settings | section glyphs and native controls | language labels and deletion scope |
| Labs | technical detail is allowed here | explicit non-production boundaries |

## Adversarial sign-off

For every changed bundle, verify all of the following before deployment:

1. A first-time user can identify the next action without reading helper copy.
2. Removing a sentence did not remove a decision, consent, loss, or failure fact.
3. Icon-only controls have a unique localized accessible name and a 44px target.
4. English, Korean, and Japanese fit without horizontal overflow.
5. 200% zoom, reduced motion, forced colors, and short landscape remain usable.
6. A feature required by the PRD is still reachable even if its explanation moved.
7. Editorial data is never presented as official data or an official temperature.
