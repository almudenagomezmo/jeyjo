export type { Database, Json } from './database.types'

import type { Database } from './database.types'

export type CustomerAddress = Database['public']['Tables']['customer_addresses']['Row']
export type CustomerAddressInsert =
  Database['public']['Tables']['customer_addresses']['Insert']
export type CustomerAddressUpdate =
  Database['public']['Tables']['customer_addresses']['Update']
