import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { todayString } from '@/lib/dateUtils'

export async function GET() {
  await ensureSchema()

  const [users, entries, days, images] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS count FROM users`),
    db.query(`SELECT COUNT(*)::int AS count FROM mood_entries`),
    db.query(`SELECT COUNT(DISTINCT entry_date)::int AS count FROM mood_entries`),
    db.query(`SELECT COUNT(*)::int AS count FROM mood_entries WHERE image_data IS NOT NULL`),
  ])

  return Response.json({
    userCount: users.rows[0].count,
    entryCount: entries.rows[0].count,
    daysWithEntries: days.rows[0].count,
    imageDataCount: images.rows[0].count,
  })
}

export async function DELETE(request: NextRequest) {
  await ensureSchema()

  const { searchParams } = request.nextUrl
  const op = searchParams.get('op')
  const dryRun = searchParams.get('dryRun') === '1'

  switch (op) {
    case 'reset-today': {
      if (dryRun) {
        const { rows } = await db.query(
          `SELECT COUNT(*)::int AS count FROM mood_entries WHERE entry_date = $1`,
          [todayString()]
        )
        return Response.json({ deletedCount: rows[0].count })
      }
      const { rowCount } = await db.query(
        `DELETE FROM mood_entries WHERE entry_date = $1`,
        [todayString()]
      )
      return Response.json({ deletedCount: rowCount ?? 0 })
    }

    case 'entries': {
      const before = searchParams.get('before')
      if (!before) return Response.json({ error: 'before date required' }, { status: 400 })
      if (dryRun) {
        const { rows } = await db.query(
          `SELECT COUNT(*)::int AS count FROM mood_entries WHERE entry_date < $1`,
          [before]
        )
        return Response.json({ deletedCount: rows[0].count })
      }
      const { rowCount } = await db.query(
        `DELETE FROM mood_entries WHERE entry_date < $1`,
        [before]
      )
      return Response.json({ deletedCount: rowCount ?? 0 })
    }

    case 'images': {
      const before = searchParams.get('before')
      if (!before) return Response.json({ error: 'before date required' }, { status: 400 })
      if (dryRun) {
        const { rows } = await db.query(
          `SELECT COUNT(*)::int AS count FROM mood_entries WHERE entry_date < $1 AND image_data IS NOT NULL`,
          [before]
        )
        return Response.json({ deletedCount: rows[0].count })
      }
      const { rowCount } = await db.query(
        `UPDATE mood_entries SET image_data = NULL WHERE entry_date < $1 AND image_data IS NOT NULL`,
        [before]
      )
      return Response.json({ deletedCount: rowCount ?? 0 })
    }

    case 'users': {
      const inactiveSince = searchParams.get('inactiveSince')
      if (!inactiveSince) return Response.json({ error: 'inactiveSince date required' }, { status: 400 })
      if (dryRun) {
        const { rows } = await db.query(
          `SELECT COUNT(*)::int AS count FROM users WHERE last_active < $1`,
          [inactiveSince]
        )
        return Response.json({ deletedCount: rows[0].count })
      }
      const { rowCount } = await db.query(
        `DELETE FROM users WHERE last_active < $1`,
        [inactiveSince]
      )
      return Response.json({ deletedCount: rowCount ?? 0 })
    }

    default:
      return Response.json({ error: 'Unknown operation' }, { status: 400 })
  }
}
