import { createReviewFixtureAuthority, reviewFixture } from "../contracts/execution-mode"
import { qaReviewFixtureOptions } from "../shared/ui/use-qa-controls"
import type { CommerceSampleResponseB } from "./stable-commerce-model-b"

/** A prepared response, never a provider adapter or browser-restored authority. */
export function commerceSampleResponseB(value: CommerceSampleResponseB) {
  if (!qaReviewFixtureOptions().allowReviewFixture) return null
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-COMMERCE-OPERATION" })
  return authority ? reviewFixture(authority, { outcome: "success", value, now: new Date() }) : null
}
