/** EAN-8 / EAN-13 check digit validation (RD-005). */
export function isValidEan(code: string): boolean {
  const digits = code.replace(/\D/g, '')
  if (digits.length !== 8 && digits.length !== 13) {
    return false
  }

  const nums = digits.split('').map(Number)
  const check = nums.pop()
  if (check == null || !Number.isFinite(check)) return false

  const weights = digits.length === 13 ? [1, 3] : [3, 1]
  let sum = 0
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i]! * weights[i % 2]!
  }
  const computed = (10 - (sum % 10)) % 10
  return computed === check
}
