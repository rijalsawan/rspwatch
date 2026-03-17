#!/usr/bin/env tsx
// scripts/fetch-member-photos.ts
//
// Downloads official RSP member photos from rspnepal.org and updates the DB.
//
// Run with:
//   npx tsx scripts/fetch-member-photos.ts
//
// What it does:
//  1. Creates public/members/ directory if needed
//  2. Downloads each member photo from api.rspnepal.org
//  3. Saves with a predictable slug-based filename
//  4. Updates matching DB members with photoUrl = /members/{file}
//  5. Reports matched / unmatched / failed downloads

import https from "node:https"
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
import "dotenv/config"

// ─── Prisma client (mirrors seed.ts pattern) ─────────────────────────────────

const prisma = (
  new PrismaClient({ accelerateUrl: process.env.DATABASE_URL! })
    .$extends(withAccelerate()) as unknown as PrismaClient
)

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL   = "https://api.rspnepal.org/images/executive-members/"
const OUTPUT_DIR = path.join(process.cwd(), "public", "members")

// ─── Full member list scraped from https://rspnepal.org/executive-members ────
// Last updated: March 2026
// Base URL: https://api.rspnepal.org/images/executive-members/{file}

const RSP_MEMBERS = [
  // ── Leadership ───────────────────────────────────────────────────────────
  { name: "Rabi Lamichhane",       file: "uvvbiugt60dcb0eabfb0a2be33a9.jpeg" },
  { name: "Balendra Shah",          file: "peakytnbf2794e7ca52f5fc70046.JPG"  },
  { name: "Dol Prasad Aryal",       file: "ocfjwatb2f4aa9ee74b5648f759a.jpeg" },
  { name: "Swarnim Wagle",          file: "sqoqonbrcff4e83952c0458a206b.jpg"  },
  { name: "Kabindra Burlakoti",     file: "etosgpvkce2b0fc9904330b616e4.jpeg" },
  { name: "Bipin Kumar Acharya",    file: "ingbfuuw84c65bc49199d7638100.jpg"  },
  { name: "Biraj Bhakta Shrestha",  file: "wtwkigio4fbe545add50df323103.jpg"  },
  { name: "Lima Adhikari",          file: "wsiwsvjt0bff91e07a450363e04f.jpeg" },
  { name: "Basu Maya Tamang",       file: "cprthfseeecd9974eeadb134cc68.jpeg" },
  { name: "Deepak Raj Bohara",      file: "ohroxdeq38f6085ba274f0e727ea.jpeg" },
  { name: "Manish Jha",             file: "gdyviejk0437817b34bba1258eec.jpg"  },
  { name: "Prathiva Rawal",         file: "vvnqgrdld7bb84d9dec03e0009dd.jpeg" },
  { name: "Ramesh Prasai",          file: "jkagrdgx0dfd425e56ec4931f8d8.jpeg" },

  // ── General Members ───────────────────────────────────────────────────────
  { name: "Upendra Pandey",         file: "itaeecud9f3612b75e03aff4645b.jpeg" },
  { name: "Ishra Mulla Miya",        file: "iucyqokfd459e7a162e0bb66f3a3.png"  },
  { name: "Ganesh Parajuli",         file: "fuvdixro7f2f7f475c13280ee871.jpeg" },
  { name: "Sobita Gautam",           file: "jhnwhhey9ca775e474d68c2c77c3.jpeg" },
  { name: "Kusum Maharjan",          file: "qcyfgwcw4b30ec4bba51fe356fe0.JPG"  },
  { name: "Bishnu Kumar Shrestha",   file: "blvcihbn0d53def828669f4954e4.jpeg" },
  { name: "Ramkrishna Bhattarai",    file: "jfixdqfh72e3e862f5d2ead25115.jpeg" },
  { name: "Rakesh Yadav",            file: "yxwhajoma976855a902cfa102b96.jpeg" },
  { name: "Prabhat Adhikari",        file: "ibedlrwfaaa48ff4f4893a72993d.jpeg" },
  { name: "Pramila Kuluju",          file: "qubytdyx89920b232694920c2a0b.JPG"  },
  { name: "Rabina Ghimire",          file: "mhaldyvd8974aa99f3173517ba55.jpeg" },
  { name: "Aliza Gurung",            file: "irqdwgwjfd936d891ae71a606aa2.jpeg" },
  { name: "Sabina B.K.",             file: "wmricpxc9b99339118695d73fec8.jpeg" },
  { name: "Arniko Pandey",           file: "hsfwfbfge89781c97a3156a48081.jpeg" },
  { name: "Ganesh Karki",            file: "bbihhrkba66a7f46aea542efe823.jpeg" },
  { name: "Nisha Mehta",             file: "rgbnxnpn8fb52dfebeaccebe248b.jpeg" },
  { name: "Bindawasini Kansakar",    file: "nldgyvad2e4435472827f0d335b0.jpeg" },
  { name: "Rupa Sankar",             file: "neclpjta18514b149841f4e8355e.jpeg" },
  { name: "Megh Ale",                file: "trayeynwe95db2b1cb2275bcb960.jpeg" },
  { name: "Bijay Jairu",             file: "jrsjorfn86ab73832fcc6ca51057.jpeg" },
  { name: "Kranti Shikha Dhakal",    file: "rhfrqqpf1be66c6e36d5bd43fab7.jpeg" },
  { name: "Tika Sangraula",          file: "fyxmwlba7576548f4e5beb02d564.jpeg" },
  { name: "Dhurba Giri",             file: "qmmysgtjc7742928798d7e5a024e.jpeg" },
  { name: "Arjun Adhikari",          file: "brxxigbhf583f686dc565caae6d9.jpg"  },
  { name: "Mohan Thapa",             file: "tvjyryum4854a79192c9eea9a8e2.jpeg" },
  { name: "Khusbu Sarkar Shrestha",  file: "xdultitmbd87d0b2957197dc3a41.jpeg" },
  { name: "Nisha Dangi",             file: "qdnbfjjnf240272179d5d097c5aa.jpg"  },
  { name: "Toshima Karki",           file: "nswpieajd893479c1f4bb1be8a7d.jpg"  },
  { name: "Sisir Khanal",            file: "xdksoksib854e077d132c184dff1.jpg"  },
  { name: "Hari Dhakal",             file: "cwlhpijl8ecd975dc967f5a6362c.jpg"  },
  { name: "Chanda Karki",            file: "qnrqntpidd8654b4691e292ba4aa.jpg"  },
  { name: "Ashim Shah",              file: "frbilefd47b1c18f656337fd8d1d.jpeg" },
  { name: "Laxmi Tiwari",            file: "xsnvhfne7713ea4a9eea16f92301.jpg"  },
  { name: "Ashok Kumar Chaudhari",   file: "ssicijnyc2d0446fe1544034664b.jpg"  },
  { name: "Shiva Nepali",            file: "dcrjifks2014913d7730cc826d70.jpg"  },
  { name: "Binita Kathayat",         file: "uhtvptkve668adf75a0f2125164f.jpg"  },
  { name: "Anil Keshari Shah",       file: "qcnqmebs38f9db5fa42363947755.jpg"  },
  { name: "Pukar Baam",              file: "pvcgcima70b838e9b297454f63da.jpg"  },
  { name: "Nanda Yadav",             file: "evqswvfm9c2df74614dc38c889f2.jpeg" },
  { name: "Rajan Gautam",            file: "jytaqcyab12ae25333874222f95f.jpg"  },
  { name: "Goma Chhetri",            file: "hbbnliawff37601799f5b233e97e.jpeg" },
  { name: "Kamini Chaudhari",        file: "ydfbonyg16a4411ccfc589d3f247.jpg"  },
  { name: "Samikchya Baskota",       file: "rltsasnd91dc58b2cd28324d9e0b.png"  },
  { name: "Prakash Chandra Pariyar", file: "pbhkepesaaf9b7545b3be9ec32f3.png"  },
  { name: "Ranju Darshana",          file: "efgxfqji8ec8788670b66c40837c.JPG"  },
  { name: "Ashutosh Pradhan",        file: "swsekfnw53c73c27586a0ffd7256.jpg"  },
  { name: "Nawaraj Thapa",           file: "ptqpkrrj8e404671dccbe798579e.png"  },
  { name: "Suraj Pradhan",           file: "llqhgsdd2a4c1ff3fa76e1fe37a5.jpg"  },
  { name: "Dhanej Thapa",            file: "qhplardjf02172647c317c4292b6.jpg"  },
  { name: "Sunil Lamsal",            file: "mievlhnf453d4d12c05e546ebc52.jpg"  },
  { name: "Bhupadev Shah",           file: "qhagpwldbca5cdc1c5e7e2fd4c4c.jpg"  },
  { name: "Sasmit Pokharel",         file: "njcmderi9045c1ba0c13bf35006c.JPG"  },
  { name: "Sagar Dhakal",            file: "pxuxfgtx9436bf458f67e59a725e.png"  },
  { name: "Sarita Gyawali",          file: "yfbsloib94f02630ceb86d85c63f.jpg"  },
  { name: "Ramesh Paudel",           file: "lwicsqroec75fb9439580d44269c.png"  },
  { name: "KP Khanal",               file: "tukgsksq895987f0b5ccef64a86b.jpg"  },
  { name: "Khadak Raj Paudel",       file: "iwcessmg8d7b250d8edea6d8a0b9.jpg"  },
  { name: "Santosh Giri",            file: "ylfatoij937c333e87af5df9f6f8.png"  },
  { name: "Laxman Tharu",            file: "ebccxjkq9953b17d2b888c3c3260.jpg"  },
  { name: "Khagendra Sunar",         file: "njndxcac29ca114af31729790217.png"  },
  { name: "Namita Yadav",            file: "wjaiodbhc9ef59c6fcf660bab2ea.jpg"  },
  { name: "Laxmi Bardewa",           file: "hjhgklrd539dd924e422aec14063.png"  },
  { name: "Ram Kumar Dhungana",      file: "phvbsvqd3b96ee1008d2c39dc21d.png"  },
  { name: "Rohan Karki",             file: "ucapedwgb2b99042e5234e00583e.jpg"  },
  { name: "Ananta Raj Ghimire",      file: "wlhlvtwu58e13c6c4acff23fccb8.png"  },
  { name: "Sushant Baidik",          file: "lxsxobjf0ac26e77714c840206e6.jpg"  },
  { name: "Pradeep Gyawali",         file: "fnfddlynf60c3f1c59a8cc1c148f.jpg"  },
  { name: "James Karki",             file: "nnlpbqyg91dc4e6c4b7ab6121249.jpg"  },
  { name: "Madhusudan Dhakal",       file: "yocflwsx68aee48deb5626a9f963.png"  },
  { name: "Ojaswi Raj Thapa",        file: "kgmfumlled76d29ed0c2636b9a3e.png"  },
  { name: "Shiva Shankar Yadav",     file: "umnyixue62f806c3b11ec7454389.jpg"  },
  { name: "Aditya Acharya",          file: "kmivoeqq1cb5930f8efbc1c032cb.png"  },
  { name: "Pradeep Pande",           file: "eiqebpba3913b408fdfa3a2afe26.png"  },
  { name: "Khemraj Saud",            file: "tegwnprx669473a311f80facbf31.jpg"  },

  // ── Provincial Committee Presidents ──────────────────────────────────────
  { name: "Tapeshwor Yadav",         file: "tigwluhs37a4dcee15b090a1367c.jpg"  },
  { name: "Achutam Lamichane",       file: "goioqfjledfe961e4b3802af7167.jpg"  },
  { name: "Rajan Gautam Gandaki",    file: "mqivgpih0de9c81c89c622045664.jpg"  },
  { name: "Devraj Pathak",           file: "swdjbvon37f487b5b94b3407e12b.jpg"  },
  { name: "Madan Khadka",            file: "ewtrfmop58643739987c40465d71.jpg"  },
  { name: "Prakash Bista",           file: "sscgpjwv5a8dc70d8e98bfd275fc.jpg"  },
] as const

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Strip honorifics (Dr., Er., Mr., Mrs.) and normalize to lowercase */
function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(dr|er|mr|mrs|prof)\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** kebab-case slug from a name for use as a local filename */
function nameToSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(dr|er|mr|mrs|prof)\.?\s+/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve()
      return
    }
    const mod = url.startsWith("https") ? https : http
    const file = fs.createWriteStream(dest)

    const makeRequest = (targetUrl: string) => {
      mod.get(targetUrl, (res) => {
        // Follow redirects
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          file.close()
          fs.unlink(dest, () => {})
          return makeRequest(res.headers.location as string)
        }
        if (res.statusCode !== 200) {
          file.destroy()
          fs.unlink(dest, () => {})
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on("finish", () => file.close(() => resolve()))
        file.on("error", (err) => { fs.unlink(dest, () => {}); reject(err) })
      }).on("error", (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
    }
    makeRequest(url)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Parliament Watch — Member Photo Downloader")
  console.log("Source: https://rspnepal.org/executive-members\n")

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load all DB members
  const dbMembers = await (prisma as any).member.findMany({
    select: { id: true, slug: true, name: true, photoUrl: true },
  })
  console.log(`DB members: ${dbMembers.length}`)
  console.log(`RSP site:   ${RSP_MEMBERS.length} photos\n`)
  console.log("─".repeat(55))

  let downloaded = 0
  let alreadyExists = 0
  let failed = 0
  let dbUpdated = 0
  const unmatched: string[] = []

  for (const rsp of RSP_MEMBERS) {
    const imageUrl = `${BASE_URL}${rsp.file}`
    const ext      = path.extname(rsp.file).toLowerCase() || ".jpg"
    const slug     = nameToSlug(rsp.name)
    const filename = `${slug}${ext}`
    const localPath  = path.join(OUTPUT_DIR, filename)
    const publicPath = `/members/${filename}`

    // 1. Download
    const existed = fs.existsSync(localPath)
    try {
      await downloadFile(imageUrl, localPath)
      if (existed) alreadyExists++
      else         downloaded++
    } catch (err) {
      console.error(`  ✗ Download failed: ${rsp.name} — ${err}`)
      failed++
      continue
    }

    // 2. Find matching DB member
    const normalRsp = normalizeName(rsp.name)
    const match = dbMembers.find((db: { name: string }) => {
      const normalDb = normalizeName(db.name)
      if (normalDb === normalRsp) return true
      // Also match when first + last name match (handles Dr./Sisir/Shishir variants)
      const rWords = normalRsp.split(" ")
      const dWords = normalDb.split(" ")
      return (
        rWords.length >= 2 &&
        dWords.length >= 2 &&
        rWords[0] === dWords[0] &&
        rWords[rWords.length - 1] === dWords[dWords.length - 1]
      )
    })

    if (match) {
      await (prisma as any).member.update({
        where: { id: match.id },
        data: { photoUrl: publicPath },
      })
      console.log(`  ✓ ${rsp.name.padEnd(28)} → ${filename}`)
      dbUpdated++
    } else {
      console.log(`  ? ${rsp.name.padEnd(28)}   (no DB entry — photo saved)`)
      unmatched.push(rsp.name)
    }
  }

  console.log("\n" + "─".repeat(55))
  console.log(`Downloaded:           ${downloaded} new images`)
  console.log(`Already cached:       ${alreadyExists} images`)
  console.log(`Download failures:    ${failed}`)
  console.log(`DB members updated:   ${dbUpdated}`)
  console.log(`Photos saved (no DB): ${unmatched.length}`)

  if (unmatched.length) {
    console.log(`\nRSP members with photos but no matching DB entry:`)
    unmatched.forEach((n) => console.log(`  - ${n}`))
    console.log(
      `\nTo add these members to the DB, add them to prisma/seed.ts\n` +
      `and re-run: npx prisma db seed`
    )
  }

  await (prisma as any).$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
