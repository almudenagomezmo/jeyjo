-- Local development seed (runs after migrations on `supabase db reset`)
-- Fixed UUIDs for documentation and RLS manual tests (see supabase/README.md)

INSERT INTO public.customers (
  id,
  erp_code,
  commercial_name,
  legal_name,
  tax_id,
  email,
  phone,
  customer_group,
  is_company,
  validated_at
)
VALUES
  (
    'a0000001-0000-4000-8000-000000000001',
    'ERP-TEST-01',
    'Empresa Demo B2B',
    'Empresa Demo B2B S.L.',
    'B12345678',
    'b2b-demo@jeyjo.local',
    '+34600000001',
    2,
    true,
    now()
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    null,
    'Cliente B2C Demo',
    'Cliente B2C Demo',
    '12345678Z',
    'b2c-demo@jeyjo.local',
    '+34600000002',
    1,
    false,
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- web_profiles rows require matching auth.users (create in Supabase Studio → Authentication)
-- Example after creating users with these emails, link profiles:
-- INSERT INTO public.web_profiles (id, customer_id, email, role)
-- VALUES
--   ('<auth-user-uuid-b2b>', 'a0000001-0000-4000-8000-000000000001', 'b2b-demo@jeyjo.local', 'b2b_superadmin'),
--   ('<auth-user-uuid-b2c>', 'a0000002-0000-4000-8000-000000000002', 'b2c-demo@jeyjo.local', 'b2c');

INSERT INTO public.search_events (entity_type, entity_id, action, payload, status)
VALUES
  ('product', 'b0000001-0000-4000-8000-000000000001', 'upsert', '{"title":"Seed product"}'::jsonb, 'pending');
