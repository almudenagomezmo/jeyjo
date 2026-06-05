export type CouponDiscountType = 'percent' | 'fixed'

export type PayloadCouponDoc = {
  id: number | string
  code: string
  discountType: CouponDiscountType
  discountValue: number
  minimumOrderAmount?: number | null
  validFrom: string
  validUntil: string
  maxUses?: number | null
  usesCount?: number | null
  active?: boolean | null
}

export type CouponErrorCode =
  | 'disabled'
  | 'not_found'
  | 'expired'
  | 'not_started'
  | 'max_uses_reached'
  | 'minimum_not_met'
  | 'inactive'

export type CouponValidationResult = {
  valid: boolean
  couponCode: string | null
  discountAmount: number
  eligibleSubtotal: number
  ineligibleOfferLines: string[]
  showOfferExclusionWarning: boolean
  label: string | null
  errors: CouponErrorCode[]
}
