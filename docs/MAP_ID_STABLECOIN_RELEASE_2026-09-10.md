# ONDO · 지도 정리 / ID / 스테이블코인 목업

## 반영 범위

- 모바일 도시 지도: 도시명·검색·뒤로가기·데모·언어를 56px 카드로 통합. 카테고리와 취향 설정은 두 번째 행, 지도 도구는 그 아래에 둔다. 검색 입력은 항상 편집 가능하며 16px 글꼴·44px 터치 영역을 유지한다. 작은 화면에서도 `19+` 표기를 숨기지 않는다.
- 전국 진입: 기존 지도·도시 좌표·진입 동작을 유지하면서 도시별 온도빛을 7.8초 간격으로 순환한다. 일시정지, 시스템 움직임 줄이기, 비활성 탭·화면 밖·도시 이동 시 정지. 다크 테마 연결선의 과도한 검은 밑선을 완화한다. 실시간 활동 데이터나 새로운 방문 수를 만들어내지 않는다.
- K-Tour ID: 검은색/흰색 단순 경로 마크, 다크 테마 안내문 대비, Mobile ID·Residence Card의 동의→샘플 응답→여행 패스 흐름을 정리한다. 실제 인증/외부 앱 실행을 흉내 내는 성공 주장은 하지 않는다.
- Wallet: 사용자가 선택하는 스테이블코인 분기에 USDC/USDT·sample Sui signer·견적·승인·출발 확인·도착 확인·샘플 잔액·영수증을 연결한다. 출발 확인만으로 충전하지 않고 도착 결과를 같은 operation으로 한 번만 반영한다. 세부 인계는 [스테이블코인 감사](./STABLECOIN_FUNDING_AUDIT_2026-09-09.md)와 [Deployment Spec](./DEPLOYMENT_SPEC.md)의 G09-S를 따른다.

## 검수 기록

- 계약 검사: **771/771 PASS**, `artifacts/qa/identity-stablecoin-map-contracts.log`.
- 타입 검사 및 standalone production build/client scan 통과. `artifacts/qa/identity-stablecoin-map-{typecheck,build}.log`.
- 통합 브라우저: **35/35 PASS (1.7분)**. 도시 상단 3, 전국 움직임 1, appearance×After19 2, Before you go 8, 기존 funding 7, ID 4, 스테이블코인 10. `artifacts/qa/identity-stablecoin-map-browser.log`. 마지막 320px 라벨·다크 연결선 보완까지 포함한 최종 후보 결과다.
- 지도 검사는 실제 외부 타일이 준비된 뒤 실행한다. ID/충전/상세 카드 검사에서는 무관한 지도 타일만 차단하고 실제 앱·장소 API와 공개 UI를 사용한다.
- 시각 검수: 320/390/430px 도시 상단, 390px light/dark·1440px dark 전국 지도. 지도 좌표·버튼 충돌 없음. 320px `19+` 표기와 다크 연결선은 최종 후보에서 추가 보완했다.
- 외부 provider, DID 발급, Sui 전송, bridge·수탁·원장 서비스는 이번 작업에서 실제 연결하지 않았다. 샘플과 live 권한 상태는 분리한다. 모든 앱 플로우를 전수 검수하거나 iOS Safari 실기기를 검수했다는 뜻은 아니다.

## 프리뷰 배포

- 배포 소스: `996119f`.
- URL: https://ondo-pr524cbqq-jaewook-9643s-projects.vercel.app
- Vercel: `dpl_45fsxjQQTpSuoPd1dVQEmxtKGdNx`, **Ready**, preview. 기존 production alias는 변경하지 않았다.
- 공개 URL에서 위와 동일한 **35/35 브라우저 검사 PASS (1.7분)**. 앱·실제 장소 API·지도 검사의 실제 타일 로딩을 확인했다.
- 독립 시각 검수: 공개 390px 다크 전국 지도에서 검은 연결선 완화, 온도빛 재생·일시정지, 겹침·넘침·런타임 오류 없음을 확인했다. 캡처: `artifacts/qa/nation-ambience-20260910/public-nation-390-dark.png`.
- 로그: `k-tour-id-app/artifacts/qa/identity-stablecoin-map-{deploy,deploy-build,deploy-inspect,public}.log`.
- 진입: 첫 화면의 도시를 선택하면 정리된 지도 상단을 볼 수 있다. 설정에서 light/dark를 선택하고, ID·Wallet의 충전 수단에서 **Stablecoins / 스테이블코인**을 선택하면 token→sample signer→출발/도착→샘플 잔액을 체험할 수 있다. `review=0`에서는 명시적으로 샘플을 선택해야 하며 실제 연결 성공으로 자동 전환하지 않는다.
