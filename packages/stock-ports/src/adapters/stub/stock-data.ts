import type { StockSnapshotDto } from '../../types/stock-dtos.js'

/** Wholesale refs aligned with seed `mainWholesaleRef` (REF-001..003). REF-004 has no wholesale snapshots. */
export const STUB_DISTRISANTIAGO_SNAPSHOTS: StockSnapshotDto[] = [
  { wholesaleRef: 'WH-REF-001', quantity: 0, sourceId: 'distrisantiago' },
  { wholesaleRef: 'WH-REF-002', quantity: 100, sourceId: 'distrisantiago' },
  { wholesaleRef: 'WH-REF-003', quantity: 0, sourceId: 'distrisantiago' },
  { wholesaleRef: 'DS-12345', quantity: 80, sourceId: 'distrisantiago' },
]

export const STUB_ARNOIA_SNAPSHOTS: StockSnapshotDto[] = [
  { wholesaleRef: 'WH-REF-001', quantity: 50, sourceId: 'arnoia' },
  { wholesaleRef: 'WH-REF-002', quantity: 0, sourceId: 'arnoia' },
  { wholesaleRef: 'WH-REF-003', quantity: 0, sourceId: 'arnoia' },
  { wholesaleRef: 'DS-12345', quantity: 10, sourceId: 'arnoia' },
]
