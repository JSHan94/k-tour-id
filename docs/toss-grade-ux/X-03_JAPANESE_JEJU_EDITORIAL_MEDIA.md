# X-03 · Japanese, Jeju editorial, place media

상태: `CROSS-FLOW SPEC · PEER-REVIEWED · IMPLEMENTATION READY`

## 1. 목적

일본어 사용자가 서울·부산의 공식 장소와 제주의 editorial place를 같은 탐색
문법으로 이해하게 한다. 콘텐츠 source의 차이는 정직하게 보이되, 제주만 별도 앱이나
홍보 Flow처럼 보이지 않게 한다.

## 2. 세 도시 공통 grammar

서울·부산·제주는 아래 component와 interaction을 공유한다.

```text
Map field
→ city beacon
→ camera focus
→ place marker / cluster
→ place peek
→ place detail
→ save / directions / Table / eligible offer
```

| 요소 | 서울·부산 | 제주 | 공통 불변식 |
|---|---|---|---|
| 도시 beacon | curated-scored | editorial-unscored | 같은 size/hit/selected halo |
| coverage | ONDO heat field | limited editorial coverage field | field/aura/core 순서 동일 |
| place card | official source chip | editorial source chip | media/name/facts/actions 동일 |
| detail | official source drawer | story/source drawer | 같은 sheet geometry |
| score | 선택 뒤 접근 가능 | `score=null` | 제주 count를 score로 변환 금지 |

`Jeju · Explore`, 빈 원형 avatar, dashed promotional card, story count를 도시 CTA에
넣지 않는다.

## 3. Editorial integration

- story의 첫 단위는 article card가 아니라 좌표·장소 연결이 확인된 `place edge`다. 여기서 확인은 장소 품질·현재 영업·인기 확인을 뜻하지 않는다.
- 지도 marker → place peek에서 `이 장소를 소개한 이야기` compact chip을 제공한다.
- place detail의 media 뒤에 story title/source/why-it-matters를 한 section으로 둔다.
- 여러 장소를 잇는 story는 map route/collection으로 열리며 독립 banner flow가 아니다.
- 좌표·장소 match가 검증되지 않은 아이디어는 지도에 pin을 만들지 않는다. 읽기 전용
  collection에서 `장소 확인 중` 상태로만 남긴다.
- editorial source가 있다는 사실은 인기·공식 기록·영업 상태를 뜻하지 않는다.

## 4. Place card

### 공통 구조

1. 88–104px media crop
2. place name — 최대 2줄
3. compact temperature/source state
4. 지금 판단할 fact 최대 3개
5. chevron 또는 전체 card tap

서울·부산의 `official`, 제주의 `editorial`은 같은 위치의 small source glyph+label로
구분한다. border/radius/height를 다르게 만들지 않는다.

### 정보 우선순위

| 항상 표시 | 선택 후 상세 | source drawer |
|---|---|---|
| 장소명, media, 위치, category | 온도 의미, 영업/카드/예약/언어/연령 | source URL, 확인일, record ID, match confidence |

`200 official records`, `10 travel ideas`, `인허가`를 card의 장점처럼 쓰지 않는다.

## 5. Media truth

### source-backed place photo

- 장소와 asset의 source/match뿐 아니라 라이선스·사용 동의·허용 surface·만료가 asset registry에서 확인된 경우만 venue photo로 쓴다.
- crop은 음식·공간의 주 객체를 보존하고 overlay text를 사진 위에 올리지 않는다.
- 같은 viewport 안에서 동일 asset을 인접 card에 반복하지 않는다.
- 원 source가 삭제되거나 권리가 만료되면 cache·thumbnail을 제거하고 같은 크기의 category illustration로 fail closed한다.

### category illustration

- 실제 사진이 없을 때 일관된 illustration set을 사용한다.
- photo-real venue evidence처럼 보이지 않게 frame/texture를 구분한다.
- alt는 `한식 카테고리 이미지`처럼 역할을 말하고 특정 장소를 주장하지 않는다.

### people

- Table invitation, onboarding aspiration, My Korea memory에만 사용한다.
- eKYC, credential result, official place fact, 19+ proof에는 쓰지 않는다.
- 외모로 국적·체류 상태·성인 여부·검증을 암시하지 않는다.
- synthetic asset은 내부 asset registry에 origin과 허용 surface를 남긴다.

### missing media

- 큰 빈 원형 profile 또는 글자 한 자 placeholder를 만들지 않는다.
- compact category pictogram + neutral patterned crop으로 높이를 유지한다.
- alt에는 이미지가 없다는 시스템 상태를 반복하지 않는다.

## 6. Japanese language rules

- 언어 토글은 `日本語` 또는 compact `JA`를 쓰고 같은 route에서 즉시 전환한다.
- 장소명은 공식 원문을 primary로 보존한다. 읽기 지원이 있으면 보조 줄에만 넣는다.
- machine transliteration을 장소의 공식 영문명처럼 주장하지 않는다.
- CTA는 일본어 동사로 끝낸다: `地図で見る`, `保存する`, `参加する`, `確認する`.
- source/story title은 원문의 저자성을 보존하고 번역 여부를 metadata에 기록한다.
- 일본어 본문은 1.55 이하 과밀 line-height를 피하고 Latin all-caps eyebrow를 강제하지
  않는다.
- 일본어 문장 길이 때문에 CTA가 잘리지 않도록 2줄과 grow를 허용한다.

## 7. Source state vocabulary

| 상태 | KO | EN | JA | 시각 표식 |
|---|---|---|---|---|
| official record | 공식 등록 정보 | Official directory | 公的登録情報 | document glyph |
| editorial place match | 에디터가 연결한 장소 | Editorial place match | 編集部による場所照合 | story glyph |
| location pending | 장소 확인 중 | Place pending | 場所を確認中 | hollow glyph |
| stale | 업데이트 확인 필요 | Check update | 更新確認が必要 | clock glyph |
| unknown | 확인되지 않음 | Not confirmed | 未確認 | dash glyph |

이 label은 `맛있음`, `영업 중`, `외국인 친화`, `혼잡`, `안전` 보증이 아니다.

## 8. Motion

- city→place는 모든 도시에서 같은 MapLibre camera duration/easing을 쓴다.
- story place edge는 marker morph가 아니라 기존 place marker에 story glyph가 나타난다.
- media는 skeleton crossfade만 사용하며 layout height가 변하지 않는다.
- image failure는 160–200ms 안에 category illustration로 교체한다.
- reduced motion은 camera jump와 opacity replace를 사용하고 선택 context는 같다.

## 9. Empty·failure

| 상태 | 사용자에게 보이는 것 | recovery |
|---|---|---|
| Jeju editorial 0 | 제주 camera + 일반 map controls + `확인된 이야기가 아직 없어요` | 도시 map 계속 보기 |
| image error | 같은 크기의 category illustration | detail 계속 사용 |
| story source unavailable | place facts 유지 + source row error | 다시 시도/원문 열기 |
| translation missing | source language title + locale badge | 원문 읽기 |
| coordinate pending | collection item, 지도 pin 없음 | story 읽기 |

empty라고 서울·부산 구조와 다른 page를 만들지 않는다.

## 10. Accessibility·responsive

- map marker와 semantic List가 동일한 source state를 accessible name에 포함한다.
- icon만으로 official/editorial을 구분하지 않고 short label을 detail/list에 제공한다.
- image alt는 장소명·card text를 중복 낭독하지 않는다.
- 320/360/390/430에서 media 40%를 넘지 않고 place name과 action hit area를 보존한다.
- 844×390에서는 desktop rail을 강제하지 않고 map/list/detail에 하나의 scroll context만 둔다.
- 200% zoom에서는 horizontal card가 vertical compact card로 바뀔 수 있다.
- KO/EN/JA에서 place name 2줄, source label, CTA가 ellipsis 없이 도달 가능하다.
- marker/card/drawer trigger는 기본 48px, 최소 44×44px이며 keyboard focus와 opener focus return을 지원한다.
- forced colors에서 official/editorial/pending/stale/unknown이 glyph+label+border로 구분되고, reduced motion에서도 같은 place·source context가 유지된다.

## 11. Acceptance criteria

- [ ] 서울·부산·제주가 같은 city beacon, place card, peek, detail을 쓴다.
- [ ] 제주는 `score=null`이며 editorial count를 온도로 변환하지 않는다.
- [ ] story는 검증된 장소 또는 route와 연결되고 독립 광고 banner로만 존재하지 않는다.
- [ ] 지도 pin은 검증 좌표가 있는 place edge에만 생긴다.
- [ ] source-backed photo와 category illustration의 truth가 구분된다.
- [ ] 각 venue photo의 source·match·rights·allowed surface·expiry가 registry에 있고, 불명확/만료 시 category illustration로 fail closed한다.
- [ ] KO/EN/JA 핵심 행동과 error에 번역 누락이 없다.
- [ ] source state는 color 제거·screen reader에서도 구분된다.
- [ ] 세 도시의 empty/failure도 동일 component grammar를 유지한다.
- [ ] 320/360/390/430/844×390, 200% zoom, keyboard, screen reader, forced colors, reduced motion을 통과한다.

## 12. PRD preservation

- `REQ-007`: source-bounded ONDO와 freshness/confidence를 유지한다.
- `REQ-013`: 가기 전 fact는 공통 place detail에서 유지한다.
- `REQ-017`: 서울·부산 공식 기록과 제주 editorial 경계를 보존한다.
- `REQ-018`: KO/EN/JA와 모바일 responsive를 보존한다.
- `REQ-019`, D-14: 세 도시 renderer 통일과 제주 unscored truth를 동시에 지킨다.
