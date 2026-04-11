import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { todayString } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  await ensureSchema()

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date') || todayString()
  const userId = searchParams.get('userId')
  const userIdParam = userId ? parseInt(userId, 10) : null

  const { rows } = await db.query(
    `SELECT
       e.id,
       e.user_id            AS "userId",
       u.name               AS "userName",
       e.mood_rating        AS "moodRating",
       e.image_data         AS "imageData",
       e.has_trophy         AS "hasTrophy",
       e.submitted_at       AS "submittedAt",
       COUNT(l.id)::int     AS "likeCount",
       COALESCE(BOOL_OR(l.user_id = $2), false) AS "likedByMe"
     FROM mood_entries e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN likes l ON l.entry_id = e.id
     WHERE e.entry_date = $1
     GROUP BY e.id, u.name
     ORDER BY e.submitted_at ASC`,
    [date, userIdParam]
  )

  return Response.json({ entries: rows })
}

export async function POST(request: NextRequest) {
  await ensureSchema()

  const body = await request.json()
  const { userId, moodRating, imageData, hasTrophy } = body

  if (!userId || !moodRating) {
    return Response.json({ error: 'userId and moodRating are required' }, { status: 400 })
  }
  if (moodRating < 1 || moodRating > 5) {
    return Response.json({ error: 'moodRating must be between 1 and 5' }, { status: 400 })
  }

  const today = todayString()

  const { rows } = await db.query(
    `INSERT INTO mood_entries (user_id, entry_date, mood_rating, image_data, has_trophy)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, entry_date) DO UPDATE
       SET mood_rating  = EXCLUDED.mood_rating,
           image_data   = EXCLUDED.image_data,
           has_trophy   = EXCLUDED.has_trophy,
           submitted_at = NOW()
     RETURNING id, submitted_at AS "submittedAt"`,
    [userId, today, moodRating, imageData ?? null, hasTrophy ?? false]
  )

  return Response.json({ entry: rows[0] })
}
