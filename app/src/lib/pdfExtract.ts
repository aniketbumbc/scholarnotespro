import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export type PageText = {
  page: number; // 1-indexed
  text: string; // this page's text
  charStart: number; // offset of this page's first char in the full doc
  charEnd: number; // offset just past this page's last char
};

export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  const parser = new PDFParse({ data: buffer });

  try {
    // First get the whole doc to learn the page count.
    const full = await parser.getText();
    console.dir(Object.keys(full), { depth: null });
    const one = await parser.getText({ partial: [1] });
    console.dir(one, { depth: 2 }); // confirm per-page shape
    const totalPages = full.total ?? full.pages?.length ?? 1;

    const pages: PageText[] = [];
    let runningOffset = 0;

    for (let p = 1; p <= totalPages; p++) {
      // Extract just this page's text via the `partial` option.
      const res = await parser.getText({ partial: [p] });
      const text = (res.text ?? "").trim();

      const charStart = runningOffset;
      const charEnd = charStart + text.length;
      runningOffset = charEnd + 1; // +1 for the notional page-break separator

      pages.push({ page: p, text, charStart, charEnd });
    }

    return pages;
  } finally {
    await parser.destroy(); // v2 requires cleanup
  }
}
