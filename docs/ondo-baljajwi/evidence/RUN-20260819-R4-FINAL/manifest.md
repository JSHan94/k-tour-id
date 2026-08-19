# RUN-20260819-R4-FINAL

상태: `NOT STARTED`

R4는 R3가 clean으로 닫힌 뒤 **같은** Product SHA, Harness SHA, baseline digest에서 시작한다. 자동 Gate와 UX/IA, Visual, Data/Content/Truth, Short-term traveler, Business/PO 독립 review를 모두 새로 실행한다.

| Field | Required value |
|---|---|
| Product SHA | `0cc65f2793ca7a17f59397b1e9e0391f281f9649` |
| Harness SHA | `8b0060ff6f371402eb2c9d8766461b50f57e4742` |
| Baseline digest | `f37ac108b1a7814f747e9e5c89b804ad15b258df29d1958b59da7656ea8725fc` |
| Automated Gate | all pass, unexpected skip 0 |
| Five-role review | 5/5 submitted independently |
| Actionable severity | S0=0, S1=0, S2=0 |

제품 또는 harness가 바뀌면 이 manifest는 무효이며 R3부터 다시 시작한다.
