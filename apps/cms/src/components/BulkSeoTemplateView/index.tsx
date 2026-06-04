'use client'

import React, { useState } from 'react'

import './index.scss'

const DEFAULT_TEMPLATE = '{title} - Compra online al mejor precio en Jeyjo'

const baseClass = 'bulk-seo-template-view'

export const BulkSeoTemplateView: React.FC = () => {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [idsText, setIdsText] = useState('')
  const [allPublished, setAllPublished] = useState(false)
  const [emptyOnly, setEmptyOnly] = useState(true)
  const [updateMetaTitle, setUpdateMetaTitle] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runBulk = async () => {
    setBusy(true)
    setError(null)
    setResult(null)

    const ids = idsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await fetch('/api/products/bulk-seo-template', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template,
        emptyOnly,
        updateMetaTitle,
        allPublished: allPublished || ids.length === 0,
        ids: ids.length > 0 ? ids : undefined,
      }),
    })

    setBusy(false)
    if (!res.ok) {
      const text = await res.text()
      setError(text || 'Error al aplicar plantilla')
      return
    }

    const data = await res.json()
    setResult(`Actualizados: ${data.updated}, omitidos: ${data.skipped}, total: ${data.total}`)
  }

  return (
    <div className={baseClass}>
      <h1>Plantilla SEO masiva</h1>
      <p className={`${baseClass}__hint`}>
        Aplica metadescripción con placeholder {'{title}'} (US-16 CA3). Máximo 500 productos por
        lote.
      </p>

      <label className={`${baseClass}__field`}>
        Plantilla
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
        />
      </label>

      <label className={`${baseClass}__field`}>
        IDs de producto (uno por línea o separados por coma)
        <textarea
          value={idsText}
          onChange={(e) => setIdsText(e.target.value)}
          rows={4}
          placeholder="Dejar vacío y marcar todos publicados"
        />
      </label>

      <label className={`${baseClass}__check`}>
        <input
          type="checkbox"
          checked={allPublished}
          onChange={(e) => setAllPublished(e.target.checked)}
        />
        Todos los publicados (máx. 500)
      </label>

      <label className={`${baseClass}__check`}>
        <input
          type="checkbox"
          checked={emptyOnly}
          onChange={(e) => setEmptyOnly(e.target.checked)}
        />
        Solo campos vacíos
      </label>

      <label className={`${baseClass}__check`}>
        <input
          type="checkbox"
          checked={updateMetaTitle}
          onChange={(e) => setUpdateMetaTitle(e.target.checked)}
        />
        Rellenar meta.title con el nombre del producto
      </label>

      <button type="button" className={`${baseClass}__btn`} disabled={busy} onClick={() => void runBulk()}>
        {busy ? 'Aplicando…' : 'Aplicar plantilla SEO'}
      </button>

      {error && <p className={`${baseClass}__error`}>{error}</p>}
      {result && <p className={`${baseClass}__ok`}>{result}</p>}
    </div>
  )
}
