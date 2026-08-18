"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronRight, CircleDollarSign, FlaskConical, Link2, ShieldCheck, WalletCards } from "lucide-react"
import { estimatedUsdTotal, type BridgePhase } from "../contracts/commerce"
import { InlineNotice, Sheet } from "../shared/ui/sheet"
import { useOndo } from "../shared/state/ondo-provider"
import { EVIDENCE_FIXTURES, LABS_ASSETS, TRAIT_FIXTURES, bridgeStateForPhase, nextBridgePhase, type BridgeState, type WalletState } from "./labs-model"
import styles from "./labs.module.css"

type MintState = "NFT-LOCKED" | "NFT-ELIGIBLE" | "NFT-OPTED-IN" | "NFT-MINTING" | "NFT-MINTED" | "NFT-FAILED"

const BRIDGE_COPY: Record<Exclude<BridgePhase, "none">, { ko: string; en: string }> = {
  source_submitted: { ko: "출발 체인 제출됨 · 시뮬레이션", en: "Source submitted · Simulated" },
  source_confirmed: { ko: "출발 체인 확인됨 · 도착 전", en: "Source confirmed · Destination pending" },
  relaying: { ko: "전달 단계 · 시뮬레이션", en: "Relaying · Simulated" },
  destination_confirmed: { ko: "도착 단계 확인됨 · 시뮬레이션", en: "Destination confirmed · Simulated" },
}

export function LabsEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const [acknowledged, setAcknowledged] = useState(false)
  const [wallet, setWallet] = useState<WalletState>("WAL-DISCONNECTED")
  const [bridge, setBridge] = useState<BridgeState>("BRG-IDLE")
  const [phase, setPhase] = useState<BridgePhase>("none")
  const [mint, setMint] = useState<MintState>(state.stamps === 10 ? "NFT-ELIGIBLE" : "NFT-LOCKED")
  const [consent, setConsent] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const estimatedTotal = useMemo(() => estimatedUsdTotal(LABS_ASSETS), [])

  function close() {
    actions.setSurface({ kind: "map" })
    actions.setTab("my")
  }

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
    setBridge("BRG-QUOTED")
  }

  function confirmBridge() {
    if (bridge !== "BRG-QUOTED") return
    setBridge("BRG-CONFIRMING")
  }

  function submitBridge() {
    if (bridge !== "BRG-CONFIRMING") return
    const first = nextBridgePhase("none")
    if (!first) return
    setPhase(first)
    setBridge(bridgeStateForPhase(first))
  }

  function advanceBridge() {
    if (bridge !== "BRG-PENDING") return
    const next = nextBridgePhase(phase)
    if (!next) return
    const fail = new URLSearchParams(window.location.search).get("scenario") === "bridge-failed" && phase === "source_confirmed"
    if (fail) {
      setBridge("BRG-FAILED")
      return
    }
    setPhase(next)
    setBridge(bridgeStateForPhase(next))
  }

  function cancelBridge() {
    if (bridge !== "BRG-QUOTED" && bridge !== "BRG-CONFIRMING") return
    setPhase("none")
    setBridge("BRG-CANCELLED")
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
          <p className={styles.eyebrow}>LABS · SIMULATED</p>
          <h2>Labs</h2>
          <p>{locale === "ko" ? "기술 가설을 보여주는 실험 영역입니다. 실제 자산 이동이나 운영 서비스가 아닙니다." : "This is an experimental area for technical hypotheses. It does not move real assets or represent a production service."}</p>
          <InlineNotice tone="warm"><AlertTriangle size={18} /><span>{locale === "ko" ? "여기의 지갑, 잔고, bridge, badge 결과는 모두 결정적 fixture입니다." : "Wallet, balance, bridge, and badge results here are deterministic fixtures."}</span></InlineNotice>
          <button type="button" className={styles.primary} onClick={() => setAcknowledged(true)}>{locale === "ko" ? "이해하고 보기" : "I understand"}</button>
          <button type="button" className={styles.textButton} onClick={close}>{locale === "ko" ? "My Korea로 돌아가기" : "Return to My Korea"}</button>
        </div>
      </Sheet>
    )
  }

  const canDisconnect = wallet !== "WAL-CONNECTING" && bridge !== "BRG-PENDING"
  const phaseCopy = phase === "none" ? null : BRIDGE_COPY[phase][locale]

  return (
    <Sheet label="Labs" onClose={close} size="full">
      <main className={styles.body} data-wallet-state={wallet} data-bridge-state={bridge} data-bridge-phase={phase} data-mint-state={mint}>
        <header className={styles.header}>
          <button type="button" onClick={close} aria-label={locale === "ko" ? "My Korea로 돌아가기" : "Back to My Korea"}><ArrowLeft size={20} /></button>
          <div><p className={styles.eyebrow}>LABS · SIMULATED</p><h2>Labs</h2></div>
          <span className={styles.truthBadge}>SIMULATED</span>
        </header>

        <InlineNotice tone="neutral"><ShieldCheck size={18} /><span>{locale === "ko" ? "실제 자산 이동이나 운영 서비스가 아닙니다." : "No real assets move and this is not a production service."}</span></InlineNotice>

        <section className={styles.card} aria-labelledby="labs-signer-title">
          <div className={styles.sectionHeading}><span><WalletCards size={18} /></span><div><h3 id="labs-signer-title">Sui zkLogin signer</h3><p>Target network: Sui Testnet · Simulated</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "Sui 주소와 트랜잭션 서명 경로를 보여줍니다. ONDO 계정, KYC 또는 멀티체인 지갑을 만들지는 않습니다." : "Shows a Sui address and transaction-signing route. It does not create an ONDO account, KYC, or multichain wallet."}</p>
          {wallet === "WAL-READY" ? <code className={styles.address}>0x8a71…ondo_fixture</code> : null}
          {wallet === "WAL-FAILED" ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "연결 fixture를 완료하지 못했어요. 실제 계정에는 영향이 없습니다." : "The connection fixture did not complete. No real account was affected."}</span></InlineNotice> : null}
          {wallet === "WAL-DISCONNECTED" || wallet === "WAL-FAILED" ? <button type="button" className={styles.secondary} onClick={connectWallet}>{wallet === "WAL-FAILED" ? locale === "ko" ? "다시 시도" : "Try again" : locale === "ko" ? "Signer 연결 시뮬레이션" : "Simulate signer connection"}</button> : null}
          {wallet === "WAL-CONNECTING" ? <button type="button" className={styles.secondary} disabled>{locale === "ko" ? "연결 중" : "Connecting"}</button> : null}
          {wallet === "WAL-READY" ? <button type="button" className={styles.textButton} disabled={!canDisconnect} onClick={() => setWallet("WAL-DISCONNECTED")}>{locale === "ko" ? "연결 해제" : "Disconnect"}</button> : null}
        </section>

        <section className={styles.card} aria-labelledby="labs-assets-title">
          <div className={styles.sectionHeading}><span><CircleDollarSign size={18} /></span><div><h3 id="labs-assets-title">{locale === "ko" ? "자산별 잔고" : "Balances by asset"}</h3><p>{locale === "ko" ? `예상 USD 환산액 · $${estimatedTotal.toFixed(2)}` : `Estimated USD value · $${estimatedTotal.toFixed(2)}`}</p></div></div>
          <div className={styles.assetList}>
            {LABS_ASSETS.map((asset) => <div key={asset.id} className={styles.assetRow}><div><strong>{asset.symbol}</strong><span>{asset.chain} · {asset.representation.replace("_", " ")}</span></div><div><strong>{asset.amount}</strong>{asset.estimatedUsd ? <span>≈ ${asset.estimatedUsd}</span> : <span>{locale === "ko" ? "USD 환산 없음" : "No USD estimate"}</span>}</div></div>)}
          </div>
          <p className={styles.finePrint}>{locale === "ko" ? "USDC와 USDT는 서로 다른 자산으로 보관합니다. OOKRW test token은 KRW 상환이나 1:1 가치를 보증하지 않습니다." : "USDC and USDT remain separate assets. OOKRW test token does not guarantee KRW redemption or 1:1 value."}</p>
        </section>

        <section className={styles.card} aria-labelledby="labs-bridge-title">
          <div className={styles.sectionHeading}><span><Link2 size={18} /></span><div><h3 id="labs-bridge-title">{locale === "ko" ? "Bridge 가설 시뮬레이션" : "Bridge hypothesis simulation"}</h3><p>Sui Testnet → OmniOne hypothesis</p></div></div>
          <InlineNotice tone="warm"><AlertTriangle size={17} /><span>{locale === "ko" ? "공식 Sui↔OmniOne bridge가 확인된 것이 아닙니다." : "An official Sui↔OmniOne bridge has not been confirmed."}</span></InlineNotice>
          <div className={styles.route}><span>13.50 USDT</span><ArrowRight size={18} /><span>13,460 OOKRW</span></div>
          {phaseCopy ? <div className={styles.progress}><span className={phase === "destination_confirmed" ? styles.completeDot : styles.pendingDot} /><strong>{phaseCopy}</strong></div> : null}
          {bridge === "BRG-IDLE" || bridge === "BRG-FAILED" || bridge === "BRG-CANCELLED" ? <button type="button" className={styles.primary} onClick={quoteBridge} disabled={wallet !== "WAL-READY"}>{wallet === "WAL-READY" ? locale === "ko" ? "Quote 보기" : "View quote" : locale === "ko" ? "Signer 연결 후 Quote" : "Connect signer for quote"}</button> : null}
          {bridge === "BRG-QUOTED" ? <><div className={styles.quote}><span>{locale === "ko" ? "예상 경로 수수료" : "Estimated route fee"}</span><strong>$0.04</strong><small>{locale === "ko" ? "2분 뒤 만료 · 시뮬레이션" : "Expires in 2 min · Simulated"}</small></div><button type="button" className={styles.primary} onClick={confirmBridge}>{locale === "ko" ? "Quote 확인" : "Confirm quote"}</button><button type="button" className={styles.secondary} onClick={cancelBridge}>{locale === "ko" ? "취소" : "Cancel"}</button></> : null}
          {bridge === "BRG-CONFIRMING" ? <><button type="button" className={styles.primary} onClick={submitBridge}>{locale === "ko" ? "Bridge 시뮬레이션 시작" : "Start bridge simulation"}</button><button type="button" className={styles.secondary} onClick={cancelBridge}>{locale === "ko" ? "취소" : "Cancel"}</button></> : null}
          {bridge === "BRG-PENDING" ? <button type="button" className={styles.primary} onClick={advanceBridge}>{locale === "ko" ? "다음 fixture 단계" : "Advance fixture phase"}<ChevronRight size={17} /></button> : null}
          {bridge === "BRG-SIMULATED-SUCCESS" ? <InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "도착 단계까지 확인된 시뮬레이션입니다. 실제 자산은 바뀌지 않았습니다." : "The simulation reached destination confirmation. No real assets changed."}</span></InlineNotice> : null}
          {bridge === "BRG-FAILED" ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "시뮬레이션 실패 · 현재 단계와 모든 잔고는 그대로예요." : "Simulation failed. The current phase and every balance remain unchanged."}</span></InlineNotice> : null}
          {bridge === "BRG-CANCELLED" ? <InlineNotice tone="neutral"><span>{locale === "ko" ? "시뮬레이션을 취소했어요. 잔고는 바뀌지 않았습니다." : "Simulation cancelled. Balances did not change."}</span></InlineNotice> : null}
          <button type="button" className={styles.inlineLink} onClick={() => setMismatch((current) => !current)}>{locale === "ko" ? "Quote 불일치 예시 보기" : "View quote mismatch example"}</button>
          {mismatch ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "자산·체인·금액이 quote와 달라 진행하지 않았어요." : "The asset, chain, or amount did not match the quote, so nothing was submitted."}</span></InlineNotice> : null}
        </section>

        <section className={styles.card} aria-labelledby="labs-evidence-title">
          <div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3 id="labs-evidence-title">{locale === "ko" ? "증거 adapter 경계" : "Evidence adapter boundaries"}</h3><p>CONTRACT ONLY</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "OpenDID와 EAS는 서로 다른 adapter가 canonical envelope로 정규화합니다. EAS 실제 구현은 Deferred입니다." : "OpenDID and EAS remain separate adapters normalized into a canonical envelope. A live EAS implementation is deferred."}</p>
          <div className={styles.evidenceList}>{EVIDENCE_FIXTURES.map((evidence) => <article key={evidence.id}><span>{evidence.sourceStandard}</span><strong>{evidence.claimType.replace("_", " ")}</strong><small>{evidence.adapterId} · {evidence.provenance.truth}</small></article>)}</div>
        </section>

        <section className={styles.card} aria-labelledby="labs-traits-title">
          <div className={styles.sectionHeading}><span><ShieldCheck size={18} /></span><div><h3 id="labs-traits-title">{locale === "ko" ? "상점 이용 조건" : "Merchant access conditions"}</h3><p>CONTRACT ONLY</p></div></div>
          {TRAIT_FIXTURES.map((trait) => <InlineNotice key={`${trait.merchantId}:${trait.offerId}`} tone={trait.result === "error" ? "danger" : "warm"}><AlertTriangle size={17} /><span>{trait.result === "stale" ? locale === "ko" ? "이 조건의 확인 시점이 지났어요." : "This condition check is out of date." : locale === "ko" ? "이용 조건을 확인하지 못했어요. 최신 장소 안내를 확인해 주세요." : "This access condition could not be checked. Please review the venue’s latest information."}</span></InlineNotice>)}
          <p className={styles.finePrint}>{locale === "ko" ? "Trait 결과는 특정 정책 fact만 나타내며 장소 전체의 입장·안전·결제를 보증하지 않습니다." : "Trait results describe a specific policy fact and do not guarantee venue admission, safety, or payment."}</p>
        </section>

        <section className={styles.card} aria-labelledby="labs-amm-title">
          <div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3 id="labs-amm-title">AMM</h3><p>DEFERRED</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "AMM 교환은 이번 후보 범위에 포함되지 않습니다." : "AMM swaps are not included in this candidate."}</p>
        </section>

        <section className={styles.card} aria-labelledby="labs-badge-title">
          <div className={styles.sectionHeading}><span><FlaskConical size={18} /></span><div><h3 id="labs-badge-title">{locale === "ko" ? "기념 badge 시뮬레이션" : "Souvenir badge simulation"}</h3><p>{state.stamps}/10</p></div></div>
          <p className={styles.bodyCopy}>{locale === "ko" ? "열 번째 방문을 기념하는 선택 기능입니다. 신원, 국적, 19+ 또는 부정적 평판은 공개 metadata에 넣지 않습니다." : "An optional souvenir for the tenth visit. Identity, nationality, 19+, and negative reputation are not included in public metadata."}</p>
          {state.stamps < 10 ? <InlineNotice tone="neutral"><span>{locale === "ko" ? "열 번째의 중복되지 않은 방문 증거가 확인되면 선택할 수 있어요." : "This becomes optional after a tenth unique visit proof."}</span></InlineNotice> : null}
          {state.stamps === 10 && mint !== "NFT-MINTED" ? <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setMint(event.target.checked ? "NFT-OPTED-IN" : "NFT-ELIGIBLE") }} /> <span>{locale === "ko" ? "공개 badge 시뮬레이션에 동의해요." : "I consent to the public badge simulation."}</span></label> : null}
          {state.stamps === 10 && mint !== "NFT-MINTED" ? <button type="button" className={styles.primary} onClick={mintBadge} disabled={!consent || wallet !== "WAL-READY" || mint === "NFT-MINTING"}>{wallet !== "WAL-READY" ? locale === "ko" ? "Signer 연결 필요" : "Signer connection required" : mint === "NFT-MINTING" ? locale === "ko" ? "시뮬레이션 중" : "Simulating" : locale === "ko" ? "시뮬레이션 시작" : "Start simulation"}</button> : null}
          {mint === "NFT-MINTED" ? <InlineNotice tone="success"><Check size={18} /><span>{locale === "ko" ? "Badge 시뮬레이션 완료 · 실제 NFT 또는 transaction은 생성되지 않았습니다." : "Badge simulation complete. No real NFT or transaction was created."}</span></InlineNotice> : null}
          {mint === "NFT-FAILED" ? <InlineNotice tone="danger"><AlertTriangle size={17} /><span>{locale === "ko" ? "Badge 시뮬레이션을 완료하지 못했어요. 공개 기록은 생성되지 않았습니다." : "Badge simulation did not complete. No public record was created."}</span></InlineNotice> : null}
        </section>
      </main>
    </Sheet>
  )
}
