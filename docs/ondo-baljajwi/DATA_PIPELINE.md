# ONDO venue data pipeline

## Outcome

The published seed contains exactly **400 current food-service licence records**: Seoul 200 and Busan 200. It is a reproducible directory seed, not a “hot place” ranking.

Public entry points:

- `CANONICAL_VENUES`: all 400 evidence-bearing records
- `CANONICAL_VENUE_COUNTS`: `{ total: 400, byCity: { seoul: 200, busan: 200 } }`
- `CANONICAL_MAP_VENUES`: compact UI seam with latitude/longitude, Korean-name fallback, category and `heat: null`
- `venueToMapRecord(venue)`: explicit canonical-to-map projection

These are exported from `k-tour-id-app/lib/ondo/venues/index.ts`. IDs use the `mois-` namespace and cannot collide with the four existing simulated map fixture IDs.

## Source and acquisition

The base source is the Ministry of the Interior and Safety (MOIS) LOCALDATA **general restaurants** dataset. The [public file page](https://file.localdata.go.kr/file/general_restaurants/info) exposes city-level CSV downloads without an API key. The [Public Data Portal record](https://www.data.go.kr/data/15045016/fileData.do) identifies MOIS as provider, says the data is refreshed daily with a reported two-day lag, documents EPSG:5174 coordinates, and labels the use scope “이용허락범위 제한 없음.”

Acquisition uses only official endpoints:

```bash
node k-tour-id-app/scripts/ondo-venues/download-localdata.mjs \
  --city=all \
  --out=/tmp/ondo-venues-cache
```

The downloader first opens the official info page, retains its session cookie, calls the official validation endpoint, then downloads the city file with the official organisation code. It rejects non-CSV responses. No Google data, browser scraping of listings, or unofficial business directories are used.

## Build and validate

```bash
node k-tour-id-app/scripts/ondo-venues/build.mjs \
  --seoul=/tmp/ondo-venues-cache/seoul-general-restaurants.csv \
  --busan=/tmp/ondo-venues-cache/busan-general-restaurants.csv \
  --out=k-tour-id-app/data/ondo-venues

node k-tour-id-app/scripts/ondo-venues/validate.mjs
pnpm --dir k-tour-id-app exec playwright test \
  --config=playwright.contracts.config.ts \
  tests/contracts/ondo-venues-data.spec.ts
```

Outputs:

- `canonical-venues.json`: evidence-bearing canonical records
- `canonical-venues.geojson`: map-ready point features
- `provenance-manifest.json`: source hashes, licence, field mapping, selection, coordinate transform and blockers

Raw source files are intentionally not committed. Their SHA-256 digests and row counts are fixed in the provenance manifest.

## Exact selection

Each city contributes ten districts; each district contributes 20 records. Within every district, the fixed category mix is:

| Category | Count |
|---|---:|
| Korean | 5 |
| Casual | 3 |
| Japanese | 2 |
| Chinese | 2 |
| Global / Western | 3 |
| Night / pub | 3 |
| Specialty seafood / grill | 2 |

Candidates must have both LOCALDATA statuses `영업/정상` and `영업`, a name, an address, valid EPSG:5174 coordinates, a mapped category, and transformed coordinates inside the city bounds. Exact normalized name+address duplicates are collapsed. Selection then sorts by SHA-256 of city, district, category and management ID. Re-running against the same source files therefore yields the same 400 IDs.

This balance prevents the map from becoming “200 arbitrary rows nearest the start of a government file.” It does **not** claim that the selected businesses are popular, editorially recommended, foreigner-friendly or currently open.

## Coordinate conversion

LOCALDATA publishes Bessel Modified Central Belt TM coordinates (EPSG:5174). The converter implements:

1. inverse Transverse Mercator;
2. EPSG “Korean 1985 to WGS 84 (1)” Molodensky–Badekas coordinate-frame transformation;
3. WGS 84 longitude/latitude output.

Two fixed Seoul/Busan vectors are tested to `1e-7` degrees. Source X/Y and the resulting WGS 84 coordinate are both retained for audit.

## Refresh policy

The pipeline is snapshot-based. A scheduled refresh should download new city files, rebuild, run all validation/contract tests, then review additions/removals before publishing. A licence record marked active does not prove “open right now”; live hours require another licensed source and its own freshness policy.
