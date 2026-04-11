import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const appId = process.env.APPLICATION_ID

  // No env var set → local dev, always valid
  if (!appId) {
    return Response.json({ valid: true })
  }

  const submitted = request.nextUrl.searchParams.get('id')
  return Response.json({ valid: submitted === appId })
}
