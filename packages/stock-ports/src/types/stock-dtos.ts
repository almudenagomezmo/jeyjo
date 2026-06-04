export type StockSourceId = 'distrisantiago' | 'arnoia'

export type StockSnapshotDto = {
  wholesaleRef: string
  quantity: number
  sourceId: StockSourceId
}
