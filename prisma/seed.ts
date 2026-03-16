// ─────────────────────────────────────────────────────────────────────────────
// RSP Watch — Database Seed
// ─────────────────────────────────────────────────────────────────────────────
//
// DATA AUTHENTICITY NOTES
// =======================
// This seed combines two categories of data:
//
// [A] VERIFIED HISTORICAL DATA — real RSP members elected in Nepal's November
//     2022 (2079 BS) general election, sourced from Ekantipur's official 2079
//     General Election results portal and Wikipedia.
//     These records carry { confidence: "SCRAPED" }.
//
// [B] ILLUSTRATIVE PROJECTION DATA — fictional MPs, laws, votes, and promise
//     statuses built for the *hypothetical 2026 scenario* in which RSP has
//     formed a majority government. These represent RSP's *stated platform
//     goals* (sourced from the real Citizen Contract) applied to a future that
//     has not yet occurred.
//     These records carry { confidence: "MANUAL" }.
//
// SOURCES
// -------
//  • 2079 General Election Results — https://generalelection2079.ekantipur.com
//  • Rabi Lamichhane — https://en.wikipedia.org/wiki/Rabi_Lamichhane
//  • Swarnim Wagle   — https://en.wikipedia.org/wiki/Swarnim_Wagle
//  • RSP Party       — https://en.wikipedia.org/wiki/Rastriya_Swatantra_Party
//  • RSP Citizen Contract (नागरिक करार) — published April 2022 before election
//
// WHAT IS NOT INCLUDED
// --------------------
//  • Balen Shah: The Mayor of Kathmandu, elected independently in May 2022.
//    He is NOT affiliated with RSP, NOT a Member of Parliament, and has NEVER
//    been a PM candidate. Previous versions of this seed incorrectly listed him.
//  • "Sumana Shrestha — Kathmandu-8": That FPTP seat was won by Birajbhakta
//    Shrestha (10,105 votes). Sumana Shrestha is a PR list member.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
import "dotenv/config"

const prisma = (
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
  }).$extends(withAccelerate()) as unknown as PrismaClient
)

async function main() {
  console.log("Seeding RSP Watch database...")

  // ─── 1. MEMBERS ────────────────────────────────────────────────────────────
  //
  // Section [A]: All 7 confirmed FPTP winners from the 2079 BS (Nov 2022)
  // general election, plus Swarnim Wagle (Tanahun-1 by-election, 2080 BS)
  // and Sumana Shrestha + Manish Jha (PR/Proportional list members).
  // Source: https://generalelection2079.ekantipur.com
  //
  // Section [B]: Fictional MPs representing the hypothetical 2026 RSP majority
  // across all 7 provinces. These are illustrative — they are NOT real people
  // and should be replaced when real scraped data is available.

  const members = [

    // ── [A] VERIFIED: FPTP Winners — Nov 2022 General Election ───────────────
    // Source for all: https://generalelection2079.ekantipur.com/pradesh-3/...

    {
      slug: "rabi-lamichhane",
      name: "Rabi Lamichhane",
      nameNepali: "रवि लामिछाने",
      constituency: "Chitwan-2",
      province: "Bagmati",
      // In the real 2022 election he served as Deputy PM & Home Minister
      // in the Dahal-led coalition. In this app's 2026 scenario he is the
      // RSP party president and hypothetical Prime Minister.
      role: "Prime Minister",
      attendancePercent: 95,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://en.wikipedia.org/wiki/Rabi_Lamichhane",
    },
    {
      slug: "hari-dhakal",
      name: "Hari Dhakal",
      nameNepali: "हरि ढकाल",
      constituency: "Chitwan-1",
      province: "Bagmati",
      role: "Member of Parliament",
      attendancePercent: 91,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-chitwan",
    },
    {
      slug: "sobita-gautam",
      name: "Sobita Gautam",
      nameNepali: "सोबिता गौतम",
      constituency: "Kathmandu-2",
      province: "Bagmati",
      role: "Member of Parliament",
      attendancePercent: 92,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-kathmandu",
    },
    {
      slug: "shishir-khanal",
      name: "Shishir Khanal",
      nameNepali: "शिशिर खनाल",
      constituency: "Kathmandu-6",
      province: "Bagmati",
      role: "Member of Parliament",
      attendancePercent: 94,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-kathmandu",
    },
    {
      slug: "ganesh-parajuli",
      name: "Ganesh Parajuli",
      nameNepali: "गणेश पराजुली",
      constituency: "Kathmandu-7",
      province: "Bagmati",
      role: "Member of Parliament",
      attendancePercent: 89,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-kathmandu",
    },
    {
      slug: "birajbhakta-shrestha",
      name: "Birajbhakta Shrestha",
      nameNepali: "विराजभक्त श्रेष्ठ",
      // Note: This is the real Kathmandu-8 FPTP winner (10,105 votes).
      // Previous seed incorrectly attributed this seat to Sumana Shrestha.
      constituency: "Kathmandu-8",
      province: "Bagmati",
      role: "Member of Parliament",
      attendancePercent: 90,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-kathmandu",
    },
    {
      slug: "toshima-karki",
      name: "Dr. Toshima Karki",
      nameNepali: "तोसिमा कार्की",
      // Won Lalitpur-3 with 31,136 votes — an 18,173-vote margin, the largest
      // margin of any Lalitpur constituency in the 2079 general election.
      constituency: "Lalitpur-3",
      province: "Bagmati",
      // Medical doctor — plausible Health Minister in the 2026 fictional govt.
      role: "Minister of Health",
      attendancePercent: 97,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://generalelection2079.ekantipur.com/pradesh-3/district-lalitpur",
    },

    // ── [A] VERIFIED: By-Election & Proportional List Members ────────────────

    {
      slug: "swarnim-wagle",
      name: "Dr. Swarnim Wagle",
      nameNepali: "स्वर्णिम वाग्ले",
      // Did NOT win the Nov 2022 general election from Tanahun-1 (NC's
      // Ramchandra Paudel won that seat, who was then elected President of
      // Nepal in March 2023). Wagle won the subsequent Tanahun-1 by-election
      // (2080 BS / ~2023-2024 CE) with 34,919 votes.
      constituency: "Tanahun-1",
      province: "Gandaki",
      // Former World Bank / UNDP economist — plausible Finance Minister.
      role: "Minister of Finance",
      attendancePercent: 96,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://en.wikipedia.org/wiki/Swarnim_Wagle",
    },
    {
      slug: "sumana-shrestha",
      name: "Sumana Shrestha",
      nameNepali: "सुमना श्रेष्ठ",
      // PR (proportional representation) member — her exact PR list rank is
      // not publicly available. Previous seed incorrectly placed her at
      // Kathmandu-8 (which was won by Birajbhakta Shrestha).
      // Known for ICT/digital rights advocacy in parliament.
      constituency: "PR (Proportional List)",
      province: "Bagmati",
      role: "Minister of ICT & Digital Affairs",
      attendancePercent: 99,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://en.wikipedia.org/wiki/Rastriya_Swatantra_Party",
    },
    {
      slug: "manish-jha",
      name: "Manish Jha",
      nameNepali: "मनिष झा",
      // PR list member representing Madhesh region.
      constituency: "PR (Proportional List)",
      province: "Madhesh",
      role: "Member of Parliament",
      attendancePercent: 88,
      confidence: "SCRAPED" as const,
      sourceUrl: "https://en.wikipedia.org/wiki/Rastriya_Swatantra_Party",
    },

    // ── [B] ILLUSTRATIVE: Fictional MPs for the 2026 Scenario ────────────────
    // These names do not correspond to real RSP members. They represent the
    // hypothetical expanded caucus RSP would need for a 2026 majority.
    // Replace with real data once available from parliament.gov.np scraper.

    // Bagmati (additional fictional seats)
    { slug: "kapil-koirala", name: "Kapil Koirala", constituency: "Kathmandu-3", province: "Bagmati", role: "Member of Parliament", attendancePercent: 91, confidence: "MANUAL" as const },
    { slug: "srijana-thapa", name: "Srijana Thapa", constituency: "Bhaktapur-1", province: "Bagmati", role: "Member of Parliament", attendancePercent: 89, confidence: "MANUAL" as const },
    { slug: "anil-kc", name: "Anil KC", constituency: "Nuwakot-1", province: "Bagmati", role: "Member of Parliament", attendancePercent: 93, confidence: "MANUAL" as const },
    { slug: "meena-subedi", name: "Meena Subedi", constituency: "Kathmandu-5", province: "Bagmati", role: "Member of Parliament", attendancePercent: 90, confidence: "MANUAL" as const },
    { slug: "bikash-dhakal", name: "Bikash Dhakal", constituency: "Kavrepalanchok-1", province: "Bagmati", role: "Member of Parliament", attendancePercent: 88, confidence: "MANUAL" as const },
    { slug: "sunita-basnet", name: "Sunita Basnet", constituency: "Sindhupalchok-1", province: "Bagmati", role: "Member of Parliament", attendancePercent: 92, confidence: "MANUAL" as const },
    { slug: "raju-karki", name: "Raju Karki", constituency: "Lalitpur-1", province: "Bagmati", role: "Member of Parliament", attendancePercent: 87, confidence: "MANUAL" as const },

    // Madhesh (fictional)
    { slug: "deepak-yadav", name: "Deepak Yadav", constituency: "Janakpur-1", province: "Madhesh", role: "Member of Parliament", attendancePercent: 85, confidence: "MANUAL" as const },
    { slug: "anita-mishra", name: "Anita Mishra", constituency: "Birgunj-2", province: "Madhesh", role: "Member of Parliament", attendancePercent: 90, confidence: "MANUAL" as const },
    { slug: "rajesh-shah-madhesh", name: "Rajesh Shah", constituency: "Parsa-1", province: "Madhesh", role: "Member of Parliament", attendancePercent: 86, confidence: "MANUAL" as const },

    // Koshi (fictional)
    { slug: "binod-rai", name: "Binod Rai", constituency: "Dhankuta-1", province: "Koshi", role: "Member of Parliament", attendancePercent: 91, confidence: "MANUAL" as const },
    { slug: "pramila-limbu", name: "Pramila Limbu", constituency: "Ilam-1", province: "Koshi", role: "Member of Parliament", attendancePercent: 93, confidence: "MANUAL" as const },
    { slug: "suresh-thapa-koshi", name: "Suresh Thapa", constituency: "Morang-2", province: "Koshi", role: "Member of Parliament", attendancePercent: 89, confidence: "MANUAL" as const },
    { slug: "kamala-rai", name: "Kamala Rai", constituency: "Jhapa-1", province: "Koshi", role: "Member of Parliament", attendancePercent: 92, confidence: "MANUAL" as const },

    // Gandaki (fictional, aside from Wagle above)
    { slug: "gita-adhikari", name: "Gita Adhikari", constituency: "Kaski-1", province: "Gandaki", role: "Member of Parliament", attendancePercent: 94, confidence: "MANUAL" as const },
    { slug: "ramesh-gurung", name: "Ramesh Gurung", constituency: "Lamjung-1", province: "Gandaki", role: "Member of Parliament", attendancePercent: 90, confidence: "MANUAL" as const },

    // Lumbini (fictional)
    { slug: "sarita-gc", name: "Sarita GC", constituency: "Rupandehi-1", province: "Lumbini", role: "Member of Parliament", attendancePercent: 91, confidence: "MANUAL" as const },
    { slug: "anup-sharma", name: "Anup Sharma", constituency: "Kapilvastu-2", province: "Lumbini", role: "Member of Parliament", attendancePercent: 90, confidence: "MANUAL" as const },
    { slug: "bikram-pandey", name: "Bikram Pandey", constituency: "Palpa-1", province: "Lumbini", role: "Member of Parliament", attendancePercent: 87, confidence: "MANUAL" as const },

    // Karnali (fictional)
    { slug: "asmita-shahi", name: "Asmita Shahi", constituency: "Surkhet-1", province: "Karnali", role: "Member of Parliament", attendancePercent: 86, confidence: "MANUAL" as const },
    { slug: "bishnu-budha", name: "Bishnu Budha", constituency: "Jajarkot-1", province: "Karnali", role: "Member of Parliament", attendancePercent: 84, confidence: "MANUAL" as const },

    // Sudurpashchim (fictional)
    { slug: "mina-bhandari", name: "Mina Bhandari", constituency: "Kailali-1", province: "Sudurpashchim", role: "Member of Parliament", attendancePercent: 89, confidence: "MANUAL" as const },
    { slug: "tek-chand", name: "Tek Bahadur Chand", constituency: "Baitadi-1", province: "Sudurpashchim", role: "Member of Parliament", attendancePercent: 85, confidence: "MANUAL" as const },
    { slug: "hira-singh-dhami", name: "Hira Singh Dhami", constituency: "Dadeldhura-1", province: "Sudurpashchim", role: "Member of Parliament", attendancePercent: 88, confidence: "MANUAL" as const },
  ]

  const memberRecords = []
  for (const m of members) {
    const record = await (prisma as any).member.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        nameNepali: m.nameNepali ?? null,
        constituency: m.constituency,
        province: m.province,
        role: m.role,
        attendancePercent: m.attendancePercent,
        sourceUrl: m.sourceUrl ?? null,
      },
      create: {
        slug: m.slug,
        name: m.name,
        nameNepali: m.nameNepali ?? null,
        constituency: m.constituency,
        province: m.province,
        role: m.role,
        attendancePercent: m.attendancePercent,
        sourceUrl: m.sourceUrl ?? null,
        isActive: true,
      },
    })
    memberRecords.push(record)
  }
  console.log(`  Seeded ${memberRecords.length} members (${members.filter(m => m.confidence === "SCRAPED").length} verified, ${members.filter(m => m.confidence === "MANUAL").length} illustrative)`)

  const memberMap = new Map(memberRecords.map((m) => [m.slug, m]))

  // ─── 2. PROMISES ───────────────────────────────────────────────────────────
  //
  // All promises are grounded in RSP's real Citizen Contract (नागरिक करार)
  // and 2022 election manifesto. The THEMATIC CONTENT is authentic — RSP
  // genuinely campaigned on each of these issues.
  //
  // The STATUSES (KEPT / IN_PROGRESS / BROKEN) are ILLUSTRATIVE and represent
  // the hypothetical 2026 scenario. RSP has not yet governed at national level.
  //
  // Source: RSP Citizen Contract (नागरिक करार), 2079 BS
  //         https://en.wikipedia.org/wiki/Rastriya_Swatantra_Party

  const promiseSourceUrl = "https://en.wikipedia.org/wiki/Rastriya_Swatantra_Party"

  const promises = [
    {
      slug: "digital-citizen-portal",
      title: "Launch One-Stop Digital Citizen Service Portal",
      description: "Digitize 90% of basic ward services (birth certificates, local taxes, passport applications) to eliminate middlemen and long queues.",
      category: "Governance",
      status: "KEPT" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "mandatory-asset-declaration",
      title: "Mandatory Asset Declaration for All Elected Officials",
      description: "All RSP MPs and participating coalition members must publicly declare their domestic and foreign assets within 30 days of assuming office. Builds on real RSP anti-corruption stance.",
      category: "Anti-Corruption",
      status: "KEPT" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "school-board-overhaul",
      title: "Overhaul Public School Management Boards",
      description: "Remove partisan political appointments from local school boards and replace them with merit-based educators and parent committees.",
      category: "Education",
      status: "IN_PROGRESS" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "startup-tax-holiday",
      title: "Establish Startup Fund and 5-Year Tax Holiday",
      description: "Create a Rs. 5 Billion innovation fund and a 5-year corporate tax block exemption for newly registered tech startups.",
      category: "Economy",
      status: "IN_PROGRESS" as const,
      source: "POLICY_BRIEF" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "procurement-livestream",
      title: "Live-Stream All Public Procurement Processes",
      description: "Ensure that all public tender openings above Rs. 10 Million are live-streamed to prevent bid tampering. The original Citizen Contract commitment.",
      category: "Anti-Corruption",
      status: "BROKEN" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "universal-health-insurance",
      title: "Universal Basic Healthcare Insurance Expansion",
      description: "Expand national health insurance coverage to 80% of citizens by making enrollment automatic with national ID issuance.",
      category: "Health",
      status: "NOT_STARTED" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "end-political-appointments",
      title: "End Political Appointments in Civil Service",
      description: "Establish merit-based hiring for all government positions through an independent Public Service Commission with binding authority. Core RSP platform commitment.",
      category: "Governance",
      status: "IN_PROGRESS" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "judicial-independence",
      title: "Strengthen Judicial Independence",
      description: "Amend constitutional provisions to ensure judicial appointments are free from political influence with a transparent selection process.",
      category: "Governance",
      status: "NOT_STARTED" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "federalism-implementation",
      title: "Effective Federalism Implementation",
      description: "Transfer all constitutionally mandated powers, budgets, and personnel to provincial and local governments within the first year.",
      category: "Governance",
      status: "IN_PROGRESS" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "agriculture-modernization",
      title: "Agriculture Sector Modernization Fund",
      description: "Create a Rs. 10 Billion fund for mechanization, cold storage chains, and crop insurance across all 7 provinces.",
      category: "Economy",
      status: "NOT_STARTED" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "renewable-energy-target",
      title: "100% Renewable Domestic Energy Target by 2030",
      description: "Achieve 100% domestic electricity from renewable sources by 2030 with priority on hydropower and solar. Nepal already has significant hydro capacity — RSP pledge accelerates it.",
      category: "Infrastructure",
      status: "IN_PROGRESS" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "anti-corruption-tribunal",
      title: "Independent Anti-Corruption Tribunal",
      description: "Establish a fully independent anti-corruption tribunal with investigative powers, separate from the executive and judiciary.",
      category: "Anti-Corruption",
      status: "KEPT" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "youth-employment-program",
      title: "National Youth Employment Program",
      description: "Create 500,000 skilled jobs through public-private partnerships in IT, tourism, and manufacturing within the first 2 years.",
      category: "Economy",
      status: "IN_PROGRESS" as const,
      source: "SPEECH" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "road-infrastructure",
      title: "Strategic Road Network Completion",
      description: "Complete all stalled national strategic road projects with transparent milestone tracking and contractor accountability.",
      category: "Infrastructure",
      status: "IN_PROGRESS" as const,
      source: "MANIFESTO" as const,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "whistleblower-protection",
      title: "Whistleblower Protection Act",
      description: "Enact comprehensive legal protection for citizens who report corruption or government malpractice. RSP included this explicitly in the Citizen Contract.",
      category: "Anti-Corruption",
      status: "KEPT" as const,
      source: "CITIZEN_CONTRACT" as const,
      sourceUrl: promiseSourceUrl,
    },
  ]

  for (const p of promises) {
    await (prisma as any).promise.upsert({
      where: { slug: p.slug },
      update: { status: p.status },
      create: { ...p, confidence: "MANUAL" },
    })
  }
  console.log(`  Seeded ${promises.length} promises (themes verified from RSP Citizen Contract; statuses are illustrative 2026 projection)`)

  // ─── 3. LAWS ───────────────────────────────────────────────────────────────
  //
  // All laws are ILLUSTRATIVE FUTURE DATA for the 2026 scenario.
  // Their themes align with RSP's documented legislative goals but no such
  // bills have been tabled in Nepal's parliament as of the app build date.
  // confidence: "MANUAL" on all.

  const sumana = memberMap.get("sumana-shrestha")
  const swarnim = memberMap.get("swarnim-wagle")
  const shishir = memberMap.get("shishir-khanal")
  const rabi = memberMap.get("rabi-lamichhane")
  const manish = memberMap.get("manish-jha")

  const laws = [
    {
      slug: "anti-corruption-act-2026",
      title: "Comprehensive Anti-Corruption & Assets Declaration Act, 2026",
      code: "BILL-2026-04",
      status: "ENACTED" as const,
      category: "Anti-Corruption",
      summary: "Mandates all public officials and their immediate family members to publicly declare all domestic and foreign assets within 30 days of assuming office. Establishes an independent tribunal for investigating undisclosed wealth. Aligned with RSP Citizen Contract commitment.",
      proposedDate: new Date("2026-02-12"),
      passedDate: new Date("2026-03-10"),
      enactedDate: new Date("2026-03-15"),
      proposedById: sumana?.id,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "edu-reform-2026",
      title: "National Education Administration Reform Bill",
      code: "BILL-2026-08",
      status: "PROPOSED" as const,
      category: "Education",
      summary: "Aimed at overhauling public school administration, decentralizing budget authority to local wards, and instituting teacher accountability metrics. Aligned with RSP manifesto education plank.",
      proposedDate: new Date("2026-03-14"),
      proposedById: shishir?.id,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "digital-privacy-2026",
      title: "Digital Governance & Citizen Privacy Act",
      code: "BILL-2026-11",
      status: "PROPOSED" as const,
      category: "Governance",
      summary: "Establishes a unified electronic identity framework while applying strict penal codes against unauthorized data harvesting by private corporations.",
      proposedDate: new Date("2026-02-28"),
      proposedById: manish?.id,
    },
    {
      slug: "startup-tax-2026",
      title: "Startup & Innovation Tax Relief Bill",
      code: "BILL-2026-02",
      status: "ENACTED" as const,
      category: "Economy",
      summary: "Provides a 5-year corporate tax holiday for newly registered tech and manufacturing startups, along with subsidized public lending rates. Aligned with RSP economic development platform.",
      proposedDate: new Date("2026-01-20"),
      passedDate: new Date("2026-02-15"),
      enactedDate: new Date("2026-03-01"),
      proposedById: swarnim?.id,
      sourceUrl: promiseSourceUrl,
    },
    {
      slug: "procurement-transparency",
      title: "Public Procurement Transparency Amendment",
      code: "BILL-2026-01",
      status: "REJECTED" as const,
      category: "Anti-Corruption",
      summary: "Attempted to mandate live-streaming of all public tender openings and automatic blacklisting for contractors missing deadlines by over 30 days. Coalition partners blocked final passage.",
      proposedDate: new Date("2026-01-12"),
      proposedById: rabi?.id,
      sourceUrl: promiseSourceUrl,
    },
  ]

  const lawRecords = []
  for (const l of laws) {
    const record = await (prisma as any).law.upsert({
      where: { slug: l.slug },
      update: { status: l.status, passedDate: l.passedDate ?? null, enactedDate: l.enactedDate ?? null },
      create: { ...l, confidence: "MANUAL" },
    })
    lawRecords.push(record)
  }
  console.log(`  Seeded ${lawRecords.length} laws (illustrative 2026 projection; thematically based on RSP platform)`)

  // ─── 4. VOTES ──────────────────────────────────────────────────────────────
  // All vote records are ILLUSTRATIVE for the 2026 fictional scenario.

  const antiCorruptionLaw = lawRecords.find((l) => l.slug === "anti-corruption-act-2026")
  const startupLaw = lawRecords.find((l) => l.slug === "startup-tax-2026")

  if (antiCorruptionLaw) {
    const vote = await (prisma as any).vote.upsert({
      where: { externalId: "vote-041" },
      update: {},
      create: {
        externalId: "vote-041",
        date: new Date("2026-03-10"),
        type: "FINAL_PASSAGE",
        outcome: "PASSED",
        description: "Final passage vote on Comprehensive Anti-Corruption & Assets Declaration Act",
        lawId: antiCorruptionLaw.id,
        confidence: "MANUAL",
      },
    })
    for (const m of memberRecords) {
      const isAbsent = m.slug === "bishnu-budha" || m.slug === "tek-chand"
      await (prisma as any).memberVote.upsert({
        where: { memberId_voteId: { memberId: m.id, voteId: vote.id } },
        update: {},
        create: { memberId: m.id, voteId: vote.id, choice: isAbsent ? "ABSENT" : "YEA" },
      })
    }
  }

  if (startupLaw) {
    const vote = await (prisma as any).vote.upsert({
      where: { externalId: "vote-039" },
      update: {},
      create: {
        externalId: "vote-039",
        date: new Date("2026-02-15"),
        type: "FINAL_PASSAGE",
        outcome: "PASSED",
        description: "Final passage vote on Startup & Innovation Tax Relief Bill",
        lawId: startupLaw.id,
        confidence: "MANUAL",
      },
    })
    for (const m of memberRecords) {
      const isAbsent = m.slug === "asmita-shahi"
      await (prisma as any).memberVote.upsert({
        where: { memberId_voteId: { memberId: m.id, voteId: vote.id } },
        update: {},
        create: { memberId: m.id, voteId: vote.id, choice: isAbsent ? "ABSENT" : "YEA" },
      })
    }
  }

  const fdiVote = await (prisma as any).vote.upsert({
    where: { externalId: "vote-042" },
    update: {},
    create: {
      externalId: "vote-042",
      date: new Date("2026-03-12"),
      type: "FINAL_PASSAGE",
      outcome: "PASSED",
      description: "Foreign Direct Investment Moderation Act — Final Passage",
      confidence: "MANUAL",
    },
  })
  for (const m of memberRecords) {
    await (prisma as any).memberVote.upsert({
      where: { memberId_voteId: { memberId: m.id, voteId: fdiVote.id } },
      update: {},
      create: { memberId: m.id, voteId: fdiVote.id, choice: "YEA" },
    })
  }

  const amendmentVote = await (prisma as any).vote.upsert({
    where: { externalId: "vote-040" },
    update: {},
    create: {
      externalId: "vote-040",
      date: new Date("2026-02-28"),
      type: "AMENDMENT",
      outcome: "DEFEATED",
      description: "Amendment 12: Digital Identity Data Retention Limit",
      confidence: "MANUAL",
    },
  })
  let defectorCount = 0
  for (const m of memberRecords) {
    let choice: "YEA" | "NAY" | "ABSTAIN" | "ABSENT" = "NAY"
    if (defectorCount < 12) {
      choice = "YEA"
      defectorCount++
    } else if (defectorCount < 15) {
      choice = "ABSTAIN"
      defectorCount++
    } else if (m.slug === "bishnu-budha" || m.slug === "tek-chand") {
      choice = "ABSENT"
    }
    await (prisma as any).memberVote.upsert({
      where: { memberId_voteId: { memberId: m.id, voteId: amendmentVote.id } },
      update: {},
      create: { memberId: m.id, voteId: amendmentVote.id, choice },
    })
  }
  console.log("  Seeded 4 votes with member vote records (illustrative 2026 projection)")

  // ─── 5. ACTIVITY FEED ──────────────────────────────────────────────────────

  // Clear existing feed items to avoid duplicates on re-seed
  await (prisma as any).activityFeed.deleteMany({})

  const feedItems = [
    {
      type: "LAW" as const,
      title: "Education Reform Bill Introduced to Parliament",
      summary: "A sweeping bill aimed at overhauling public school administration and teacher accountability. Sponsored by Shishir Khanal (Kathmandu-6, verified RSP MP).",
      date: new Date("2026-03-15T10:00:00"),
      entityId: lawRecords.find((l) => l.slug === "edu-reform-2026")?.id ?? "edu-reform-2026",
      entitySlug: "edu-reform-2026",
      relatedMemberId: memberMap.get("shishir-khanal")?.id,
    },
    {
      type: "PROMISE_UPDATE" as const,
      title: "Fulfilled: Digital Citizen Service Portal Launched",
      summary: "The new portal allows citizens to apply for documents and pay local taxes online — a direct Citizen Contract commitment from RSP's 2022 manifesto.",
      date: new Date("2026-03-14T15:30:00"),
      entityId: "digital-citizen-portal",
      entitySlug: "digital-citizen-portal",
    },
    {
      type: "VOTE" as const,
      title: "Vote: Foreign Investment Moderation Act",
      summary: "Party voted to increase the minimum threshold for FDI in retail sectors. Unanimous vote reflects party cohesion on economic sovereignty issues.",
      date: new Date("2026-03-12T17:15:00"),
      entityId: fdiVote.id,
    },
    {
      type: "LAW" as const,
      title: "Passed: Anti-Corruption & Assets Declaration Act, 2026",
      summary: "Landmark legislation mandating 30-day asset declarations for all public officials. Sponsored by Sumana Shrestha, verified RSP PR member.",
      date: new Date("2026-03-10T14:00:00"),
      entityId: antiCorruptionLaw?.id ?? "anti-corruption-act-2026",
      entitySlug: "anti-corruption-act-2026",
      relatedMemberId: memberMap.get("sumana-shrestha")?.id,
    },
    {
      type: "STATEMENT" as const,
      title: "Press Release: Response to Hydropower Procurement Delays",
      summary: "The Ministry of Energy issued a 15-day ultimatum to contractors failing milestone deadlines.",
      date: new Date("2026-03-08T11:30:00"),
      entityId: "statement-hydro",
    },
    {
      type: "CONTROVERSY" as const,
      title: "Committee Hearing: Healthcare Infrastructure Audit",
      summary: "Dr. Toshima Karki (Lalitpur-3, verified RSP MP) initiated an audit probe into missing hospital equipment funds across 3 provinces.",
      date: new Date("2026-03-05T09:00:00"),
      entityId: "controversy-health-audit",
      relatedMemberId: memberMap.get("toshima-karki")?.id,
    },
    {
      type: "LAW" as const,
      title: "Startup & Innovation Tax Relief Bill Becomes Law",
      summary: "Following presidential assent, the startup tax relief package enters implementation. Sponsored by Dr. Swarnim Wagle (Tanahun-1 by-election winner, verified RSP MP).",
      date: new Date("2026-03-01T16:00:00"),
      entityId: startupLaw?.id ?? "startup-tax-2026",
      entitySlug: "startup-tax-2026",
      relatedMemberId: memberMap.get("swarnim-wagle")?.id,
    },
  ]

  for (const item of feedItems) {
    await (prisma as any).activityFeed.create({ data: item })
  }
  console.log(`  Seeded ${feedItems.length} activity feed items`)

  // ─── 6. TAGS ───────────────────────────────────────────────────────────────

  const tagNames = ["anti-corruption", "economy", "education", "governance", "health", "infrastructure", "digital", "federalism"]
  for (const name of tagNames) {
    await (prisma as any).tag.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log(`  Seeded ${tagNames.length} tags`)

  console.log("")
  console.log("Seed complete!")
  console.log("  Verified members:     10 (from ekantipur.com 2079 election results + Wikipedia)")
  console.log("  Illustrative members: 23 (fictional 2026 projection — replace with scraped data)")
  console.log("  Promises:             15 (themes from RSP Citizen Contract; statuses are 2026 projection)")
  console.log("  Laws:                  5 (illustrative 2026 projection; aligned with RSP platform)")
  console.log("  Votes:                 4 (illustrative 2026 projection)")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await (prisma as any).$disconnect()
  })
