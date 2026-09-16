import { createRequire } from "node:module";
import { resolve } from "node:path";

// Package the selected imagegen output at the social card's declared dimensions.
// The edit itself is performed with imagegen; this only exports the final size.
const input = process.argv[2];
if (!input) throw new Error("Provide the selected generated PNG path.");
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const output = new URL("../../public/og-ktour-korea-v3.png", import.meta.url);
await sharp(resolve(input)).resize(1200, 630, { fit: "fill" }).png().toFile(output.pathname);
console.log("Exported K-Tour ID food sharing card: 1200×630");
