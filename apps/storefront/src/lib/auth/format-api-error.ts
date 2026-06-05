import { formatValidationFieldErrors, type AuthApiErrorBody } from './api-errors'

/** Mensaje único para mostrar en formularios (título + detalle). */
export function formatAuthErrorForUi(
  data: Partial<AuthApiErrorBody> & { fieldErrors?: Record<string, string[]> },
): string {
  if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return formatValidationFieldErrors(data.fieldErrors)
  }
  if (data.details) {
    return `${data.error ?? 'Error'}. ${data.details}`
  }
  return data.error ?? 'No se pudo completar la operación'
}
