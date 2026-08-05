# K-Tour ID Map-first A/B Experiment

Status: Variant B prototype

Branch: `experiment/map-first-daedongyeojido`

Control: `main` / `https://k-tour-id.vercel.app`

## 1. Experiment question

Can K-Tour ID feel more like a useful Korea travel product—and less like a collection of service pages—when the primary interface is a map where places and activities produce the next actions?

This branch does not replace the current product. It is an isolated B variant for side-by-side evaluation.

### A / control

- Editorial home
- Persona-specific recommendation and benefit cards
- Separate Explore, Connect and ID · Wallet navigation
- Commercial service categories are visible from the home surface

### B / map-first

- The map is the home and the main discovery surface
- A place or activity is selected before mobility, food, booking or payment appears
- Commercial services become contextual branches of a trip instead of independent destinations
- Map and list share one result set and selection state
- Activity participation is the only entry into its group chat
- ID · Wallet remains a foundation and appears at the moment eligibility, benefit or payment matters

### Hypothesis

Variant B should increase a user's ability to answer three questions without learning the app structure:

1. What can I do around here now?
2. How do I get there and what can I use with my K-Tour ID?
3. What happens before, during and after I join or book it?

## 2. Product definition

> K-Tour ID의 현대 대동여지도 B안은 한국의 산·강·길·장소를 여행의 맥으로 다시 읽고, 필요한 순간에 K-Tour ID의 자격·혜택·결제를 조용히 연결하는 개인 여행 지도다.

This is not an antique-looking tourist app. Daedongyeojido is used as information-design inspiration:

- Connected landscape: mountain, water and road networks create a legible travel structure.
- Modular sheets: a large territory is understood through manageable local sections.
- Route marks: movement and distance are readable, not decorative.
- Symbol legend: a small, consistent vocabulary represents public travel infrastructure.

The modern operational map remains the source of truth. The heritage landscape is an optional interpretive layer.

## 3. Information architecture

```text
Map
├─ Search: destination or intent
├─ Layers: around me / things to do / eat / move / together / my benefits
├─ Map ↔ accessible list parity
├─ Place or activity selection
│  └─ Adaptive action sheet
│     ├─ time / distance / language / availability / price
│     ├─ story and source
│     ├─ K-Tour ID eligibility and benefit
│     ├─ preview directions
│     └─ booking, order or participation
└─ Context branches
   ├─ how to get there: public transit / Kakao T / Uber / walk
   ├─ before or after: nearby food / delivery to stay
   ├─ reservation: date / party / cancellation / ticket
   └─ confirmed activity: meeting point / notices / group chat

Journey
├─ saved and booked places by day
├─ joined activities
├─ next movement
├─ order / ticket / ride status
└─ private travel record

ID · Wallet
├─ K-Tour ID status and presentation
├─ identity attributes and consent
├─ travel balance and payment method
├─ issued benefits and tickets
└─ receipts and settlement evidence
```

Community is not a global tab in Variant B. It is a map activity layer before participation and a Journey object after participation.

## 4. Core flows

### Discover and join an activity

```text
Open map
→ choose Together layer
→ select activity pin/card
→ review time, language, seats, price and verified host
→ review participation conditions
→ confirm participation
→ add to Journey
→ activity group chat opens
→ meeting point, notices and check-in
→ optional review or friend connection after the activity
```

No gender matching and no dating promise. No unsolicited open DM.

### Place to mobility

```text
Select place/activity
→ preview distance and simplest route
→ compare public transit, walking and partner ride quote
→ show pickup point, ETA, fare, benefit and payment method
→ hand off to partner UI/SDK where operational depth is required
→ completion callback returns ride status to Journey
```

K-Tour ID should own the comparison and trip context. Live driver operations and partner-specific exceptions remain partner territory.

### Place to food or delivery

```text
Select place/activity
→ choose before/after meal or delivery to stay
→ confirm place/address, ETA, delivery fee, minimum and benefit
→ select a provider option
→ hand off for full menu/operations if required
→ return order state to Journey and receipt to ID · Wallet
```

### Contextual benefit

```text
Select eligible place/action
→ show available benefit and reason
→ disclose minimum identity attribute needed
→ user consents
→ apply benefit to quote
→ pay or reserve
→ issue ticket/receipt to ID · Wallet
```

## 5. Map behavior contract

- The default map shows only high-value places and activities; food and mobility appear progressively.
- Selecting a pin selects the corresponding card. Selecting a list/card focuses the corresponding pin.
- Low zoom uses clusters; high zoom reveals individual choices.
- Moving the map does not silently replace results. It reveals “search this area.”
- A result card prioritizes time, travel time, language, remaining capacity, price and eligibility over long description.
- One recommendation is prominent; two alternatives are enough for fast decisions.
- Data source and freshness must be visible whenever information is simulated, partner-provided or live.
- Location denial still yields a complete experience using a chosen city, lodging area or current itinerary.

## 6. Location, privacy and accessibility

### Location

- Start coarse; request precise location only for navigation, pickup or nearby ranking.
- Do not request background location by default.
- Exact location is session-scoped and must not be written into a VC, DID document or public chain.
- Lodging location needs a privacy zone rather than an exact public marker.
- Group live location is off by default and requires explicit per-session opt-in.

### Accessibility

- Map and list must expose the same results and filters.
- Every pin needs an accessible name, category and selected state.
- Distance and direction must also be available as text.
- All actions must work by keyboard, screen reader and reduced-motion settings.
- Color is not the only signal for category, availability or eligibility.

## 7. Third-party service capsule

OpenDID/OpenCX-based partner modules should implement a shared contract rather than inventing a new screen for every provider:

```text
provider + trust badge
availability / quote / last updated
minimum identity requirement and consent
book / cancel
payment method
live order state
deep-link or SDK fallback
completion callback
```

Kakao T, Uber, Baemin, Coupang Eats and activity providers can therefore use the same map card → action sheet → confirmation skeleton while retaining their operational interface.

## 8. Reference synthesis

### Mobility and navigation

- [Citymapper](https://citymapper.com/): destination-first comparison, GO execution and next-action focus
- [Apple Maps](https://www.apple.com/maps/): map context with a restrained adaptive route card
- [Google Maps](https://support.google.com/maps/answer/10014587): explore and saved places inside a geographic context
- [NAVER Map](https://map.naver.com/): Korean transit, exits, congestion and place depth
- [KakaoMap](https://map.kakao.com/): Korean place and route detail
- [Transit](https://transitapp.com/): nearby departures, source clarity and execution mode
- [Moovit](https://moovitapp.com/): step-by-step live directions and freshness labels
- [NAVITIME Japan Travel](https://japantravel.navitime.com/en/): foreign-traveler and pass-aware door-to-door routing
- [Uber](https://www.uber.com/): destination-first quote and request-state sheet
- [Grab](https://www.grab.com/): tourism-ready transport and food handoffs

### Activities, itineraries and commerce

- [Airbnb map search](https://www.airbnb.com/help/article/252): synchronized map/result exploration
- [GetYourGuide](https://www.getyourguide.com/): decision-focused activity availability
- [Klook](https://www.klook.com/): destination context across activities, transit, dining and essentials
- [Tripadvisor Trips](https://www.tripadvisor.com/Trips): save, organize and collaborate on a map
- [Viator](https://www.viator.com/): cancellation and reservation-risk clarity
- [AllTrails](https://support.alltrails.com/hc/en-us/articles/360041612232-How-to-use-list-view-to-explore-trails): true map/list parity
- [Komoot](https://www.komoot.com/help/routeplanner): places and POIs as branches of one route
- [Wanderlog](https://wanderlog.com/home): itinerary and map as one planning object
- [Roadtrippers](https://support.roadtrippers.com/hc/en-us/articles/202594209-Planning-a-Trip-in-Our-Mobile-App): route-adjacent category discovery
- [Atlas Obscura](https://app.atlasobscura.com/): strong editorial reason-to-go per place
- [Meetup](https://help.meetup.com/hc/en-us/articles/39235072484109-Finding-an-event): activity-scoped participation and chat

### Korea map and heritage grammar

- [National Museum of Korea — Daedongyeojido](https://www.museum.go.kr/ENG/contents/E0201020000.do?relicId=2577&schM=search)
- [VISITKOREA map](https://english.visitkorea.or.kr/vkmap/)
- [KTO × NAVER Map BE LOCAL](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=1590269)
- [Mapbox style layers, zoom and clustering](https://docs.mapbox.com/mapbox-gl-js/guides/styles/style-layers/)

## 9. A/B evaluation

Test both variants with the same persona and tasks.

### Tasks

1. Find an English-friendly activity near the current location and identify its remaining seats.
2. Join it, find the group chat and confirm why strangers cannot DM before participation.
3. Compare how to get there, including a partner ride and an applicable benefit.
4. Find a meal for before/after the activity without returning to a service-category home.
5. Locate the resulting booking, chat, ticket and payment receipt.
6. Complete the same flow after denying location permission.

### Primary measures

- Task completion rate
- Time to first meaningful place/activity selection
- Wrong-turn/back-navigation count
- Ability to explain where mobility, food, community and ID · Wallet belong
- Confidence that a benefit is genuinely usable
- Perceived travel usefulness versus “feature showcase” impression

### Guardrails

- Location opt-in rate and comprehension
- Accessibility completion parity between map and list
- Partner handoff return rate
- Booking/order failure recovery
- No decrease in ability to find ID, wallet, receipts and credential status

## 10. Prototype boundary

This branch tests product structure, wording, interaction hierarchy and visual direction. Its map geometry, quotes, routes and partner availability are simulated. Production architecture, real map provider, routing engine, OpenDID/OpenCX contracts and Sui implementation remain developer-owned decisions governed by the development specification.
