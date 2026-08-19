# R3 · Short-term foreign traveler

Verdict: `CLEAN · S0=0 · S1=0 · S2=0 · S3=0`.

Product `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3`, Harness `6e7254af02adcf49a35424203e2201093485872a`.

- fresh actual browser `98/98 PASS`: Flow `36/36`, KO/EN `56/56`, selected-venue After19 `2/2`, onboarding geometry `4/4`.
- step 2 `Choose meal preferences`와 final `Open the ONDO map`의 의미가 분리되고 Guest skip과 세 persona 모두 인증 없이 실제 B map에 도달한다.
- desktop Guest CTA는 canvas 안 `y=860..912`, `scrollTop=0`, center hit-test true이며 실제 좌표 click으로 map에 진입한다.
- official Korean name, navigation transliteration, unknown traveler facts, Google directions가 정직한 위계로 보인다.
- Tables는 live host/reservation이 없는 preview임을 목록·상세에서 항상 표시한다.
- After19는 ONDO simulated night-preview policy이며 공식 장소 제한이라고 주장하지 않는다.
- 주요 취소·실패·재시도는 원 행동 또는 명시적 대안으로 복귀한다.
- accepted probes에서 product runtime error와 external map error는 각각 0이었다.
