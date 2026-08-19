# Data environment and blockers

No secret value is stored or printed. Environment checks report only whether the expected variable names are configured:

```bash
node k-tour-id-app/scripts/ondo-venues/check-env.mjs
```

| Capability | Environment names | Current effect |
|---|---|---|
| LOCALDATA city CSV | none | Complete: official Seoul/Busan downloads work without a key |
| MOIS incremental OpenAPI | `DATA_GO_KR_SERVICE_KEY` | Optional and not configured; does not block CSV refresh or the 400-record seed |
| KTO TourAPI enrichment | `KTO_TOUR_API_SERVICE_KEY`, `KTO_TOUR_API_MOBILE_APP` | Not configured; blocks only KTO matching/enrichment |

The MOIS OpenAPI is application/key gated; an unregistered test key returned the documented `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`. The official CSV path therefore remains the base acquisition route.

The [KTO Korean Tourism Information API](https://www.data.go.kr/data/15101578/openapi.do) is also key gated. Until credentials and matching policy exist, KTO content IDs, English names, tourism descriptions, images and detail fields remain absent rather than guessed. Adding a key alone does not authorize arbitrary image redistribution; each KTO field and asset must retain its own source/usage evidence.

## Follow-up enrichment gate

KTO or another provider may be merged only after all of the following are defined:

1. stable source content ID;
2. deterministic match rule with distance/name thresholds and ambiguous-match rejection;
3. per-field provenance and fetched-at timestamp;
4. asset licence/attribution for every image;
5. freshness/expiry policy;
6. contract tests proving no enriched fact silently falls back to a guessed value.

Until that gate passes, the base directory is complete and truthful, while hours/card/menu/image/heat stay explicitly unknown.
