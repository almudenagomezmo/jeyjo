import type { Access, GlobalConfig } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

const analyticsStaffRead: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'mantenimiento'])

const analyticsStaffUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'mantenimiento'])

export const AnalyticsSettings: GlobalConfig = {
  slug: 'analyticsSettings',
  label: 'Analytics y Merchant Feed',
  admin: {
    group: 'Configuración del sistema',
  },
  access: {
    read: analyticsStaffRead,
    update: analyticsStaffUpdate,
  },
  fields: [
    {
      name: 'ga4MeasurementId',
      type: 'text',
      label: 'GA4 Measurement ID (referencia)',
      admin: {
        description:
          'Documentación operativa. En runtime la tienda usa NEXT_PUBLIC_GA4_MEASUREMENT_ID y NEXT_PUBLIC_GA4_ENABLED (ver apps/storefront/.env.example).',
      },
    },
    {
      name: 'merchantFeedEnabled',
      type: 'checkbox',
      label: 'Feed Merchant Center activo',
      defaultValue: true,
      admin: {
        description:
          'Kill switch además de MERCHANT_FEED_ENABLED en Vercel. URL pública: /api/feeds/merchant-center.xml',
      },
    },
    {
      name: 'lastFeedGeneratedAt',
      type: 'date',
      label: 'Última generación del feed',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'feedOmittedCounts',
      type: 'json',
      label: 'Productos omitidos en última generación',
      admin: { readOnly: true },
    },
    {
      name: 'consecutiveFeedFailures',
      type: 'number',
      label: 'Fallos consecutivos del cron',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'lastFeedErrorAt',
      type: 'date',
      label: 'Último error del cron',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastFeedErrorMessage',
      type: 'textarea',
      label: 'Mensaje del último error',
      admin: { readOnly: true },
    },
  ],
}
