// Lightweight heuristic parser for receipt OCR text — no external API needed.
export interface ParsedReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null;
}

const TOTAL_KEYWORDS = /\b(grand\s*total|total\s*due|amount\s*due|balance\s*due|total)\b/i;
const MONEY_RE = /\$?\s?(\d{1,5}(?:[.,]\d{2}))\b/g;
const DATE_RE =
  /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/i;

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let amount: number | null = null;

  // Prefer a line that mentions "total" and contains a currency amount.
  for (const line of lines) {
    if (TOTAL_KEYWORDS.test(line)) {
      const matches = [...line.matchAll(MONEY_RE)];
      if (matches.length) {
        const val = parseFloat(matches[matches.length - 1][1].replace(',', '.'));
        if (!Number.isNaN(val)) {
          amount = val;
          break;
        }
      }
    }
  }

  // Fallback: take the largest money-looking number in the whole receipt.
  if (amount === null) {
    const all = [...rawText.matchAll(MONEY_RE)].map((m) => parseFloat(m[1].replace(',', '.')));
    const valid = all.filter((n) => !Number.isNaN(n));
    if (valid.length) amount = Math.max(...valid);
  }

  const dateMatch = rawText.match(DATE_RE);
  let date: string | null = null;
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!Number.isNaN(parsed.getTime())) date = parsed.toISOString();
  }

  // Merchant heuristic: first substantial line that isn't purely numeric/symbols.
  const merchant = lines.find((l) => l.length > 2 && /[a-zA-Z]{3,}/.test(l) && !TOTAL_KEYWORDS.test(l)) ?? null;

  return { amount, merchant, date };
}
