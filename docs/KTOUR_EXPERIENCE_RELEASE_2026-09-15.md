# K-Tour ID · 한국 여행 공유 이미지 + 골목 가이드 체험

상태: **Ready — 운영 배포·지정 여정 검수·main/Harvey 동기화 완료**. 앱 검수 source `5712aede4cba3549dc15b1565f1f05257e1c1bd0`, 작업 브랜치 `feat/ktour-experience-share-20260915`, 기존 기준선 `5f16c38`.

## 이번 변경

1. 공유 썸네일을 한옥 골목·한국 음식·카페·약과가 보이는 `og-ktour-korea-v3.png`로 교체한다. 흑백 K-Tour ID 로고·대표 주소는 유지한다. [아트워크·최종 프롬프트](../k-tour-id-app/docs/branding/KTOUR_KOREA_SHARE_2026-09-15.md).
2. **서울 → 로바 상세 → 골목 가이드 체험 → 필요한 신원 확인·패스 제시 → 범위 승인 → 처리 → 가이드 열기 → 같은 장소 복귀**를 독립된 비금전 목업으로 연결한다. 지도 첫 진입이나 미리보기 버튼을 늘리지 않는다. 같은 행동에서 방금 승인한 Person 결과를 재사용하되 패스 생성·보관과 VP 동의는 별도로 받는다.
3. 승인/실행, 서비스 사용, 감사 기록을 분리한다. 취소·만료·결과 대기·사용 차단·기록 재시도를 같은 작업에서 다룬다. 결제·충전·예약·방문 횟수에는 영향을 주지 않는다.

체험 결과는 디지털 가이드 콘텐츠다. 실제 매장의 제공 의무가 있는 무료 상품·할인권이 아니다. 현재 Person 확인만 필요하며 요청하지 않은 국적·체류·성인·결제 조건은 판단하지 않는다. 새 단축 경로의 패스도 Person만 담고, 일반 갱신으로 성인·체류·결제·혜택 권한이 늘지 않는다. 다른 목적의 추가 확인은 기존의 명시적 동의·발급 흐름으로 연결한다. 체험 중 화면 높이가 바뀌어도 복귀 버튼이 보이도록 체험 행에만 최소 스크롤 보정을 적용한다.

## 개발 인계

[체험 화면·상태·연결점](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md) → [짧은 해커톤 인계](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) → [실제 Sui 필수 계약](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md). CX/OpenDID/AI/Sui/OmniOne Chain 호출은 여전히 개발자 구현 대상이며 이번 추가는 로컬 목업이다. Sumsub Sandbox는 별도 브랜치 그대로다.

## 이번 소스 검수

- 공유 이미지 1200×630 시각 검토: 루트 + 독립 검토자 승인. 새 이미지 metadata/brand 계약 9/9 PASS.
- 최종 `page-7c7e5c4f3603217e.js` artifact: typecheck, 전체 계약 **893/893**(10.5초, workers2, 실패/skip/flaky0), production build·artifact scan PASS. 이 중 신규 체험 계약은 31개이며 별도 합산하지 않는다.
- 신규 체험 모바일 **8/8**(1.9분, workers1, retries0): fresh guest 전체 흐름, 기록 대기·실패 복구, 최종 자격 거절, unknown/중단, 저장 차단, 두 탭 동시 승인, 제한 패스→별도 동의 후 추가 확인. 외부 provider/비GET 요청·페이지 오류0. 실행과 사용은 각각1회이며 결제·충전·방문 기록 변경0.
- 기존 UX/브랜드 모바일·데스크톱 **24/24**(96.6초, workers1, retries0), 지도–월렛 모바일 **7/7**(67.3초, workers1, retries0). 모두 실패·skip·flaky0. 각 suite의 실제 화면 범위만 의미한다.
- 독립 320px JA/dark 시각·키보드: 568→480 높이 변경, Tab/Space/Enter 승인, 52px footer, 가이드 본문, 복귀 버튼의 가시성·hit·focus PASS. [검수 요약·대표 캡처](./ux-refinement/2026-09-15/evidence/experience-visual-review-5712aed.md). 선호 설정만 주입했으며 자격/잔액 fixture는 주입하지 않았다. 브라우저 오류·provider 요청0.
- 로컬 HTTP: 공개29·차단41·build assets19, root200·legacy308·discovery7 PASS. 새 OG PNG는1200×630이며 SHA256 `b073a12b3f5ee0bb2e80f0b759b8a75a13d02946a6d844b8b0a89a540d1f33c1`.
- Git Preview `dpl_8anxp7yz8pgNXMnGmdJk3nMwDMGb` · [고유 URL](https://ondo-8egc96uut-jaewook-9643s-projects.vercel.app), Ready, 로그의 branch/source `feat/ktour-experience-share-20260915 / 5712aed`. HTTP 공개29·차단41·build assets19, 모바일 public guest 전체 체험+브랜드 **6/6**(34.1초, workers1, retries0) PASS.
- Production `dpl_87smepbXSj8DRwm8nveLJ9SuQRbS` · [고유 URL](https://ondo-ixgksyq9e-jaewook-9643s-projects.vercel.app), Ready, Git 로그 `main / 5712aed`, 대표 alias [ktour-id.vercel.app](https://ktour-id.vercel.app) 확인. 대표 주소 HTTP 공개29·차단41·build assets19, 모바일 public guest 전체 체험+브랜드 **6/6**(52.2초, workers1, retries0) PASS. Preview 결과와 합산하지 않는다.
- 원격 main/Harvey를 `5712aed`에서 동일 확인했고 atomic fast-forward했다. 이후 결과 문서·대표 캡처·테스트 하네스 후속 커밋도 같은 두 브랜치에 반영하며, 앱 배포 입력은 검수 source와 동일한지 확인한다. 자기 자신의 문서 커밋 SHA를 반복 수정하지 않는다.

중간 검수 이력: 직전 `page-0a579e8a35166cb4.js`에서 기존 UX/브랜드 mobile·desktop 24/24와 신규 체험 앞 6개를 확인했다. 두 탭 동시 클릭 테스트는 정상 완료된 버튼을 자동 재클릭하며 기다리는 하네스 경쟁을 발견해 단발 클릭으로 수정했다. 추가 확인 테스트 역시 holder 종료 애니메이션 중 재클릭을 없애고 단계별 수령 확인을 명시했다. 기존 map-wallet 검사는 제거된 환불 선택자와 top-up 목적의 오래된 기대를 최신 UX에 맞췄다. 320px 시각 검사에서는 높이 변경 뒤 복귀 focus가 fold 밖에 남는 실제 UX 문제를 찾아 최종 artifact에서 보정했다. 이후 전체 해당 suite를 다시 실행했으며 중간 결과를 최종 PASS 수에 합산하지 않는다.

기존 `505e475` 기능 검수와 `5f16c38` 문서/테스트 후속 배포 수치를 이번 소스의 결과로 합산하지 않는다. 전체 실제 기기·외부 provider 검수나 해커톤 접수/수상을 보장하는 기록이 아니다.
