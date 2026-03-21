-- 90-day Sprint pivot schema

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sprint_status') THEN
    CREATE TYPE public.sprint_status AS ENUM ('pending', 'active', 'paused', 'completed', 'expired', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sprint_quota_type') THEN
    CREATE TYPE public.sprint_quota_type AS ENUM ('new', 'refresh');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_registry_state') THEN
    CREATE TYPE public.topic_registry_state AS ENUM (
      'candidate',
      'reserved',
      'accepted',
      'merged',
      'rejected',
      'conflict_replacement_requested'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gsc_decay_candidate_status') THEN
    CREATE TYPE public.gsc_decay_candidate_status AS ENUM ('queued', 'selected', 'used', 'skipped');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.sprint_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  dodo_product_id text UNIQUE,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  duration_days int NOT NULL DEFAULT 90 CHECK (duration_days > 0),
  quota_new_articles int NOT NULL CHECK (quota_new_articles >= 0),
  quota_refresh_articles int NOT NULL CHECK (quota_refresh_articles >= 0),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.sprint_packages(id),
  status public.sprint_status NOT NULL DEFAULT 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  activated_at timestamptz,
  completed_at timestamptz,
  dodo_checkout_id text,
  dodo_payment_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_sprints_window_check CHECK (
    (starts_at IS NULL AND ends_at IS NULL)
    OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)
  )
);

CREATE TABLE IF NOT EXISTS public.sprint_quota_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sprint_id uuid NOT NULL REFERENCES public.user_sprints(id) ON DELETE CASCADE,
  quota_type public.sprint_quota_type NOT NULL,
  delta int NOT NULL,
  reason text NOT NULL,
  article_id uuid,
  content_plan_item_id text,
  correlation_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.topic_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sprint_id uuid NOT NULL REFERENCES public.user_sprints(id) ON DELETE CASCADE,
  state public.topic_registry_state NOT NULL DEFAULT 'candidate',
  title text NOT NULL,
  canonical_keyword text NOT NULL,
  normalized_slug text NOT NULL,
  intent text,
  funnel_role text,
  cluster_id text,
  embedding vector(1536),
  source_batch_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gsc_decay_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sprint_id uuid NOT NULL REFERENCES public.user_sprints(id) ON DELETE CASCADE,
  page_url text NOT NULL,
  window_30_clicks numeric NOT NULL DEFAULT 0,
  window_60_clicks numeric NOT NULL DEFAULT 0,
  window_30_impressions numeric NOT NULL DEFAULT 0,
  window_60_impressions numeric NOT NULL DEFAULT 0,
  ctr_delta numeric,
  position_delta numeric,
  decay_score numeric NOT NULL DEFAULT 0,
  status public.gsc_decay_candidate_status NOT NULL DEFAULT 'queued',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprint_packages_active ON public.sprint_packages (is_active);
CREATE INDEX IF NOT EXISTS idx_user_sprints_user_status ON public.user_sprints (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sprints_dates ON public.user_sprints (starts_at, ends_at);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_active_sprint ON public.user_sprints (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sprint_quota_ledgers_sprint_created ON public.sprint_quota_ledgers (user_sprint_id, created_at);
CREATE INDEX IF NOT EXISTS idx_topic_registry_sprint_state ON public.topic_registry (user_sprint_id, state);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_topic_registry_slug_per_sprint ON public.topic_registry (user_sprint_id, normalized_slug);
CREATE INDEX IF NOT EXISTS idx_topic_registry_keyword ON public.topic_registry (user_sprint_id, canonical_keyword);
CREATE INDEX IF NOT EXISTS idx_gsc_decay_sprint_status_score ON public.gsc_decay_candidates (user_sprint_id, status, decay_score DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_decay_url ON public.gsc_decay_candidates (user_sprint_id, page_url);

ALTER TABLE public.sprint_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_quota_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_decay_candidates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sprint_packages' AND policyname = 'Authenticated can view active sprint packages'
  ) THEN
    CREATE POLICY "Authenticated can view active sprint packages"
      ON public.sprint_packages
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sprint_packages' AND policyname = 'Service role can manage sprint packages'
  ) THEN
    CREATE POLICY "Service role can manage sprint packages"
      ON public.sprint_packages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_sprints' AND policyname = 'Users can view own sprints'
  ) THEN
    CREATE POLICY "Users can view own sprints"
      ON public.user_sprints
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_sprints' AND policyname = 'Users can insert own sprints'
  ) THEN
    CREATE POLICY "Users can insert own sprints"
      ON public.user_sprints
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_sprints' AND policyname = 'Users can update own sprints'
  ) THEN
    CREATE POLICY "Users can update own sprints"
      ON public.user_sprints
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_sprints' AND policyname = 'Service role can manage user sprints'
  ) THEN
    CREATE POLICY "Service role can manage user sprints"
      ON public.user_sprints
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sprint_quota_ledgers' AND policyname = 'Users can view own sprint ledgers'
  ) THEN
    CREATE POLICY "Users can view own sprint ledgers"
      ON public.sprint_quota_ledgers
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_sprints us
          WHERE us.id = sprint_quota_ledgers.user_sprint_id
            AND us.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sprint_quota_ledgers' AND policyname = 'Service role can manage sprint ledgers'
  ) THEN
    CREATE POLICY "Service role can manage sprint ledgers"
      ON public.sprint_quota_ledgers
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'topic_registry' AND policyname = 'Users can view own topic registry'
  ) THEN
    CREATE POLICY "Users can view own topic registry"
      ON public.topic_registry
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_sprints us
          WHERE us.id = topic_registry.user_sprint_id
            AND us.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'topic_registry' AND policyname = 'Service role can manage topic registry'
  ) THEN
    CREATE POLICY "Service role can manage topic registry"
      ON public.topic_registry
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gsc_decay_candidates' AND policyname = 'Users can view own gsc decay candidates'
  ) THEN
    CREATE POLICY "Users can view own gsc decay candidates"
      ON public.gsc_decay_candidates
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_sprints us
          WHERE us.id = gsc_decay_candidates.user_sprint_id
            AND us.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gsc_decay_candidates' AND policyname = 'Service role can manage gsc decay candidates'
  ) THEN
    CREATE POLICY "Service role can manage gsc decay candidates"
      ON public.gsc_decay_candidates
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.content_plans
  ADD COLUMN IF NOT EXISTS user_sprint_id uuid REFERENCES public.user_sprints(id) ON DELETE SET NULL;

ALTER TABLE public.content_plans
  ADD COLUMN IF NOT EXISTS plan_mode text NOT NULL DEFAULT 'legacy_monthly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'content_plans_plan_mode_check'
      AND conrelid = 'public.content_plans'::regclass
  ) THEN
    ALTER TABLE public.content_plans
      ADD CONSTRAINT content_plans_plan_mode_check
      CHECK (plan_mode = ANY (ARRAY['legacy_monthly'::text, 'sprint_90_day'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_plans_user_sprint ON public.content_plans (user_sprint_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_plan_mode ON public.content_plans (plan_mode);

INSERT INTO public.sprint_packages (code, name, dodo_product_id, price, currency, duration_days, quota_new_articles, quota_refresh_articles, metadata)
VALUES
  ('sprint_497', 'FlipAEO 90-Day Sprint 497', null, 497, 'USD', 90, 50, 25, '{"ratio":"2:1"}'::jsonb),
  ('sprint_897', 'FlipAEO 90-Day Sprint 897', null, 897, 'USD', 90, 100, 50, '{"ratio":"2:1"}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  dodo_product_id = COALESCE(EXCLUDED.dodo_product_id, sprint_packages.dodo_product_id),
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  quota_new_articles = EXCLUDED.quota_new_articles,
  quota_refresh_articles = EXCLUDED.quota_refresh_articles,
  metadata = EXCLUDED.metadata,
  updated_at = now();
