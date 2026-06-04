export type StockPageOptions = {
  limit?: number
  cursor?: string | null
}

export type StockPageResult<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
