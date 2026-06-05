import type { CreateRmaInput, RmaReason } from '@/lib/intranet/rma/types'

const RMA_REASONS: RmaReason[] = ['wrong_item', 'defective', 'wrong_qty', 'other']

export type RmaValidationError = {
  field: string
  message: string
}

export function validateCreateRmaInput(input: CreateRmaInput): RmaValidationError | null {
  const sku = input.articleSku?.trim()
  const note = input.deliveryNoteNumber?.trim()
  const reason = input.reason
  const observations = input.observations?.trim() ?? ''

  if (!sku) {
    return { field: 'articleSku', message: 'Indica la referencia del artículo' }
  }
  if (sku.length > 64) {
    return { field: 'articleSku', message: 'Referencia demasiado larga' }
  }
  if (!note || note.length < 3) {
    return { field: 'deliveryNoteNumber', message: 'Indica el número de albarán' }
  }
  if (note.length > 40) {
    return { field: 'deliveryNoteNumber', message: 'Número de albarán demasiado largo' }
  }
  if (!RMA_REASONS.includes(reason)) {
    return { field: 'reason', message: 'Selecciona un motivo válido' }
  }
  if (reason === 'other' && observations.length < 10) {
    return {
      field: 'observations',
      message: 'Describe el motivo en observaciones (mínimo 10 caracteres)',
    }
  }

  return null
}
