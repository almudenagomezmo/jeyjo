export function getReconcileStaleHours(): number {
  const raw = Number(process.env.SEARCH_RECONCILE_STALE_HOURS ?? 2)
  return Number.isFinite(raw) && raw > 0 ? raw : 2
}

export function getReconcileErrorWindowHours(): number {
  const raw = Number(process.env.SEARCH_RECONCILE_ERROR_WINDOW_HOURS ?? 24)
  return Number.isFinite(raw) && raw > 0 ? raw : 24
}

export function getOrphanCleanupMaxDeletes(): number {
  const raw = Number(process.env.ORPHAN_CLEANUP_MAX_DELETES ?? 500)
  return Number.isFinite(raw) && raw > 0 ? raw : 500
}

export function isSearchIndexOnSaveEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' && process.env.SEARCH_INDEX_ON_SAVE === 'true'
  )
}
