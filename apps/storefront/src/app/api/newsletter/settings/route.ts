import { NextResponse } from 'next/server'

import { getNewsletterSettings } from '@/lib/newsletter/settings'

export async function GET() {
  const settings = await getNewsletterSettings()
  return NextResponse.json(settings)
}
