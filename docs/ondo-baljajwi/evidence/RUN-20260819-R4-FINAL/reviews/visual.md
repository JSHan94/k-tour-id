# R4 · Visual system

Verdict: `CLEAN · S0=0 · S1=0 · S2=0`. Non-actionable S3=`3`.

Product `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3`, Harness `6e7254af02adcf49a35424203e2201093485872a`, baseline `5ffbe67fe65e5d46ecb2b7c217394fd2c29847f272dbf56afdac716c66bb49c1`.

- mobile 44×`390×844`, desktop 44×`1440×1000` baseline과 FL-001~018 cover를 전수 재검수했다.
- 대표 pixel `14/14`, surface Axe·44px·overflow `28/28`, onboarding geometry `4/4`, regression `20/20`, After19 isolated `9/9 PASS`.
- 발자취의 점묘·여백·먹색 위계·절제된 shadow/navigation을 제품 언어로 번역했고, 실제 지도에서는 cluster count와 ONDO score geometry를 분리했다.
- desktop onboarding exit와 selected venue 위 After19 CTA가 첫 viewport에서 topmost·hit-test 가능하며 clipping이 없다.

S3: serif token 미정의, Local Signal 장식 border의 heat 색 1회 재사용, 비표준 혼합 부하에서 1회 발생 후 isolated 반복에서 재현되지 않은 After19 poll timeout. 제품/UI blocker는 아니다.
