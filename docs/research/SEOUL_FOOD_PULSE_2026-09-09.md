# Seoul food discovery candidates — 2026-09-09

Six map-ready editorial candidates: two bars, two casual meals, two cafés. These are researched places, **not live visitor activity, measured ONDO temperature, availability, reservations, or partner integrations**. The two bars belong in adult/nightlife discovery; this dataset does not grant age verification or venue admission. No source review counts, queue estimates, opening-hours guesses, or synthetic popularity scores were imported.

Data: [`seoul-food-pulse.json`](../../k-tour-id-app/data/ondo/research/seoul-food-pulse.json). Checked on 2026-09-09. `publishedAt: null` means that no publication date was confirmed; the check date must never become a publication date. Japanese names/signatures are editorial display translations, not claimed official registered names.

## Selection and timely evidence

| Place | Discovery role | Verified reason to feature | Primary evidence |
| --- | --- | --- | --- |
| Zest · 강남구 | Korean-ingredient cocktails | No. 2, Asia’s 50 Best Bars **2026** | [Award announcement, 2026-07-28](https://www.the50.com/stories/News/asias-50-best-bars-2026-the-list-revealed.html) |
| Bar Cham · 종로구 | Hanok / Korean spirits | No. 33 in the same **2026** list | [Award announcement, 2026-07-28](https://www.the50.com/stories/News/asias-50-best-bars-2026-the-list-revealed.html) |
| Gosari Express · 중구 | Vegan market-lane noodles | New 2026 Bib Gourmand; distinct from luxury tasting menus | [Michelin announcement, 2026-02-26](https://guide.michelin.com/vn/en/article/michelin-guide-ceremony/korea-bib-gourmand-2026), [operator](https://www.badcarrotgroup.com/kr) |
| 3rd Samgyetang · 서초구 | Korean comfort food | New 2026 Bib Gourmand, with pine-nut samgyetang | [Michelin announcement, 2026-02-26](https://guide.michelin.com/vn/en/article/michelin-guide-ceremony/korea-bib-gourmand-2026), [venue guide](https://guide.michelin.com/en/seoul-capital-area/kr-seoul/restaurant/3rd-samgyetang) |
| Onion Anguk · 종로구 | Palace walk + bakery | Tourism-listed hanok café; a route anchor, **not a newly trending claim** | [Korea Tourism Organization venue page](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=191156), publication date unconfirmed |
| London Bagel Museum Dosan · 강남구 | Bagel / café stop | Seoul Tourism page explicitly edited **2026-05-29** | [Visit Seoul](https://english.visitseoul.net/restaurants/LondonBagelMuseumDosan/ENPxyqzye), first published 2023-06-28 |

The 50 Best legacy `/bars/asia/list` search result still showed the **2025** ordering during this check. The dated **2026** announcement is the ranking authority; notably, Bar Cham is 33 in 2026, not its 2025 rank of 6. Some direct 50 Best page requests redirected to maintenance, while the discovery HTML and the dated announcement remained retrievable. Michelin region/language routes also returned inconsistent bot-check responses; the readable official venue pages and their location links were used, not unverified third-party summaries.

## Coordinate and identity audit

Coordinates are rounded to five decimal places from the source values below. That formatting is not a claim of entrance-level surveying accuracy. Confirm the address with the operator before routing a user to a particular entrance. For 50 Best, **the map camera centre was not used**: the Google map embedded by the publisher supplies a separate, named place coordinate.

| Place | Raw source latitude, longitude | Evidence extraction |
| --- | --- | --- |
| Zest | `37.5252611, 127.040778` | [50 Best Discovery](https://www.theworlds50best.com/discovery/Establishments/South-Korea/Seoul/Zest.html), embedded map named `ZEST SEOUL`, place ID `0x357ca5f1fb7ae3f5:0x4c36d81e0c9621e5`. Its iframe URL’s `127.03858275177394` is a camera centre and was explicitly rejected. |
| Bar Cham | `37.5791709, 126.9703851` | [50 Best Discovery](https://www.theworlds50best.com/discovery/Establishments/South-Korea/Seoul/Bar-Cham.html), embedded map named `Bar Cham`, place ID `0x357ca3dfc3a164c5:0x8e54ebaac81ccd4b`. |
| Gosari Express | `37.5662600, 127.0200100` | [Michelin Korean venue page](https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurant/gosari-express), “Location … on the map” link’s `q` coordinate. Address also agrees with the operator’s legal footer. |
| 3rd Samgyetang | `37.4913500, 127.0115500` | [Michelin venue page](https://guide.michelin.com/en/seoul-capital-area/kr-seoul/restaurant/3rd-samgyetang), location link’s `q` coordinate. |
| Onion Anguk | `37.5775179548045, 126.986675890193` | [KTO venue page](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=191156), JSON-LD `latitude` / `longitude`, also page map variables `lat` / `lot`. Specific branch: 계동길 5, not Seongsu. |
| London Bagel Museum Dosan | `37.5260808495833, 127.036439070226` | [Visit Seoul venue page](https://english.visitseoul.net/restaurants/LondonBagelMuseumDosan/ENPxyqzye), venue `data-map-y` / `data-map-x` and `f_open_route_map`. Specific branch: 언주로168길 33, not Anguk. |

Checked `k-tour-id-app/data/ondo-venues/canonical-venues-map.json` using Korean/English name variants (`제스트/Zest`, `바 참/Bar Cham`, `고사리/Gosari`, `삼계장인/3rd Samgyetang`, `어니언/Onion`, `런던베이글/London`). **No canonical matches** were found. All six therefore have `canonicalVenueId: null`; research records do not impersonate local-government IDs, license status, or existing verified map records.

Zest sources have inconsistent floor notation (an older discovery string says B1; the named embedded place says 1F). The JSON intentionally records the agreed street/building address only. An initially considered Myeongdong Kyoja candidate was excluded because a move was reported in newer secondary information while the Michelin page still exposed an older address; resolving that was unnecessary for a reliable six-place set.

## Food-photo candidates and rights

All six `photo` fields are **null**. A public image URL, an operator credit, or a tourism/award listing does not itself grant image reuse. No food image has been downloaded or hotlinked into the app by this research task.

| Place | Best candidate page to obtain permission / original asset | Current decision |
| --- | --- | --- |
| Zest | [50 Best Discovery gallery](https://www.theworlds50best.com/discovery/Establishments/South-Korea/Seoul/Zest.html) / operator `@zest.seoul` | No explicit reusable license verified. |
| Bar Cham | [50 Best Discovery gallery](https://www.theworlds50best.com/discovery/Establishments/South-Korea/Seoul/Bar-Cham.html) / operator `@bar.cham` | No explicit reusable license verified. |
| Gosari Express | [Operator](https://www.badcarrotgroup.com/kr), [Michelin food gallery](https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurant/gosari-express) | Michelin reserves rights; seek operator permission for food originals. |
| 3rd Samgyetang | [Michelin dish gallery](https://guide.michelin.com/en/seoul-capital-area/kr-seoul/restaurant/3rd-samgyetang) | Michelin reserves rights; no reuse grant confirmed. |
| Onion Anguk | [KTO venue gallery](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=191156) | Page footer reserves rights; no item-specific open license confirmed. |
| London Bagel Museum Dosan | [Visit Seoul bagel gallery](https://english.visitseoul.net/restaurants/LondonBagelMuseumDosan/ENPxyqzye) | No item-specific open license confirmed. |

A [KTO generic samgyetang studio photo](https://korean1.visitkorea.or.kr/enu/nphotogallery/photo.kto?func_name=photo_view&newphotoDTO.photo_code=2620016201306005m&newphotoDTO.searchWord=&newphotoDTO.sub_menu=plan&newphotoDTO.sub_menu_detail=29877) has an explicit Korea Open Government License Type 1 label, but it depicts a 2013 studio dish, **not 3rd Samgyetang’s food**. It was not assigned to that venue. If later used as a clearly marked category illustration, verify/download the original through PHOTO KOREA and retain its required attribution.

## UI hand-off

Use these records as “Food picks / 취향별 발견” cards and real-location map pins. A researched-place preview can show dish, neighbourhood, and the short localized reason. It must not display made-up live crowds, current wait time, open-now state, guaranteed menu stock, or verified benefits. Any animated activity overlay remains an independently labelled sample; research selection and real-time heat evidence are different concepts. Editorial selection must not unlock DID/19+ or booking flows by itself.
