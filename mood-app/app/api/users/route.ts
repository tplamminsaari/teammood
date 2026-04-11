import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { MAX_USERS } from '@/lib/types'

export async function GET() {
  await ensureSchema()

  const { rows } = await db.query(
    `SELECT id, name, last_active AS "lastActive"
     FROM users
     ORDER BY last_active DESC
     LIMIT 50`
  )
  return Response.json({ users: rows })
}

export async function POST(request: NextRequest) {
  await ensureSchema()

  const body = await request.json()
  const name: string = (body.name ?? '').trim()

  if (!name) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }
  if (name.length > 100) {
    return Response.json({ error: 'Name is too long' }, { status: 400 })
  }

  const nameLower = name.toLowerCase()

  // Check if user already exists
  const existing = await db.query(
    `SELECT id, name FROM users WHERE name_lower = $1`,
    [nameLower]
  )

  if (existing.rows.length > 0) {
    // Update last_active and return existing user
    await db.query(
      `UPDATE users SET last_active = NOW() WHERE id = $1`,
      [existing.rows[0].id]
    )
    return Response.json({ user: { id: existing.rows[0].id, name: existing.rows[0].name } })
  }

  // New user — enforce 128-user limit
  const { rows: countRows } = await db.query(`SELECT COUNT(*) AS count FROM users`)
  if (parseInt(countRows[0].count, 10) >= MAX_USERS) {
    return Response.json(
      { error: 'User limit reached. Please contact the maintainer.' },
      { status: 409 }
    )
  }

  const { rows } = await db.query(
    `INSERT INTO users (name, name_lower) VALUES ($1, $2)
     RETURNING id, name`,
    [name, nameLower]
  )
  return Response.json({ user: rows[0] }, { status: 201 })
}
