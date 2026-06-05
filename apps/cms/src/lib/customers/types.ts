export type CustomerListStatus = 'pending' | 'validated' | 'all'

export type CustomerListRow = {
  id: string
  commercial_name: string
  email: string
  tax_id: string | null
  phone: string | null
  customer_group: number
  validated_at: string | null
  is_company: boolean
  created_at: string
}

export type WebProfileRow = {
  id: string
  email: string
  role: string
  is_active: boolean
  last_login_at: string | null
  display_name: string | null
  email_confirmed: boolean
}

export type CustomerDetail = {
  customer: {
    id: string
    commercial_name: string
    legal_name: string | null
    email: string
    phone: string | null
    tax_id: string | null
    is_company: boolean
    customer_group: number
    validated_at: string | null
    erp_code: string | null
    billing_address_line1: string | null
    billing_city: string | null
    billing_postal_code: string | null
    billing_country: string | null
    created_at: string
  }
  profiles: WebProfileRow[]
  canValidate: boolean
  emailConfirmedForValidation: boolean
}
