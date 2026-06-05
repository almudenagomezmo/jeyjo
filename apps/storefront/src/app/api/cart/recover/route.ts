import { NextResponse } from 'next/server'

import { verifyCartRecoverToken } from '@/lib/coupon/recover-token'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const payload = verifyCartRecoverToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  return NextResponse.json({
    snapshotId: payload.snapshotId,
    lines: payload.lines,
  })
}
