# UX-08 독립 시각 검수 · 5712aed

**한정 PASS.** 2026-09-15, 로컬 production artifact `page-7c7e5c4f3603217e.js`에서 실행했다. 앱 소스 `5712aed`, Chromium 1 context/page, JA/dark/reduced-motion, 320×568 → 320×480, DPR1이다. 실제 기기나 원격 운영 검수는 아니다.

## 직접 확인한 것

- 공개 Roba 상세 URL → 기존 전체 상세의 체험 행 → fresh guest account/Person → 같은 Person 결과를 재사용한 별도 패스 생성·보관 동의 → holder 준비/수령 → `personVerified` 목적별 VP → 제안 → 승인 → 실제 가이드 3개 → 원 장소.
- 언어·테마·기존 onboarding 완료 환경만 설정했다. account/credential/financial grant를 주입하지 않았다. sample 동의 흐름을 실제 provider 완료로 표현하지 않는다.
- 제안 동의는 Tab→Space, 승인 버튼은 Tab→Enter로 실행했다. 이 구간의 포커스가 dialog 안에 있고 inert 요소로 가지 않음을 확인했다. 전체 여정을 키보드만으로 탐색한 검수는 아니다.
- 480px 높이에서 승인/복귀 footer는 각각 266×52px, 화면 안에 표시되고 중심 hit 검사 통과. 세 guide article의 폭은 약216px이고 본문 가로 overflow가 없었다. 캡처 8장을 직접 열어 번호·본문 줄바꿈·버튼·키보드 focus ring을 확인했다.
- 화면을 568→480으로 줄인 뒤 복귀: 정확한 Roba, 체험 target의 가시성·hit·focus 모두 PASS. target은 `x21/y396.19/278×82.75`, 실제 scrollowner∩viewport는 `y97.41–479`다. 문서/본문 가로폭은320px다.
- page error0, request failure0, provider/외부 mutation 요청0. 브라우저를 닫은 뒤 결과를 저장했다.

## 반례와 수정 범위

이전 `page-0a579e8a35166cb4.js`에서는 같은 높이 변경 후 DOM focus는 돌아와도 체험 행이 fold 밖에 남았다. snapshot scroll 복원 후 `preventScroll` focus만 하던 동작이었다. 최종 소스는 **experience 복귀에만**, 기존 snapshot을 먼저 복원하고 target이 보이는 scrollowner/viewport 밖일 때 `nearest`로 최소 보정한다. 이미 보이는 대상이나 다른 서비스의 복귀 정책을 이 수정으로 바꾸지 않는다. 위 실제 재검수에서 해당 반례는 해소됐다.

## 공개 가능한 대표 캡처

[320px JA/dark 키보드 승인](./experience-ja320-keyboard-5712aed.png) · [화면 높이 변경 후 같은 장소·체험 행 복귀](./experience-ja320-return-5712aed.png)

두 이미지는 CSS-scale의 수정하지 않은 브라우저 캡처이며 샘플 UI·공개 매장 정보만 포함한다. 실제 사용자 식별자료·문서·토큰·provider 결과가 없다. 전체 로컬 기록은 `k-tour-id-app/artifacts/qa/experience-visual-review/final-7c7e5c4f3603217e/`이고 이전 반례는 상위 폴더에 보존한다. ignored artifact를 GitHub 공개 링크로 쓰지 않는다.

계약 수, 다른 언어/화면/실패 조합, 원격 Preview/Production 및 main/Harvey 반영 여부는 [새 릴리스 기록](../../../KTOUR_EXPERIENCE_RELEASE_2026-09-15.md)을 따른다. 이 검수는 한 대표 여정이며 모든 상태·물리 iPhone/Android·실제 CX/OpenDID/Sui/AI/OmniOne 연동 완료의 증거가 아니다.
