-- Pinterest Integration Schema
-- Tables: pinterest_connections, pin_queue, account_health_log
-- These tables support the full Pinterest OAuth + Publishing + Analytics pipeline.

-- pinterest_connections: Stores OAuth tokens and account metadata per user
CREATE TABLE IF NOT EXISTS public.pinterest_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinterest_user_id text,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  account_age_days integer DEFAULT 0,
  trust_score numeric(5,2) DEFAULT 0.0,
  warmup_phase text NOT NULL DEFAULT 'warmup_no_url',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pinterest_connections_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_pinterest_connections_user ON public.pinterest_connections (user_id);

ALTER TABLE public.pinterest_connections ENABLE ROW LEVEL SECURITY;

-- Users can read their own connection
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pinterest_connections'
      AND policyname = 'Users can view own pinterest connection'
  ) THEN
    CREATE POLICY "Users can view own pinterest connection"
      ON public.pinterest_connections FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own connection (disconnect)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pinterest_connections'
      AND policyname = 'Users can delete own pinterest connection'
  ) THEN
    CREATE POLICY "Users can delete own pinterest connection"
      ON public.pinterest_connections FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role has full access (for OAuth callback + background jobs)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pinterest_connections'
      AND policyname = 'Service role can manage pinterest connections'
  ) THEN
    CREATE POLICY "Service role can manage pinterest connections"
      ON public.pinterest_connections FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- pin_queue: Approved pins waiting to be published to Pinterest
CREATE TABLE IF NOT EXISTS public.pin_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pin_queue_user_status ON public.pin_queue (user_id, status);
CREATE INDEX IF NOT EXISTS idx_pin_queue_priority ON public.pin_queue (priority, created_at);

ALTER TABLE public.pin_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pin_queue'
      AND policyname = 'Users can view own pin queue'
  ) THEN
    CREATE POLICY "Users can view own pin queue"
      ON public.pin_queue FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pin_queue'
      AND policyname = 'Users can insert into own pin queue'
  ) THEN
    CREATE POLICY "Users can insert into own pin queue"
      ON public.pin_queue FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pin_queue'
      AND policyname = 'Service role can manage pin queue'
  ) THEN
    CREATE POLICY "Service role can manage pin queue"
      ON public.pin_queue FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- account_health_log: Daily publishing telemetry per user
CREATE TABLE IF NOT EXISTS public.account_health_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinterest_connection_id uuid,
  pins_today integer DEFAULT 0,
  warmup_phase text,
  warmup_day integer DEFAULT 0,
  shadow_ban_risk text DEFAULT 'low',
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_health_user ON public.account_health_log (user_id, checked_at DESC);

ALTER TABLE public.account_health_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_health_log'
      AND policyname = 'Users can view own health log'
  ) THEN
    CREATE POLICY "Users can view own health log"
      ON public.account_health_log FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_health_log'
      AND policyname = 'Service role can manage health log'
  ) THEN
    CREATE POLICY "Service role can manage health log"
      ON public.account_health_log FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;
