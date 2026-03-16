// Scraper: The Kathmandu Post — RSP-related news articles
// Source: https://kathmandupost.com
// Target pages:
//   - Search/tag results: https://kathmandupost.com/search?q=rastriya+swatantra
//   - Individual article pages
// Engine: Cheerio (static HTML)

import { prisma } from "@/lib/prisma"
import { fetchPage, sleep } from "../utils/http"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, slugify, parseDate } from "../utils/normalize"
import { ScrapedNewsArticleSchema, type ScrapedNewsArticle } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"

const config = SOURCES["kathmandu-post"]

// Search terms to find RSP-relevant articles
const SEARCH_QUERIES = [
  "rastriya+swatantra+party",
  "balen+shah",
  "rabi+lamichhane",
]

export async function scrapeKathmanduPost() {
  return withScrapeLogging("kathmandu-post", config.baseUrl, async () => {
    const records: ScrapedNewsArticle[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    for (const query of SEARCH_QUERIES) {
      try {
        // kathmandupost.com search page structure:
        // URL: /search?q=query
        // Each result: <article class="article-image"> with <h3><a href="...">title</a></h3>
        const searchUrl = `${config.baseUrl}/search?q=${query}`
        const $ = await fetchPage(searchUrl, {
          retries: config.maxRetries,
          delayMs: config.requestDelayMs,
        })

        if (!rawHtml) rawHtml = $.html()

        // Extract article links from search results
        // kathmandupost.com search results use .article-image or .main-heading containers
        const articleLinks: { title: string; href: string; date: string }[] = []

        $("article, .article-image, .main-heading").each((_, el) => {
          const $el = $(el)
          const $link = $el.find("h3 a, h2 a, .heading a").first()
          const title = $link.text().trim()
          const href = $link.attr("href") ?? ""
          const date = $el.find("time, .date, .published-at").text().trim()

          if (title && href) {
            articleLinks.push({
              title: cleanText(title),
              href: href.startsWith("http") ? href : `${config.baseUrl}${href}`,
              date,
            })
          }
        })

        // Process each article (limit to prevent excessive scraping)
        for (const article of articleLinks.slice(0, 10)) {
          await sleep(config.requestDelayMs)

          try {
            // Scrape individual article page for content
            // kathmandupost.com article structure:
            // .story-section or article has the full text
            const $article = await fetchPage(article.href, {
              retries: 2,
              delayMs: config.requestDelayMs,
            })

            const content = $article(".story-section, .article-content, article p")
              .map((_, el) => $article(el).text().trim())
              .get()
              .join("\n\n")

            const dateStr = article.date ||
              $article("time, .published-at, meta[property='article:published_time']").attr("content") ||
              $article("time").text().trim()

            const newsItem: ScrapedNewsArticle = {
              title: article.title,
              content: cleanText(content).substring(0, 2000),
              date: parseDate(dateStr) ?? new Date(),
              sourceUrl: article.href,
              category: categorizeArticle(article.title, content),
            }

            const parsed = ScrapedNewsArticleSchema.safeParse(newsItem)
            if (!parsed.success) {
              console.warn(`Invalid article data: ${parsed.error.message}`)
              continue
            }

            records.push(parsed.data)

            // Check for duplicate by sourceUrl
            const existing = await prisma.statement.findFirst({
              where: { sourceUrl: article.href },
            })

            if (!existing) {
              // Determine related member
              const relatedMember = await findRelatedMember(article.title + " " + content)

              const newStatement = await prisma.statement.create({
                data: {
                  title: newsItem.title,
                  content: newsItem.content,
                  date: newsItem.date,
                  sourceUrl: newsItem.sourceUrl,
                  memberId: relatedMember?.id,
                  confidence: "SCRAPED",
                },
              })

              // Add to activity feed
              await prisma.activityFeed.create({
                data: {
                  type: "STATEMENT",
                  title: newsItem.title,
                  summary: newsItem.content.substring(0, 200),
                  date: newsItem.date,
                  entityId: newStatement.id,
                  relatedMemberId: relatedMember?.id,
                  sourceUrl: newsItem.sourceUrl,
                },
              })
              created++
            } else {
              updated++
            }
          } catch (err) {
            console.warn(`Failed to scrape article ${article.href}:`, err)
          }
        }
      } catch (err) {
        console.warn(`Failed search query "${query}":`, err)
      }
    }

    return { records, created, updated, rawHtml }
  })
}

/**
 * Categorize an article based on title and content keywords.
 */
function categorizeArticle(
  title: string,
  content: string
): "statement" | "controversy" | "appointment" | "general" {
  const text = (title + " " + content).toLowerCase()
  if (text.includes("controversy") || text.includes("scandal") || text.includes("विवाद")) {
    return "controversy"
  }
  if (text.includes("appoint") || text.includes("cabinet") || text.includes("नियुक्त")) {
    return "appointment"
  }
  if (
    text.includes("statement") ||
    text.includes("said") ||
    text.includes("announced") ||
    text.includes("भने")
  ) {
    return "statement"
  }
  return "general"
}

/**
 * Try to match a known RSP member mentioned in the article text.
 */
async function findRelatedMember(text: string) {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  for (const member of members) {
    // Check if member's last name appears in the text
    const lastName = member.name.split(" ").pop()
    if (lastName && text.toLowerCase().includes(lastName.toLowerCase())) {
      return member
    }
  }
  return null
}
