import type { TextField } from 'payload'

type CustomerIdFieldOverrides = Partial<
  Pick<TextField, 'label' | 'required' | 'index' | 'admin'>
>

export function customerIdField(overrides?: CustomerIdFieldOverrides): TextField {
  return {
    name: 'customerId',
    type: 'text',
    label: overrides?.label ?? 'Cliente',
    required: overrides?.required ?? true,
    index: overrides?.index ?? true,
    admin: {
      description: 'Cliente B2B validado de Supabase. El valor guardado es su UUID.',
      ...overrides?.admin,
      components: {
        Field: '@/components/CustomerIdSelect#CustomerIdSelectField',
        Cell: '@/components/CustomerIdSelect#CustomerIdSelectCell',
        ...overrides?.admin?.components,
      },
    },
  }
}
