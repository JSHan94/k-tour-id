# Busan food pulse — researched destinations

Checked: 2026-09-09. Companion data: `k-tour-id-app/data/ondo/research/busan-food-pulse.json`.

## Scope and truth boundary

Six researched visitor destinations: two restaurants, two cafés, two bars. These are editorial discovery candidates supported by operator, tourism or award records—not live footfall, current queues, availability, opening-status guarantees, purchase records, or DID-verified visits. Only the two Michelin additions carry a dated 2026 recognition claim. `checkedAt` is our research date, not a source publication date or operating-status receipt. Undated sources retain `publishedAt: null`.

The proposed spend bands below are editorial positioning, not a current menu quote. Cafés / casual noodle lunch, a Korean set meal / craft-beer evening, and a premium hotel cocktail stop provide different kinds of occasions. Show an exact price only after a current menu/source is separately recorded.

## Selection and tourism use

| Destination | Visitor occasion / spend positioning | Evidence and integration caution |
| --- | --- | --- |
| 뫼밀집 · Moemiljip | Casual Marine City noodle lunch; lower-spend meal candidate | New 2026 Bib Gourmand; Korean buckwheat milled in-house. Recognition announced **2026-02-26**, not a live popularity signal. [Michelin announcement](https://guide.michelin.com/vn/en/article/michelin-guide-ceremony/korea-bib-gourmand-2026), [Visit Busan venue](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000202017001000&uc_seq=2768). |
| 송헌집 · Songheonjip | Tteokgalbi meal around Gwangalli / Millak; set-meal occasion | New 2026 Bib Gourmand, with a converted-house setting. Do not infer an available table from guide inclusion. [Michelin venue](https://guide.michelin.com/hk/zh_HK/busan-region/busan_1025838/restaurant/songheonjip), [dated announcement](https://guide.michelin.com/vn/en/article/michelin-guide-ceremony/korea-bib-gourmand-2026). |
| 모모스 로스터리 & 커피바 · Momos Yeongdo | Specialty coffee and a working-roastery visit at the port; café spend | Roasting / brewing experience makes the stop more than a generic café pin. This is **Yeongdo**, not the Oncheonjang / Geumjeong main branch. “Coffee bar” is classified `cafe`, not an alcohol venue. [Visit Busan](https://www.visitbusan.net/index.do?menuCd=DOM_000000202002001000&uc_seq=2158), [operator branch information](https://momos.co.kr/faq). |
| 웨이브온커피 · Waveon Coffee | Gijang sea-view coffee detour; café spend | Sea-facing coffee destination with hand-drip and Wolnae latte. Its northern Gijang location belongs in a **coastal day-trip** group, not a walkable central-Busan route. [Visit Busan](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=174). |
| 사우어 영도 · Sour Yeongdo | Local craft beer and dining overlooking the port; mid-range evening occasion | Current researched target is **8F, Ggti Bongrae**, not the former Songjeong Wild Wave pub or brewery headquarters. [Tourism itinerary with the 8F venue](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000202012001000&uc_seq=1767), [operator location](https://www.wildwavebrew.com/?pageName=sourlocation~service). Operator page is indexed, but direct HTTPS fetching showed a certificate-hostname mismatch during this check; use the tourism source as the safe primary outbound reference until repaired. |
| 파크 하얏트 부산 리빙룸 바 · Living Room Bar | Premium cocktails and Gwangan Bridge views; higher-spend evening occasion | Bar is on the hotel's 31F. **Operator explicitly does not accept bar reservations**: do not attach a real “Reserve Table” claim or reuse the neighbouring restaurant's booking link as a bar booking. [Operator dining directory](https://www.hyatt.com/park-hyatt/en-US/busph-park-hyatt-busan/dining), [operator bar booking restriction](https://www.hyatt.com/park-hyatt/en-US/busph-park-hyatt-busan/dining/living-room). |

## Coordinate and branch audit

Coordinates are source-reported map positions, not hand-placed estimates. Visit Busan positions were extracted from the fetched venue HTML's `findPath_goal_lat/lng` and corroborated by `makeMapObjWithVueObj.default_lat/lng`. Those fields must be checked against the article's address; multi-stop articles can point elsewhere.

| Venue | Latitude, longitude | Exact source / match evidence |
| --- | --- | --- |
| Moemiljip | `35.15664, 129.14696` | [Visit Busan 2768](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000202017001000&uc_seq=2768): 23 Marine City 3-ro, Orange Plaza 2F. A third-party map differed slightly; the official venue map wins. |
| Songheonjip | `35.15654, 129.12146` | [Michelin venue map](https://guide.michelin.com/hk/zh_HK/busan-region/busan_1025838/restaurant/songheonjip): Google location embed's coordinate query, matched to 18 Millak-ro 19beon-gil. Store the public source-page URL, not its embedded API-key URL. |
| Momos Yeongdo | `35.095932, 129.04263` | [Visit Busan 2158](https://www.visitbusan.net/index.do?menuCd=DOM_000000202002001000&uc_seq=2158): 160 Bongnaenaru-ro, Yeongdo. |
| Waveon | `35.32225, 129.26979` | [Visit Busan 174](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=174): 286 Haemaji-ro, Jangan-eup, Gijang. |
| Sour Yeongdo | `35.095074, 129.0427` | **Building position**, not floor-level GPS. [Dedicated tourism page for the same building's 6F coworking tenant](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000201001001000&uc_seq=2139) identifies 46 Daegyo-ro 46beon-gil. [That tenant's own page](https://thehyuil.co.kr/programs/busan-yeongdo/49) independently embeds `35.0951, 129.042673832097`, approximately 4m away. Sour's operator and tourism itinerary locate the bar at the same street address on **8F**. |
| Living Room Bar | `35.156578, 129.14195` | **Hotel building position** from [Visit Busan 2243](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000201001001000&uc_seq=2243); operator separately locates the bar at 51 Marine City 1-ro, 31F. |

Neither `canonical-venues.json` nor `canonical-venues-map.json` (400 records each, checked on this date) contains a matching researched venue name / branch. All six `canonicalVenueId` values are deliberately `null`; do not join by nearest coordinate or assume a differently named nearby restaurant is equivalent. English / Japanese display translations are editorial labels unless reproduced from an operator's named branch; they are not separately claimed official localized business registrations.

## Photos: candidate pages, not granted licenses

All six records use `photo: null`. Finding an official image is not permission to copy, hotlink or redistribute it; no image-specific reuse license was established in this pass. Do not disguise another restaurant's food photograph as any of these venues. A generic licensed cuisine image would need an explicit illustrative-image label and a separate data contract.

| Venue | Candidate page for permission / licensed-media follow-up | Current decision |
| --- | --- | --- |
| Moemiljip | [Official tourism / Michelin-supplied venue photography](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000202017001000&uc_seq=2768) | No explicit reusable grant found; Michelin image credit is not a license. |
| Songheonjip | [Michelin venue gallery](https://guide.michelin.com/hk/zh_HK/busan-region/busan_1025838/restaurant/songheonjip) | Request venue / photographer permission; no automatic reuse. |
| Momos | [Operator library](https://momos.co.kr/article/%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC/19/212533/page/4/), [tourism gallery](https://www.visitbusan.net/index.do?menuCd=DOM_000000202002001000&uc_seq=2158) | Operator library story is dated 2025-10-21; photography still requires rights clearance. |
| Waveon | [Tourism venue gallery](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=174) | No explicit image-specific reuse license found. |
| Sour Yeongdo | [Tourism itinerary gallery](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000202012001000&uc_seq=1767), [operator](https://www.wildwavebrew.com/) | Clear rights and repair / recheck operator link before media ingestion. |
| Living Room Bar | [Hyatt dining gallery](https://www.hyatt.com/park-hyatt/en-US/busph-park-hyatt-busan/dining) | Hotel-owned marketing imagery is not presumed licensed to this app. |

## Adversarial findings and handoff rules

- **Reject historical-branch shortcuts.** Gorilla Brewing Gwangalli had a closure conflict in third-party listings; an old tourism article alone was insufficient to include it. Wild Wave's former Songjeong address was not reused for Sour Yeongdo. These exclusions are evidence-quality decisions, not an official declaration that every historical location is closed.
- **Reject article-wide coordinates.** [Visit Busan's multi-brewery story](https://www.visitbusan.net/index.do?contentsSid=22&lang_cd=ko&uc_seq=486) names Sour, but its map default is in Gwangalli, not Yeongdo. Another multi-workation-centre article also points outside the selected building. Neither became Sour's coordinate source.
- **Separate recommendation and eligibility.** `kind: "bar"` is a content category; it does not certify that an ONDO DID is accepted for admission, purchase, or legal age verification. Keep the hackathon credential flow explicitly simulated until a real venue / verifier integration exists.
- **Keep discovery actions honest.** Details, save, directions and an explicitly local / mock plan are valid. Do not fabricate live seats, reservations, menus, foreign-card support, or English-speaking service from these sources. In particular, Living Room Bar must not imply bookability.
- **Do not turn research into artificial live heat.** Safe labels include “Research pick”, “Tourism pick”, or the specifically evidenced “2026 Bib Gourmand”. Any animated temperature used for these records must remain visibly sample / illustrative data, not a measured visitor pulse.
- **Outstanding before genuine food-photo launch:** image-rights clearance or a separately labelled, licensed illustrative-photo system. This research does not resolve those rights by setting a plausible image URL.

## Validation

Validate the companion array for six unique IDs, Busan bounds, complete EN/KO/JA strings, two bars, source URLs and evidence values, literal research date, and explicit null photo/canonical joins. App schema, map data, application code and deployment are intentionally untouched by this research task.
