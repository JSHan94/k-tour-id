"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronRight, CircleDollarSign, FlaskConical, Link2, ShieldCheck, WalletCards } from "lucide-react"
import { estimatedUsdTotal, type BridgePhase } from "../contracts/commerce"
import { InlineNotice, Sheet } from "../shared/ui/sheet"
import { useOndo } from "../shared/state/ondo-provider"
import { useQaControls } from "../shared/ui/use-qa-controls"
import { EVIDENCE_FIXTURES, LABS_ASSETS, TRAIT_FIXTURES, bridgeStateForPhase, nextBridgePhase, type BridgeState, type WalletState } from "./labs-model"
import styles from "./labs.module.css"

type MintState = "NFT-LOCKED" | "NFT-ELIGIBLE" | "NFT-OPTED-IN" | "NFT-MINTING" | "NFT-MINTED" | "NFT-FAILED"
type TraitRetryState = "idle" | "checking" | "eligible" | "failed"

type LabsSession = {
  acknowledged: boolean
  wallet: WalletState
  bridge: BridgeState
  phase: BridgePhase
  mint: MintState
  consent: boolean
  quoteExpiresAt: number | null
  traitStates: Record<string, TraitRetryState>
}

const LABS_SESSION_KEY = "ondo.labs.v2"

const TRAIT_DISPLAY = {
  "offer-foreign-card": {
    key: "seongsu-card",
    place: { ko: "성수 돼지국밥", en: "Seongsu Dwaeji Gukbap" },
    condition: { ko: "해외 발급 카드 안내", en: "Foreign-issued card information" },
    policy: { ko: "카드 이용 정책", en: "Card acceptance policy" },
  },
  "offer-over19": {
    key: "euljiro-over19",
    place: { ko: "을지로 노가리", en: "Euljiro Nogari" },
    condition: { ko: "19세 이상 이용 조건", en: "19+ access condition" },
    policy: { ko: "야간 이용 정책", en: "Night access policy" },
  },
} satisfies Record<string, {
  key: string
  place: { ko: string; en: string }
  condition: { ko: string; en: string }
  policy: { ko: string; en: string }
}>

function readLabsSession(): Partial<LabsSession> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.sessionStorage.getItem(LABS_SESSION_KEY) ?? "{}") as Partial<LabsSession>
  } catch {
    return {}
  }
}

const BRIDGE_COPY: Record<Exclude<BridgePhase, "none">, { ko: string; en: string }> = {
  source_submitted: { ko: "출발 체인 제출됨 · 시뮬레이션", en: "Source submitted · Simulated" },
  source_confirmed: { ko: "출발 체인 확인됨 · 도착 전", en: "Source confirmed · Destination pending" },
  relaying: { ko: "전달 단계 · 시뮬레이션", en: "Relaying · Simulated" },
  destination_confirmed: { ko: "도착 단계 확인됨 · 시뮬레이션", en: "Destination confirmed · Simulated" },
}

export function LabsEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const qaControls = useQaControls()
  const originTab = useRef(state.tab).current
  const originOpener = useRef<HTMLElement | null>(typeof document !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [wallet, setWallet] = useState<WalletState>("WAL-DISCONNECTED")
  const [bridge, setBridge] = useState<BridgeState>("BRG-IDLE")
  const [phase, setPhase] = useState<BridgePhase>("none")
  const [mint, setMint] = useState<MintState>(state.stamps === 10 ? "NFT-ELIGIBLE" : "NFT-LOCKED")
  const [consent, setConsent] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [quoteExpiresAt, setQuoteExpiresAt] = useState<number | null>(null)
  const [traitStates, setTraitStates] = useState<Record<string, TraitRetryState>>({})
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const quoteButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const advanceButtonRef = useRef<HTMLButtonElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const bridgeReceiptRef = useRef<HTMLDivElement>(null)
  const walletRetryRef = useRef<HTMLButtonElement>(null)
  const sessionWasRestored = useRef(false)
  const estimatedTotal = useMemo(() => estimatedUsdTotal(LABS_ASSETS), [])

  function focusAfterTransition(target: RefObject<HTMLElement | null>) {
    window.requestAnimationFrame(() => target.current?.focus())
  }

  useEffect(() => {
    const stored = readLabsSession()
    if (stored.acknowledged === true) setAcknowledged(true)
    if (stored.wallet && stored.wallet !== "WAL-CONNECTING") setWallet(stored.wallet)
    if (stored.bridge) setBridge(stored.bridge === "BRG-PENDING" ? "BRG-FAILED" : stored.bridge)
    if (stored.phase) setPhase(stored.phase)
    if (stored.mint && stored.mint !== "NFT-MINTING") setMint(stored.mint)
    if (stored.consent === true) setConsent(true)
    if (typeof stored.quoteExpiresAt === "number") setQuoteExpiresAt(stored.quoteExpiresAt)
    if (stored.traitStates && typeof stored.traitStates === "object") setTraitStates(stored.traitStates)
    sessionWasRestored.current = true
    setSessionLoaded(true)
  }, [])

  useEffect(() => {
    if (!sessionLoaded || !sessionWasRestored.current) return
    const snapshot: LabsSession = { acknowledged, wallet, bridge, phase, mint, consent, quoteExpiresAt, traitStates }
    window.sessionStorage.setItem(LABS_SESSION_KEY, JSON.stringify(snapshot))
  }, [acknowledged, bridge, consent, mint, phase, quoteExpiresAt, sessionLoaded, traitStates, wallet])

  useEffect(() => {
    if (!sessionLoaded || qaControls || bridge !== "BRG-PENDING") return
    const timer = window.setTimeout(advanceBridge, 650)
    return () => window.clearTimeout(timer)
  }, [bridge, phase, qaControls, sessionLoaded])

  useEffect(() => {
    if (wallet !== "WAL-FAILED") return
    let secondFrame = 0
    let timeout = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        timeout = window.setTimeout(() => walletRetryRef.current?.focus({ preventScroll: true }), 0)
      })
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(timeout)
    }
  }, [wallet])

  function close() {
    const opener = originOpener.current
    actions.setSurface({ kind: "map" })
    actions.setTab(originTab)
    window.setTimeout(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      else document.querySelector<HTMLElement>(originTab === "id" ? "[data-testid='open-labs-id']" : "[data-testid='open-labs-milestone'], [data-testid='open-labs']")?.focus({ preventScroll: true })
    }, 120)
  }

  const returnLabel = originTab === "id"
    ? locale === "ko" ? "ID로 돌아가기" : "Return to ID"
    : originTab === "my"
      ? locale === "ko" ? "My Korea로 돌아가기" : "Return to My Korea"
      : locale === "ko" ? "이전 탭으로 돌아가기" : "Return to previous tab"

  function connectWallet() {
    setWallet("WAL-CONNECTING")
    window.setTimeout(() => {
      const fail = new URLSearchParams(window.location.search).get("scenario") === "labs-wallet-fail"
      setWallet(fail ? "WAL-FAILED" : "WAL-READY")
    }, 480)
  }

  function quoteBridge() {
    setMismatch(false)
    setPhase("none")
    const expiredFixture = new URLSearchParams(window.location.search).get("scenario") === "bridge-expired"
    setQuoteExpiresAt(expiredFixture ? Date.now() - 1_000 : Date.now() + 120_000)
    setBridge("BRG-QUOTED")
    focusAfterTransition(confirmButtonRef)
  }

  function confirmBridge() {
    if (bridge !== "BRG-QUOTED") return
    if (quoteExpiresAt == null || quoteExpiresAt <= Date.now()) {
      setBridge("BRG-EXPIRED")
      focusAfterTransition(quoteButtonRef)
      return
    }
    setBridge("BRG-CONFIRMING")
    focusAfterTransition(submitButtonRef)
  }

  function submitBridge() {
    if (bridge !== "BRG-CONFIRMING") return
    const first = nextBridgePhase("none")
    if (!first) return
    setPhase(first)
    setBridge(bridgeStateForPhase(first))
    focusAfterTransition(qaControls ? advanceButtonRef : progressRef)
  }

  function advanceBridge() {
    if (bridge !== "BRG-PENDING") return
    const next = nextBridgePhase(phase)
    if (!next) return
    const fail = new URLSearchParams(window.location.search).get("scenario") === "bridge-failed" && phase === "source_confirmed"
    if (fail) {
      setBridge("BRG-FAILED")
      focusAfterTransition(quoteButtonRef)
      return
    }
    setPhase(next)
    setBridge(bridgeStateForPhase(next))
    focusAfterTransition(next === "destination_confirmed" ? bridgeReceiptRef : qaControls ? advanceButtonRef : progressRef)
  }

  function cancelBridge() {
    if (bridge !== "BRG-QUOTED" && bridge !== "BRG-CONFIRMING") return
    setPhase("none")
    setQuoteExpiresAt(null)
    setBridge("BRG-CANCELLED")
    focusAfterTransition(quoteButtonRef)
  }

  function retryTrait(key: string) {
    setTraitStates((current) => ({ ...current, [key]: "checking" }))
    window.setTimeout(() => {
      const fails = new URLSearchParams(window.location.search).get("scenario") === "trait-retry-fail"
      setTraitStates((current) => ({ ...current, [key]: fails ? "failed" : "eligible" }))
    }, 420)
  }

  function mintBadge() {
    if (state.stamps !== 10 || wallet !== "WAL-READY" || !consent) return
    setMint("NFT-MINTING")
    window.setTimeout(() => {
      const fail = new URLSearchParams(window.location.search).get("scenario") === "mint-failed"
      setMint(fail ? "NFT-FAILED" : "NFT-MINTED")
    }, 520)
  }

  if (!acknowledged) {
    return (
      <Sheet label="Labs" onClose={close} size="full">
        <div className={styles.boundary}>
          <span className={styles.labMark}><FlaskConical size={24} /></span>
          <p className={styles.eyebrow}>{locale === "ko" ? "기술 실험실 · 시뮬레이션" : "LABS · SIMULATED"}</p>
          <h2>{locale === "ko" ? "기술 실험실" : "Labs"}</h2>
          <p>{locale === "ko" ? "기술 가설을 보여주는 실험 영역입니다. 실제 자산 이동이나 운영 서비스가 아닙니다." : "This is an experimental area for technical hypotheses. It does not move real assets or represent a production service."}</p>
          <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{qaControls ? locale === "ko" ? "지갑, 잔고, 체인 연결과 기념 배지 결과는 반복해도 같은 테스트용 미리보기입니다." : "Wallet, balance, bridge, and badge results here are deterministic fixtures." : locale === "ko" ? "지갑, 잔고, 체인 연결과 기념 배지는 모두 재현 가능한 미리보기 결과입니다." : "Wallet, balance, bridge, and badge results are reproducible previews."}</span></InlineNotice>
          <button type="button" className={styles.primary} onClick={() => setAcknowledged(true)} data-testid="labs-acknowledge">{locale === "ko" ? "이해하고 보기" : "I understand"}</button>
          <button type="button" className={styles.textButton} onClick={close}>{returnLabel}</button>
        </div>
      </Sheet>
    )
  }

  const canDisconnect = wallet !== "WAL-CONNECTING" && bridge !== "BRG-PENDING"
  const phaseCopy = phase === "none" ? null : BRIDGE_COPY[phase][locale]
  const walletOutcomeId = "labs-wallet-outcome"

  return (
    <Sheet label="Labs" onClose={close} showClose={false} size="full">
      <main className={styles.body} data-wallet-state={wallet} data-bridge-state={bridge} data-bridge-phase={phase} data-mint-state={mint} data-testid="labs-overlay">
        <header className={styles.header}>
          <button type="button" data-sheet-initial-focus onClick={close} aria-label={returnLabel}><ArrowLeft size={20} /></button>
          <div><p className={styles.eyebrow}>{locale === "ko" ? "기술 실험실 · 시뮬레이션" : "LABS · SIMULATED"}</p><h2>{locale === "ko" ? "기술 실험실" : "Labs"}</h2></div>
          <span className={styles.truthBadge}>{locale === "ko" ? "시뮬레이션" : "SIMULATED"}</span>
        </header>

        <InlineNotice tone="neutral"><ShieldCheck size={18} /><span>{locale === "ko" ? "실제 자산 이동이나 운영 서비스가 아닙니다." : "No real assets move and this is not a production service."}</span></InlineNotice>

        <section className={styles.card} aria-labelledby="labs-signer-title">
          <div className={styles.sectionHeading}><span><WalletCards size={18} /></span><div><h3 id="labs-signer-title">{locale === "ko" ? "Sui zkLogin · 서명 방식 식별자" : "Sui zkLogin signer"}</h3><p>{locale === "ko" ? "대상 네트워크 식별자: Sui Testnet · 시뮬레이션" : "Target network: Sui Testnet · Simulated"}</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "Sui 주소와 트랜잭션 서명 경로를 보여줍니다. ONDO 계정, 본인 확인(KYC) 또는 멀티체인 지갑을 만들지는 않습니다." : "Shows a Sui address and transaction-signing route. It does not create an ONDO account, KYC, or multichain wallet."}</p>
          {wallet === "WAL-READY" ? <div><small className={styles.identifierLabel}>{locale === "ko" ? "미리보기 주소 식별자" : "Preview address identifier"}</small><code className={styles.address}>{qaControls ? "0x8a71…ondo_fixture" : "0x8a71…ondo_preview"}</code></div> : null}
          {wallet === "WAL-FAILED" ? <div id={walletOutcomeId} className={styles.walletOutcome} role="alert" aria-atomic="true" data-testid="labs-wallet-outcome"><AlertTriangle size={17} /><span>{qaControls ? locale === "ko" ? "테스트용 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다." : "The test connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected." : locale === "ko" ? "미리보기 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다." : "The preview connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected."}</span></div> : null}
          {wallet === "WAL-DISCONNECTED" || wallet === "WAL-FAILED" ? <button ref={walletRetryRef} type="button" className={styles.secondary} onClick={connectWallet} aria-describedby={wallet === "WAL-FAILED" ? walletOutcomeId : undefined} data-testid="labs-connect-wallet">{wallet === "WAL-FAILED" ? locale === "ko" ? "다시 시도" : "Try again" : qaControls ? locale === "ko" ? "서명 기능 연결 시뮬레이션" : "Simulate signer connection" : locale === "ko" ? "미리보기 서명 기능 연결" : "Connect preview signer"}</button> : null}
          {wallet === "WAL-CONNECTING" ? <button type="button" className={styles.secondary} aria-busy="true" disabled>{locale === "ko" ? "연결 중" : "Connecting"}</button> : null}
          {wallet === "WAL-READY" ? <button type="button" className={styles.textButton} disabled={!canDisconnect} onClick={() => setWallet("WAL-DISCONNECTED")}>{locale === "ko" ? "연결 해제" : "Disconnect"}</button> : null}
        </section>

        <section className={styles.card} aria-labelledby="labs-assets-title">
          <div className={styles.sectionHeading}><span><CircleDollarSign size={18} /></span><div><h3 id="labs-assets-title">{locale === "ko" ? "자산별 잔고" : "Balances by asset"}</h3><p>{locale === "ko" ? `예상 USD 환산액 · $${estimatedTotal.toFixed(2)}` : `Estimated USD value · $${estimatedTotal.toFixed(2)}`}</p></div></div>
          <div className={styles.assetList}>
            {LABS_ASSETS.map((asset) => <div key={asset.id} className={styles.assetRow}><div><strong>{asset.symbol}</strong><span>{locale === "ko" ? `네트워크 식별자: ${asset.chain} · ${asset.representation === "native" ? "기본형" : asset.representation === "wrapped" ? "연결형" : "테스트 토큰"}` : `${asset.chain} · ${asset.representation.replace("_", " ")}`}</span></div><div><strong>{asset.amount}</strong>{asset.estimatedUsd ? <span>≈ ${asset.estimatedUsd}</span> : <span>{locale === "ko" ? "USD 환산 없음" : "No USD estimate"}</span>}</div></div>)}
          </div>
          <p className={styles.finePrint}>{locale === "ko" ? "USDC·USDT·OOKRW는 자산 식별자입니다. USDC와 USDT는 서로 다른 자산으로 보관하며, OOKRW 테스트 토큰은 KRW 상환이나 1:1 가치를 보증하지 않습니다." : "USDC and USDT remain separate assets. OOKRW test token does not guarantee KRW redemption or 1:1 value."}</p>
        </section>

        <section className={styles.card} aria-labelledby="labs-bridge-title">
          <div className={styles.sectionHeading}><span><Link2 size={18} /></span><div><h3 id="labs-bridge-title">{locale === "ko" ? "체인 연결 가설 시뮬레이션" : "Bridge hypothesis simulation"}</h3><p>{locale === "ko" ? "경로 식별자: Sui Testnet → OmniOne · 가설" : "Sui Testnet → OmniOne hypothesis"}</p></div></div>
          <InlineNotice tone="warm"><AlertTriangle size={17} /><span>{locale === "ko" ? "공식 Sui↔OmniOne 체인 연결이 확인된 것은 아닙니다." : "An official Sui↔OmniOne bridge has not been confirmed."}</span></InlineNotice>
          <div className={styles.route}><span>13.50 USDT</span><ArrowRight size={18} /><span>13,460 OOKRW</span></div>
          {phaseCopy ? <div ref={progressRef} className={styles.progress} role="status" aria-live="polite" tabIndex={-1}><span className={phase === "destination_confirmed" ? styles.completeDot : styles.pendingDot} /><strong>{phaseCopy}</strong></div> : null}
          {bridge === "BRG-IDLE" || bridge === "BRG-FAILED" || bridge === "BRG-CANCELLED" || bridge === "BRG-EXPIRED" ? <button ref={quoteButtonRef} type="button" className={styles.primary} onClick={quoteBridge} disabled={wallet !== "WAL-READY"} data-testid="labs-bridge-quote">{wallet === "WAL-READY" ? bridge === "BRG-EXPIRED" ? locale === "ko" ? "새 예상 조건 받기" : "Get a new quote" : locale === "ko" ? "예상 조건 보기" : "View quote" : locale === "ko" ? "서명 기능 연결 후 예상 조건 보기" : "Connect signer for quote"}</button> : null}
          {bridge === "BRG-QUOTED" ? <><div className={styles.quote} data-testid="labs-quote"><span>{locale === "ko" ? "예상 경로 수수료" : "Estimated route fee"}</span><strong>$0.04</strong><small>{quoteExpiresAt != null && quoteExpiresAt <= Date.now() ? locale === "ko" ? "예상 조건 만료 · 시뮬레이션" : "Quote expired · Simulated" : locale === "ko" ? "최대 2분 동안 유효 · 시뮬레이션" : "Valid for up to 2 min · Simulated"}</small></div><button ref={confirmButtonRef} type="button" className={styles.primary} onClick={confirmBridge} data-testid="labs-bridge-confirm">{locale === "ko" ? "예상 조건 확인" : "Confirm quote"}</button><button type="button" className={styles.secondary} onClick={cancelBridge} data-testid="labs-bridge-cancel">{locale === "ko" ? "취소" : "Cancel"}</button></> : null}
          {bridge === "BRG-CONFIRMING" ? <><button ref={submitButtonRef} type="button" className={styles.primary} onClick={submitBridge} data-testid="labs-bridge-submit">{locale === "ko" ? "체인 연결 시뮬레이션 시작" : "Start bridge simulation"}</button><button type="button" className={styles.secondary} onClick={cancelBridge} data-testid="labs-bridge-cancel">{locale === "ko" ? "취소" : "Cancel"}</button></> : null}
          {bridge === "BRG-PENDING" && qaControls ? <button ref={advanceButtonRef} type="button" className={styles.primary} onClick={advanceBridge} data-testid="labs-bridge-advance">{locale === "ko" ? "다음 테스트 단계" : "Advance fixture phase"}<ChevronRight size={17} /></button> : null}
          {bridge === "BRG-SIMULATED-SUCCESS" ? <><div role="status" aria-live="polite"><InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "도착 단계까지 확인된 시뮬레이션입니다. 실제 자산은 바뀌지 않았습니다." : "The simulation reached destination confirmation. No real assets changed."}</span></InlineNotice></div><div ref={bridgeReceiptRef} className={styles.bridgeReceipt} data-testid="labs-bridge-receipt" tabIndex={-1}><strong>{locale === "ko" ? "예상 전후 · 읽기 전용" : "Projected before and after · Read only"}</strong><span>{locale === "ko" ? "Sui Testnet의 USDT" : "USDT on Sui Testnet"} <b>13.50 → 0.00</b></span><span>{locale === "ko" ? "OmniOne 가설의 OOKRW" : "OOKRW on OmniOne hypothesis"} <b>18,000 → 31,460</b></span><small>{locale === "ko" ? "실제 잔고나 거래는 변경되지 않았습니다." : "Actual balances and transactions were not changed."}</small></div></> : null}
          {bridge === "BRG-FAILED" ? <div role="alert"><InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "시뮬레이션 실패 · 현재 단계와 모든 잔고는 그대로예요. 새 예상 조건으로 다시 시작할 수 있습니다." : "Simulation failed. The current phase and every balance remain unchanged. You can restart with a fresh quote."}</span></InlineNotice></div> : null}
          {bridge === "BRG-CANCELLED" ? <div role="status" aria-live="polite"><InlineNotice tone="neutral"><span>{locale === "ko" ? "시뮬레이션을 취소했어요. 잔고는 바뀌지 않았으며, 새 예상 조건으로 다시 시작할 수 있습니다." : "Simulation cancelled. Balances did not change, and you can restart with a fresh quote."}</span></InlineNotice></div> : null}
          {bridge === "BRG-EXPIRED" ? <InlineNotice tone="warm"><AlertTriangle size={17} /><span>{locale === "ko" ? "예상 조건이 만료되어 제출하지 않았어요. 새 예상 조건을 받아 계속해 주세요." : "The quote expired, so nothing was submitted. Get a new quote to continue."}</span></InlineNotice> : null}
          {qaControls ? <button type="button" className={styles.inlineLink} onClick={() => setMismatch((current) => !current)}>{locale === "ko" ? "예상 조건 불일치 예시 보기" : "View quote mismatch example"}</button> : null}
          {qaControls && mismatch ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "자산·체인·금액이 예상 조건과 달라 진행하지 않았어요." : "The asset, chain, or amount did not match the quote, so nothing was submitted."}</span></InlineNotice> : null}
        </section>

        <details className={`${styles.card} ${styles.disclosure}`} open={qaControls || undefined}>
          <summary className={styles.disclosureSummary}><div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3>{locale === "ko" ? "증거 변환 경계" : "Evidence adapter boundaries"}</h3><p>{locale === "ko" ? "계약 명세만 제공 · 기술 세부정보" : "CONTRACT ONLY · Technical details"}</p></div></div><ChevronRight size={18} /></summary>
          <div className={styles.disclosureBody}>
            <p className={styles.bodyCopy}>{locale === "ko" ? "OpenDID와 EAS는 표준 식별자입니다. 두 표준의 증거를 각각 변환한 뒤 하나의 공통 형식으로 맞춥니다. EAS 연동은 설계만 있고 아직 구현되지 않았습니다." : "OpenDID and EAS remain separate adapters normalized into a canonical envelope. A live EAS implementation is deferred."}</p>
            <div className={styles.evidenceList}>{EVIDENCE_FIXTURES.map((evidence) => <article key={evidence.id}><span>{locale === "ko" ? `표준 식별자: ${evidence.sourceStandard}` : evidence.sourceStandard}</span><strong>{locale === "ko" ? evidence.claimType === "person" ? "사람 확인" : evidence.claimType === "visit" ? "방문 기록" : evidence.claimType === "age_over_19" ? "19+ 확인" : "상점 이용 조건" : evidence.claimType.replace("_", " ")}</strong><small>{locale === "ko" ? `${evidence.sourceStandard} 변환 규칙 · 계약 명세만 제공` : `${evidence.sourceStandard} adapter · ${evidence.provenance.truth}`}</small></article>)}</div>
          </div>
        </details>

        <section className={styles.card} aria-labelledby="labs-traits-title">
          <div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3 id="labs-traits-title">{locale === "ko" ? "상점 이용 조건" : "Merchant access conditions"}</h3><p>{locale === "ko" ? "계약 명세만 제공" : "CONTRACT ONLY"}</p></div></div>
          {TRAIT_FIXTURES.map((trait) => {
            const key = `${trait.merchantId}:${trait.offerId}`
            const retryState = traitStates[key] ?? "idle"
            const display = TRAIT_DISPLAY[trait.offerId as keyof typeof TRAIT_DISPLAY]
            const status = retryState === "checking"
              ? locale === "ko" ? "다시 확인 중" : "Checking again"
              : retryState === "eligible"
                ? locale === "ko" ? "조건 충족" : "Condition met"
                : retryState === "failed"
                  ? locale === "ko" ? "여전히 확인 불가" : "Still unavailable"
                  : trait.result === "stale"
                    ? locale === "ko" ? "확인 기한 지남" : "Out of date"
                    : locale === "ko" ? "확인 불가" : "Unavailable"
            const checkedAt = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(trait.checkedAt))
            return <article className={styles.traitRow} key={key} data-trait-state={retryState} data-testid={`trait-${display.key}`} aria-labelledby={`trait-${display.key}-place`}>
              <header className={styles.traitHeading}><strong id={`trait-${display.key}-place`}>{display.place[locale]}</strong><span>{display.condition[locale]}</span></header>
              <dl className={styles.traitFacts}><div><dt>{locale === "ko" ? "상태" : "Status"}</dt><dd>{status}</dd></div><div><dt>{locale === "ko" ? "확인 시각" : "Checked at"}</dt><dd>{checkedAt}</dd></div><div><dt>{locale === "ko" ? "조건 범위" : "Condition scope"}</dt><dd>{display.policy[locale]} · {locale === "ko" ? "계약 명세만 제공" : "Contract only"}</dd></div></dl>
              <InlineNotice tone={retryState === "eligible" ? "success" : trait.result === "error" || retryState === "failed" ? "danger" : "warm"}>{retryState === "eligible" ? <Check size={17} /> : <AlertTriangle size={17} />}<span>{retryState === "eligible" ? locale === "ko" ? "이 특정 이용 조건은 충족됩니다. 장소 전체의 이용 가능 여부는 별도로 확인해 주세요." : "This specific access condition is met. Confirm overall venue availability separately." : retryState === "failed" ? locale === "ko" ? "다시 확인하지 못했어요. 최신 장소 안내를 확인해 주세요." : "The condition still could not be checked. Review the venue’s latest information." : trait.result === "stale" ? locale === "ko" ? "이 조건의 확인 시점이 지났어요." : "This condition check is out of date." : locale === "ko" ? "이용 조건을 확인하지 못했어요. 최신 장소 안내를 확인해 주세요." : "This access condition could not be checked. Please review the venue’s latest information."}</span></InlineNotice>
              <button type="button" className={styles.secondary} disabled={retryState === "checking"} onClick={() => retryTrait(key)} data-testid={`trait-retry-${display.key}`} aria-label={locale === "ko" ? `${display.place.ko}의 ${display.condition.ko} 다시 확인` : `Retry ${display.condition.en} for ${display.place.en}`}>{retryState === "checking" ? locale === "ko" ? "다시 확인 중" : "Checking again" : locale === "ko" ? "이 조건 다시 확인" : "Retry this condition"}</button>
            </article>
          })}
          <p className={styles.finePrint}>{locale === "ko" ? "이용 조건 결과는 특정 정책 정보만 나타내며 장소 전체의 입장·안전·결제를 보증하지 않습니다." : "Trait results describe a specific policy fact and do not guarantee venue admission, safety, or payment."}</p>
        </section>

        <details className={`${styles.card} ${styles.disclosure}`} open={qaControls || undefined}>
          <summary className={styles.disclosureSummary}><div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3>{locale === "ko" ? "AMM · 교환 방식 식별자" : "AMM"}</h3><p>{locale === "ko" ? "설계만 제공 · 사용 불가" : "DEFERRED · Not available"}</p></div></div><ChevronRight size={18} /></summary>
          <div className={styles.disclosureBody}><p className={styles.bodyCopy}>{locale === "ko" ? "AMM 교환은 이번 후보 범위에 포함되지 않습니다." : "AMM swaps are not included in this candidate."}</p></div>
        </details>

        <section className={styles.card} aria-labelledby="labs-badge-title">
          <div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3 id="labs-badge-title">{locale === "ko" ? "기념 배지 시뮬레이션" : "Souvenir badge simulation"}</h3><p>{state.stamps}/10</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "열 번째 시뮬레이션 방문 기록을 기념하는 선택 기능입니다. 신원, 국적, 19+ 또는 부정적 평판은 공개 정보에 넣지 않습니다." : "An optional souvenir for the tenth simulated visit record. Identity, nationality, 19+, and negative reputation are not included in public metadata."}</p>
          {state.stamps < 10 ? <InlineNotice tone="neutral"><span>{locale === "ko" ? "서로 다른 시뮬레이션 방문 기록 열 개를 남긴 뒤 선택할 수 있어요." : "This becomes optional after ten distinct simulated visit records."}</span></InlineNotice> : null}
          {state.stamps === 10 && mint !== "NFT-MINTED" ? <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setMint(event.target.checked ? "NFT-OPTED-IN" : "NFT-ELIGIBLE") }} /> <span>{locale === "ko" ? "공개 기념 배지 시뮬레이션에 동의해요." : "I consent to the public badge simulation."}</span></label> : null}
          {state.stamps === 10 && mint !== "NFT-MINTED" ? <button type="button" className={styles.primary} onClick={mintBadge} disabled={!consent || wallet !== "WAL-READY" || mint === "NFT-MINTING"} data-testid="labs-badge-mint">{wallet !== "WAL-READY" ? locale === "ko" ? "서명 기능 연결 필요" : "Signer connection required" : mint === "NFT-MINTING" ? locale === "ko" ? "시뮬레이션 중" : "Simulating" : locale === "ko" ? "시뮬레이션 시작" : "Start simulation"}</button> : null}
          {mint === "NFT-MINTED" ? <InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "기념 배지 시뮬레이션 완료 · 실제 NFT나 거래는 생성되지 않았습니다." : "Badge simulation complete. No real NFT or transaction was created."}</span></InlineNotice> : null}
          {mint === "NFT-FAILED" ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "기념 배지 시뮬레이션을 완료하지 못했어요. 공개 기록은 생성되지 않았습니다." : "Badge simulation did not complete. No public record was created."}</span></InlineNotice> : null}
        </section>
      </main>
    </Sheet>
  )
}
