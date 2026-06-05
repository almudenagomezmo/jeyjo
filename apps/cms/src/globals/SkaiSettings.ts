import type { Access, GlobalConfig } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

const superadminUpdate: Access = ({ req: { user } }) => hasStaffRole(user, ['superadmin'])

export const SkaiSettings: GlobalConfig = {
  slug: 'skaiSettings',
  label: 'SKAI / EVA',
  admin: {
    group: 'Configuración',
    hidden: true,
  },
  access: {
    read: () => true,
    update: superadminUpdate,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Widget EVA activo',
      defaultValue: true,
    },
    {
      name: 'businessHours',
      type: 'text',
      label: 'Horario de atención',
      defaultValue: 'Lunes a viernes 09:00–18:00',
    },
    {
      name: 'outOfHoursMessage',
      type: 'textarea',
      label: 'Mensaje fuera de horario',
      defaultValue: 'EVA está disponible 24/7; el equipo humano atiende en horario laboral.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fallbackPhone',
          type: 'text',
          label: 'Teléfono contacto',
        },
        {
          name: 'fallbackEmail',
          type: 'email',
          label: 'Email contacto',
        },
      ],
    },
    {
      name: 'fallbackWhatsapp',
      type: 'text',
      label: 'WhatsApp contacto',
    },
    {
      name: 'knowledgeDocuments',
      type: 'array',
      label: 'Documentos de conocimiento',
      fields: [
        {
          name: 'filename',
          type: 'text',
          required: true,
        },
        {
          name: 'uploadedAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'storagePath',
          type: 'text',
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
