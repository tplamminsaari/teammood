import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const globalForPg = globalThis as unknown as { pgPool?: Pool }

export const db: Pool = globalForPg.pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
})

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = db
}

let schemaInitialised = false

export async function ensureSchema(): Promise<void> {
  if (schemaInitialised) return
  schemaInitialised = true

  const client = await db.connect()
  try {
    const { rows } = await client.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `)
    if (rows.length === 0) {
      const schema = fs.readFileSync(
        path.join(process.cwd(), 'lib', 'schema.sql'),
        'utf8'
      )
      await client.query(schema)
    }
  } finally {
    client.release()
  }
}
