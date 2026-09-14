# Jeju food pulse: verified research candidates

Checked: 2026-09-09. Scope: six real food, café, and bar destinations for the illustrative ONDO map. This is a source-backed selection, **not a current popularity ranking, live footfall feed, verified opening status, or reservation inventory**.

Machine-readable handoff: `k-tour-id-app/data/ondo/research/jeju-food-pulse.json`.

## Selection and coordinate audit

Every coordinate below was copied from the named venue's official VisitJeju profile, alongside its address. No address geocoding, map-center guessing, attraction coordinates, or arbitrary map spreading was used. Coordinate precision is preserved as published; it is not a claim of survey accuracy.

| Research ID suffix | Place / kind | Latitude, longitude | Evidence and selection basis |
| --- | --- | --- | --- |
| `woojin-haejangguk` | 우진해장국 / food | 33.5114884, 126.5200864 | Official tourism profile introduces Jeju bracken-and-pork soup in the old town. [Venue and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000018375). |
| `gozip-dolwurock-jungmun` | 고집돌우럭 중문점 / food | 33.25799, 126.41676 | Regional fish meal near Jungmun; the operator separately confirms its Jungmun branch. [Tourism profile and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000021950), [operator](https://www.gozipfish.com/). |
| `azulejo` | 아줄레주 / café | 33.3668229, 126.8391408 | Egg tarts, fruit drinks, and a tile-decorated setting in Seongsan. [Venue and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000008044), [official English name](https://www.visitjeju.net/en/detail/view?contentsid=CNTS_200000000008044). |
| `moasi` | 모아시 / café | 33.2708619, 126.1989831 | Official tourism recommendation for coffee, concrete architecture, and a water courtyard in western Jeju. [Venue and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_300000000013818). |
| `delmoondo-hamdeok` | 델문도 함덕 / café | 33.54379, 126.668846 | Seafront café with a separately described evening pub. A tourism feature explicitly dated 2025-08-29 recommends it and reports its inclusion in the Blue Ribbon/Samsung Life café selection. This is **tourism-reported recognition**, not independently verified award-provider status. [Venue and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000001501), [dated recommendation](https://visitjeju.net/kr/themtour/view?contentsid=CNTS_300000000013659&menuId=DOM_000002000000000221), [operator](https://www.delmoondo.com/). |
| `magpie-tapdong` | 맥파이 탑동점 / bar | 33.5183337, 126.5224034 | Official tourism profile identifies a craft-beer pub; operator confirms Tapdong at the same street address. This is **not** the out-of-town brewery. [Venue and coordinates](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000012588), [operator location list](https://www.magpiebrewing.com/). |

All six IDs have the `research-jeju-` prefix. The assortment is two food venues, three cafés, and one explicit bar. It deliberately covers a western coffee stop, southern meal, eastern café, Hamdeok coast, and the old town; this is editorial diversity, not measured regional demand.

## Freshness and limits

- `checkedAt` records this research check, not a venue visit, live availability check, or original publication date.
- `publishedAt` is null when the page does not clearly label an article publication date. Several profiles expose old raw CMS timestamps; these were not relabeled as current recommendations. Moasi's profile exposes `20251002104059`, but without an explicit publication label it also remains null.
- The Delmoondo article explicitly identifies 2025-08-29 as its information date and warns that details may change. That is the one dated recommendation in this selection. [Dated article and notice](https://visitjeju.net/kr/themtour/view?contentsid=CNTS_300000000013659&menuId=DOM_000002000000000221).
- Magpie's operator homepage lists the Tapdong branch independently of the brewery, which helps disambiguate two separate destinations. Do not use the homepage's shared map-link target as Tapdong coordinates; the tourism profile supplies the branch-specific pair. [Operator](https://www.magpiebrewing.com/), [Tapdong profile](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000012588).
- No current waiting time, crowd number, payment-card support, English-speaking staff, booking availability, or 2026 award was inferred. User reviews and the tourism site's weather/congestion widgets are not ranking inputs.
- English and Japanese display strings are concise editorial translations/transliterations, not verified registered trade names in those languages, except where the official English Azulejo page confirms the spelling.

## Duplicate and integration check

Checked `JEJU_EDITORIAL_SEEDS` and derived `JEJU_EDITORIAL_PLACES` in `features/ondo/pulse-b/japan-first-pulse-model-b.ts`. Existing seeds include 성산일출봉, 광치기해변, 관음사, 돈사돈, 오는정김밥, TaMuRa, 소길별하, 해녀의부엌 북촌점, 동문재래시장, and 서귀포매일올레시장. **None of these six candidates duplicates those names, addresses, or IDs.** `canonicalVenueId` remains null throughout; integration must perform its own final canonical-catalog reconciliation.

The new candidates are food/drink businesses, not replacements or invented food classifications for existing tourist attractions. Keep source-backed business metadata separate from fabricated, explicitly labeled demo activity. Do not turn a research candidate into a scored official record merely because it appears on the heatmap.

After19 handling: Magpie is the clear bar candidate. Delmoondo remains a daytime `cafe` in this schema; its Beachwave pub is a separate operating context at the venue, not evidence that every café belongs in the adult/night filter. The tourism profile states an ID requirement for that pub. Any mock eligibility flow must preserve the café-versus-pub distinction and must not imply the app's DID is already accepted by the operator. [Delmoondo venue details](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000001501).

## Image rights and candidates

All six `photo` values are **null**. No explicit reusable license was established for a specific venue photo, and nothing was downloaded, hotlinked into the app, or represented as licensed. VisitJeju's dated feature expressly reserves rights and prohibits unauthorized reuse; its gallery accessibility does not constitute permission. [Rights notice](https://visitjeju.net/kr/themtour/view?contentsid=CNTS_300000000013659&menuId=DOM_000002000000000221).

For a later licensed-photo pass, the official venue-profile galleries linked in the table are source candidates only. Request reuse permission for the particular image and record photographer, license, and license URL before setting `photo`:

- Woojin: soup/restaurant gallery on its VisitJeju profile.
- Gozip Jungmun: meal/interior gallery on its VisitJeju profile; the operator site additionally credits a professional photographer, so a visible image is not assumed reusable.
- Azulejo: café/egg-tart gallery on its VisitJeju profile.
- Moasi: concrete courtyard gallery on its VisitJeju profile.
- Delmoondo: Hamdeok waterfront gallery on its VisitJeju profile, not the separate Gimnyeong branch imagery.
- Magpie: Tapdong interior/food gallery on its VisitJeju profile, not brewery exterior imagery.

Until rights are cleared, use truthful code-native styling or a clearly generic visual treatment rather than an unlicensed or falsely venue-specific photograph.
