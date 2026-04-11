import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'

export async function POST(request: NextRequest) {
  await ensureSchema()

  const { entryId, userId } = await request.json()

  if (!entryId || !userId) {
    return Response.json({ error: 'entryId and userId are required' }, { status: 400 })
  }

  // Check if like exists
  const existing = await db.query(
    `SELECT id FROM likes WHERE entry_id = $1 AND user_id = $2`,
    [entryId, userId]
  )

  let liked: boolean
  if (existing.rows.length > 0) {
    await db.query(`DELETE FROM likes WHERE entry_id = $1 AND user_id = $2`, [entryId, userId])
    liked = false
  } else {
    await db.query(
      `INSERT INTO likes (entry_id, user_id) VALUES ($1, $2)`,
      [entryId, userId]
    )
    liked = true
  }

  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM likes WHERE entry_id = $1`,
    [entryId]
  )

  return Response.json({ liked, likeCount: rows[0].count })
}
