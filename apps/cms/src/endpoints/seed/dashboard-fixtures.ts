import type { Payload } from 'payload'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function seedDashboardFixtures(payload: Payload): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    payload.logger.info('— Skipping dashboard fixtures (Supabase not configured)')
    return
  }

  const { data: existing } = await supabase
    .from('erp_sync_runs')
    .select('id')
    .eq('status', 'failed')
    .limit(1)

  if (!existing?.length) {
    await supabase.from('erp_sync_runs').insert({
      adapter: 'stub',
      status: 'failed',
      error_summary: 'Seed: simulación de fallo sync para dashboard US-19',
      products_updated: 0,
      suppliers_updated: 0,
      pricing_rows_upserted: 0,
      finished_at: new Date().toISOString(),
    })
    payload.logger.info('— Dashboard fixture: failed erp_sync_runs row')
  }
}
