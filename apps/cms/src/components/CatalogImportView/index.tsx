'use client'

import React, { useState } from 'react'

import './index.scss'

type ParseError = {
  line: number
  column?: string
  code: string
  message: string
  blocking: boolean
}

type ParseSummary = {
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
}

type ParseResponse = {
  importId: string
  summary: ParseSummary
  wildcards: number
  errors: ParseError[]
  canApply: boolean
  productCount: number
  supplierCount: number
}

const baseClass = 'catalog-import-view'

export const CatalogImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null)
  const [applyResult, setApplyResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runParse = async () => {
    if (!file) {
      setError('Selecciona un archivo .xlsx')
      return
    }

    setBusy(true)
    setError(null)
    setApplyResult(null)

    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/erp/catalog-import/parse', {
      method: 'POST',
      credentials: 'include',
      body: form,
    })

    setBusy(false)

    if (!res.ok) {
      const text = await res.text()
      setError(text || 'Error al validar el archivo')
      setParseResult(null)
      return
    }

    setParseResult(await res.json())
  }

  const runApply = async () => {
    if (!parseResult?.canApply) return

    if (!window.confirm(`¿Aplicar importación de ${parseResult.productCount} productos?`)) {
      return
    }

    setBusy(true)
    setError(null)

    const res = await fetch('/api/erp/catalog-import/apply', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId: parseResult.importId }),
    })

    setBusy(false)

    if (!res.ok) {
      const text = await res.text()
      setError(text || 'Error al aplicar importación')
      return
    }

    const data = await res.json()
    setApplyResult(
      `Actualizados: ${data.productsUpdated} productos, ${data.suppliersUpdated} proveedores. Comodines: ${data.wildcards}. Estado: ${data.status}.`,
    )
  }

  return (
    <div className={baseClass}>
      <h1>Importación catálogo Excel</h1>
      <p className={`${baseClass}__hint`}>
        Sube <strong>ImportaciónArticulos.xlsx</strong> de Avansuite (US-15). El sistema valida el
        formato antes de aplicar cambios al catálogo Payload.
      </p>

      <nav className={`${baseClass}__actions`}>
        <a href="/api/erp/catalog-import/template" download>
          Descargar plantilla
        </a>
        <a href="/api/erp/catalog-export">Exportar catálogo a Excel</a>
        <a href="/admin/pim-health">Salud PIM</a>
      </nav>

      <div className={`${baseClass}__actions`}>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setParseResult(null)
            setApplyResult(null)
          }}
        />
        <button type="button" disabled={busy || !file} onClick={() => void runParse()}>
          {busy ? 'Validando…' : 'Validar archivo'}
        </button>
        <button
          type="button"
          disabled={busy || !parseResult?.canApply}
          onClick={() => void runApply()}
        >
          {busy ? 'Aplicando…' : 'Aplicar importación'}
        </button>
      </div>

      {error ? <p className={`${baseClass}__error--blocking`}>{error}</p> : null}
      {applyResult ? <p className={`${baseClass}__summary`}>{applyResult}</p> : null}

      {parseResult ? (
        <div className={`${baseClass}__summary`}>
          <p>
            Filas válidas: <strong>{parseResult.summary.validRows}</strong> /{' '}
            {parseResult.summary.totalRows} · Errores bloqueantes:{' '}
            <strong>{parseResult.summary.errorRows}</strong> · Comodines:{' '}
            <strong>{parseResult.wildcards}</strong>
          </p>
          {!parseResult.canApply ? (
            <p className={`${baseClass}__error--blocking`}>
              Corrige los errores bloqueantes antes de aplicar.
            </p>
          ) : null}
          {parseResult.errors.length > 0 ? (
            <table className={`${baseClass}__errors`}>
              <thead>
                <tr>
                  <th>Línea</th>
                  <th>Columna</th>
                  <th>Tipo</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.errors.map((err, i) => (
                  <tr key={`${err.line}-${err.code}-${i}`}>
                    <td>{err.line || '—'}</td>
                    <td>{err.column ?? '—'}</td>
                    <td
                      className={
                        err.blocking
                          ? `${baseClass}__error--blocking`
                          : `${baseClass}__error--warning`
                      }
                    >
                      {err.blocking ? 'Error' : 'Aviso'}
                    </td>
                    <td>{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
