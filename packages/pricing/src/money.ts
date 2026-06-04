/** Round to 2 decimal places (HALF_UP). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function grossFromNet(net: number, vatRate: number): number {
  return roundMoney(net * (1 + vatRate / 100))
}

export function applyPercentDiscount(base: number, discountPercent: number): number {
  return roundMoney(base * (1 - discountPercent / 100))
}

export function isB2BCustomerGroup(customerGroup: number): boolean {
  return customerGroup >= 2
}
