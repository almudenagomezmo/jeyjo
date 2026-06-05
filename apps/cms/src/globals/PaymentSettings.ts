import type { Access, GlobalConfig } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

const paymentStaffUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'administracion'])

export const PaymentSettings: GlobalConfig = {
  slug: 'paymentSettings',
  label: 'Pagos (B2C)',
  admin: {
    group: 'Configuración del sistema',
  },
  access: {
    read: () => true,
    update: paymentStaffUpdate,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'cardEnabled',
          type: 'checkbox',
          label: 'Tarjeta (Redsys)',
          defaultValue: true,
        },
        {
          name: 'bizumEnabled',
          type: 'checkbox',
          label: 'Bizum (Redsys)',
          defaultValue: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paypalEnabled',
          type: 'checkbox',
          label: 'PayPal',
          defaultValue: true,
        },
        {
          name: 'transferEnabled',
          type: 'checkbox',
          label: 'Transferencia bancaria',
          defaultValue: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'applePayEnabled',
          type: 'checkbox',
          label: 'Apple Pay',
          defaultValue: false,
        },
        {
          name: 'googlePayEnabled',
          type: 'checkbox',
          label: 'Google Pay',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'transferInstructions',
      type: 'group',
      label: 'Instrucciones transferencia',
      fields: [
        {
          name: 'iban',
          type: 'text',
          label: 'IBAN',
        },
        {
          name: 'beneficiary',
          type: 'text',
          label: 'Beneficiario',
        },
        {
          name: 'conceptTemplate',
          type: 'text',
          label: 'Plantilla concepto',
          defaultValue: 'Pedido {orderNumber}',
          admin: {
            description: 'Use {orderNumber} como marcador de referencia',
          },
        },
      ],
    },
  ],
}
