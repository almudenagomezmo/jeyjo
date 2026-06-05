import type { Access, GlobalConfig } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'
import {
  systemSettingsAfterChange,
  systemSettingsBeforeChange,
} from '@/hooks/systemSettingsAuditHooks'
import { SYSTEM_SETTINGS_SEED } from '@/lib/system-config/defaults'

const businessUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'administracion'])

const technicalUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'mantenimiento'])

const systemSettingsRead: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'administracion', 'mantenimiento'])

const systemSettingsUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'administracion', 'mantenimiento'])

function nonNegativeNumber(value: unknown): number | string | true {
  if (value === null || value === undefined || value === '') return true
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 'El valor debe ser mayor o igual a 0'
  return true
}

export const SystemSettings: GlobalConfig = {
  slug: 'systemSettings',
  label: 'Sistema (operativo)',
  admin: {
    group: 'Configuración del sistema',
    description:
      'Parámetros operativos de portes, stock, alertas y contacto. Los cambios se propagan en ~1 minuto.',
  },
  access: {
    read: systemSettingsRead,
    update: systemSettingsUpdate,
  },
  hooks: {
    beforeChange: [
      ...systemSettingsBeforeChange,
      ({ data }) => {
        const fields = [
          'shippingB2cThreshold',
          'shippingB2cCost',
          'shippingB2bThreshold',
          'shippingB2bCost',
          'stockLowThreshold',
          'topSalesWindowDays',
          'dashboardLowStockThreshold',
          'catalogStalenessHours',
          'suggestLimit',
          'minQueryLength',
        ] as const
        for (const field of fields) {
          const check = nonNegativeNumber(data?.[field])
          if (check !== true) throw new Error(`${field}: ${check}`)
        }
        if (data?.suggestLimit != null) {
          const limit = Number(data.suggestLimit)
          if (limit > 20) throw new Error('suggestLimit: máximo 20 resultados')
        }
        return data
      },
    ],
    afterChange: systemSettingsAfterChange,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Portes',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'shippingB2cThreshold',
                  type: 'number',
                  label: 'B2C — umbral envío gratis (€)',
                  defaultValue: SYSTEM_SETTINGS_SEED.shippingB2cThreshold,
                  min: 0,
                  access: { update: businessUpdate },
                },
                {
                  name: 'shippingB2cCost',
                  type: 'number',
                  label: 'B2C — coste portes (€ IVA incl.)',
                  defaultValue: SYSTEM_SETTINGS_SEED.shippingB2cCost,
                  min: 0,
                  access: { update: businessUpdate },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shippingB2bThreshold',
                  type: 'number',
                  label: 'B2B — umbral envío gratis (€)',
                  defaultValue: SYSTEM_SETTINGS_SEED.shippingB2bThreshold,
                  min: 0,
                  access: { update: businessUpdate },
                },
                {
                  name: 'shippingB2bCost',
                  type: 'number',
                  label: 'B2B — gastos de gestión (€)',
                  defaultValue: SYSTEM_SETTINGS_SEED.shippingB2bCost,
                  min: 0,
                  access: { update: businessUpdate },
                },
              ],
            },
          ],
        },
        {
          label: 'Stock y alertas',
          fields: [
            {
              name: 'stockLowThreshold',
              type: 'number',
              label: 'Umbral stock bajo (semáforo)',
              defaultValue: SYSTEM_SETTINGS_SEED.stockLowThreshold,
              min: 0,
              admin: {
                description: 'Unidades por debajo de las cuales el indicador es "Últimas unidades".',
              },
              access: { update: businessUpdate },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'topSalesWindowDays',
                  type: 'number',
                  label: 'Ventana Top Ventas (días)',
                  defaultValue: SYSTEM_SETTINGS_SEED.topSalesWindowDays,
                  min: 1,
                  access: { update: businessUpdate },
                },
                {
                  name: 'dashboardLowStockThreshold',
                  type: 'number',
                  label: 'Umbral alerta Top Ventas',
                  defaultValue: SYSTEM_SETTINGS_SEED.dashboardLowStockThreshold,
                  min: 0,
                  access: { update: businessUpdate },
                },
              ],
            },
          ],
        },
        {
          label: 'ERP y búsqueda',
          fields: [
            {
              name: 'catalogStalenessHours',
              type: 'number',
              label: 'Horas staleness catálogo ERP',
              defaultValue: SYSTEM_SETTINGS_SEED.catalogStalenessHours,
              min: 1,
              admin: {
                description: 'Tras este tiempo sin sync exitoso, los datos se consideran obsoletos.',
              },
              access: { update: technicalUpdate },
            },
            {
              name: 'predictiveSearchEnabled',
              type: 'checkbox',
              label: 'Búsqueda predictiva activa',
              defaultValue: true,
              access: { update: technicalUpdate },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'suggestLimit',
                  type: 'number',
                  label: 'Límite sugerencias',
                  defaultValue: SYSTEM_SETTINGS_SEED.suggestLimit,
                  min: 1,
                  max: 20,
                  access: { update: technicalUpdate },
                },
                {
                  name: 'minQueryLength',
                  type: 'number',
                  label: 'Longitud mínima consulta',
                  defaultValue: SYSTEM_SETTINGS_SEED.minQueryLength,
                  min: 1,
                  access: { update: technicalUpdate },
                },
              ],
            },
          ],
        },
        {
          label: 'Contacto',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'supportPhone',
                  type: 'text',
                  label: 'Teléfono soporte',
                  access: { update: businessUpdate },
                },
                {
                  name: 'supportEmail',
                  type: 'email',
                  label: 'Email soporte',
                  access: { update: businessUpdate },
                },
              ],
            },
            {
              name: 'whatsapp',
              type: 'text',
              label: 'WhatsApp',
              access: { update: businessUpdate },
            },
            {
              name: 'storeAlfaroName',
              type: 'text',
              label: 'Tienda Alfaro — nombre',
              defaultValue: SYSTEM_SETTINGS_SEED.storeAlfaroName,
              access: { update: businessUpdate },
            },
            {
              name: 'storeAlfaroAddress',
              type: 'textarea',
              label: 'Tienda Alfaro — dirección',
              access: { update: businessUpdate },
            },
            {
              name: 'storeRinconName',
              type: 'text',
              label: 'Tienda Rincón — nombre',
              defaultValue: SYSTEM_SETTINGS_SEED.storeRinconName,
              access: { update: businessUpdate },
            },
            {
              name: 'storeRinconAddress',
              type: 'textarea',
              label: 'Tienda Rincón — dirección',
              access: { update: businessUpdate },
            },
          ],
        },
      ],
    },
  ],
}
