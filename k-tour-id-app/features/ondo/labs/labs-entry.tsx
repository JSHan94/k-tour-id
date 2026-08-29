"use client"

import { useEffect, useMemo, useRef, useState, type ComponentProps, type RefObject } from "react"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronRight, CircleDollarSign, FlaskConical, Link2, ShieldCheck, WalletCards } from "lucide-react"
import { estimatedUsdTotal, type BridgePhase } from "../contracts/commerce"
import { InlineNotice, SheetB } from "../shared/ui/sheet-b"
import { useOndoB } from "../shared/state/ondo-b-provider"
import { useBActivityProfile } from "../identity-b/activity-profile-b-provider"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"
import { readQaScenario, useQaControls } from "../shared/ui/use-qa-controls"
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

const B_LABS_SESSION_KEY = "ondo-b.labs.v1"
const WALLET_STATES = new Set<WalletState>(["WAL-DISCONNECTED", "WAL-CONNECTING", "WAL-READY", "WAL-FAILED"])
const BRIDGE_STATES = new Set<BridgeState>(["BRG-IDLE", "BRG-QUOTED", "BRG-CONFIRMING", "BRG-PENDING", "BRG-SIMULATED-SUCCESS", "BRG-FAILED", "BRG-CANCELLED", "BRG-EXPIRED"])
const BRIDGE_PHASES = new Set<BridgePhase>(["none", "source_submitted", "source_confirmed", "relaying", "destination_confirmed"])
const MINT_STATES = new Set<MintState>(["NFT-LOCKED", "NFT-ELIGIBLE", "NFT-OPTED-IN", "NFT-MINTING", "NFT-MINTED", "NFT-FAILED"])
const TRAIT_RETRY_STATES = new Set<TraitRetryState>(["idle", "checking", "eligible", "failed"])
const BRIDGE_NO_PHASE_STATES = new Set<BridgeState>(["BRG-IDLE", "BRG-QUOTED", "BRG-CONFIRMING", "BRG-CANCELLED", "BRG-EXPIRED"])
const BRIDGE_IN_FLIGHT_PHASES = new Set<BridgePhase>(["source_submitted", "source_confirmed", "relaying"])

type LocalizedLabsCopy = Record<OndoBLocale, string>

function labsCopy(locale: OndoBLocale, ko: string, en: string, ja: string) {
  return ({ ko, en, ja } satisfies LocalizedLabsCopy)[locale]
}

function coherentBridgeRestore(bridge: BridgeState | undefined, phase: BridgePhase | undefined) {
  if (!bridge && !phase) return { bridge: undefined, phase: undefined }
  if (!bridge) return { bridge: "BRG-IDLE" as const, phase: "none" as const }
  if (BRIDGE_NO_PHASE_STATES.has(bridge)) {
    return phase == null || phase === "none"
      ? { bridge, phase: "none" as const }
      : { bridge: "BRG-IDLE" as const, phase: "none" as const }
  }
  if (bridge === "BRG-SIMULATED-SUCCESS") {
    return phase === "destination_confirmed"
      ? { bridge, phase }
      : { bridge: "BRG-IDLE" as const, phase: "none" as const }
  }
  if (bridge === "BRG-PENDING" || bridge === "BRG-FAILED") {
    return phase != null && BRIDGE_IN_FLIGHT_PHASES.has(phase)
      ? { bridge, phase }
      : { bridge: "BRG-IDLE" as const, phase: "none" as const }
  }
  return { bridge: "BRG-IDLE" as const, phase: "none" as const }
}

const TRAIT_DISPLAY = {
  "offer-foreign-card": {
    key: "seongsu-card",
    place: { ko: "성수 돼지국밥", en: "Seongsu Dwaeji Gukbap", ja: "聖水テジクッパ" },
    condition: { ko: "해외 발급 카드 안내", en: "Foreign-issued card information", ja: "海外発行カードの案内" },
    policy: { ko: "카드 이용 정책", en: "Card acceptance policy", ja: "カード利用ポリシー" },
  },
  "offer-over19": {
    key: "euljiro-over19",
    place: { ko: "을지로 노가리", en: "Euljiro Nogari", ja: "乙支路ノガリ" },
    condition: { ko: "19세 이상 이용 조건", en: "19+ access condition", ja: "19歳以上の利用条件" },
    policy: { ko: "야간 이용 정책", en: "Night access policy", ja: "夜間利用ポリシー" },
  },
} satisfies Record<string, {
  key: string
  place: LocalizedLabsCopy
  condition: LocalizedLabsCopy
  policy: LocalizedLabsCopy
}>

function readLabsSession(sessionKey: string): Partial<LabsSession> {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(sessionKey) ?? "{}") as unknown
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {}
    const value = raw as Record<string, unknown>
    const wallet = typeof value.wallet === "string" && WALLET_STATES.has(value.wallet as WalletState) ? value.wallet as WalletState : undefined
    const bridgeCandidate = typeof value.bridge === "string" && BRIDGE_STATES.has(value.bridge as BridgeState) ? value.bridge as BridgeState : undefined
    const phaseCandidate = typeof value.phase === "string" && BRIDGE_PHASES.has(value.phase as BridgePhase) ? value.phase as BridgePhase : undefined
    const { bridge, phase } = coherentBridgeRestore(bridgeCandidate, phaseCandidate)
    const mint = typeof value.mint === "string" && MINT_STATES.has(value.mint as MintState) ? value.mint as MintState : undefined
    const traitStates = value.traitStates != null && typeof value.traitStates === "object" && !Array.isArray(value.traitStates)
      ? Object.fromEntries(Object.entries(value.traitStates as Record<string, unknown>)
          .filter((entry): entry is [string, TraitRetryState] => typeof entry[1] === "string" && TRAIT_RETRY_STATES.has(entry[1] as TraitRetryState))
          .slice(0, 20))
      : undefined
    return {
      acknowledged: value.acknowledged === true,
      wallet,
      bridge,
      phase,
      mint,
      consent: value.consent === true,
      quoteExpiresAt: typeof value.quoteExpiresAt === "number" && Number.isFinite(value.quoteExpiresAt) ? value.quoteExpiresAt : undefined,
      traitStates,
    }
  } catch {
    return {}
  }
}

const BRIDGE_COPY: Record<Exclude<BridgePhase, "none">, LocalizedLabsCopy> = {
  source_submitted: { ko: "출발 체인 제출됨 · 시뮬레이션", en: "Source submitted · Simulated", ja: "送信元チェーンに提出済み · シミュレーション" },
  source_confirmed: { ko: "출발 체인 확인됨 · 도착 전", en: "Source confirmed · Destination pending", ja: "送信元チェーンで確認済み · 到着待ち" },
  relaying: { ko: "전달 단계 · 시뮬레이션", en: "Relaying · Simulated", ja: "中継中 · シミュレーション" },
  destination_confirmed: { ko: "도착 단계 확인됨 · 시뮬레이션", en: "Destination confirmed · Simulated", ja: "送信先で確認済み · シミュレーション" },
}

const B_BRIDGE_COPY: Record<Exclude<BridgePhase, "none">, LocalizedLabsCopy> = {
  source_submitted: { ko: "출발 단계 준비됨", en: "Source step ready", ja: "送信元ステップ準備完了" },
  source_confirmed: { ko: "출발 단계 확인됨 · 도착 대기", en: "Source confirmed · Destination pending", ja: "送信元を確認・到着待ち" },
  relaying: { ko: "경로 확인 중", en: "Checking route", ja: "経路を確認中" },
  destination_confirmed: { ko: "도착 단계 확인됨", en: "Destination step confirmed", ja: "送信先ステップ確認済み" },
}

type LabsOriginTab = "ondo" | "my" | "tables" | "id" | "settings"

type LabsEntryCoreProps = {
  locale: OndoBLocale
  originTab: LabsOriginTab
  stamps: number
  provider: "legacy" | "b"
  sessionKey: string
  onDismiss(): void
}

export function LabsEntryB() {
  const { state, actions } = useOndoB()
  const { state: activity } = useBActivityProfile()
  return (
    <LabsEntryCore
      locale={state.locale}
      originTab={state.tab}
      stamps={activity.stamps}
      provider="b"
      sessionKey={B_LABS_SESSION_KEY}
      onDismiss={() => actions.setSurface({ kind: "map" })}
    />
  )
}

export function LabsEntryCore({ locale, originTab: originTabValue, stamps, provider, sessionKey, onDismiss }: LabsEntryCoreProps) {
  const qaControls = useQaControls()
  const originTab = useRef(originTabValue).current
  const originOpener = useRef<HTMLElement | null>(
    typeof document !== "undefined"
      && document.activeElement instanceof HTMLElement
      && document.activeElement !== document.body
      && document.activeElement !== document.documentElement
      ? document.activeElement
      : null,
  )
  const [acknowledged, setAcknowledged] = useState(false)
  const [wallet, setWallet] = useState<WalletState>("WAL-DISCONNECTED")
  const [bridge, setBridge] = useState<BridgeState>("BRG-IDLE")
  const [phase, setPhase] = useState<BridgePhase>("none")
  const [mint, setMint] = useState<MintState>(stamps === 10 ? "NFT-ELIGIBLE" : "NFT-LOCKED")
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
  const text = (ko: string, en: string, ja: string) => labsCopy(locale, ko, en, ja)
  const labsLabel = text("기술 실험실", "Labs", "技術ラボ")
  const badgeBody = provider === "b"
    ? text(
        "이 브라우저에서 활동이 기록된 서로 다른 장소 열 곳을 기념하는 선택 기능입니다. 장소 조회·로컬 시그널·OOKRW Test 영수증 중 하나가 있으면 한 번만 셉니다.",
        "An optional souvenir for local activity across ten different places in this browser. A place counts once when it has a view, Local Signal, or OOKRW Test receipt.",
        "このブラウザでローカル活動が記録された異なる10か所を記念する任意機能です。閲覧、ローカルシグナル、OOKRW Testレシートのいずれかがある場所を1回だけ数えます。",
      )
    : text(
        "열 번째 시뮬레이션 방문 기록을 기념하는 선택 기능입니다. 신원, 국적, 19+ 또는 부정적 평판은 공개 정보에 넣지 않습니다.",
        "An optional souvenir for the tenth simulated visit record. Identity, nationality, 19+, and negative reputation are not included in public metadata.",
        "10件目の訪問記録を記念する任意のシミュレーションです。本人情報、国籍、19歳以上の情報、否定的な評価は公開メタデータに含まれません。",
      )
  const badgeRequirement = provider === "b"
    ? text(
        "이 브라우저에서 활동한 서로 다른 장소 열 곳을 채우면 선택할 수 있어요.",
        "This becomes optional after local activity across ten different places in this browser.",
        "このブラウザでローカル活動がある場所が10か所になると選べます。",
      )
    : text(
        "서로 다른 시뮬레이션 방문 기록 열 개를 남긴 뒤 선택할 수 있어요.",
        "This becomes optional after ten distinct simulated visit records.",
        "異なる訪問記録を10件残すと選べるようになります。",
      )

  function focusAfterTransition(target: RefObject<HTMLElement | null>) {
    window.requestAnimationFrame(() => target.current?.focus())
  }

  useEffect(() => {
    const stored = readLabsSession(sessionKey)
    if (stored.acknowledged === true) setAcknowledged(true)
    if (stored.wallet && stored.wallet !== "WAL-CONNECTING") setWallet(stored.wallet)
    if (stored.bridge) setBridge(stored.bridge === "BRG-PENDING" ? "BRG-FAILED" : stored.bridge)
    if (stored.phase) setPhase(stored.phase)
    if (stamps === 10 && stored.mint && stored.mint !== "NFT-MINTING") setMint(stored.mint)
    if (stamps === 10 && stored.consent === true) setConsent(true)
    if (typeof stored.quoteExpiresAt === "number") setQuoteExpiresAt(stored.quoteExpiresAt)
    if (stored.traitStates && typeof stored.traitStates === "object") setTraitStates(stored.traitStates)
    sessionWasRestored.current = true
    setSessionLoaded(true)
  }, [sessionKey, stamps])

  useEffect(() => {
    if (!sessionLoaded || !sessionWasRestored.current) return
    const snapshot: LabsSession = { acknowledged, wallet, bridge, phase, mint, consent, quoteExpiresAt, traitStates }
    try {
      window.sessionStorage.setItem(sessionKey, JSON.stringify(snapshot))
    } catch {
      // Labs remains a usable in-memory preview when session storage is blocked.
    }
  }, [acknowledged, bridge, consent, mint, phase, quoteExpiresAt, sessionKey, sessionLoaded, traitStates, wallet])

  useEffect(() => {
    if (stamps === 10 && mint === "NFT-LOCKED") setMint("NFT-ELIGIBLE")
    if (stamps < 10 && mint !== "NFT-LOCKED") {
      setMint("NFT-LOCKED")
      setConsent(false)
    }
  }, [mint, stamps])

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
    onDismiss()
    window.setTimeout(() => {
      if (opener?.isConnected && opener !== document.body && opener !== document.documentElement) opener.focus({ preventScroll: true })
      else document.querySelector<HTMLElement>(originTab === "id" ? "[data-testid='open-labs-id']" : "[data-testid='open-labs-milestone'], [data-testid='open-labs']")?.focus({ preventScroll: true })
    }, 120)
  }

  const returnLabel = originTab === "id"
    ? locale === "ko" ? "ID로 돌아가기" : locale === "ja" ? "IDに戻る" : "Return to ID"
    : originTab === "my"
      ? locale === "ko" ? "My Korea로 돌아가기" : locale === "ja" ? "マイ韓国に戻る" : "Return to My Korea"
      : locale === "ko" ? "이전 탭으로 돌아가기" : locale === "ja" ? "前のタブに戻る" : "Return to previous tab"

  function connectWallet() {
    setWallet("WAL-CONNECTING")
    window.setTimeout(() => {
      const fail = readQaScenario() === "labs-wallet-fail"
      setWallet(fail ? "WAL-FAILED" : "WAL-READY")
    }, 480)
  }

  function quoteBridge() {
    setMismatch(false)
    setPhase("none")
    const expiredFixture = readQaScenario() === "bridge-expired"
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
    const fail = readQaScenario() === "bridge-failed" && phase === "source_confirmed"
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
      const fails = readQaScenario() === "trait-retry-fail"
      setTraitStates((current) => ({ ...current, [key]: fails ? "failed" : "eligible" }))
    }, 420)
  }

  function mintBadge() {
    if (stamps !== 10 || wallet !== "WAL-READY" || !consent) return
    setMint("NFT-MINTING")
    window.setTimeout(() => {
      const fail = readQaScenario() === "mint-failed"
      setMint(fail ? "NFT-FAILED" : "NFT-MINTED")
    }, 520)
  }

  if (!acknowledged) {
    return (
      <LabsSheet provider={provider} locale={locale} label={labsLabel} onClose={close} size="full">
        <div className={styles.boundary}>
          <span className={styles.labMark}><FlaskConical size={24} /></span>
          <p className={styles.eyebrow}>{provider === "b" ? text("기기 내 도구", "ON-DEVICE TOOLS", "端末内ツール") : text("기술 실험실 · 시뮬레이션", "LABS · SIMULATED", "技術ラボ · シミュレーション")}</p>
          <h2>{labsLabel}</h2>
          <p>{provider === "b" ? text("지갑 준비, 경로 확인, 여행 기념 도구를 한곳에서 살펴보세요.", "Explore wallet preparation, route checks, and travel keepsakes in one place.", "ウォレット準備、経路確認、旅の記念ツールをひとつの場所で確認できます。") : text("기술 가설을 보여주는 실험 영역입니다. 실제 자산 이동이나 운영 서비스가 아닙니다.", "This is an experimental area for technical hypotheses. It does not move real assets or represent a production service.", "技術的な仮説を体験する実験エリアです。実際の資産移動や運用中のサービスではありません。")}</p>
          <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{provider === "b"
            ? text("이 기기에서만 동작하며 돈·계정·제공자·네트워크에 연결하지 않습니다.", "Runs only on this device; no money, account, provider, or network is connected.", "この端末内だけで動作し、お金・アカウント・プロバイダー・ネットワークには接続しません。")
            : qaControls
            ? text("지갑, 잔고, 체인 연결과 기념 배지 결과는 반복해도 같은 테스트용 미리보기입니다.", "Wallet, balance, bridge, and badge results here are deterministic fixtures.", "ウォレット、残高、チェーン接続、記念バッジの結果は、何度試しても同じテスト用プレビューです。")
            : text("지갑, 잔고, 체인 연결과 기념 배지는 모두 재현 가능한 미리보기 결과입니다.", "Wallet, balance, bridge, and badge results are reproducible previews.", "ウォレット、残高、チェーン接続、記念バッジは、すべて再現可能なプレビューです。")}</span></InlineNotice>
          <button type="button" className={styles.primary} onClick={() => setAcknowledged(true)} data-testid="labs-acknowledge">{text("이해하고 보기", "I understand", "内容を確認して見る")}</button>
          <button type="button" className={styles.textButton} onClick={close}>{returnLabel}</button>
        </div>
      </LabsSheet>
    )
  }

  const canDisconnect = wallet !== "WAL-CONNECTING" && bridge !== "BRG-PENDING"
  const phaseCopy = phase === "none" ? null : (provider === "b" ? B_BRIDGE_COPY : BRIDGE_COPY)[phase][locale]
  const walletOutcomeId = "labs-wallet-outcome"

  return (
    <LabsSheet provider={provider} locale={locale} label={labsLabel} onClose={close} showClose={false} size="full">
      <div className={styles.body} data-wallet-state={wallet} data-bridge-state={bridge} data-bridge-phase={phase} data-mint-state={mint} data-testid="labs-overlay">
        <header className={styles.header}>
          <button type="button" data-sheet-initial-focus onClick={close} aria-label={returnLabel}><ArrowLeft size={20} /></button>
          <div><p className={styles.eyebrow}>{provider === "b" ? text("기기 내 도구", "ON-DEVICE TOOLS", "端末内ツール") : text("기술 실험실 · 시뮬레이션", "LABS · SIMULATED", "技術ラボ · シミュレーション")}</p><h2>{labsLabel}</h2></div>
          <span className={styles.truthBadge}>{provider === "b" ? text("로컬", "LOCAL", "ローカル") : text("시뮬레이션", "SIMULATED", "シミュレーション")}</span>
        </header>

        <InlineNotice tone="neutral"><ShieldCheck size={18} /><span>{provider === "b" ? text("돈·계정·제공자·네트워크에 연결하지 않습니다.", "No money, account, provider, or network is connected.", "お金・アカウント・プロバイダー・ネットワークには接続しません。") : text("실제 자산 이동이나 운영 서비스가 아닙니다.", "No real assets move and this is not a production service.", "実際の資産移動はなく、運用中のサービスでもありません。")}</span></InlineNotice>

        <section className={styles.card} aria-labelledby="labs-signer-title">
          <div className={styles.sectionHeading}><span><WalletCards size={18} /></span><div><h3 id="labs-signer-title">{text("Sui zkLogin · 서명 방식 식별자", "Sui zkLogin signer", "Sui zkLogin · 署名方式")}</h3><p>{provider === "b" ? text("Sui Testnet · 기기 내 경로", "Sui Testnet · on-device route", "Sui Testnet・端末内ルート") : text("대상 네트워크: Sui Testnet · 시뮬레이션", "Target network: Sui Testnet · Simulated", "対象ネットワーク：Sui Testnet · シミュレーション")}</p></div></div>
          <p className={styles.bodyCopy}>{text("Sui 주소와 트랜잭션 서명 경로를 보여줍니다. ONDO 계정, 본인 확인(KYC) 또는 멀티체인 지갑을 만들지는 않습니다.", "Shows a Sui address and transaction-signing route. It does not create an ONDO account, KYC, or multichain wallet.", "Suiアドレスとトランザクションの署名経路を表示します。ONDOアカウント、本人確認（KYC）、マルチチェーンウォレットは作成されません。")}</p>
          {wallet === "WAL-READY" ? <div><small className={styles.identifierLabel}>{provider === "b" ? text("서명 주소", "Signer address", "署名アドレス") : text("미리보기 주소 식별자", "Preview address identifier", "プレビュー用アドレス識別子")}</small><code className={styles.address}>{qaControls ? "0x8a71…ondo_fixture" : "0x8a71…ondo_preview"}</code></div> : null}
          {wallet === "WAL-FAILED" ? <div id={walletOutcomeId} className={styles.walletOutcome} role="alert" aria-atomic="true" data-testid="labs-wallet-outcome"><AlertTriangle size={17} /><span>{provider === "b"
            ? text("서명 준비를 완료하지 못했어요. 아무것도 제출되지 않았습니다.", "Signer preparation did not complete. Nothing was submitted.", "署名の準備を完了できませんでした。何も送信されていません。")
            : qaControls
              ? text("테스트용 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다.", "The test connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected.", "テスト接続を完了できませんでした。ONDOアカウント、本人確認（KYC）、マルチチェーンウォレット、実際の資産・取引・アカウントには影響ありません。")
              : text("미리보기 연결을 완료하지 못했어요. ONDO 계정, 본인 확인(KYC), 멀티체인 지갑, 실제 자산, 거래 또는 실제 계정에는 아무 영향이 없습니다.", "The preview connection did not complete. No ONDO account, KYC, multichain wallet, real asset, transaction, or real account was affected.", "プレビュー接続を完了できませんでした。ONDOアカウント、本人確認（KYC）、マルチチェーンウォレット、実際の資産・取引・アカウントには影響ありません。")}</span></div> : null}
          {wallet === "WAL-DISCONNECTED" || wallet === "WAL-FAILED" ? <button ref={walletRetryRef} type="button" className={styles.secondary} onClick={connectWallet} aria-describedby={wallet === "WAL-FAILED" ? walletOutcomeId : undefined} data-testid="labs-connect-wallet">{wallet === "WAL-FAILED"
            ? text("다시 시도", "Try again", "もう一度試す")
            : provider === "b"
              ? text("서명 준비", "Prepare signer", "署名を準備")
              : qaControls
              ? text("서명 기능 연결 시뮬레이션", "Simulate signer connection", "署名機能の接続をシミュレーション")
              : text("미리보기 서명 기능 연결", "Connect preview signer", "プレビュー用署名機能を接続")}</button> : null}
          {wallet === "WAL-CONNECTING" ? <button type="button" className={styles.secondary} aria-busy="true" disabled>{text("연결 중", "Connecting", "接続中")}</button> : null}
          {wallet === "WAL-READY" ? <button type="button" className={styles.textButton} disabled={!canDisconnect} onClick={() => setWallet("WAL-DISCONNECTED")}>{text("연결 해제", "Disconnect", "接続を解除")}</button> : null}
        </section>

        <section className={styles.card} aria-labelledby="labs-assets-title">
          <div className={styles.sectionHeading}><span><CircleDollarSign size={18} /></span><div><h3 id="labs-assets-title">{text("자산별 잔고", "Balances by asset", "資産別残高")}</h3><p>{text(`예상 USD 환산액 · $${estimatedTotal.toFixed(2)}`, `Estimated USD value · $${estimatedTotal.toFixed(2)}`, `推定USD換算額 · $${estimatedTotal.toFixed(2)}`)}</p></div></div>
          <div className={styles.assetList}>
            {LABS_ASSETS.map((asset) => <div key={asset.id} className={styles.assetRow}><div><strong>{asset.symbol}</strong><span>{text(
              `네트워크 식별자: ${asset.chain} · ${asset.representation === "native" ? "기본형" : asset.representation === "wrapped" ? "연결형" : "테스트 토큰"}`,
              `${asset.chain} · ${asset.representation.replace("_", " ")}`,
              `ネットワーク：${asset.chain} · ${asset.representation === "native" ? "ネイティブ" : asset.representation === "wrapped" ? "ブリッジ形式" : "テストトークン"}`,
            )}</span></div><div><strong>{asset.symbol === "OOKRW" ? Number(asset.amount).toLocaleString("en-US") : asset.amount}</strong>{asset.estimatedUsd ? <span>≈ ${asset.estimatedUsd}</span> : <span>{text("USD 환산 없음", "No USD estimate", "USD換算なし")}</span>}</div></div>)}
          </div>
          <p className={styles.finePrint}>{text("USDC·USDT·OOKRW는 자산 식별자입니다. USDC와 USDT는 서로 다른 자산으로 보관하며, OOKRW 테스트 토큰은 KRW 상환이나 1:1 가치를 보증하지 않습니다.", "USDC and USDT remain separate assets. OOKRW test token does not guarantee KRW redemption or 1:1 value.", "USDC・USDT・OOKRWは資産の識別子です。USDCとUSDTは別々の資産として保持され、OOKRWテストトークンはKRWへの償還や1:1の価値を保証しません。")}</p>
        </section>

        <section className={styles.card} aria-labelledby="labs-bridge-title">
          <div className={styles.sectionHeading}><span><Link2 size={18} /></span><div><h3 id="labs-bridge-title">{provider === "b" ? text("체인 경로 확인", "Chain route check", "チェーン経路チェック") : text("체인 연결 가설 시뮬레이션", "Bridge hypothesis simulation", "チェーン接続仮説のシミュレーション")}</h3><p>{provider === "b" ? text("Sui Testnet → OmniOne", "Sui Testnet → OmniOne", "Sui Testnet → OmniOne") : text("경로 식별자: Sui Testnet → OmniOne · 가설", "Sui Testnet → OmniOne hypothesis", "経路：Sui Testnet → OmniOne · 仮説")}</p></div></div>
          <InlineNotice tone="warm"><AlertTriangle size={17} /><span>{text("Sui↔OmniOne 경로는 연결되어 있지 않습니다.", "No Sui↔OmniOne route is connected.", "Sui↔OmniOneの経路は接続されていません。")}</span></InlineNotice>
          <div className={styles.route}><span>13.50 USDT</span><ArrowRight size={18} /><span>13,460 OOKRW</span></div>
          {phaseCopy ? <div ref={progressRef} className={styles.progress} role="status" aria-live="polite" tabIndex={-1}><span className={phase === "destination_confirmed" ? styles.completeDot : styles.pendingDot} /><strong>{phaseCopy}</strong></div> : null}
          {bridge === "BRG-IDLE" || bridge === "BRG-FAILED" || bridge === "BRG-CANCELLED" || bridge === "BRG-EXPIRED" ? <button ref={quoteButtonRef} type="button" className={styles.primary} onClick={quoteBridge} disabled={wallet !== "WAL-READY"} data-testid="labs-bridge-quote">{wallet === "WAL-READY"
            ? bridge === "BRG-EXPIRED"
              ? text("새 예상 조건 받기", "Get a new quote", "新しい見積もりを取得")
              : text("예상 조건 보기", "View quote", "見積もりを見る")
            : text("서명 기능 연결 후 예상 조건 보기", "Connect signer for quote", "署名機能を接続して見積もりを見る")}</button> : null}
          {bridge === "BRG-QUOTED" ? <><div className={styles.quote} data-testid="labs-quote"><span>{text("예상 경로 수수료", "Estimated route fee", "推定経路手数料")}</span><strong>$0.04</strong><small>{quoteExpiresAt != null && quoteExpiresAt <= Date.now()
            ? provider === "b" ? text("예상 조건 만료", "Quote expired", "見積もり期限切れ") : text("예상 조건 만료 · 시뮬레이션", "Quote expired · Simulated", "見積もり期限切れ · シミュレーション")
            : provider === "b" ? text("최대 2분 동안 유효", "Valid for up to 2 min", "最長2分間有効") : text("최대 2분 동안 유효 · 시뮬레이션", "Valid for up to 2 min · Simulated", "最長2分間有効 · シミュレーション")}</small></div><button ref={confirmButtonRef} type="button" className={styles.primary} onClick={confirmBridge} data-testid="labs-bridge-confirm">{text("예상 조건 확인", "Confirm quote", "見積もりを確認")}</button><button type="button" className={styles.secondary} onClick={cancelBridge} data-testid="labs-bridge-cancel">{text("취소", "Cancel", "キャンセル")}</button></> : null}
          {bridge === "BRG-CONFIRMING" ? <><button ref={submitButtonRef} type="button" className={styles.primary} onClick={submitBridge} data-testid="labs-bridge-submit">{provider === "b" ? text("경로 확인 시작", "Run route check", "経路チェックを開始") : text("체인 연결 시뮬레이션 시작", "Start bridge simulation", "ブリッジのシミュレーションを開始")}</button><button type="button" className={styles.secondary} onClick={cancelBridge} data-testid="labs-bridge-cancel">{text("취소", "Cancel", "キャンセル")}</button></> : null}
          {bridge === "BRG-PENDING" && qaControls ? <button ref={advanceButtonRef} type="button" className={styles.primary} onClick={advanceBridge} data-testid="labs-bridge-advance">{provider === "b" ? text("다음 단계", "Next step", "次のステップ") : text("다음 테스트 단계", "Advance fixture phase", "次のテスト段階へ")}<ChevronRight size={17} /></button> : null}
          {bridge === "BRG-SIMULATED-SUCCESS" ? <><div role="status" aria-live="polite"><InlineNotice tone="success"><Check size={18} /><span>{provider === "b" ? text("도착 단계까지 확인했어요. 잔고는 그대로입니다.", "Route check reached the destination step. Balances remain unchanged.", "送信先ステップまで確認しました。残高は変わりません。") : text("도착 단계까지 확인된 시뮬레이션입니다. 실제 자산은 바뀌지 않았습니다.", "The simulation reached destination confirmation. No real assets changed.", "送信先での確認まで完了したシミュレーションです。実際の資産は変更されていません。")}</span></InlineNotice></div><div ref={bridgeReceiptRef} className={styles.bridgeReceipt} data-testid="labs-bridge-receipt" tabIndex={-1}><strong>{text("예상 전후 · 읽기 전용", "Projected before and after · Read only", "推定前後 · 閲覧のみ")}</strong><span>{text("Sui Testnet의 USDT", "USDT on Sui Testnet", "Sui TestnetのUSDT")} <b>13.50 → 0.00</b></span><span>{provider === "b" ? text("OmniOne의 OOKRW", "OOKRW on OmniOne", "OmniOneのOOKRW") : text("OmniOne 가설의 OOKRW", "OOKRW on OmniOne hypothesis", "OmniOne仮説のOOKRW")} <b>18,000 → 31,460</b></span><small>{text("실제 잔고나 거래는 변경되지 않았습니다.", "Actual balances and transactions were not changed.", "実際の残高や取引は変更されていません。")}</small></div></> : null}
          {bridge === "BRG-FAILED" ? <div role="alert"><InlineNotice tone="danger"><AlertTriangle size={17} /><span>{provider === "b" ? text("경로 확인을 완료하지 못했어요. 잔고는 그대로이며 새 예상 조건으로 다시 시작할 수 있어요.", "Route check did not complete. Balances remain unchanged; start again with a fresh quote.", "経路チェックを完了できませんでした。残高は変わらず、新しい見積もりでやり直せます。") : text("시뮬레이션 실패 · 현재 단계와 모든 잔고는 그대로예요. 새 예상 조건으로 다시 시작할 수 있습니다.", "Simulation failed. The current phase and every balance remain unchanged. You can restart with a fresh quote.", "シミュレーションに失敗しました。現在の段階とすべての残高は変わっていません。新しい見積もりでやり直せます。")}</span></InlineNotice></div> : null}
          {bridge === "BRG-CANCELLED" ? <div role="status" aria-live="polite"><InlineNotice tone="neutral"><span>{provider === "b" ? text("경로 확인을 취소했어요. 잔고는 그대로입니다.", "Route check cancelled. Balances remain unchanged.", "経路チェックをキャンセルしました。残高は変わりません。") : text("시뮬레이션을 취소했어요. 잔고는 바뀌지 않았으며, 새 예상 조건으로 다시 시작할 수 있습니다.", "Simulation cancelled. Balances did not change, and you can restart with a fresh quote.", "シミュレーションをキャンセルしました。残高は変わっていません。新しい見積もりでやり直せます。")}</span></InlineNotice></div> : null}
          {bridge === "BRG-EXPIRED" ? <InlineNotice tone="warm"><AlertTriangle size={17} /><span>{text("예상 조건이 만료되어 제출하지 않았어요. 새 예상 조건을 받아 계속해 주세요.", "The quote expired, so nothing was submitted. Get a new quote to continue.", "見積もりの有効期限が切れたため、送信されませんでした。新しい見積もりを取得して続けてください。")}</span></InlineNotice> : null}
          {qaControls ? <button type="button" className={styles.inlineLink} onClick={() => setMismatch((current) => !current)}>{text("예상 조건 불일치 예시 보기", "View quote mismatch example", "見積もり不一致の例を見る")}</button> : null}
          {qaControls && mismatch ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{text("자산·체인·금액이 예상 조건과 달라 진행하지 않았어요.", "The asset, chain, or amount did not match the quote, so nothing was submitted.", "資産・チェーン・金額が見積もりと一致しないため、送信されませんでした。")}</span></InlineNotice> : null}
        </section>

        <details className={`${styles.card} ${styles.disclosure}`} open={qaControls || undefined}>
          <summary className={styles.disclosureSummary}><div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3>{text("증거 변환 경계", "Evidence adapter boundaries", "証明データ変換の境界")}</h3><p>{text("계약 명세만 제공 · 기술 세부정보", "CONTRACT ONLY · Technical details", "契約仕様のみ · 技術詳細")}</p></div></div><ChevronRight size={18} /></summary>
          <div className={styles.disclosureBody}>
            <p className={styles.bodyCopy}>{text("OpenDID와 EAS는 표준 식별자입니다. 두 표준의 증거를 각각 변환한 뒤 하나의 공통 형식으로 맞춥니다. EAS 연동은 설계만 있고 아직 구현되지 않았습니다.", "OpenDID and EAS remain separate adapters normalized into a canonical envelope. A live EAS implementation is deferred.", "OpenDIDとEASは別々の標準として扱い、それぞれの証明データを共通形式に変換します。EASとの実接続は設計段階で、まだ実装されていません。")}</p>
            <div className={styles.evidenceList}>{EVIDENCE_FIXTURES.map((evidence) => <article key={evidence.id}><span>{text(`표준 식별자: ${evidence.sourceStandard}`, evidence.sourceStandard, `標準：${evidence.sourceStandard}`)}</span><strong>{text(
              evidence.claimType === "person" ? "본인 확인" : evidence.claimType === "visit" ? "방문 기록" : evidence.claimType === "age_over_19" ? "19+ 확인" : "상점 이용 조건",
              evidence.claimType.replace("_", " "),
              evidence.claimType === "person" ? "本人確認" : evidence.claimType === "visit" ? "訪問記録" : evidence.claimType === "age_over_19" ? "19歳以上の確認" : "店舗の利用条件",
            )}</strong><small>{text(`${evidence.sourceStandard} 변환 규칙 · 계약 명세만 제공`, `${evidence.sourceStandard} adapter · ${evidence.provenance.truth}`, `${evidence.sourceStandard}変換ルール · 契約仕様のみ`)}</small></article>)}</div>
          </div>
        </details>

        <section className={styles.card} aria-labelledby="labs-traits-title">
          <div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3 id="labs-traits-title">{text("상점 이용 조건", "Merchant access conditions", "店舗の利用条件")}</h3><p>{text("계약 명세만 제공", "CONTRACT ONLY", "契約仕様のみ")}</p></div></div>
          {TRAIT_FIXTURES.map((trait) => {
            const key = `${trait.merchantId}:${trait.offerId}`
            const retryState = traitStates[key] ?? "idle"
            const display = TRAIT_DISPLAY[trait.offerId as keyof typeof TRAIT_DISPLAY]
            const status = retryState === "checking"
              ? text("다시 확인 중", "Checking again", "再確認中")
              : retryState === "eligible"
                ? text("조건 충족", "Condition met", "条件を満たしています")
                : retryState === "failed"
                  ? text("여전히 확인 불가", "Still unavailable", "引き続き確認できません")
                  : trait.result === "stale"
                    ? text("확인 기한 지남", "Out of date", "確認期限切れ")
                    : text("확인 불가", "Unavailable", "確認できません")
            const checkedAt = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(trait.checkedAt))
            return <article className={styles.traitRow} key={key} data-trait-state={retryState} data-testid={`trait-${display.key}`} aria-labelledby={`trait-${display.key}-place`}>
              <header className={styles.traitHeading}><strong id={`trait-${display.key}-place`}>{display.place[locale]}</strong><span>{display.condition[locale]}</span></header>
              <dl className={styles.traitFacts}><div><dt>{text("상태", "Status", "状態")}</dt><dd>{status}</dd></div><div><dt>{text("확인 시각", "Checked at", "確認日")}</dt><dd>{checkedAt}</dd></div><div><dt>{text("조건 범위", "Condition scope", "条件の範囲")}</dt><dd>{display.policy[locale]} · {text("계약 명세만 제공", "Contract only", "契約仕様のみ")}</dd></div></dl>
              <InlineNotice tone={retryState === "eligible" ? "success" : trait.result === "error" || retryState === "failed" ? "danger" : "warm"}>{retryState === "eligible" ? <Check size={17} /> : <AlertTriangle size={17} />}<span>{retryState === "eligible"
                ? text("이 특정 이용 조건은 충족됩니다. 장소 전체의 이용 가능 여부는 별도로 확인해 주세요.", "This specific access condition is met. Confirm overall venue availability separately.", "この利用条件は満たしています。店舗全体の利用可否は別途ご確認ください。")
                : retryState === "failed"
                  ? text("다시 확인하지 못했어요. 최신 장소 안내를 확인해 주세요.", "The condition still could not be checked. Review the venue’s latest information.", "再確認できませんでした。店舗の最新情報をご確認ください。")
                  : trait.result === "stale"
                    ? text("이 조건의 확인 시점이 지났어요.", "This condition check is out of date.", "この条件の確認期限が切れています。")
                    : text("이용 조건을 확인하지 못했어요. 최신 장소 안내를 확인해 주세요.", "This access condition could not be checked. Please review the venue’s latest information.", "利用条件を確認できませんでした。店舗の最新情報をご確認ください。")}</span></InlineNotice>
              <button type="button" className={styles.secondary} disabled={retryState === "checking"} onClick={() => retryTrait(key)} data-testid={`trait-retry-${display.key}`} aria-label={text(`${display.place.ko}의 ${display.condition.ko} 다시 확인`, `Retry ${display.condition.en} for ${display.place.en}`, `${display.place.ja}の${display.condition.ja}を再確認`)}>{retryState === "checking" ? text("다시 확인 중", "Checking again", "再確認中") : text("이 조건 다시 확인", "Retry this condition", "この条件を再確認")}</button>
            </article>
          })}
          <p className={styles.finePrint}>{text("이용 조건 결과는 특정 정책 정보만 나타내며 장소 전체의 입장·안전·결제를 보증하지 않습니다.", "Trait results describe a specific policy fact and do not guarantee venue admission, safety, or payment.", "利用条件の結果は特定のポリシー情報だけを示し、店舗への入場・安全・決済を保証するものではありません。")}</p>
        </section>

        <details className={`${styles.card} ${styles.disclosure}`} open={qaControls || undefined}>
          <summary className={styles.disclosureSummary}><div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3>{text("AMM · 교환 방식 식별자", "AMM", "AMM · 交換方式")}</h3><p>{text("설계만 제공 · 사용 불가", "DEFERRED · Not available", "設計のみ · 利用不可")}</p></div></div><ChevronRight size={18} /></summary>
          <div className={styles.disclosureBody}><p className={styles.bodyCopy}>{text("AMM 교환은 이번 후보 범위에 포함되지 않습니다.", "AMM swaps are not included in this candidate.", "AMM交換は今回の候補範囲に含まれていません。")}</p></div>
        </details>

        <section className={styles.card} aria-labelledby="labs-badge-title">
          <div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3 id="labs-badge-title">{provider === "b" ? text("여행 기념 배지", "Travel keepsake badge", "旅の記念バッジ") : text("기념 배지 시뮬레이션", "Souvenir badge simulation", "記念バッジのシミュレーション")}</h3><p>{stamps}/10</p></div></div>
          <p className={styles.bodyCopy}>{badgeBody}</p>
          {stamps < 10 ? <InlineNotice tone="neutral"><span>{badgeRequirement}</span></InlineNotice> : null}
          {stamps === 10 && mint !== "NFT-MINTED" ? <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setMint(event.target.checked ? "NFT-OPTED-IN" : "NFT-ELIGIBLE") }} /> <span>{provider === "b" ? text("공개 배지에 들어갈 장소 활동만 사용해요.", "Use only place activity in the public badge.", "公開バッジには場所のアクティビティだけを使います。") : text("공개 기념 배지 시뮬레이션에 동의해요.", "I consent to the public badge simulation.", "公開用の記念バッジ・シミュレーションに同意します。")}</span></label> : null}
          {stamps === 10 && mint !== "NFT-MINTED" ? <button type="button" className={styles.primary} onClick={mintBadge} disabled={!consent || wallet !== "WAL-READY" || mint === "NFT-MINTING"} data-testid="labs-badge-mint">{wallet !== "WAL-READY"
            ? text("서명 기능 연결 필요", "Signer connection required", "署名機能の接続が必要です")
            : mint === "NFT-MINTING"
              ? provider === "b" ? text("배지 준비 중", "Preparing badge", "バッジを準備中") : text("시뮬레이션 중", "Simulating", "シミュレーション中")
              : provider === "b" ? text("배지 준비", "Prepare badge", "バッジを準備") : text("시뮬레이션 시작", "Start simulation", "シミュレーションを開始")}</button> : null}
          {mint === "NFT-MINTED" ? <InlineNotice tone="success"><Check size={18} /><span>{provider === "b" ? text("배지 정보가 준비됐어요. NFT나 거래는 생성되지 않았습니다.", "Badge details are ready. No NFT or transaction was created.", "バッジ情報を準備しました。NFTや取引は作成されていません。") : text("기념 배지 시뮬레이션 완료 · 실제 NFT나 거래는 생성되지 않았습니다.", "Badge simulation complete. No real NFT or transaction was created.", "記念バッジのシミュレーションが完了しました。実際のNFTや取引は作成されていません。")}</span></InlineNotice> : null}
          {mint === "NFT-FAILED" ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{provider === "b" ? text("배지 정보를 준비하지 못했어요. 게시된 내용은 없습니다.", "Badge preparation did not complete. Nothing was published.", "バッジ情報を準備できませんでした。公開された内容はありません。") : text("기념 배지 시뮬레이션을 완료하지 못했어요. 공개 기록은 생성되지 않았습니다.", "Badge simulation did not complete. No public record was created.", "記念バッジのシミュレーションを完了できませんでした。公開記録は作成されていません。")}</span></InlineNotice> : null}
        </section>
      </div>
    </LabsSheet>
  )
}

function LabsSheet({ provider: _provider, locale, ...props }: ComponentProps<typeof SheetB> & {
  provider: "legacy" | "b"
  locale: OndoBLocale
}) {
  return <SheetB {...props} locale={locale} />
}
