// Client-side fallback for /ask when no live LLM key is configured (or the API
// errors). Curated, accurate answers (KO + EN) so the "ask the AI" URL always
// responds. Wording mirrors the honest demo-vs-finals story.

export interface Faq {
  keys: string[]
  a: string
  aEn: string
}

export const ASK_SUGGESTIONS = [
  "K-Tour ID이 뭐예요?",
  "모바일 신분증·여권은 어떻게 쓰여요?",
  "DID랑 VC(K-Tour ID) 차이는?",
  "가맹점은 뭘 검증하나요?",
  "온체인엔 뭐가 올라가나요?",
  "AI는 뭘 해주나요?",
  "결선엔 뭐가 바뀌나요?",
]

export const ASK_FAQ: Faq[] = [
  {
    keys: ["뭐예요", "뭔가요", "뭐하는", "소개", "프로젝트", "what is", "what's", "k-tour id", "k-tour", "ktourid", "about"],
    a: "K-Tour ID는 신원 확인 결과를 서비스용 여행자 Credential로 바꾸고, 사용자가 필요한 자격만 가맹점에 제시하도록 돕는 관광 신뢰 지갑입니다. 모바일 신분증·모바일 외국인등록증은 OmniOne CX, 단기 관광객 여권은 별도 eKYC 경로를 사용합니다. 현재 앱은 VP 검증·혜택·결제·정산·체인 증거까지 이어지는 클릭 목업이며 모든 연동 상태를 LIVE·SANDBOX·SIMULATION으로 구분합니다.",
    aEn: "K-Tour ID is a tourist trust wallet that turns an identity-proofing result into a private service credential and lets the holder present only the eligibility a merchant needs. Mobile ID and mobile residence cards use OmniOne CX, while short-stay passport users follow a separate eKYC path. The current app is a clickable VP-to-benefit-to-settlement mock and labels every adapter LIVE, SANDBOX or SIMULATION.",
  },
  {
    keys: ["모바일 신분증", "mobile id", "신분증", "내국인", "resident", "여권", "passport", "ekyc", "본인확인", "외국인등록증", "arc"],
    a: "본인확인은 유형별로 다릅니다. 내국인 모바일 신분증과 등록외국인의 모바일 외국인등록증은 OmniOne CX 후보 경로이고, 단기 관광객은 여권 MRZ·NFC·얼굴·라이브니스를 처리하는 별도 eKYC 어댑터를 사용합니다. 그 결과로 발급되는 K-Tour Credential은 민간 서비스 자격이며 국가 신분증이나 공식 체류자격을 대신하지 않습니다.",
    aEn: "Identity proofing is path-specific. Korean Mobile ID and a registered foreigner's mobile residence card are OmniOne CX paths; short-stay visitors use a separate passport MRZ/NFC, face-match and liveness adapter. The resulting K-Tour credential is a private service credential, not a national ID or official immigration status.",
  },
  {
    keys: ["did", "vc", "차이", "difference", "다른", "verifiable credential", "캡슐", "capsule"],
    a: "DID는 식별자와 서명 검증용 키의 기준점입니다. VC는 발급자가 소지자의 DID에 대해 서명한 자격증명이고, K-Tour ID는 여행 서비스 자격을 담는 민간 VC입니다. 단기 관광객 VC의 여행 기간은 서비스 유효기간이지 공식 비자·체류자격이 아닙니다.",
    aEn: "A DID is an identifier and key-verification anchor. A VC is an issuer-signed credential about a holder DID; K-Tour ID is a private travel-service VC. For a passport-only visitor, its trip window is a service-validity period, not an official visa or immigration status.",
  },
  {
    keys: ["가맹점", "vp", "검증", "verify", "면세", "presentation", "merchant", "verifier", "tax"],
    a: "가맹점은 VP(Verifiable Presentation)만 받아 PII 없이 4가지를 검증합니다: ① 발급자 서명 진위(발급자 DID·키를 체인에서 resolve, 중앙DB 불필요) ② 소지자 본인성(VP가 소지자 키로 서명됨) ③ 유효·미폐기·미만료 ④ 필요한 자격만(예: 외국인 관광객, 면세 자격, 쿠폰 미사용, 19세 이상). 예: 면세점은 '검증된 외국인 관광객 + 체류 유효'만 확인하고 여권번호·이름은 받지 않습니다. (가맹점 VP 검증 자체는 결선에서 OmniOne으로 붙습니다.)",
    aEn: "A merchant receives only a VP (Verifiable Presentation) and verifies four things without any PII: (1) issuer signature authenticity (resolve the issuer DID/key on-chain — no central DB), (2) holder binding (VP signed by the holder's key), (3) validity / not-revoked / not-expired, (4) just the needed claim (e.g., foreign tourist, tax-free eligible, coupon unused, age ≥ 19). A duty-free shop confirms 'verified foreign tourist + stay valid' without ever seeing the passport number or name. (Merchant-side VP verification itself lands in the finals via OmniOne.)",
  },
  {
    keys: ["온체인", "오프체인", "on-chain", "off-chain", "프라이버시", "privacy", "해시", "hash", "개인정보", "pii"],
    a: "체인에는 원문이 아니라 정규화된 이벤트 payload의 해시와 비식별 참조만 앵커링합니다. 목업은 발급, VP 생성·검증, 혜택 적용, 결제, 바우처 사용, 파트너 정산 이벤트를 로컬에서 생성하며 SIMULATION으로 표시합니다. 여권번호·사진·VC/VP 원문·결제 원문은 체인에 기록하지 않습니다.",
    aEn: "The chain anchor contains only a normalized event-payload hash and non-identifying references, never originals. The mock emits local issuance, VP creation/verification, benefit, payment, voucher and settlement events and labels them SIMULATION. Passport numbers, photos, full VC/VP payloads and payment originals stay off-chain.",
  },
  {
    keys: ["폐기", "revocation", "revoke", "취소", "만료", "분실", "비자", "expire", "lost", "visa"],
    a: "발급자는 OpenDID의 구체 Credential Status 방식에 맞춰 Credential을 정지·폐기해야 하고, Verifier는 VP 서명뿐 아니라 issuer trust·holder binding·만료·status를 함께 확인해야 합니다. 현재 목업에는 active·expired·revoked·offline 결과 화면이 있지만 실제 status endpoint나 registry 호출은 아직 연결되지 않았습니다.",
    aEn: "The issuer must suspend or revoke through the concrete Credential Status mechanism supported by the OpenDID deployment. The verifier checks issuer trust, holder binding, expiry and status as well as the VP signature. The mock shows active, expired, revoked and offline outcomes, but no live status endpoint or registry is connected yet.",
  },
  {
    keys: ["omnione", "솔루션", "라온", "raon", "cx", "open did", "opendid", "필수", "가점", "세개", "3개", "세 개", "solution", "mandatory", "bonus"],
    a: "통합 경계는 Identity, Credential Issuer, Holder Presentation, Verifier, Policy, Payment, Voucher, Settlement, Audit Anchor로 나뉩니다. OmniOne CX는 모바일 신분증 제출·검증, OpenDID는 VC/VP·상태, OmniOne Chain은 비식별 이벤트 해시 앵커 역할입니다. 여권 eKYC와 결제 레일은 각각 별도 어댑터입니다.",
    aEn: "Integration boundaries are split into Identity, Credential Issuer, Holder Presentation, Verifier, Policy, Payment, Voucher, Settlement and Audit Anchor. OmniOne CX handles Mobile ID submission/verification, OpenDID handles VC/VP and status, and OmniOne Chain anchors non-PII event hashes. Passport eKYC and payment rails are separate adapters.",
  },
  {
    keys: ["ai", "에이아이", "혜택", "router", "benefit", "코파일럿", "copilot", "추천", "쿠폰", "남은", "leftover"],
    a: "AI Benefit Router는 여행 기간·예산·사용 가능한 바우처를 바탕으로 추천 이유를 설명하고, 사용자가 승인한 행동만 실행합니다. 남은 자금을 바우처로 바꿀 때도 재원·환불·만료 조건을 먼저 보여줘야 합니다. 현재 추천과 대화는 시뮬레이션입니다.",
    aEn: "The AI Benefit Router explains recommendations from trip duration, budget and available vouchers, then executes only user-approved actions. Any leftover-fund conversion must show funding, refund and expiry terms first. Recommendations and chat are currently simulated.",
  },
  {
    keys: ["스마트", "컨트랙트", "smart contract", "2-layer", "2레이어", "레이어", "layer", "evm", "프로그래머블", "programmable"],
    a: "현재 확정된 체인 역할은 개인정보가 제거된 이벤트 해시 앵커입니다. 결제 토큰·예치·환불·정산을 스마트컨트랙트로 처리할지는 실제 결제 레일, 규제, OmniOne 실행환경을 확인한 뒤 결정해야 하며, 기존 forKRW·ForeignerSBT 실험 코드는 제품 경로에서 제외합니다.",
    aEn: "The confirmed chain role is a non-PII event-hash anchor. Whether payment token, escrow, refund or settlement logic belongs in contracts depends on the selected payment rail, regulation and actual OmniOne execution environment. The legacy forKRW and ForeignerSBT experiments are excluded from the product path.",
  },
  {
    keys: ["zkp", "영지식", "zero", "선택적", "selective", "bbs", "unlink"],
    a: "Privacy Edge는 'Selective Disclosure · ZKP-ready'로 설계됐어요(PDF 표기). 값을 안 까고 술어만 증명(나이≥19, 체류>0)하거나 고른 속성만 공개하고, ZKP-friendly 서명(예: BBS+)은 비연결성도 지향할 수 있어요. 다만 OmniOne이 BBS+/ZKP를 기본 제공하는지는 공개 문서로 미확정이라 단정하지 않고, 구체 스킴은 표준 라이브러리로 결선에 붙이는 걸 목표로 합니다. 데모엔 실제 ZKP 연산은 아직 없어요.",
    aEn: "Privacy Edge is designed as 'Selective Disclosure · ZKP-ready' (the PDF's term). The holder can reveal only chosen attributes or prove a predicate (age ≥ 19, stay > 0) without originals, and ZKP-friendly signatures (e.g., BBS+) can target unlinkability. We don't assert OmniOne ships BBS+/ZKP (unconfirmed in public docs); the specific scheme is a finals goal via standard libraries. The demo doesn't run real ZKP yet.",
  },
  {
    keys: ["결선", "로드맵", "roadmap", "finals", "real", "실제", "다음", "9/30", "프로덕션", "production"],
    a: "지금은 전체 골든 플로우를 구현한 클릭 목업입니다. 다음 단계는 실제 CX callback, 여권 eKYC, OpenDID Issuer·Wallet·Verifier·Status, 결제/환불 레일, 체인 anchor receipt를 각각 연결하고, 화면의 SIMULATION 배지를 응답에 따라 SANDBOX 또는 LIVE로 바꾸는 것입니다.",
    aEn: "The current build is a complete clickable golden-flow mock. The next stage connects CX callbacks, passport eKYC, OpenDID issuer/wallet/verifier/status, payment/refund rails and chain anchor receipts, then changes each SIMULATION badge to SANDBOX or LIVE only when the corresponding response exists.",
  },
  {
    keys: ["기술", "스택", "stack", "tech", "어떻게 만들", "구현", "build", "nextjs"],
    a: "Next.js 16(App Router) · React 19 · Tailwind v4 · TypeScript. 서비스는 인터페이스+mock으로 분리(lib/services, DEMO_MODE)해 결선에 OmniOne/Open DID/결제 어댑터를 한 줄로 교체합니다. 디자인은 한국 헤리티지(한지·먹·인주 도장·단청) 랭귀지입니다.",
    aEn: "Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript. Services are split behind interfaces + mocks (lib/services, DEMO_MODE) so the OmniOne / Open DID / payment adapters swap in for the finals with a one-line change. The design uses a Korean-heritage language (hanji paper, ink, dojang seal-red, dancheong).",
  },
]

function isEnglish(q: string): boolean {
  return !/[가-힣]/.test(q) && /[a-z]/i.test(q)
}

// latin/number keys match on a word boundary (so "ai" doesn't fire inside
// "explain"); Korean keys match as a substring.
function hit(q: string, key: string): boolean {
  const k = key.toLowerCase()
  if (/^[a-z0-9/+-]+$/.test(k)) {
    const esc = k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(q)
  }
  return q.includes(k)
}

// greetings / thanks at the start of the message → a warm, non-question reply
const GREETING = /^\s*(안녕|안뇽|하이|하잉|ㅎㅇ|반가|여보세요|hi|hello|hey|good\s?(morning|afternoon|evening)|고마|감사|thank|thx)/i

export function matchFaq(question: string): string {
  const q = question.toLowerCase()
  const en = isEnglish(question)
  if (GREETING.test(question.trim())) {
    return en
      ? "Hi! I'm the K-Tour ID technical assistant. Ask me about the architecture (OmniOne · Open DID · OmniOne Chain), DID vs VC, merchant VP verification, on-chain privacy, revocation, ZKP, or what changes for the finals."
      : "안녕하세요! K-Tour ID 기술 어시스턴트예요. 아키텍처(OmniOne · Open DID · OmniOne Chain), DID/VC 차이, 가맹점 VP 검증, 온체인 프라이버시, 폐기, ZKP, 데모→결선 계획 등 무엇이든 편하게 물어보세요."
  }
  let best: { score: number; f: Faq } | null = null
  for (const f of ASK_FAQ) {
    const score = f.keys.reduce((s, k) => (hit(q, k) ? s + 1 : s), 0)
    if (score > 0 && (!best || score > best.score)) best = { score, f }
  }
  if (best) return en ? best.f.aEn : best.f.a
  return en
    ? "I'm the K-Tour ID technical assistant. Try asking about on-chain privacy (hash-only), DID vs VC, merchant VP verification, revocation, ZKP, the 2-layer architecture, or what changes for the finals."
    : "저는 K-Tour ID 기술 어시스턴트예요. 온체인 프라이버시(해시만), DID/VC 차이, 가맹점 VP 검증, 폐기, ZKP, 2-레이어 아키텍처, 결선 변경점 등을 물어봐 주세요."
}
