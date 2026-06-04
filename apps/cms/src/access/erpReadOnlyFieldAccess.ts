/**
 * Admin UI layer: staff cannot update ERP-sourced fields.
 * Server layer: `beforeChange` hooks revert ERP fields unless `req.context.erpSync === true`.
 */
export const erpReadOnlyFieldAccess = {
  update: () => false,
}
