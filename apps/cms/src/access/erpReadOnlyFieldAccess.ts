import type { FieldAccess } from 'payload'

import { isWebNativeModeFromReq } from '@/lib/web-native-mode'

/**
 * Admin UI layer: commercial fields editable in web-native mode.
 * Server layer: `beforeChange` hooks revert ERP fields unless `erpSync` or web-native.
 */
export const erpReadOnlyFieldAccess: { update: FieldAccess } = {
  update: ({ req }) => isWebNativeModeFromReq(req),
}
