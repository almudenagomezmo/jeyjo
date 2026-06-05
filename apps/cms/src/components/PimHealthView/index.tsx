'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type HealthProduct = {
  id: string | number
  title: string
  slug: string | null
  skuErp: string | null
  adminUrl: string
}

type PimHealthData = {
  scanned: number
  noCatalogImage: { count: number; items: HealthProduct[] }
  noMetaDescription: { count: number; items: HealthProduct[] }
  duplicateSlugs: { count: number; groups: Array<{ slug: string; items: HealthProduct[] }> }
}

const baseClass = 'pim-health-view'

export const PimHealthView: React.FC = () => {
  const [data, setData] = useState<PimHealthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/pim-health', { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar salud PIM')
      return
    }
    setData(await res.json())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const renderList = (items: HealthProduct[]) => (
    <ul className={`${baseClass}__list`}>
      {items.map((item) => (
        <li key={String(item.id)}>
          <a href={item.adminUrl}>
            {item.title}
            {item.skuErp ? ` (${item.skuErp})` : ''}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={baseClass}>
      <h1>Salud PIM / SEO</h1>
      <p>
        <a href="/admin/catalog-import">Importación catálogo Excel</a>
      </p>
      <p className={`${baseClass}__hint`}>
        Hasta {data?.scanned ?? '…'} productos publicados analizados (US-16 CA4).
      </p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}
      {data && (
        <>
          <section>
            <h2>Sin imagen de catálogo ({data.noCatalogImage.count})</h2>
            {data.noCatalogImage.count === 0 ? (
              <p>Ninguno detectado.</p>
            ) : (
              renderList(data.noCatalogImage.items)
            )}
          </section>
          <section>
            <h2>Sin metadescripción ({data.noMetaDescription.count})</h2>
            {data.noMetaDescription.count === 0 ? (
              <p>Ninguno detectado.</p>
            ) : (
              renderList(data.noMetaDescription.items)
            )}
          </section>
          <section>
            <h2>Slugs duplicados ({data.duplicateSlugs.count})</h2>
            {data.duplicateSlugs.groups.length === 0 ? (
              <p>Ninguno detectado.</p>
            ) : (
              data.duplicateSlugs.groups.map((group) => (
                <div key={group.slug} className={`${baseClass}__group`}>
                  <h3>{group.slug}</h3>
                  {renderList(group.items)}
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  )
}
