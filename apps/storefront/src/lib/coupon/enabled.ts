export function isMarketingCouponsEnabled(): boolean {
  return process.env.MARKETING_COUPONS_ENABLED !== 'false'
}
