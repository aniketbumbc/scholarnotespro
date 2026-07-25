import "dotenv/config";
import { extractPdfPages } from "../lib/pdfExtract";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: tsx app/src/testscript/test-extraction.ts <path-to-pdf>");
  process.exit(1);
}

async function main() {
  const pages = await extractPdfPages(filePath!);

  console.log(`\n✅ Extracted ${pages.length} pages\n`);
  for (const p of pages.slice(0, 3)) {
    console.log(`--- Page ${p.page}  (chars ${p.charStart}–${p.charEnd}) ---`);
    console.log(p.text.slice(0, 200), "…\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
