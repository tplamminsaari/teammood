import { NextRequest } from 'next/server'
import { db, ensureSchema } from '@/lib/db'
import { todayString } from '@/lib/dateUtils'

export async function GET(request: NextRequest) {
  await ensureSchema()

  const date = request.nextUrl.searchParams.get('date') || todayString()

  const { rows } = await db.query(
    `SELECT sprint_name AS "sprintName" FROM daily_config WHERE config_date = $1`,
    [date]
  )

  return Response.json({ sprintName: rows[0]?.sprintName ?? '' })
}

export async function PUT(request: NextRequest) {
  await ensureSchema()

  const { date, sprintName } = await request.json()

  if (!date) {
    return Response.json({ error: 'date is required' }, { status: 400 })
  }

  await db.query(
    `INSERT INTO daily_config (config_date, sprint_name)
     VALUES ($1, $2)
     ON CONFLICT (config_date) DO UPDATE SET sprint_name = EXCLUDED.sprint_name`,
    [date, sprintName ?? '']
  )

  return Response.json({ sprintName: sprintName ?? '' })
}
