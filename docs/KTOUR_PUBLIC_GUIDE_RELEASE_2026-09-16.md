# 공개 가이드 · 선택적 패스 저장

2026-09-16 · `feat/ktour-public-guide-20260916`, 시작점 `b7bdba0`, 앱 source `9980472`. 상태: **구현·독립 검수·운영 배포·main/Harvey 동기화 완료**. 이전 배포 결과는 이번 검수로 계산하지 않는다.

## 바뀐 여정

**지도 → 로바 전체 상세 → 골목 가이드 무료 읽기.** 읽기에는 로그인·신원 확인·패스가 필요 없고 저장 기록도 만들지 않는다.

**선택: 내 패스에 담기 → 필요한 신원/패스·제시 동의 → 저장 범위 승인 → 저장 결과.** 확인을 취소하면 무료 가이드로 돌아온다. 저장이 거절되거나 저장소가 막혀도 내용은 계속 읽을 수 있다. 담은 가이드는 여행 패스의 ‘저장한 가이드’에서 다시 읽을 수 있다.

계정·Person·패스 발급/수령·VP·실행 승인과 실제 저장·감사 기록은 별개다. 무료 읽기를 유료/제한된 콘텐츠처럼 표현하지 않는다. 새 `save-neighborhood-guide-to-pass` 동의는 이전 v1 열람 동의를 재사용하지 않는다. 기존 데이터는 삭제·변환하지 않고 새 v2 캠페인 키로 분리한다.

## 독립 검토와 수정

- A: PRD·권한 경계 검토 후 모델/계약 구현. 무료 열람의 저장소 접근, 이전 승인 재사용, 두 탭 중복을 반례로 제시했다. UI를 작성하지 않은 상태에서 공개 흐름 검수를 맡는다.
- C: 사용자 흐름·문구 반론 후 3개 언어 문구 정리. 패스 재열기 진입점, 출처별 복귀 문구·포커스, 저장소 삭제/미지원 문제를 지적했다. UI 구현은 맡지 않는다.
- B: 실제 연동 명세·sitemap 동기화. 코드와 연결점을 대조하고 네 기술의 개발 범위를 유지한다.
- 조정자: 위 반론 합의 후 공개 reader와 저장 작업을 분리하고 패스 컬렉션을 연결했다. 공용 빌드·배포를 단독 수행하며 브라우저는 동시 최대2개다.

## 검수 및 배포

아래는 새 소스의 계약·빌드·브라우저·운영 결과다. 최초 계약 검수에서 신규 파일의 배포 allowlist 누락과 내부 저장소 이름의 UI 문자열 검사 오탐, 문서 필수 복귀 문구 누락을 발견했다. 신규 파일을 배포 목록에 포함하고 저장소 동작을 store 모듈에 모았으며 앱 복귀 요구를 문서에 유지했다. 실패 결과를 최종 PASS로 합산하지 않는다.

- 최종 소스 계약 **911/911 PASS**(6.84초), skipped/flaky0. typecheck·production build·artifact scan PASS.
- 최종 로컬 artifact `page-57198da7230c9ebc.js`: HTTP root200, 공개30·차단41·build19·legacy308·discovery7 PASS.
- 같은 artifact의 독립 시각/회귀 **7/7 PASS**(43.0초): 새 공개/저장 JA320×480·dark·키보드2, 기존 장소/온도4, 충전 맥락1. 1worker/retries0. reduced-motion 실제 적용과 캡처5장을 직접 확인했다.
- 같은 artifact의 비작성자 저장/공개 검수 **13/13 PASS**(168.17초): 기존 저장8 + 신규 읽기5. 공개 읽기의 IDB.open 0, v1 이력/marker 보존, 저장소 차단, 취소 후 읽기, 실제 저장→패스 재열람·동일 행 focus/viewport·기록 불변을 포함한다. 1worker/retries0, skip/flaky/pageerror0. 위7개와 겹치지 않아 최종 로컬 고유20개다.
- 초기 신규 공개 테스트는 기존 버튼의 접근성 이름을 `Close`로 잘못 찾은 하네스 1건을 `Close place`로 수정했다. 앱 성공 상태나 권한을 주입하는 우회는 하지 않는다. 초기 시각 테스트의 설정은 `emulateMedia` + `matchMedia` assertion으로 고쳐 최종 실행했다. 이전 시각 PASS를 reduced-motion 검수로 재사용하지 않는다.
- 비작성자가 저장소 오류에서 남는 로더를 발견해 중립 아이콘으로 수정했다. 위 최종 artifact는 이 보정 이후이며 이전 `0bb9736b82c34586`의 검사 수를 합산하지 않는다.

원격 Preview: source `99804728133245baef441c47df1a2643c3e28690`, [고유 URL](https://ondo-kybuyzuj1-jaewook-9643s-projects.vercel.app), `dpl_2KWK9RPXy9ZpKXSHun1LeCpejDwN`, Ready. 환경별 실제 chunk는 `page-013afb3dd9bba0e0.js`이며 로컬과 혼동하지 않는다. HTTP 공개30·차단41·build19·root200·legacy308·discovery7 PASS. 비작성자 공개5+시각2 **7/7 PASS**(55.7초), 1worker/retries0, pageerror·금지 요청0, 캡처3장 직접 확인. 이후 main/Harvey를 같은 source로 atomic fast-forward했다. force push나 다른 개발자의 변경 덮어쓰기는 없다.

운영: [대표 주소](https://ktour-id.vercel.app) · [고유 Production](https://ondo-dxilo68xo-jaewook-9643s-projects.vercel.app), `dpl_EPhXrY7zDf5pgPk5CBUUWXiPYwPy`, 같은 source `9980472`, Ready·대표 alias 확인. 실제 chunk는 `page-013afb3dd9bba0e0.js`다.

- 운영 HTTP 공개30·차단41·build19·root200·legacy308·discovery7 PASS.
- 대표 주소에서 비작성자 공개5+기존 저장8 **13/13 PASS**(163.93초), 모바일 Chromium1worker/retries0, skip/flaky/pageerror·금지 요청0.
- 같은 주소의 시각2+브랜드5 **7/7 PASS**(20.50초), 모바일 Chromium1worker/retries0. 운영 JA320 가이드/저장 컬렉션 캡처2장을 직접 확인했다. 운영 고유20개이며 로컬20·Preview7과 합산하지 않는다.
- 최종 문서 반론에서 옛 혜택/redeem 용어와 v2 저장의 우선순위, 이미 구현된 UI를 신규 개발하라는 낡은 지시를 수정했다. 실제 사용자별 컬렉션 조회/소유권 검증 책임도 명시했다. 기능 범위나 네 기술의 실제 연동 의무는 축소하지 않았다.
- 최종 인계 정합 계약 **9/9 PASS**. 수정 Markdown11개·상대 링크145개 누락0, diff whitespace 검사 PASS. 문서 검사를 사용자 여정 수로 합산하지 않는다.

증거는 `k-tour-id-app/artifacts/qa/public-guide-final13`, `public-guide-final-57198da-visual-regression`, `public-guide-preview-9980472`, `public-guide-production13`, `public-guide-production-visual` 및 `/tmp/ktour-public-guide-*.json`에 있다. 이 ignored 경로는 공개 GitHub 첨부가 아니다. 결과 문서만 바꾼 후속 커밋은 앱 검수 source와 구분하며 최종 브랜치 HEAD는 GitHub에서 확인한다.

## 개발자 연결점과 한계

[짧은 인계](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) → [공개 읽기/저장 계약](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md) → [전체 명세](./DEPLOYMENT_SPEC.md). [sitemap](./ux-refinement/2026-09-15/sitemap-code.md)도 같은 저장 동작을 가리킨다.

실제 CX·OpenDID·Sui·OmniOne Chain은 Harvey가 연결할 개발 대상이다. 저장 결과는 이 브라우저의 공유 샘플 사용자 컬렉션이며 서명 VC·실제 개인 소유권·상점 혜택·방문 증거가 아니다. 금융·예약·Sumsub 실험을 새로 연결하지 않았다. 실기기·실제 외부 앱 왕복은 이번 브라우저 검수와 구분한다.
