import { z } from 'zod'

export const heartbeatSchema = z.object({
  lineCount: z.number().int().min(0).max(500),
  totalQty: z.number().int().min(0).max(10_000),
})

export type HeartbeatPayload = z.infer<typeof heartbeatSchema>
