import type { GlobalConfig } from 'payload'

import { marketingStaffRead, marketingStaffUpdate } from '@/access/marketingStaff'

export const NewsletterSettings: GlobalConfig = {
  slug: 'newsletterSettings',
  label: 'Newsletter',
  admin: {
    group: 'Marketing',
  },
  access: {
    read: () => true,
    update: marketingStaffUpdate,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Suscripciones activas',
      defaultValue: true,
    },
    {
      name: 'headline',
      type: 'text',
      label: 'Título del bloque',
      defaultValue: 'Newsletter Jeyjo',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
      defaultValue: 'Recibe ofertas y novedades de material de oficina.',
    },
    {
      name: 'privacyPolicyUrl',
      type: 'text',
      label: 'URL política de privacidad',
      defaultValue: '/privacidad',
    },
    {
      name: 'brevoListId',
      type: 'number',
      label: 'ID lista Brevo (opcional)',
      admin: {
        description: 'Sustituye BREVO_NEWSLETTER_LIST_ID del entorno si se indica',
      },
    },
    {
      name: 'confirmationEmailEnabled',
      type: 'checkbox',
      label: 'Enviar email de confirmación',
      defaultValue: true,
    },
  ],
}
