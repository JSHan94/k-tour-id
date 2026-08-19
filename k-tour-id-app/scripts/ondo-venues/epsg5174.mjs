const DEG = Math.PI / 180
const ARCSEC = DEG / 3600

const BESSEL = { a: 6_377_397.155, inverseFlattening: 299.1528128 }
const WGS84 = { a: 6_378_137, inverseFlattening: 298.257223563 }

// EPSG:5174 — Korean 1985 / Modified Central Belt.
const TM = {
  latitudeOfOrigin: 38 * DEG,
  centralMeridian: 127.002890277778 * DEG,
  scaleFactor: 1,
  falseEasting: 200_000,
  falseNorthing: 500_000,
}

// EPSG's Korean 1985 → WGS 84 (1) seven-parameter transformation.
const TO_WGS84 = {
  tx: -145.907,
  ty: 505.034,
  tz: 685.756,
  rx: -1.162 * ARCSEC,
  ry: 2.347 * ARCSEC,
  rz: 1.592 * ARCSEC,
  scale: 1 + 6.342e-6,
  px: -3_159_521.31,
  py: 4_068_151.32,
  pz: 3_748_113.85,
}

function ellipsoid(input) {
  const flattening = 1 / input.inverseFlattening
  const b = input.a * (1 - flattening)
  const e2 = flattening * (2 - flattening)
  return { ...input, b, e2, ep2: e2 / (1 - e2) }
}

function meridionalArc(latitude, shape) {
  const e4 = shape.e2 ** 2
  const e6 = shape.e2 ** 3
  return shape.a * (
    (1 - shape.e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * latitude
    - (3 * shape.e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * latitude)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * latitude)
    - (35 * e6 / 3072) * Math.sin(6 * latitude)
  )
}

function inverseTransverseMercator(x, y) {
  const shape = ellipsoid(BESSEL)
  const e1 = (1 - Math.sqrt(1 - shape.e2)) / (1 + Math.sqrt(1 - shape.e2))
  const e4 = shape.e2 ** 2
  const e6 = shape.e2 ** 3
  const originArc = meridionalArc(TM.latitudeOfOrigin, shape)
  const mu = (originArc + (y - TM.falseNorthing) / TM.scaleFactor)
    / (shape.a * (1 - shape.e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256))
  const fp = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)

  const sinFp = Math.sin(fp)
  const cosFp = Math.cos(fp)
  const tanFp = Math.tan(fp)
  const n1 = shape.a / Math.sqrt(1 - shape.e2 * sinFp ** 2)
  const r1 = shape.a * (1 - shape.e2) / (1 - shape.e2 * sinFp ** 2) ** 1.5
  const t1 = tanFp ** 2
  const c1 = shape.ep2 * cosFp ** 2
  const d = (x - TM.falseEasting) / (n1 * TM.scaleFactor)

  const latitude = fp - (n1 * tanFp / r1) * (
    d ** 2 / 2
    - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * shape.ep2) * d ** 4 / 24
    + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * shape.ep2 - 3 * c1 ** 2) * d ** 6 / 720
  )
  const longitude = TM.centralMeridian + (
    d
    - (1 + 2 * t1 + c1) * d ** 3 / 6
    + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * shape.ep2 + 24 * t1 ** 2) * d ** 5 / 120
  ) / cosFp
  return { latitude, longitude }
}

function geodeticToEcef(latitude, longitude, shapeInput) {
  const shape = ellipsoid(shapeInput)
  const n = shape.a / Math.sqrt(1 - shape.e2 * Math.sin(latitude) ** 2)
  return {
    x: n * Math.cos(latitude) * Math.cos(longitude),
    y: n * Math.cos(latitude) * Math.sin(longitude),
    z: n * (1 - shape.e2) * Math.sin(latitude),
  }
}

function helmertToWgs84(point) {
  const p = TO_WGS84
  const x = point.x - p.px
  const y = point.y - p.py
  const z = point.z - p.pz
  return {
    x: p.px + p.tx + p.scale * x + p.rz * y - p.ry * z,
    y: p.py + p.ty - p.rz * x + p.scale * y + p.rx * z,
    z: p.pz + p.tz + p.ry * x - p.rx * y + p.scale * z,
  }
}

function ecefToGeodetic(point, shapeInput) {
  const shape = ellipsoid(shapeInput)
  const p = Math.hypot(point.x, point.y)
  let latitude = Math.atan2(point.z, p * (1 - shape.e2))
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const n = shape.a / Math.sqrt(1 - shape.e2 * Math.sin(latitude) ** 2)
    const next = Math.atan2(point.z + shape.e2 * n * Math.sin(latitude), p)
    if (Math.abs(next - latitude) < 1e-13) {
      latitude = next
      break
    }
    latitude = next
  }
  return { latitude, longitude: Math.atan2(point.y, point.x) }
}

export function epsg5174ToWgs84(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError("EPSG:5174 coordinates must be finite numbers")
  const korean1985 = inverseTransverseMercator(x, y)
  const sourceEcef = geodeticToEcef(korean1985.latitude, korean1985.longitude, BESSEL)
  const wgs84 = ecefToGeodetic(helmertToWgs84(sourceEcef), WGS84)
  return {
    longitude: wgs84.longitude / DEG,
    latitude: wgs84.latitude / DEG,
  }
}
