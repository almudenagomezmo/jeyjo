export type CustomerGroup = 1 | 2 | 3 | 4

export type CustomerGroupMeta = {
  value: CustomerGroup
  label: string
  hint: string
  segment: 'b2c' | 'b2b'
}

export const CUSTOMER_GROUP_OPTIONS: CustomerGroupMeta[] = [
  {
    value: 1,
    label: 'B2C — Particular',
    hint: 'Área de cliente estándar y precios P1.',
    segment: 'b2c',
  },
  {
    value: 2,
    label: 'B2B — Empresa',
    hint: 'Portal intranet B2B y tarifa P2.',
    segment: 'b2b',
  },
  {
    value: 3,
    label: 'B2B — Colegio / instituto',
    hint: 'Catálogo escolar vigente (campaña temporal).',
    segment: 'b2b',
  },
  {
    value: 4,
    label: 'B2B — Concurso público',
    hint: 'Revistas de ofertas o flyers con precios especiales temporales.',
    segment: 'b2b',
  },
]

export function customerGroupLabel(group: number): string {
  return CUSTOMER_GROUP_OPTIONS.find((o) => o.value === group)?.label ?? `Grupo ${group}`
}

export function roleForCustomerGroup(group: number): 'b2c' | 'b2b_superadmin' {
  return group === 1 ? 'b2c' : 'b2b_superadmin'
}

export function approvalEmailSegmentCopy(group: CustomerGroup): string {
  switch (group) {
    case 1:
      return 'Tu cuenta de particular ha sido activada.'
    case 2:
      return 'Tu cuenta de empresa B2B ha sido activada.'
    case 3:
      return 'Tu cuenta de centro educativo ha sido activada. Tendrás acceso al catálogo escolar vigente.'
    case 4:
      return 'Tu cuenta de empresa en concurso público ha sido activada. Podrás consultar las ofertas temporales asignadas.'
  }
}
