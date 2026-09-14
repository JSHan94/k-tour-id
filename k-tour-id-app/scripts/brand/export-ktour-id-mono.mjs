import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Next already declares sharp in the app lockfile; resolve it through Next so
// this also works with pnpm's isolated dependencies after a clean installation.
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const brand = new URL("../../public/brand/", import.meta.url);
const source = await readFile(new URL("ktour-id-mono-v1.svg", brand));
const sizes = [16, 32, 180, 192, 512];

await Promise.all(sizes.map(async (size) => {
  // Render at the target size rather than resizing a previously rasterized icon.
  const png = await sharp(source, { density: 72 * size / 64 })
    .resize(size, size)
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();
  const destination = new URL(`ktour-id-mono-v1-${size}.png`, brand);
  await writeFile(destination, png);
  console.log(`${size}×${size}: ${fileURLToPath(destination)}`);
}));
