"use client"

import { Bookmark, Check, ChevronRight, FlaskConical, MapPin, MessageCircle, ShieldCheck, Sparkles, Stamp } from "lucide-react"
import { venueDisplayName } from "@/lib/ondo/venues/display"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"
import { DISCOVERY_PREFERENCE_OPTIONS, PERSONA_OPTIONS } from "../onboarding/discovery-options"
import { useOndo } from "../shared/state/ondo-provider"
import styles from "./my.module.css"

const VENUE_NAMES: Record<string, { en: string; ko: string }> = {
  "seoul-seongsu-gukbap": { en: "Seongsu Local Gukbap", ko: "성수 로컬 국밥" },
  "seoul-euljiro-nogari": { en: "Euljiro Nogari Alley", ko: "을지로 노가리 골목" },
  "seoul-mangwon-kalguksu": { en: "Mangwon Kalguksu", ko: "망원 칼국수" },
  "busan-jagalchi-grill": { en: "Jagalchi Grilled Fish", ko: "자갈치 생선구이" },
}

export function MyEntry() {
  const { state, actions } = useOndo()
  const locale = state.locale
  const history = [
    { key: "identity", icon: <ShieldCheck size={17} />, label: locale === "ko" ? "사람 확인" : "Person check", value: state.reputation.identity === "verified" ? locale === "ko" ? "확인됨" : "Verified" : locale === "ko" ? "확인 전" : "Not verified" },
    { key: "visit", icon: <MapPin size={17} />, label: locale === "ko" ? "확인된 방문" : "Confirmed visits", value: state.reputation.visit === "repeat" ? locale === "ko" ? "반복 방문" : "Repeat" : state.reputation.visit === "recent" ? locale === "ko" ? "최근 방문" : "Recent" : locale === "ko" ? "새 활동" : "New" },
    { key: "contribution", icon: <Sparkles size={17} />, label: locale === "ko" ? "도움이 된 정보" : "Helpful contributions", value: state.reputation.contribution === "established" ? locale === "ko" ? "꾸준한 기여" : "Established" : state.reputation.contribution === "helpful" ? locale === "ko" ? "도움이 됨" : "Helpful" : locale === "ko" ? "새 활동" : "New" },
    { key: "meetup", icon: <MessageCircle size={17} />, label: locale === "ko" ? "완료한 Table" : "Completed Tables", value: state.reputation.meetup === "established" ? locale === "ko" ? "꾸준한 참여" : "Established" : state.reputation.meetup === "reliable" ? locale === "ko" ? "완료 이력 있음" : "Reliable" : locale === "ko" ? "새 활동" : "New" },
  ]

  function savedVenueLabel(venueId: string) {
    const legacy = VENUE_NAMES[venueId]
    if (legacy) return { primary: legacy[locale], secondary: locale === "en" ? legacy.ko : null }
    const koreanName = canonicalMapVenueById(venueId)?.name.ko
    if (!koreanName) return { primary: locale === "ko" ? "저장한 장소" : "Saved place", secondary: null }
    return locale === "ko"
      ? { primary: koreanName, secondary: null }
      : { primary: venueDisplayName(koreanName, "en"), secondary: `${koreanName} · Transliterated for navigation` }
  }

  function togglePreference(id: (typeof DISCOVERY_PREFERENCE_OPTIONS)[number]["id"]) {
    actions.setDiscoveryPreferences(state.discoveryPreferences.includes(id)
      ? state.discoveryPreferences.filter((preference) => preference !== id)
      : [...state.discoveryPreferences, id])
  }

  return (
    <main className={styles.screen} data-testid="ondo-my-entry">
      <header className={styles.header}><p>MY KOREA</p><h1>{locale === "ko" ? "나의 한국 여행" : "My Korea"}</h1><span>{locale === "ko" ? "저장한 장소와 분리된 활동 이력을 확인해요." : "Saved places and separate activity histories, in one quiet place."}</span></header>

      <section className={styles.section} aria-labelledby="saved-heading">
        <div className={styles.sectionTitle}><div><Bookmark size={18} /><h2 id="saved-heading">{locale === "ko" ? "저장한 장소" : "Saved places"}</h2></div><span>{state.savedVenueIds.length}</span></div>
        {state.savedVenueIds.length ? <div className={styles.savedList}>{state.savedVenueIds.map((venueId) => {
          const label = savedVenueLabel(venueId)
          return <button key={venueId} type="button" onClick={() => { actions.setTab("ondo"); actions.setSurface({ kind: "venue", venueId }) }} data-testid={`saved-venue-${venueId}`}><MapPin size={17} /><span><strong>{label.primary}</strong>{label.secondary ? <small>{label.secondary}</small> : null}</span><ChevronRight size={17} /></button>
        })}</div> : <div className={styles.empty}><Bookmark size={21} /><p>{locale === "ko" ? "ONDO 지도에서 다시 보고 싶은 식음료 장소를 저장해 보세요." : "Save a food or drink place from the ONDO map to find it here."}</p><button type="button" onClick={() => { actions.setTab("ondo"); actions.setSurface({ kind: "map" }) }}>{locale === "ko" ? "ONDO 지도 보기" : "Open ONDO map"}</button></div>}
      </section>

      <section className={styles.section} aria-labelledby="discovery-heading" data-testid="discovery-settings">
        <div className={styles.sectionTitle}><div><Sparkles size={18} /><h2 id="discovery-heading">{locale === "ko" ? "둘러보기 설정" : "Discovery settings"}</h2></div></div>
        <p className={styles.sectionCopy}>{locale === "ko" ? "온보딩에서 고른 이용 방식과 식음료 관심사를 언제든 바꿀 수 있어요." : "Change the travel context and food interests you chose during onboarding."}</p>
        <label className={styles.personaControl} htmlFor="discovery-persona"><span>{locale === "ko" ? "ONDO 이용 방식" : "How I use ONDO"}</span><select id="discovery-persona" data-testid="discovery-persona" value={state.persona ?? ""} onChange={(event) => {
          const next = PERSONA_OPTIONS.find((option) => option.id === event.target.value)
          if (next) actions.setPersona(next.id)
        }}><option value="" disabled>{locale === "ko" ? "선택해 주세요" : "Choose one"}</option>{PERSONA_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}</select></label>
        <fieldset className={styles.preferenceFieldset}><legend>{locale === "ko" ? "먹고 싶은 것과 분위기" : "Food and mood"}</legend><div className={styles.preferenceChips}>{DISCOVERY_PREFERENCE_OPTIONS.map((option) => {
          const selected = state.discoveryPreferences.includes(option.id)
          return <button key={option.id} type="button" aria-pressed={selected} onClick={() => togglePreference(option.id)} data-testid={`discovery-preference-${option.id}`}>{option.label[locale]}</button>
        })}</div></fieldset>
        <p className={styles.preferenceTruth} data-testid="discovery-preference-truth">{locale === "ko" ? "이 기기에 저장되어 둘러보기 맥락에 사용됩니다. 확인되지 않은 식이·심야 영업·분위기 정보는 숨은 필터로 사용하지 않아요." : "Saved on this device and used as discovery context. Unverified dietary, late-hours, and mood facts are not used as hidden filters."}</p>
      </section>

      <section className={styles.section} aria-labelledby="stamp-heading">
        <div className={styles.sectionTitle}><div><Stamp size={18} /><h2 id="stamp-heading">{locale === "ko" ? "방문 스탬프" : "Visit stamps"}</h2></div><span>{state.stamps}/10</span></div>
        <div className={styles.stampCard}>
          <div className={styles.stampGrid} aria-label={locale === "ko" ? `방문 스탬프 10개 중 ${state.stamps}개` : `${state.stamps} of 10 visit stamps`}>
            {Array.from({ length: 10 }, (_, index) => <span key={index} className={index < state.stamps ? styles.stampFilled : styles.stampEmpty}>{index < state.stamps ? <Check size={16} /> : index + 1}</span>)}
          </div>
          <p>{state.stamps === 10 ? locale === "ko" ? "열 번째 방문을 남겼어요." : "You recorded your tenth visit." : locale === "ko" ? "결제가 아니라 별도로 확인된 방문이 하나씩 쌓여요." : "Each separate confirmed visit—not payment—adds one stamp."}</p>
          {state.stamps === 10 ? <button type="button" className={styles.labsLink} onClick={() => actions.setSurface({ kind: "labs" })} data-testid="open-labs-milestone"><FlaskConical size={17} /><span>{locale === "ko" ? "원하면 Labs에서 기념 배지 시뮬레이션을 볼 수 있어요." : "If you choose, view a souvenir badge simulation in Labs."}</span><ChevronRight size={17} /></button> : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="history-heading">
        <div className={styles.sectionTitle}><div><Sparkles size={18} /><h2 id="history-heading">{locale === "ko" ? "활동 이력" : "Activity history"}</h2></div></div>
        <p className={styles.sectionCopy}>{locale === "ko" ? "종합 점수 없이 서로 다른 의미의 활동을 분리해서 보여줘요." : "Different kinds of activity stay separate; there is no overall trust or safety score."}</p>
        <div className={styles.historyList}>{history.map((item) => <div key={item.key}><span className={styles.historyIcon}>{item.icon}</span><strong>{item.label}</strong><span>{item.value}</span></div>)}</div>
      </section>

      <section className={styles.labsCard}>
        <span><FlaskConical size={20} /></span><div><strong>Labs</strong><p>{locale === "ko" ? "지갑·체인 연결·증거 변환 가설은 소비자 흐름과 분리되어 있어요." : "Wallet, bridge, and evidence-adapter hypotheses stay outside the consumer journey."}</p></div><button type="button" onClick={() => actions.setSurface({ kind: "labs" })} aria-label={locale === "ko" ? "Labs 열기" : "Open Labs"} data-testid="open-labs"><ChevronRight size={18} /></button>
      </section>
    </main>
  )
}
