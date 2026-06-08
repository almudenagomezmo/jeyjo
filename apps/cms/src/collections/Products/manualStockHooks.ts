import { resolveStockIndicator } from '@jeyjo/stock-ports'
import type { CollectionAfterChangeHook } from 'payload'

import { isWebNativeModeFromReq } from '@/lib/web-native-mode'
import { loadSystemSettingsDoc, resolveOperationalThresholds } from '@/lib/system-config/resolve'

export const manualStockAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  if (!isWebNativeModeFromReq(req)) return doc
  if (req.context?.stockSync === true) return doc

  const erpStock = doc.erpStock
  const prevStock = previousDoc?.erpStock
  if (operation === 'update' && erpStock === prevStock && doc.stockIndicator) {
    return doc
  }

  const settingsDoc = await loadSystemSettingsDoc(req.payload)
  const { stockLowThreshold } = resolveOperationalThresholds(settingsDoc)

  const indicator = resolveStockIndicator({
    erpStock: typeof erpStock === 'number' ? erpStock : null,
    distrisantiagoStock: null,
    arnoiaStock: null,
    threshold: stockLowThreshold,
    staleDistrisantiago: false,
    staleArnoia: false,
  })

  if (doc.stockIndicator === indicator.level) return doc

  const syncReq = req
  syncReq.context = { ...syncReq.context, stockSync: true }

  await req.payload.update({
    collection: 'products',
    id: doc.id,
    data: { stockIndicator: indicator.level },
    overrideAccess: true,
    req: syncReq,
  })

  return { ...doc, stockIndicator: indicator.level }
}
