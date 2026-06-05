/** When false, section permission guards are bypassed (rollback / local dev). Default: enabled. */
export function isB2bPermissionsEnabled(): boolean {
  const raw = process.env.B2B_PERMISSIONS_ENABLED
  if (raw === undefined || raw === '') return true
  return raw !== 'false' && raw !== '0'
}
