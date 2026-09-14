# Sui 2026 OpenDID hackathon program — public-source review

Read on 2026-09-14. This is a factual extraction/paraphrase, not an organizer-authored document or proof of this team's eligibility. No authentication, submission, account creation, external message, or cookie-consent action was performed.

## Primary sources and retrieval

1. Current Mysten Labs-hosted program handbook: https://mystenlabs.notion.site/2026-AI-1-1-Sui-2c76d9dcb4e980c4ba47c9c81dd1564a
   - Current title: Sui 에코시스템 빌더 지원 프로그램: 2026 블록체인 & AI 해커톤 특별 바운티.
   - Page metadata last edit: 2026-05-27T05:12:13.089Z (a page edit time, not a verified announcement date).
   - Public read-only retrieval: POST `https://mystenlabs.notion.site/api/v3/loadPageChunk`, content-type `application/json`, body below. No authentication/cookies required. Read block values from `recordMap.block[id].value.value`; public text is in `properties`, with child IDs in `content`. Returned cursor stack was empty. Do not retain permissions, user IDs, or CRDT history when extracting text.

```json
{"pageId":"2c76d9dc-b4e9-80c4-ba47-c9c81dd1564a","limit":100,"cursor":{"stack":[]},"chunkNumber":0,"verticalColumns":false}
```

2. Program's DeepSurge portal: https://www.deepsurge.xyz/hackathons/d3da2166-edab-4af2-b750-4c8d29f4b12a
   - Read via an isolated headless browser; browser closed after reading. Public page rendered, without sign-in. Resource links point to the same handbook and https://opendid.org/hackathon/2026/.
3. Sui Korean announcement, 2026-05-08 02:10:05 UTC (11:10 KST): https://t.me/Sui_Foundation_News_Korean/1604
4. Repeat announcement, 2026-05-22 02:37:53 UTC (11:37 KST): https://t.me/Sui_Foundation_News_Korean/1620
   - Telegram public HTML was readable using GET. Both announcements link to the handbook above.
5. Current organizer event page: https://opendid.org/hackathon/2026/

## Current handbook requirements (all are event-specific)

- The Sui Foundation independently funds and operates this ecosystem program. It expressly disclaims official sponsorship, partnership, or a designated technical track from the Korean Digital Authentication Association, RaonSecure, or the hackathon's sponsors. This is not an additional official judging bonus.
- Eligible recipients must comply with the hackathon's official rules, receive an official first/second/third-place award, and satisfy the Sui technical requirements. Sui awards require separate verification; adding Sui does not itself guarantee payment.
- The current table lists additional support equivalent to KRW 10,000,000 for the grand-prize tier, KRW 7,000,000 for the next tier, and KRW 5,000,000 for the third tier. These are separate Sui-funded amounts. The exact payout asset, conversion date, tax treatment, award-tier interpretation and current applicability to this team are not resolved here.
- Core logic and smart contracts must be deployed on Sui Mainnet or Testnet.
- Functionality must be implemented using Move. A generic EVM bridge is not an accepted substitute.
- Integrate at least two of four specified Sui-stack features: zkLogin, PTBs, Walrus Protocol, DeepBook. The examples associate zkLogin with Web2 user/agent onboarding, PTBs with multi-command AI workflows, Walrus with decentralized AI/model/data/media storage and verification, and DeepBook with AI financial/liquidity/trading logic. Merely invoking a generic transaction does not prove meaningful integration of two features.
- Present an Agentic AI use case, with examples of on-chain asset ownership or autonomous decision-making.
- Implement Sui-based provenance and tamper-verification for AI data.
- Register and finally submit the project to DeepSurge for bounty review.
- Publish code in a public GitHub repository with a clear README.
- Submit a one-page technical case study explaining the suitability of Sui infrastructure for the AI application.
- The handbook still lists 2026-05-31 as the official hackathon registration deadline. It states technical support runs from application until the final competition ends. Payment follows the official awards and verification of the DeepSurge submission and Sui requirements.
- Developer community short link is https://go.sui.io/sui-kr-may2026; it returned HTTP 404 on this read. Developer bot is @sui_devrel_agent_bot; no message was sent.

Useful handbook block IDs for repeat verification:

| Subject | Block ID |
|---|---|
| Independent program disclaimer | 36d6d9dc-b4e9-8060-9697-fee34ed6c502 |
| Award/eligibility statement | 36d6d9dc-b4e9-8071-903f-d34143482311 |
| Payout table | 36d6d9dc-b4e9-8025-884b-d59e384bf93e |
| Deployed core | 36d6d9dc-b4e9-80b5-9094-c9455bf76d11 |
| Move / bridge restriction | 36d6d9dc-b4e9-80c0-a32a-f66a9794f58d |
| At least two features | 36d6d9dc-b4e9-8013-bdc2-c71c8738dff3 |
| Agentic AI | 36d6d9dc-b4e9-806f-a36d-c74a3c98d2e8 |
| AI provenance verification | 36d6d9dc-b4e9-8064-bfd3-d4e15aae5162 |
| DeepSurge final submission | 36d6d9dc-b4e9-807f-a171-d68150ac1164 |
| Public GitHub | 36d6d9dc-b4e9-80fd-9970-d8fbb46e837e |
| Case study | 36d6d9dc-b4e9-800d-a0cb-d21097706315 |
| May 31 registration | 36d6d9dc-b4e9-8056-95a5-e13cab48a168 |

## DeepSurge public page on this read

- Event title: OpenDID Hackathon.
- Status: ongoing.
- Displayed event dates: May 1 through September 30. No explicit Sui final-submission time or timezone was visible.
- Eligibility note: Korean citizens only.
- Listed track: Use Sui Blockchain.
- Sign-in is required to participate. This audit did not verify team registration or enter the sign-in flow.
- Description still promotes a 1:1 prize-matching bounty and meaningful AI × Sui applications.
- Displayed prize pool: USD 21,800; visible tier amounts: USD 6,800 / 4,800 / 3,400. Do not reconcile these with KRW amounts using an assumed exchange rate or infer recipient count from their sum.

## Conflicts and unknowns to keep explicit

- Older May Telegram announcements described a 1:1 match and estimated the organizer's tiers at KRW 10m / 7m / 5m. The current organizer page instead lists KRW 15m / 6m / 3m, while the current Sui handbook retains additional KRW-equivalent 10m / 7m / 5m. Therefore an automatic exact doubling of every current official prize is not established by these sources. Confirm the operative Sui payment terms before promising a total.
- The Sui program exists and is specifically linked to this hackathon, but it is not an official organizer partnership or scoring track. DeepSurge's track label is a portal label, not evidence of an official OpenDID judging bonus.
- Exact Sui final-submission cutoff/timezone; whether existing registered teams can enroll in the Sui program now; payout eligibility of this team; and any non-public participant instructions remain unknown.
- This handbook does not state a unique successful-transaction count, minimum novelty/new-code window, required demo duration, mainnet-only requirement, or mandatory bridge. Do not import such requirements from Sui Overflow or other hackathons. Local project test targets such as three successful transactions are internal acceptance targets, not verified sponsor rules.
- The event range ending September 30 does not override the team's separately supplied September 21 submission deadline. These dates describe different things and need independent confirmation.

## Scope consequence (engineering inference, not a sponsor ruling)

A souvenir mint or a second-chain receipt by itself is not enough to demonstrate the stated technical core, two Sui-stack features, Agentic AI use case and AI provenance requirements. Preserve the real CX/OpenDID/OmniOne entitlement flow, but scope a meaningful Sui+AI vertical slice with explicit ownership, time and evidence. Whether a proposed implementation qualifies must not be pre-declared before it is built and reviewed against the program terms.
