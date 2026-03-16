import path from "node:path"
import { defineConfig } from "prisma/config"
import { config } from "dotenv"

config({ path: path.join(__dirname, ".env") })

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
