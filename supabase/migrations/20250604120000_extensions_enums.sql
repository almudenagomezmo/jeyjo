-- Jeyjo core schema: extensions and enums
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.web_profile_role AS ENUM (
  'b2c',
  'b2b_superadmin',
  'b2b_subuser',
  'pending'
);

CREATE TYPE public.search_event_status AS ENUM (
  'pending',
  'processing',
  'done',
  'error'
);
