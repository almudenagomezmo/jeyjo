import type { SystemConfigDto } from '@/lib/system-config/types'

interface FooterStoresProps {
  contact: SystemConfigDto['contact']
  showStores: boolean
}

export function FooterStores({ contact, showStores }: FooterStoresProps) {
  if (!showStores) return null

  const stores = [contact.stores.alfaro, contact.stores.rincon].filter(
    (store) => store.name.trim().length > 0,
  )

  if (stores.length === 0) return null

  return (
    <div className="mt-6">
      <p className="mb-2 text-[13px] font-semibold text-white">Nuestras tiendas</p>
      <ul className="space-y-3 text-[13px] text-neutral-300">
        {stores.map((store) => (
          <li key={store.name}>
            <p className="font-medium text-neutral-200">{store.name}</p>
            {store.address && <p className="mt-0.5 leading-relaxed">{store.address}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
