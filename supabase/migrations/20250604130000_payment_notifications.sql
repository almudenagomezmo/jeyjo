-- Redsys payment notification idempotency and audit (payments-redsys-wallets)

CREATE TABLE public.payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference text NOT NULL,
  signature text NOT NULL,
  gateway text NOT NULL DEFAULT 'redsys',
  response_code text,
  raw_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_notifications_signature_unique_idx
  ON public.payment_notifications (signature);

CREATE INDEX payment_notifications_order_reference_idx
  ON public.payment_notifications (order_reference);
