import type { KPassDecisionReason, KPassServiceDecision } from "../contracts/kpass-capabilities"
import type { OndoBLocale } from "../shared/state/ondo-b-preferences"

const REASONS: Record<KPassDecisionReason, readonly [string, string, string]> = {
  allowed: ["이용 가능", "Available", "利用可能"],
  credential_required: ["K-Tour ID가 필요해요", "Set up K-Tour ID", "K-Tour IDが必要です"],
  credential_invalid: ["자격을 다시 확인해 주세요", "Check this pass again", "パスを再確認してください"],
  credential_expired: ["자격이 만료됐어요", "This pass has expired", "パスの期限が切れました"],
  credential_suspended: ["자격 확인이 보류됐어요", "This pass is on hold", "パスを確認中です"],
  credential_revoked: ["사용이 중지된 자격이에요", "This pass was revoked", "このパスは失効しました"],
  unsupported_policy: ["자격을 새로 받아 주세요", "Update your pass", "パスを更新してください"],
  person_proof_required: ["본인 확인이 필요해요", "Confirm your identity", "本人確認が必要です"],
  age_proof_required: ["나이 확인 정보가 없어요", "Age proof is missing", "年齢の証明がありません"],
  age_not_eligible: ["19+ 이용 조건에 맞지 않아요", "The 19+ requirement is not met", "19歳以上の条件を満たしていません"],
  stay_proof_required: ["체류기간 확인이 필요해요", "Confirm your stay dates", "滞在期間の確認が必要です"],
  stay_not_started: ["혜택 이용기간 전이에요", "This benefit starts later", "特典の開始前です"],
  stay_expired: ["혜택 이용기간이 끝났어요", "Your benefit window has ended", "特典の利用期間が終了しました"],
  service_not_entitled: ["이 서비스의 이용권이 없어요", "This service is not included", "このサービスは対象外です"],
  benefit_not_entitled: ["이 혜택의 대상이 아니에요", "This benefit is not included", "この特典は対象外です"],
  benefit_used: ["이미 사용한 혜택이에요", "This benefit was already used", "この特典は使用済みです"],
  benefit_expired: ["혜택이 만료됐어요", "This benefit has expired", "特典の期限が切れました"],
  risk_review: ["추가 확인 중이에요", "An extra review is needed", "追加確認が必要です"],
  risk_blocked: ["지금은 이용할 수 없어요", "This action is restricted", "現在この操作は制限されています"],
  payment_kyc_required: ["결제 확인이 필요해요", "Payment check needed", "決済確認が必要です"],
  payment_amount_required: ["결제 금액을 확인해 주세요", "Check the amount", "決済金額をご確認ください"],
  payment_amount_invalid: ["결제 금액을 확인해 주세요", "Check the amount", "決済金額をご確認ください"],
  payment_limit_reached: ["이 자격의 결제한도를 넘었어요", "This exceeds your pass allowance", "パスの決済上限を超えています"],
  invalid_request: ["이 요청을 다시 열어 주세요", "Reopen this request", "このリクエストを開き直してください"],
}

export function kpassDecisionLabel(decision: KPassServiceDecision, locale: OndoBLocale) {
  return REASONS[decision.reason][locale === "ko" ? 0 : locale === "en" ? 1 : 2]
}

export function kpassDecisionRecovery(decision: KPassServiceDecision, locale: OndoBLocale) {
  const words: readonly [string, string, string] = decision.recovery === "choose_standard_price" || decision.reason === "stay_expired"
    ? ["혜택 없이도 같은 주문을 계속할 수 있어요.", "You can continue with the same order at the standard price.", "特典なしで同じ注文を続けられます。"]
    : decision.reason === "age_not_eligible"
      ? ["일반 장소와 다른 식사 테이블은 계속 둘러볼 수 있어요.", "Other places and meal tables are still open to explore.", "一般の場所や他の食事テーブルは引き続き探せます。"]
      : decision.reason === "payment_limit_reached"
        ? ["잔액과 이용한도는 달라요. 충전해도 이 자격의 한도는 늘어나지 않아요.", "Adding funds does not increase this pass allowance.", "チャージしてもこのパスの利用上限は増えません。"]
        : ["ID에서 자격을 확인하거나 원래 화면으로 돌아가세요.", "Review your pass in ID, or return to what you were doing.", "IDで資格を確認するか、元の画面に戻れます。"]
  return words[locale === "ko" ? 0 : locale === "en" ? 1 : 2]
}
