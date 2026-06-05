## 1. API y dominio CMS

- [x] 1.1 Crear `apps/cms/src/lib/customers/group-labels.ts` con etiquetas y textos email para grupos 1–4
- [x] 1.2 Crear `apps/cms/src/lib/customers/fetch-customer-detail.ts` (customers + web_profiles + email confirmado vía admin auth)
- [x] 1.3 Generalizar endpoint a `apps/cms/src/endpoints/customers-admin.ts`: `GET` listado con filtros status/group/search/paginación y `GET /:id` detalle; reutilizar `canValidateCustomers` + MFA
- [x] 1.4 Registrar endpoint y vista en `payload.config.ts`; deprecar export `pendingCustomersEndpoint` (mantener redirect o proxy temporal si hace falta en transición)
- [x] 1.5 Extraer lógica de `validate/route.ts` a `lib/customers/validate-customer.ts` e incluir gate `email_confirmed_at`

## 2. Email de aprobación

- [x] 2.1 Crear `apps/cms/src/lib/customers/emails/approval.ts` con plantillas B2C y B2B (grupos 2–4) vía `payload.sendEmail`
- [x] 2.2 Invocar envío desde `validate-customer.ts` tras commit exitoso; log en fallo sin rollback
- [x] 2.3 Test unitario de asunto/enlaces por grupo (1 → `/cuenta`, 2–4 → `/intranet`)

## 3. Vista admin Clientes

- [x] 3.1 Renombrar/evolucionar `PendingCustomersView` → `CustomersAdminView` con listado filtrable (default pendientes), búsqueda y paginación
- [x] 3.2 Añadir ficha detalle solo lectura (datos registro + perfiles + badge email confirmado)
- [x] 3.3 Modal Validar con selector grupos 1–4 y hints de negocio; deshabilitar si email no confirmado
- [x] 3.4 Estilos en `index.scss` alineados a vistas OMS/Newsletter existentes
- [x] 3.5 Redirect `/admin/pending-customers` → `/admin/customers?status=pending` (Next route o middleware admin)

## 4. Dashboard y documentación

- [x] 4.1 Actualizar `alerts.ts` href a `/admin/customers?status=pending`
- [x] 4.2 Actualizar `apps/cms/README.md` con nueva ruta, API y flujo de dos emails
- [x] 4.3 Ajustar copy registro storefront si hace falta (`register/route.ts` o `RegisterForm`) para mencionar confirmación email + validación Jeyjo

## 5. Tests y verificación

- [x] 5.1 Test integración endpoint listado: filtros pending/validated, roles denegados sin staff
- [x] 5.2 Test integración validate: rechazo sin email confirmado; éxito grupos 3 y 4 con rol `b2b_superadmin`
- [x] 5.3 Test integración dashboard alert href
- [ ] 5.4 Smoke manual: registro → Mailpit confirm → validar grupo 3 → email aprobación → login `/intranet`; repetir grupo 1 → `/cuenta`
