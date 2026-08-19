# Venue provenance and truth boundaries

## Snapshot evidence

The committed data was built from the official LOCALDATA downloads received on `2026-08-19T02:34:13.000Z`.

| City | LOCALDATA org code | Source rows | Eligible rows before dedupe/quota | Bytes | SHA-256 |
|---|---|---:|---:|---:|---|
| Seoul | `6110000_ALL` | 537,461 | 49,064 | 161,467,072 | `9e99b2cfa77b8479824773b53a9aade7aafd009a624a20757e267dba32b53af9` |
| Busan | `6260000_ALL` | 131,241 | 23,451 | 39,545,973 | `ee907cdce95fea40fb01dd4ce7df60ab4ed08d2e1f8ca167cc5dca2c625409cb` |

Authoritative references:

- [MOIS LOCALDATA general restaurants download](https://file.localdata.go.kr/file/general_restaurants/info)
- [Public Data Portal file record](https://www.data.go.kr/data/15045016/fileData.do)
- [Public Data Portal API record and field/CRS description](https://www.data.go.kr/data/15154916/openapi.do)
- [EPSG:5174 definition](https://epsg.org/crs_5174/Korean-1985-Modified-Central-Belt.html)

Attribution: Ministry of the Interior and Safety (MOIS), LOCALDATA general restaurant licensing data. The portal labels it free and “이용허락범위 제한 없음.” Keep the provider, dataset name, portal link and snapshot time anywhere the dataset is redistributed.

## What each record proves

| Product field | Official source field | Truth |
|---|---|---|
| Korean business name | `사업장명` | `OFFICIAL_SOURCE` |
| Raw category | `업태구분명` | `OFFICIAL_SOURCE`; canonical category is a documented normalization |
| Road / lot address | `도로명주소`, `지번주소` | `OFFICIAL_SOURCE` when present |
| Source coordinate | `좌표정보(X)`, `좌표정보(Y)` | `OFFICIAL_SOURCE`, EPSG:5174 |
| WGS 84 coordinate | deterministic EPSG operation | `OFFICIAL_SOURCE` derivative; source coordinate retained |
| Active licence record | `영업상태명=영업/정상` and `상세영업상태명=영업` | `OFFICIAL_SOURCE` as of the snapshot |
| Source modification | `최종수정시점` | `OFFICIAL_SOURCE` when parseable |

Every evidence object contains `sourceRefId`, `sourceField`, and `sourceRecordDigest`. The digest is derived from the selected source fields and permits change detection without committing the 200 MB raw files.

## What it does not prove

The following fields are always `UNKNOWN` in the 400-record base:

- English name or translation
- opening hours and open-now state
- foreign-card acceptance
- menu, price and reservation policy
- English-language support
- image and image rights
- popularity, quality, tourist suitability or editorial recommendation
- ONDO score, heat level, confidence, signal count or freshness

In map projection, Korean is used as a visual fallback when English is unknown and the seam exposes `nameEnTruth: UNKNOWN_FALLBACK_TO_KO`. This is not represented as an English translation.

`ACTIVE_LICENSE_RECORD` must never be relabelled `OPEN_NOW`. The canonical heat object is null/unknown. A future heat system must join a separately versioned evidence stream. Simulated signals, if used in a demo, must remain `SIMULATED` and must never overwrite official source facts.

## Images

No images are downloaded. There is no inferred right to reuse a venue’s website, social feed, Google listing or user photo. An image may only be added with an asset-level licence/source/author/fetched-at record and a redistribution-compatible right.

## Dedupe and limitations

Exact normalized Korean name+address duplicates collapse to the most recently modified source record. Different branches of a franchise remain distinct because their addresses differ. LOCALDATA is a licence registry, not an editorial travel catalogue; the 400 records should be treated as verifiable map coverage to be enriched, not as the final “best restaurants” claim.
