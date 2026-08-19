# PULSE KOREA → ONDO 제품 방향

상태: `APPROVED · REALIZED AS ONDO B`

## 한 문장

**외국인이 한국 지명을 몰라도, 현지인이 보내는 식음료 신호의 열기로 지금 갈 곳을 발견하는 지도.**

## 고정 결정

- PULSE KOREA + AFTER 19를 결합한다.
- 초기 콘텐츠는 식음료로 한정한다.
- 사업 비전은 내국인·장기체류 외국인·단기 여행자를 잇지만 핵심 데모는 외국인 discovery다.
- 서울과 부산을 실제 장소 coverage로 채우고 전국의 빈 지도처럼 보이지 않게 한다.
- DID는 지도 장식이 아니라 Person, Age, Payment, evidence 같은 필요한 자격의 JIT gate에만 쓴다.
- 발자취의 거의 흰 canvas, 넓은 여백, 점·선·기록의 절제 원리를 차용하되 화면·브랜드는 복제하지 않는다.

## 현재 ONDO B

- 행정안전부 LOCALDATA 기반 서울 200 + 부산 200 공식 식음료 장소.
- 도시별 40개의 명시적 `SIMULATED` ONDO preview signal과 그중 `night` category만 포함한 After19 subset(서울 7, 부산 10).
- MapLibre 지도에서 neutral cluster count와 heat score를 다른 geometry로 표현.
- 공식 장소, preview signal, sample, confidence band, freshness와 unknown facts를 분리.
- Tables·Local Signal을 통해 ‘로컬이 알려주는 열기’의 제품 루프를 보여주되 live network라고 주장하지 않는다.

구현 깊이와 금지 주장은 [최종 요구 감사](./ondo-baljajwi/06_FINAL_REQUIREMENTS_AUDIT.md)를 따른다.
