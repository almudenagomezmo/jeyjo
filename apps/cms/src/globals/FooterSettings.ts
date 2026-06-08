import type { Access, GlobalConfig } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'
import {
  footerSettingsAfterChange,
  footerSettingsBeforeChange,
} from '@/hooks/footerSettingsAuditHooks'
import { FOOTER_SETTINGS_SEED } from '@/lib/system-config/footer-defaults'

const businessUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'administracion'])

export const FooterSettings: GlobalConfig = {
  slug: 'footerSettings',
  label: 'Pie de página',
  admin: {
    group: 'Configuración del sistema',
    description: 'Redes sociales, badge UE y visibilidad de secciones del footer público.',
  },
  access: {
    read: () => true,
    update: businessUpdate,
  },
  hooks: {
    beforeChange: footerSettingsBeforeChange,
    afterChange: footerSettingsAfterChange,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'showStores',
          type: 'checkbox',
          label: 'Mostrar tiendas físicas',
          defaultValue: FOOTER_SETTINGS_SEED.showStores,
        },
        {
          name: 'showSocial',
          type: 'checkbox',
          label: 'Mostrar redes sociales',
          defaultValue: FOOTER_SETTINGS_SEED.showSocial,
        },
      ],
    },
    {
      name: 'socialFacebook',
      type: 'text',
      label: 'Facebook URL',
    },
    {
      name: 'socialInstagram',
      type: 'text',
      label: 'Instagram URL',
    },
    {
      name: 'socialLinkedin',
      type: 'text',
      label: 'LinkedIn URL',
    },
    {
      name: 'socialYoutube',
      type: 'text',
      label: 'YouTube URL',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'blogEnabled',
          type: 'checkbox',
          label: 'Enlace al blog',
          defaultValue: FOOTER_SETTINGS_SEED.blogEnabled,
          admin: {
            description: 'Muestra el enlace a /blog en la columna Ayuda del footer público.',
          },
        },
        {
          name: 'blogLabel',
          type: 'text',
          label: 'Texto enlace blog',
          defaultValue: FOOTER_SETTINGS_SEED.blogLabel,
        },
      ],
    },
    {
      name: 'euFundingEnabled',
      type: 'checkbox',
      label: 'Mostrar badge financiación UE',
      defaultValue: false,
    },
    {
      name: 'euFundingImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen badge UE',
      admin: {
        condition: (_, siblingData) => siblingData?.euFundingEnabled === true,
      },
    },
    {
      name: 'euFundingAlt',
      type: 'text',
      label: 'Texto alternativo badge UE',
      required: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.euFundingEnabled === true && Boolean(siblingData?.euFundingImage),
      },
    },
    {
      name: 'euFundingUrl',
      type: 'text',
      label: 'URL enlace badge UE (opcional)',
      admin: {
        condition: (_, siblingData) => siblingData?.euFundingEnabled === true,
      },
    },
  ],
}
