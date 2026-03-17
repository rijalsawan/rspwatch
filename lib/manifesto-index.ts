// ─────────────────────────────────────────────────────────────────────────────
// Manifesto Search Index
// Extracts text from public/Manifesto.pdf, caches it in memory, and exposes
// searchManifesto(query) returning scored excerpts. Module-level cache survives
// across requests in the same server process — PDF is only parsed once.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs"
import path from "path"

export interface ManifestoMatch {
  /** ~150-char context window around the best keyword hit */
  excerpt: string
  /** 1-indexed page number (estimated via form-feed splitting) */
  page: number
  /** Relevance score, 0–1 */
  score: number
}

interface Chunk {
  text: string
  page: number
}

// ---------- stop-word list (common English + Nepali romanisation noise) ----------
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "and", "in", "on", "at", "for", "with", "that", "this",
  "it", "its", "by", "from", "as", "or", "but", "not", "will", "shall",
  "we", "our", "all", "their", "they", "which", "who", "have", "has",
  "had", "do", "does", "did", "so", "if", "than", "then", "also",
  "ko", "ma", "ra", "ka", "le", "lai", "ko", "ne", "cha",
])

// ---------- module-level cache ----------
let _chunks: Chunk[] | null = null
let _indexAvailable = true

/** Returns false when the PDF was parsed but yielded no extractable text (e.g. image-based PDF). */
export function isManifestoIndexAvailable(): boolean {
  return _indexAvailable
}

async function loadChunks(): Promise<Chunk[]> {
  if (_chunks) return _chunks

  const pdfPath = path.join(process.cwd(), "public", "Manifesto.pdf")
  if (!fs.existsSync(pdfPath)) {
    console.warn("[manifesto-index] Manifesto.pdf not found at", pdfPath)
    _chunks = []
    _indexAvailable = false
    return _chunks
  }

  // Lazy-require keeps pdf-parse out of the client bundle.
  // Use the main entry — serverExternalPackages ensures Turbopack never bundles it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer, options?: object) => Promise<{ text: string; numpages: number }>
  const buffer = fs.readFileSync(pdfPath)
  const { text, numpages } = await pdfParse(buffer)

  // Detect image-based PDF: if non-whitespace content is negligible, text extraction failed
  const substantiveText = text.replace(/\s/g, "")
  if (substantiveText.length < 200) {
    console.warn(
      `[manifesto-index] PDF appears to be image-based — extracted only ${substantiveText.length} non-whitespace chars. Search index unavailable.`
    )
    _chunks = []
    _indexAvailable = false
    return _chunks
  }

  // Form-feed (\f) separates pages in pdf-parse output
  const pages = text.split("\f")
  const chunks: Chunk[] = []

  pages.forEach((pageText, idx) => {
    const pageNum = idx + 1
    // Split into paragraphs on blank lines or long runs of whitespace
    const paras = pageText
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 40) // skip very short fragments

    for (const para of paras) {
      chunks.push({ text: para, page: pageNum })
    }
  })

  // Fallback: if form-feed splitting gave only one big chunk, re-split by sentences
  if (chunks.length < 5 && text.length > 500) {
    const sentences = text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?।])\s+/)
      .filter((s) => s.length > 40)

    const roughPageSize = Math.ceil(sentences.length / numpages)
    chunks.length = 0
    sentences.forEach((s, i) => {
      chunks.push({ text: s, page: Math.floor(i / roughPageSize) + 1 })
    })
  }

  _chunks = chunks
  return chunks
}

// ─────────────────────────────────────────────────────────────────────────────
// Core search function
// ─────────────────────────────────────────────────────────────────────────────

export async function searchManifesto(
  query: string,
  maxResults = 3
): Promise<ManifestoMatch[]> {
  const chunks = await loadChunks()
  if (chunks.length === 0) return []

  const normalised = query.toLowerCase().replace(/[^\w\s]/g, " ")
  const queryWords = normalised
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))

  if (queryWords.length === 0) return []

  const exactPhrase = query.toLowerCase()

  const scored = chunks.map((chunk) => {
    const lower = chunk.text.toLowerCase()
    let score = 0

    // Exact phrase carry the highest weight
    if (lower.includes(exactPhrase)) score += 8

    // Each keyword match adds to score
    for (const word of queryWords) {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")
      const hits = lower.match(re)
      if (hits) score += hits.length
    }

    if (score === 0) return null

    // Prefer concise, information-dense chunks
    const norm = score / Math.sqrt(chunk.text.length / 80)
    return { ...chunk, score: norm }
  })

  const top = (scored.filter(Boolean) as (Chunk & { score: number })[])
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  const maxRaw = top[0]?.score ?? 1

  return top.map((c) => ({
    excerpt: buildExcerpt(c.text, queryWords),
    page: c.page,
    score: parseFloat(Math.min(1, c.score / maxRaw).toFixed(2)),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildExcerpt(text: string, keywords: string[]): string {
  const lower = text.toLowerCase()

  // Find earliest keyword hit to anchor the excerpt
  let anchor = -1
  for (const word of keywords) {
    const pos = lower.indexOf(word)
    if (pos !== -1 && (anchor === -1 || pos < anchor)) anchor = pos
  }

  if (anchor === -1) {
    const snippet = text.slice(0, 160)
    return snippet.length < text.length ? snippet + "…" : snippet
  }

  const start = Math.max(0, anchor - 60)
  const end = Math.min(text.length, anchor + 120)
  const pre = start > 0 ? "…" : ""
  const post = end < text.length ? "…" : ""
  return pre + text.slice(start, end) + post
}

/** Pre-warm the index (optional — call from server startup or on first request) */
export async function warmManifestoIndex(): Promise<void> {
  await loadChunks()
}
