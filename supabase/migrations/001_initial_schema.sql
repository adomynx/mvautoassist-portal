-- ============================================================
-- 001_initial_schema.sql
-- MVAutoAssist Portal — Initial Database Schema
-- ============================================================
-- Reverse-engineered from live Supabase project rgbscknpcklbyshtrzpf
-- on 2026-05-11 via PostgREST OpenAPI spec + live data queries.
-- (pg_dump was unavailable: Docker Desktop not installed on dev machine.)
--
-- Certainty levels:
--   CONFIRMED  — from live PostgREST OpenAPI schema (column names, types,
--                defaults, nullability, FK relationships)
--   CONFIRMED  — from live data queries (helpline default row, role values)
--   INFERRED   — column-level CHECK constraints (role, status) — values
--                cross-verified against application code in proxy.ts and
--                login/page.tsx; no pg_constraint query was possible
--   INFERRED   — ON DELETE behaviour on FKs (standard Supabase conventions)
--   INFERRED   — exact trigger function bodies (standard Supabase pattern;
--                not pg_proc-queryable without direct DB access)
-- ============================================================


-- ============================================================
-- TABLE: users
-- Public-schema profile that mirrors auth.users.
-- Populated automatically by the handle_new_user trigger below.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid         NOT NULL,
  email       text         NOT NULL,
  full_name   text         NOT NULL,
  role        text         NOT NULL CHECK (role IN ('admin', 'dealer')),
  location    text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT users_pkey      PRIMARY KEY (id),
  CONSTRAINT users_id_fkey   FOREIGN KEY (id)
                             REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT users_email_key UNIQUE (email)
);


-- ============================================================
-- TABLE: certificates
-- One row per RSA service certificate issued by a dealer/agent.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id                 uuid         NOT NULL DEFAULT gen_random_uuid(),
  cert_number        text         NOT NULL,
  agent_id           uuid         NOT NULL,

  -- Customer fields
  customer_name      text         NOT NULL,
  customer_dob       date,
  customer_mobile    text         NOT NULL,
  customer_email     text,
  customer_address   text,

  -- Vehicle fields
  vehicle_type       text         NOT NULL,
  registration_no    text,
  make_model         text         NOT NULL,
  variant            text,
  engine_no          text         NOT NULL,
  chassis_no         text         NOT NULL,
  fuel_type          text,
  manufacturing_year integer,

  -- Coverage period
  start_date         date         NOT NULL,
  end_date           date         NOT NULL,

  -- Financials
  insurance_amount   numeric      NOT NULL DEFAULT 0,
  rsa_amount         numeric      NOT NULL,
  total_amount       numeric      NOT NULL,

  -- Workflow
  status             text         NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now(),
  approved_at        timestamptz,
  approved_by        uuid,

  CONSTRAINT certificates_pkey             PRIMARY KEY (id),
  CONSTRAINT certificates_cert_number_key  UNIQUE (cert_number),
  CONSTRAINT certificates_agent_id_fkey    FOREIGN KEY (agent_id)
                                           REFERENCES public.users (id) ON DELETE RESTRICT,
  CONSTRAINT certificates_approved_by_fkey FOREIGN KEY (approved_by)
                                           REFERENCES public.users (id) ON DELETE SET NULL
);


-- ============================================================
-- TABLE: price_tiers
-- Per-dealer RSA pricing options; one row may be flagged default.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_tiers (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  amount     numeric     NOT NULL,
  is_default boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT price_tiers_pkey      PRIMARY KEY (id),
  CONSTRAINT price_tiers_user_fkey FOREIGN KEY (user_id)
                                   REFERENCES public.users (id) ON DELETE CASCADE
);


-- ============================================================
-- TABLE: helpline_settings
-- Stores the RSA toll-free / helpline numbers.
-- user_id is nullable: null means the row is a global default.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.helpline_settings (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid,
  helpline_number text        NOT NULL,
  is_default      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT helpline_settings_pkey      PRIMARY KEY (id),
  CONSTRAINT helpline_settings_user_fkey FOREIGN KEY (user_id)
                                         REFERENCES public.users (id) ON DELETE SET NULL
);


-- ============================================================
-- INDEXES
-- Total: 8
--   Auto-created by constraints (6):
--     users_pkey, users_email_key,
--     certificates_pkey, certificates_cert_number_key,
--     price_tiers_pkey, helpline_settings_pkey
--   Explicit performance indexes (2):
--     idx_certificates_agent_id  — speeds up "show me this agent's certs"
--     idx_certificates_status    — speeds up admin pending-queue queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificates_agent_id
  ON public.certificates (agent_id);

CREATE INDEX IF NOT EXISTS idx_certificates_status
  ON public.certificates (status);


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Keeps updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Syncs a newly registered auth.users row into public.users.
-- SECURITY DEFINER so the insert runs as the function owner,
-- bypassing the RLS policies that would otherwise block it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'dealer')
  );
  RETURN NEW;
END;
$$;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Fire handle_new_user whenever Supabase Auth creates a user.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on the three tables that carry that column.
CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_helpline_settings_updated_at
  BEFORE UPDATE ON public.helpline_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- DEFAULT DATA
-- ============================================================
-- Confirmed from live DB query on 2026-05-11:
--   helpline_number = '9307187878', is_default = true, user_id = null
INSERT INTO public.helpline_settings (helpline_number, is_default)
VALUES ('9307187878', true)
ON CONFLICT DO NOTHING;
