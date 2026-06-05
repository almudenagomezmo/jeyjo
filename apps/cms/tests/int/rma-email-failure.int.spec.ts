import { describe, expect, it, vi } from 'vitest'

import { sendRmaRequestEmail } from '@/lib/rma/send-rma-request-email'

describe('sendRmaRequestEmail', () => {
  it('returns false when sendEmail throws without rethrowing', async () => {
    const payload = {
      sendEmail: vi.fn().mockRejectedValue(new Error('SMTP down')),
      logger: { error: vi.fn() },
    }

    const ok = await sendRmaRequestEmail(payload as never, {
      to: 'empresa@test.com',
      rmaNumber: 'RMA-2026-0042',
      articleSku: 'REF-011',
      deliveryNoteNumber: 'ALB-2026-001',
      reason: 'wrong_item',
      observations: 'Pedí azul, me enviaron rojo',
    })

    expect(ok).toBe(false)
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it('returns true when sendEmail succeeds', async () => {
    const payload = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
      logger: { error: vi.fn() },
    }

    const ok = await sendRmaRequestEmail(payload as never, {
      to: 'empresa@test.com',
      rmaNumber: 'RMA-2026-0001',
      articleSku: 'REF-011',
      deliveryNoteNumber: 'ALB-2026-001',
      reason: 'wrong_item',
    })

    expect(ok).toBe(true)
  })
})
