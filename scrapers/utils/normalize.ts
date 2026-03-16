// Data normalization helpers for scraped content.
// Handles Nepali date conversion, text cleaning, and slug generation.

/**
 * Generate a URL-safe slug from a title string.
 * Handles both English and Nepali (Devanagari) text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // strip non-word chars (keeps Devanagari via \w in Unicode mode)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 100)
}

/**
 * Clean HTML entities and excessive whitespace from scraped text.
 */
export function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Nepali (Bikram Sambat) months for reference.
 * Full BS↔AD conversion requires a lookup table; this provides basic
 * string-to-Date parsing for common Nepali date formats on government sites.
 */
const NEPALI_MONTHS: Record<string, number> = {
  "बैशाख": 1, "जेष्ठ": 2, "आषाढ": 3, "श्रावण": 4,
  "भाद्र": 5, "आश्विन": 6, "कार्तिक": 7, "मंसिर": 8,
  "पौष": 9, "माघ": 10, "फाल्गुन": 11, "चैत्र": 12,
}

/**
 * Attempt to parse a date string in various formats encountered on Nepali sites.
 * Returns null if parsing fails — scraper should log the failure rather than crashing.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Try standard ISO / English date first
  const native = new Date(dateStr)
  if (!isNaN(native.getTime())) return native

  // Try common Nepali formats: "2082/11/28" (BS year)
  const bsMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (bsMatch) {
    const bsYear = parseInt(bsMatch[1], 10)
    // Rough BS→AD: AD ≈ BS - 57 (approximate, off by 0-1 year)
    if (bsYear > 2000) {
      const adYear = bsYear - 57
      const month = parseInt(bsMatch[2], 10) - 1
      const day = parseInt(bsMatch[3], 10)
      return new Date(adYear, month, day)
    }
  }

  return null
}

/**
 * Extract a numeric percentage from strings like "98%", "98.5 %", etc.
 */
export function parsePercentage(text: string): number | null {
  const match = text.match(/([\d.]+)\s*%/)
  if (!match) return null
  const val = parseFloat(match[1])
  return isNaN(val) ? null : val
}

/**
 * Map scraped status strings to our LawStatus enum values.
 */
export function normalizeLawStatus(
  raw: string
): "DRAFT" | "PROPOSED" | "COMMITTEE" | "PASSED" | "REJECTED" | "ENACTED" {
  const lower = raw.toLowerCase().trim()
  if (lower.includes("enacted") || lower.includes("law")) return "ENACTED"
  if (lower.includes("passed") || lower.includes("approved")) return "PASSED"
  if (lower.includes("committee")) return "COMMITTEE"
  if (lower.includes("rejected") || lower.includes("withdrawn")) return "REJECTED"
  if (lower.includes("draft")) return "DRAFT"
  return "PROPOSED"
}
