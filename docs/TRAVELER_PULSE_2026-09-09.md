# Traveler pulse · 음식 중심 탐색

2026-09-09 사용자 요청: 지형보다 여행자의 방문·사진·업데이트가 만드는 온도를 강조하고, 장소 peek에 음식 이미지를 추가하며, 서울/부산/제주 식음료·주점 조사 범위를 확장한다.

## 구현 경계

- 2.5D 카메라와 실제 건물 높이 레이어는 유지한다. 건물 대비/불투명도를 낮추고 확대 화면의 온도 field 대비를 높인다.
- 같은 지도 재생 프레임에서 장소별 30분 샘플 방문·사진·업데이트를 산출한다. 지도에는 최대 2개, 서로 떨어진 좌표 고정 이벤트를 표시한다. 움직이는 가짜 사람/개별 동선은 만들지 않는다.
- Sample 라벨, `PREPARED_ILLUSTRATION`, `observedAt=null`을 유지한다. 실제 사용자·실시간 인기·검증된 방문이라고 주장하지 않는다. reduced motion, pause, 숨겨진 탭에서 재생 상태를 존중한다.
- 공식 장소 peek에 음식 예시 이미지와 기존 local-signal 진입점을 연결한다. 기기 내 실제 작성 기록은 샘플 방문 수와 섞지 않는다.
- 기존 소유 AI 음식 이미지는 **Food illustration / 음식 예시 / 料理イメージ**로 표시한다. 해당 매장의 실제 메뉴 사진으로 표시하지 않는다. 로드 실패 시 pictogram으로 대체하며 깨진 이미지가 남지 않는다.

## 병렬 리서치

| 도시 | 추가 | 자료 |
|---|---:|---|
| 서울 | 6 (식사2/카페2/바2) | [근거·좌표·사진 권한](./research/SEOUL_FOOD_PULSE_2026-09-09.md) |
| 부산 | 6 (식사2/카페2/바2) | [근거·좌표·사진 권한](./research/BUSAN_FOOD_PULSE_2026-09-09.md) |
| 제주 | 6 (식사2/카페3/바1) | [근거·좌표·사진 권한](./research/JEJU_FOOD_PULSE_2026-09-09.md) |

18개는 `data/ondo/research/*-food-pulse.json`에 추가한다. 기존 LOCALDATA 400개/curated sample 80개 및 제주 공식 편집 8곳을 변조하지 않는다. 출처는 operator/tourism/award/editorial로 분리하고 확인일·발행일·좌표 근거를 기록한다. 사진 사용권과 기존 official ID 매칭이 검증되지 않아 전부 `photo:null`, `canonicalVenueId:null`이다.

목록의 'Worth a stop'에서 새 장소를 찾고 상세 → 길찾기/지도 이동을 사용할 수 있다. 샘플 지도에도 같은 장소 좌표를 추가한다. After 19는 이 추가 목록에서 명시적인 bar만 고른다. 외부 연동이 없는 예약 가능성·영업중 여부는 만들지 않는다. `review=0`에서도 편집 목록·상세·길찾기는 유지하며 샘플 카운터는 나타나지 않는다.

## 실제 구현할 작업

[DEPLOYMENT_SPEC §9.1](./DEPLOYMENT_SPEC.md#91-traveler-pulse--음식-리서치--2026-09-09-추가-경계): 신호 ingest·VP/정책 검증·집계/감쇠·SSE/WS·권한/동의·사진 검수/보관·리서치 갱신. 현재 외부 provider/실제 방문 피드는 연결하지 않았다.

## 검수·배포

최종 후보의 로컬 production build 기준:

- `pnpm typecheck`: PASS.
- `pnpm test:contracts`: **749/749 PASS**. 신규 10개는 표본 결정성/범위/시간 정규화, 18곳 스키마·좌표·권한, 기존 400/80 기록 보존을 검사한다. 기존 result-count 계약은 추가 편집 결과를 포함하도록 변경하고 After19 bar-only 경계를 추가 검증했다.
- `pnpm build:vercel:ondo-b`: PASS, standalone client boundary/artifact scan PASS.
- `ondo-traveler-food-pulse.spec.ts`: **8/8 PASS**. 390px light/320px dark; 세 도시×sample/review=0, 음식 이미지 실로딩, 새 장소 검색(결과1)/길찾기/지도 이동/목록 복귀, 기존 Local Signal→CX 샘플 취소/성공→동일 장소 복귀, 포인터/키보드/reduced-motion.
- `ondo-thermal-coherence`, `ondo-map-appearance-axes`, `ondo-map-relief-regression`: **7/7 PASS**. 온도 프레임 동기화·경계 반전·Jeju 점 선택, light/dark×After19, 얕은 2.5D 및 실제 건물 레이어 유지.
- 로그: `k-tour-id-app/artifacts/qa/traveler-food-{contracts,build,typecheck,browser,regression}.log`. 이미지: `artifacts/qa/traveler-food-20260909/`.

검사 과정에서 신규 상세의 부족한 여백/닫기 버튼 간섭, research-only 검색의 잘못된 결과0, 새 장소가 누락된 카메라 범위, 자동 갱신의 키보드 포커스 소실을 수정했다. 첫 브라우저 7/8에서 발견한 reduced-motion 포인터 이동 문제는 **좌표를 hover/active transform과 분리**한 뒤 양쪽 motion 모드의 위치 유지·클릭 재검사로 해결했다. 최종 8/8과 7/7은 그 수정 뒤 다시 빌드한 결과다.

iOS Safari 실기기와 실제 provider/방문 피드는 검증 범위 밖이다.

### 공개 프리뷰

- 앱 소스: `e24886a` (`implementation/did-demo-20260908`).
- 공유 URL: [Traveler pulse 프리뷰](https://ondo-of36cqlzz-jaewook-9643s-projects.vercel.app).
- Vercel `dpl_xAfvh5QRRqUCvBA1cfXEirYdkPGU`, target **preview**, **Ready** 확인. 프로젝트 `ondo`, 개인 계정 소유 guard PASS. production alias는 변경하지 않았다.
- 위 URL에서 동일한 신규 production 브라우저 테스트 **8/8 PASS (2.2m)**. CSP 우회·private map hook·실제 provider 응답 주입 없이 실행했다. 로그 `artifacts/qa/traveler-food-public.log`, trace/failure output 경로 `artifacts/qa/traveler-food-public/`.
- 공개 배포에서도 3개 도시×sample/review=0, light/dark, 같은 장소의 DID 샘플 복귀, 이미지 로딩과 지도 이벤트의 포인터/키보드 동작을 재확인했다. 로컬 preview 서버는 검수 후 종료했다.
