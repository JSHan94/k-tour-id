/**
 * Logical modal ownership order. These values are consumed by modal
 * isolation, not CSS painting. A child task must have a larger value than the
 * surface it suspends so only the foremost dialog remains operable.
 */
export const ONDO_MODAL_PRIORITY = Object.freeze({
  peek: 80,
  decision: 100,
  detail: 120,
  fullTask: 140,
  critical: 160,
  nestedCritical: 161,
  finalCritical: 162,
})
