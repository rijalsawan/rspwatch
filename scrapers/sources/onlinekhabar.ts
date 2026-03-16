// Scraper: OnlineKhabar — RSP-related news articles
// Source: https://english.onlinekhabar.com
// Target pages:
//   - Search: https://english.onlinekhabar.com/?s=rastriya+swatantra
//   - Individual article pages
// Engine: Cheerio (static HTML)

import { prisma } from "@/lib/prisma"
import { fetchPage, sleep } from "../utils/http"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, parseDate } from "../utils/normalize"
import { ScrapedNewsArticleSchema, type ScrapedNewsArticle } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"

const config = SOURCES["onlinekhabar"]

const SEARCH_QUERIES = [
  "rastriya+swatantra+party",
  "balen+shah",
  "rsp+nepal",
]

export async function scrapeOnlineKhabar() {
  return withScrapeLogging("onlinekhabar", config.baseUrl, async () => {
    const records: ScrapedNewsArticle[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    for (const query of SEARCH_QUERIES) {
      try {
        // OnlineKhabar search page structure:
        // URL: /?s=query
        // Results: <div class="ok-news-post"> with <h2><a href="...">title</a></h2>
        const searchUrl = `${config.baseUrl}/?s=${query}`
        const $ = await fetchPage(searchUrl, {
          retries: config.maxRetries,
          delayMs: config.requestDelayMs,
        })

        if (!rawHtml) rawHtml = $.html()

        const articleLinks: { title: string; href: string; date: string }[] = []

        // OnlineKhabar uses .ok-news-post containers in search results
        $(".ok-news-post, article, .post-item").each((_, el) => {
          const $el = $(el)
          const $link = $el.find("h2 a, h3 a, .ok-post-title a").first()
          const title = $link.text().trim()
          const href = $link.attr("href") ?? ""
          const date = $el.find("time, .ok-post-date, .date").text().trim()

          if (title && href) {
            articleLinks.push({
              title: cleanText(title),
              href: href.startsWith("http") ? href : `${config.baseUrl}${href}`,
              date,
            })
          }
        })

        for (const article of articleLinks.slice(0, 10)) {
          await sleep(config.requestDelayMs)

          try {
            // OnlineKhabar article page structure:
            // .ok-single-post-content or .entry-content contains the article body
            const $article = await fetchPage(article.href, {
              retries: 2,
              delayMs: config.requestDelayMs,
            })

            const content = $article(".ok-single-post-content p, .entry-content p, article p")
              .map((_, el) => $article(el).text().trim())
              .get()
              .join("\n\n")

            const dateStr = article.date ||
              $article("time").attr("datetime") ||
              $article(".ok-post-date").text().trim()

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
  if (text.includes("statement") || text.includes("said") || text.includes("announced")) {
    return "statement"
  }
  return "general"
}

async function findRelatedMember(text: string) {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  for (const member of members) {
    const lastName = member.name.split(" ").pop()
    if (lastName && text.toLowerCase().includes(lastName.toLowerCase())) {
      return member
    }
  }
  return null
}
