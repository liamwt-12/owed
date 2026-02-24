import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xero/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
