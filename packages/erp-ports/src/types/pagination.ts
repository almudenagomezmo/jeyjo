export type ErpPageOptions = {
  limit?: number
  cursor?: string | null
}

export type ErpPageResult<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
