-- ============================================================
-- EcomPin Intelligence Suite — Data Foundation
-- Tables: pin_analytics_snapshots, ab_experiments
-- Column: pins.aesthetic_tag
-- ============================================================

-- 1. pin_analytics_snapshots: Daily time-series snapshots of pin performance
CREATE TABLE IF NOT EXISTS public.pin_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL,
  user_id uuid NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  outbound_clicks integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pin_analytics_snapshots_pin_date_key UNIQUE (pin_id, snapshot_date),
  CONSTRAINT pin_analytics_snapshots_pin_id_fkey FOREIGN KEY (pin_id) REFERENCES public.pins(id) ON DELETE CASCADE,
  CONSTRAINT pin_analytics_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pin_snapshots_user_date
  ON public.pin_analytics_snapshots (user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_pin_snapshots_pin
  ON public.pin_analytics_snapshots (pin_id, snapshot_date DESC);

ALTER TABLE public.pin_analytics_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pin_analytics_snapshots'
      AND policyname = 'Users can view own analytics snapshots'
  ) THEN
    CREATE POLICY "Users can view own analytics snapshots"
      ON public.pin_analytics_snapshots FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pin_analytics_snapshots'
      AND policyname = 'Service role can manage analytics snapshots'
  ) THEN
    CREATE POLICY "Service role can manage analytics snapshots"
      ON public.pin_analytics_snapshots FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 2. ab_experiments: Tracks A/B test pairs for aesthetic comparison
CREATE TABLE IF NOT EXISTS public.ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  pin_a_id uuid NOT NULL,
  pin_b_id uuid NOT NULL,
  aesthetic_a text NOT NULL,
  aesthetic_b text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  winner text,
  started_at timestamptz NOT NULL DEFAULT now(),
  concluded_at timestamptz,
  metrics_a jsonb NOT NULL DEFAULT '{}',
  metrics_b jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ab_experiments_status_check CHECK (status IN ('running', 'concluded', 'expired')),
  CONSTRAINT ab_experiments_winner_check CHECK (winner IS NULL OR winner IN ('a', 'b', 'tie')),
  CONSTRAINT ab_experiments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT ab_experiments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT ab_experiments_pin_a_fkey FOREIGN KEY (pin_a_id) REFERENCES public.pins(id) ON DELETE CASCADE,
  CONSTRAINT ab_experiments_pin_b_fkey FOREIGN KEY (pin_b_id) REFERENCES public.pins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_user_status ON public.ab_experiments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_product ON public.ab_experiments (product_id, status);

ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_experiments'
      AND policyname = 'Users can view own experiments'
  ) THEN
    CREATE POLICY "Users can view own experiments"
      ON public.ab_experiments FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_experiments'
      AND policyname = 'Service role can manage experiments'
  ) THEN
    CREATE POLICY "Service role can manage experiments"
      ON public.ab_experiments FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 3. Add aesthetic_tag column to pins table
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS aesthetic_tag text;
