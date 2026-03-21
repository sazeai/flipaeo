-- Ensure vector(1536) extension exists
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- DROP FUNCTION public.consume_ai_tokens(uuid);

CREATE OR REPLACE FUNCTION public.consume_ai_tokens(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_subscription record;
  v_usage record;
  v_is_subscribed boolean := false;
  v_tokens_remaining bigint;
begin
  -- 1. Check subscription status (active = subscribed)
  select * into v_subscription
  from dodo_subscriptions
  where user_id = p_user_id
    and status = 'active'
  order by created_at desc
  limit 1;
  
  v_is_subscribed := (v_subscription.id is not null);
  
  -- If not subscribed, deny immediately
  if not v_is_subscribed then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'subscription_required',
      'tokens_remaining', 0,
      'is_subscribed', false
    );
  end if;
  
  -- 2. Get or create usage record
  select * into v_usage
  from ai_token_usage
  where user_id = p_user_id;
  
  if v_usage.user_id is null then
    -- First time user, create record with cycle start from subscription
    insert into ai_token_usage (user_id, tokens_used, cycle_start_date)
    values (
      p_user_id, 
      0, 
      coalesce(v_subscription.current_period_end - interval '1 month', now())
    )
    returning * into v_usage;
  end if;
  
  -- 3. Check if billing cycle has passed (lazy reset)
  -- If subscription's current_period_end indicates a new billing cycle, reset tokens
  if v_subscription.current_period_end is not null 
     and v_usage.cycle_start_date < (v_subscription.current_period_end - interval '1 month') then
    -- Reset the cycle
    update ai_token_usage
    set tokens_used = 0,
        cycle_start_date = v_subscription.current_period_end - interval '1 month',
        updated_at = now()
    where user_id = p_user_id
    returning * into v_usage;
  end if;
  
  -- 4. Calculate remaining tokens
  v_tokens_remaining := v_usage.tokens_limit - v_usage.tokens_used;
  
  -- 5. Check if quota exceeded
  if v_tokens_remaining <= 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'tokens_remaining', 0,
      'tokens_used', v_usage.tokens_used,
      'tokens_limit', v_usage.tokens_limit,
      'is_subscribed', true,
      'cycle_resets_at', v_subscription.current_period_end
    );
  end if;
  
  -- 6. Allowed!
  return jsonb_build_object(
    'allowed', true,
    'tokens_remaining', v_tokens_remaining,
    'tokens_used', v_usage.tokens_used,
    'tokens_limit', v_usage.tokens_limit,
    'is_subscribed', true,
    'cycle_resets_at', v_subscription.current_period_end
  );
end;
$function$
;

-- DROP FUNCTION public.find_covered_answer(extensions.vector(1536), uuid, float8);

CREATE OR REPLACE FUNCTION public.find_covered_answer(check_embedding vector(1536), brand_uuid uuid, match_threshold double precision)
 RETURNS TABLE(article_id uuid, answer_text text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT first_covered_by, answer_unit, 1 - (answer_embedding <=> check_embedding)
  FROM answer_coverage
  WHERE brand_id = brand_uuid
  AND answer_embedding IS NOT NULL
  AND 1 - (answer_embedding <=> check_embedding) > match_threshold
  ORDER BY 1 - (answer_embedding <=> check_embedding) DESC
  LIMIT 1;
END;
$function$
;

-- DROP FUNCTION public.find_live_url_from_article(uuid, uuid, float8);

CREATE OR REPLACE FUNCTION public.find_live_url_from_article(target_article_id uuid, brand_uuid uuid, match_threshold double precision)
 RETURNS TABLE(live_url text, live_title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
DECLARE
  source_vector vector(1536);
BEGIN
  -- 1. Get the source vector(1536) from the draft article
  SELECT topic_embedding INTO source_vector
  FROM articles
  WHERE id = target_article_id;

  -- 2. Find the matching live link
  RETURN QUERY
  SELECT url, title, 1 - (embedding <=> source_vector)
  FROM internal_links
  WHERE brand_id = brand_uuid
  AND 1 - (embedding <=> source_vector) > match_threshold
  ORDER BY 1 - (embedding <=> source_vector) DESC
  LIMIT 1;
END;
$function$
;

-- DROP FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.match_articles(extensions.vector(1536), float8, int4, uuid, uuid);

CREATE OR REPLACE FUNCTION public.match_articles(query_embedding vector(1536), match_threshold double precision, match_count integer, p_user_id uuid, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, keyword text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        articles.id,
        articles.keyword,
        1 - (articles.topic_embedding <=> query_embedding) AS similarity
    FROM articles
    WHERE 
        articles.topic_embedding IS NOT NULL
        AND 1 - (articles.topic_embedding <=> query_embedding) > match_threshold
        AND articles.user_id = p_user_id
        AND (p_brand_id IS NULL OR articles.brand_id = p_brand_id)
    ORDER BY articles.topic_embedding <=> query_embedding
    LIMIT match_count;
END;
$function$
;

-- DROP FUNCTION public.match_articles_topic(extensions.vector(1536), float8, int4, uuid, uuid);

CREATE OR REPLACE FUNCTION public.match_articles_topic(query_embedding vector(1536), match_threshold double precision, match_count integer, p_user_id uuid, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, keyword text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    articles.id,
    articles.keyword,
    1 - (articles.topic_embedding <=> query_embedding) AS similarity
  FROM articles
  WHERE 1 - (articles.topic_embedding <=> query_embedding) > match_threshold
    AND articles.user_id = p_user_id
    AND (p_brand_id IS NULL OR articles.brand_id = p_brand_id)  -- NEW: Brand isolation
  ORDER BY articles.topic_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

-- DROP FUNCTION public.match_internal_links(extensions.vector(1536), float8, int4, uuid);

CREATE OR REPLACE FUNCTION public.match_internal_links(query_embedding vector(1536), match_threshold double precision, match_count integer, p_user_id uuid)
 RETURNS TABLE(id uuid, url text, title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    internal_links.id,
    internal_links.url,
    internal_links.title,
    1 - (internal_links.embedding <=> query_embedding) AS similarity
  FROM internal_links
  WHERE 1 - (internal_links.embedding <=> query_embedding) > match_threshold
    AND internal_links.user_id = p_user_id
  ORDER BY internal_links.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

-- DROP FUNCTION public.match_internal_links(extensions.vector(1536), float8, int4, uuid, uuid);

CREATE OR REPLACE FUNCTION public.match_internal_links(query_embedding vector(1536), match_threshold double precision, match_count integer, p_brand_id uuid, p_user_id uuid)
 RETURNS TABLE(id uuid, url text, title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    internal_links.id,
    internal_links.url,
    internal_links.title,
    1 - (internal_links.embedding <=> query_embedding) AS similarity
  FROM internal_links
  WHERE 1 - (internal_links.embedding <=> query_embedding) > match_threshold
    AND internal_links.user_id = p_user_id
    AND (p_brand_id IS NULL OR internal_links.brand_id = p_brand_id)
  ORDER BY internal_links.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

-- DROP FUNCTION public.record_ai_usage(uuid, int8);

CREATE OR REPLACE FUNCTION public.record_ai_usage(p_user_id uuid, p_tokens_used bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_new_total bigint;
  v_limit bigint;
begin
  -- Update usage, incrementing tokens_used
  update ai_token_usage
  set tokens_used = tokens_used + p_tokens_used,
      last_request_at = now(),
      updated_at = now()
  where user_id = p_user_id
  returning tokens_used, tokens_limit into v_new_total, v_limit;
  
  -- If no record exists (edge case), create one
  if v_new_total is null then
    insert into ai_token_usage (user_id, tokens_used)
    values (p_user_id, p_tokens_used)
    returning tokens_used, tokens_limit into v_new_total, v_limit;
  end if;
  
  return jsonb_build_object(
    'tokens_used', v_new_total,
    'tokens_remaining', greatest(0, v_limit - v_new_total),
    'tokens_limit', v_limit
  );
end;
$function$
;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
;



-- public.credits_id_seq definition

-- DROP SEQUENCE public.credits_id_seq;

CREATE SEQUENCE public.credits_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;


-- public.user_feedback_id_seq definition

-- DROP SEQUENCE public.user_feedback_id_seq;

CREATE SEQUENCE public.user_feedback_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;




    -- DROP TYPE public."article_phase";

CREATE TYPE public."article_phase" AS ENUM (
	'research',
	'outline',
	'writing',
	'polish',
	'trigger');

-- DROP TYPE public."article_status";

CREATE TYPE public."article_status" AS ENUM (
	'queued',
	'researching',
	'outlining',
	'writing',
	'polishing',
	'completed',
	'failed');

-- public.dodo_pricing_plans definition

-- Drop table

-- DROP TABLE public.dodo_pricing_plans;

CREATE TABLE public.dodo_pricing_plans (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	price numeric(10, 2) NOT NULL,
	credits int4 NOT NULL,
	currency text DEFAULT 'USD'::text NOT NULL,
	dodo_product_id text NULL,
	is_active bool DEFAULT true NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT dodo_pricing_plans_pkey PRIMARY KEY (id)
);
CREATE INDEX dodo_pricing_plans_active_idx ON public.dodo_pricing_plans USING btree (is_active);
CREATE INDEX dodo_pricing_plans_dodo_product_id_idx ON public.dodo_pricing_plans USING btree (dodo_product_id);
ALTER TABLE public.dodo_pricing_plans ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Anonymous users can view active pricing plans" ON public.dodo_pricing_plans
 AS PERMISSIVE
 FOR SELECT
 TO anon
 USING ((is_active = true));
CREATE POLICY "Authenticated users can view active pricing plans" ON public.dodo_pricing_plans
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((is_active = true));
CREATE POLICY "Service role can manage pricing plans" ON public.dodo_pricing_plans
 AS PERMISSIVE
 FOR ALL
 TO service_role
 USING (true)
 WITH CHECK (true);


-- public.dodo_webhook_events definition

-- Drop table

-- DROP TABLE public.dodo_webhook_events;

CREATE TABLE public.dodo_webhook_events (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	dodo_event_id text NOT NULL,
	event_type text NOT NULL,
	processed bool DEFAULT false NOT NULL,
	processed_at timestamptz NULL,
	"data" jsonb NOT NULL,
	error_message text NULL,
	retry_count int4 DEFAULT 0 NOT NULL,
	CONSTRAINT dodo_webhook_events_dodo_event_id_key UNIQUE (dodo_event_id),
	CONSTRAINT dodo_webhook_events_pkey PRIMARY KEY (id)
);
CREATE INDEX dodo_webhook_events_dodo_event_id_idx ON public.dodo_webhook_events USING btree (dodo_event_id);
CREATE INDEX dodo_webhook_events_event_type_idx ON public.dodo_webhook_events USING btree (event_type);
CREATE INDEX dodo_webhook_events_processed_idx ON public.dodo_webhook_events USING btree (processed);
ALTER TABLE public.dodo_webhook_events ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role can manage webhook events" ON public.dodo_webhook_events
 AS PERMISSIVE
 FOR ALL
 TO service_role
 USING (true)
 WITH CHECK (true);


-- public.ai_token_usage definition

-- Drop table

-- DROP TABLE public.ai_token_usage;

CREATE TABLE public.ai_token_usage (
	user_id uuid NOT NULL,
	tokens_used int8 DEFAULT 0 NOT NULL,
	tokens_limit int8 DEFAULT 200000 NOT NULL,
	cycle_start_date timestamptz DEFAULT now() NOT NULL,
	last_request_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT ai_token_usage_pkey PRIMARY KEY (user_id)
);
CREATE INDEX ai_token_usage_user_id_idx ON public.ai_token_usage USING btree (user_id);

-- Table Triggers

create trigger update_ai_token_usage_modtime before
update
    on
    public.ai_token_usage for each row execute function update_updated_at_column();
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role full access to AI usage" ON public.ai_token_usage
 AS PERMISSIVE
 FOR ALL
 USING (true)
 WITH CHECK (true);
CREATE POLICY "Users can view their own AI usage" ON public.ai_token_usage
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.answer_coverage definition

-- Drop table

-- DROP TABLE public.answer_coverage;

CREATE TABLE public.answer_coverage (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	brand_id uuid NULL,
	"cluster" text NOT NULL,
	answer_unit text NOT NULL,
	coverage_state text NOT NULL,
	first_covered_by uuid NULL,
	last_updated_at timestamptz DEFAULT now() NULL,
	answer_embedding extensions.vector(1536) NULL,
	CONSTRAINT answer_coverage_pkey PRIMARY KEY (id),
	CONSTRAINT answer_coverage_user_id_brand_id_cluster_answer_unit_key UNIQUE (user_id, brand_id, cluster, answer_unit)
);
CREATE INDEX idx_answer_coverage_user_cluster ON public.answer_coverage USING btree (user_id, cluster);
ALTER TABLE public.answer_coverage ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete their own coverage data" ON public.answer_coverage
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own coverage data" ON public.answer_coverage
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own coverage data" ON public.answer_coverage
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own coverage data" ON public.answer_coverage
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.articles definition

-- Drop table

-- DROP TABLE public.articles;

CREATE TABLE public.articles (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	brand_id uuid NULL,
	keyword text NOT NULL,
	status public."article_status" DEFAULT 'queued'::article_status NULL,
	competitor_data jsonb NULL,
	outline jsonb NULL,
	current_step_index int4 DEFAULT 0 NULL,
	raw_content text DEFAULT ''::text NULL,
	final_html text NULL,
	error_message text NULL,
	failed_at_phase public."article_phase" NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	meta_description text NULL,
	slug text NULL,
	featured_image_url text NULL,
	wordpress_post_id text NULL,
	wordpress_post_url text NULL,
	wordpress_site_id uuid NULL,
	published_at timestamptz NULL,
	webflow_item_id text NULL,
	webflow_item_url text NULL,
	webflow_site_id uuid NULL,
	shopify_article_id text NULL,
	shopify_article_url text NULL,
	shopify_connection_id uuid NULL,
	article_type text DEFAULT 'informational'::text NULL,
	topic_embedding extensions.vector(1536) NULL,
	supporting_keywords _text NULL,
	CONSTRAINT articles_pkey PRIMARY KEY (id)
);
CREATE INDEX articles_slug_idx ON public.articles USING btree (slug);
CREATE INDEX articles_topic_embedding_idx ON public.articles USING ivfflat (topic_embedding vector_cosine_ops) WITH (lists='100');
CREATE INDEX idx_articles_status ON public.articles USING btree (status);
CREATE INDEX idx_articles_user ON public.articles USING btree (user_id);

-- Table Triggers

create trigger update_articles_modtime before
update
    on
    public.articles for each row execute function update_updated_at_column();
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own articles" ON public.articles
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own articles" ON public.articles
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own articles" ON public.articles
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own articles" ON public.articles
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.brand_details definition

-- Drop table

-- DROP TABLE public.brand_details;

CREATE TABLE public.brand_details (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	website_url text NOT NULL,
	brand_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	image_style text DEFAULT 'stock'::text NULL,
	deleted_at timestamptz NULL,
	discovered_competitors jsonb NULL,
	pillar_recommendations jsonb NULL,
	CONSTRAINT brand_details_pkey PRIMARY KEY (id)
);
CREATE INDEX brand_details_user_id_idx ON public.brand_details USING btree (user_id);

-- Table Triggers

create trigger update_brand_details_updated_at before
update
    on
    public.brand_details for each row execute function update_updated_at_column();
ALTER TABLE public.brand_details ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete their own brand details" ON public.brand_details
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own brand details" ON public.brand_details
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own brand details" ON public.brand_details
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own brand details" ON public.brand_details
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.content_plans definition

-- Drop table

-- DROP TABLE public.content_plans;

CREATE TABLE public.content_plans (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	brand_id uuid NULL,
	plan_data jsonb NOT NULL,
	competitor_seeds jsonb NULL,
	gsc_enhanced bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	automation_status text DEFAULT 'paused'::text NULL,
	catch_up_mode text DEFAULT 'gradual'::text NULL,
	generation_status text DEFAULT 'complete'::text NULL,
	generation_phase text NULL,
	generation_error text NULL,
	CONSTRAINT content_plans_automation_status_check CHECK ((automation_status = ANY (ARRAY['paused'::text, 'active'::text, 'completed'::text]))),
	CONSTRAINT content_plans_catch_up_mode_check CHECK ((catch_up_mode = ANY (ARRAY['gradual'::text, 'skip'::text, 'reschedule'::text]))),
	CONSTRAINT content_plans_generation_status_check CHECK ((generation_status = ANY (ARRAY['pending'::text, 'generating'::text, 'complete'::text, 'failed'::text]))),
	CONSTRAINT content_plans_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_content_plans_automation ON public.content_plans USING btree (automation_status) WHERE (automation_status = 'active'::text);
CREATE INDEX idx_content_plans_brand ON public.content_plans USING btree (brand_id);
CREATE INDEX idx_content_plans_generation_status ON public.content_plans USING btree (generation_status) WHERE (generation_status = ANY (ARRAY['pending'::text, 'generating'::text]));
CREATE INDEX idx_content_plans_user ON public.content_plans USING btree (user_id);
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete their own content plans" ON public.content_plans
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own content plans" ON public.content_plans
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own content plans" ON public.content_plans
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own content plans" ON public.content_plans
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.credits definition

-- Drop table

-- DROP TABLE public.credits;

CREATE TABLE public.credits (
	id int8 GENERATED BY DEFAULT AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	credits numeric(10, 2) DEFAULT 0 NOT NULL,
	user_id uuid NOT NULL,
	CONSTRAINT credits_pkey PRIMARY KEY (id)
);
CREATE INDEX credits_user_id_idx ON public.credits USING btree (user_id);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role can delete credits" ON public.credits
 AS PERMISSIVE
 FOR DELETE
 TO service_role
 USING (true);
CREATE POLICY "Service role can insert credits" ON public.credits
 AS PERMISSIVE
 FOR INSERT
 TO service_role
 WITH CHECK (true);
CREATE POLICY "Service role can read all credits" ON public.credits
 AS PERMISSIVE
 FOR SELECT
 TO service_role
 USING (true);
CREATE POLICY "Service role can update credits" ON public.credits
 AS PERMISSIVE
 FOR UPDATE
 TO service_role
 USING (true)
 WITH CHECK (true);
CREATE POLICY "Users can create their own credits" ON public.credits
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own credits" ON public.credits
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((auth.uid() = user_id))
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own credits" ON public.credits
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((auth.uid() = user_id));


-- public.dodo_payments definition

-- Drop table

-- DROP TABLE public.dodo_payments;

CREATE TABLE public.dodo_payments (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	user_id uuid NOT NULL,
	dodo_payment_id text NOT NULL,
	dodo_checkout_session_id text NULL,
	pricing_plan_id uuid NOT NULL,
	amount numeric(10, 2) NOT NULL,
	currency text DEFAULT 'USD'::text NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	credits int4 DEFAULT 0 NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT dodo_payments_dodo_payment_id_key UNIQUE (dodo_payment_id),
	CONSTRAINT dodo_payments_pkey PRIMARY KEY (id)
);
CREATE INDEX dodo_payments_dodo_payment_id_idx ON public.dodo_payments USING btree (dodo_payment_id);
CREATE INDEX dodo_payments_status_idx ON public.dodo_payments USING btree (status);
CREATE INDEX dodo_payments_user_id_idx ON public.dodo_payments USING btree (user_id);
ALTER TABLE public.dodo_payments ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role can delete payments" ON public.dodo_payments
 AS PERMISSIVE
 FOR DELETE
 TO service_role
 USING (true);
CREATE POLICY "Service role can insert payments" ON public.dodo_payments
 AS PERMISSIVE
 FOR INSERT
 TO service_role
 WITH CHECK (true);
CREATE POLICY "Service role can read all payments" ON public.dodo_payments
 AS PERMISSIVE
 FOR SELECT
 TO service_role
 USING (true);
CREATE POLICY "Service role can update payments" ON public.dodo_payments
 AS PERMISSIVE
 FOR UPDATE
 TO service_role
 USING (true)
 WITH CHECK (true);
CREATE POLICY "Users can view their own payments" ON public.dodo_payments
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((auth.uid() = user_id));


-- public.dodo_subscription_changes definition

-- Drop table

-- DROP TABLE public.dodo_subscription_changes;

CREATE TABLE public.dodo_subscription_changes (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	user_id uuid NOT NULL,
	from_plan_id uuid NULL,
	to_plan_id uuid NULL,
	checkout_session_id text NULL,
	status text NOT NULL,
	change_type text NOT NULL,
	reason text NULL,
	completed_at timestamptz NULL,
	error_message text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT dodo_subscription_changes_change_type_check CHECK ((change_type = ANY (ARRAY['new'::text, 'change'::text, 'cancellation'::text, 'reactivation'::text]))),
	CONSTRAINT dodo_subscription_changes_pkey PRIMARY KEY (id),
	CONSTRAINT dodo_subscription_changes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);
CREATE INDEX dodo_subscription_changes_change_type_idx ON public.dodo_subscription_changes USING btree (change_type);
CREATE INDEX dodo_subscription_changes_checkout_session_idx ON public.dodo_subscription_changes USING btree (checkout_session_id);
CREATE INDEX dodo_subscription_changes_created_at_idx ON public.dodo_subscription_changes USING btree (created_at DESC);
CREATE INDEX dodo_subscription_changes_status_idx ON public.dodo_subscription_changes USING btree (status);
CREATE INDEX dodo_subscription_changes_user_id_idx ON public.dodo_subscription_changes USING btree (user_id);
ALTER TABLE public.dodo_subscription_changes ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role can manage subscription changes" ON public.dodo_subscription_changes
 AS PERMISSIVE
 FOR ALL
 TO service_role
 USING (true)
 WITH CHECK (true);
CREATE POLICY "Users can create their own subscription changes" ON public.dodo_subscription_changes
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own subscription changes" ON public.dodo_subscription_changes
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((auth.uid() = user_id));


-- public.dodo_subscriptions definition

-- Drop table

-- DROP TABLE public.dodo_subscriptions;

CREATE TABLE public.dodo_subscriptions (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	user_id uuid NOT NULL,
	dodo_subscription_id text NULL,
	pricing_plan_id uuid NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	cancel_at_period_end bool DEFAULT false NOT NULL,
	current_period_end timestamptz NULL,
	next_billing_date timestamptz NULL,
	canceled_at timestamptz NULL,
	price_snapshot int8 NULL,
	currency_snapshot text NULL,
	CONSTRAINT dodo_subscriptions_dodo_subscription_id_key UNIQUE (dodo_subscription_id),
	CONSTRAINT dodo_subscriptions_pkey PRIMARY KEY (id)
);
CREATE INDEX dodo_subscriptions_cancel_next_idx ON public.dodo_subscriptions USING btree (cancel_at_period_end, next_billing_date);
CREATE INDEX dodo_subscriptions_dodo_subscription_id_idx ON public.dodo_subscriptions USING btree (dodo_subscription_id);
CREATE INDEX dodo_subscriptions_status_idx ON public.dodo_subscriptions USING btree (status);
CREATE INDEX dodo_subscriptions_status_next_idx ON public.dodo_subscriptions USING btree (status, next_billing_date);
CREATE INDEX dodo_subscriptions_user_id_idx ON public.dodo_subscriptions USING btree (user_id);
ALTER TABLE public.dodo_subscriptions ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role can insert subscriptions" ON public.dodo_subscriptions
 AS PERMISSIVE
 FOR INSERT
 TO service_role
 WITH CHECK (true);
CREATE POLICY "Service role can read all subscriptions" ON public.dodo_subscriptions
 AS PERMISSIVE
 FOR SELECT
 TO service_role
 USING (true);
CREATE POLICY "Service role can update subscriptions" ON public.dodo_subscriptions
 AS PERMISSIVE
 FOR UPDATE
 TO service_role
 USING (true)
 WITH CHECK (true);
CREATE POLICY "Users can view their own subscriptions" ON public.dodo_subscriptions
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((auth.uid() = user_id));


-- public.gsc_connections definition

-- Drop table

-- DROP TABLE public.gsc_connections;

CREATE TABLE public.gsc_connections (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	site_url text NOT NULL,
	access_token text NOT NULL,
	refresh_token text NOT NULL,
	expires_at timestamptz NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT gsc_connections_pkey PRIMARY KEY (id),
	CONSTRAINT gsc_connections_user_id_key UNIQUE (user_id)
);
ALTER TABLE public.gsc_connections ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete their own GSC connections" ON public.gsc_connections
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own GSC connections" ON public.gsc_connections
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own GSC connections" ON public.gsc_connections
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own GSC connections" ON public.gsc_connections
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.internal_links definition

-- Drop table

-- DROP TABLE public.internal_links;

CREATE TABLE public.internal_links (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	url text NOT NULL,
	title text NOT NULL,
	embedding extensions.vector(1536) NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	brand_id uuid NULL,
	CONSTRAINT internal_links_pkey PRIMARY KEY (id)
);
CREATE INDEX internal_links_embedding_idx ON public.internal_links USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');
ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own links" ON public.internal_links
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own links" ON public.internal_links
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own links" ON public.internal_links
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own links" ON public.internal_links
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.profiles definition

-- Drop table

-- DROP TABLE public.profiles;

CREATE TABLE public.profiles (
	id uuid NOT NULL,
	email text NULL,
	credits_remaining int4 DEFAULT 3 NULL,
	subscription_tier text DEFAULT 'free'::text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	default_brand_id uuid NULL,
	CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_profiles_modtime before
update
    on
    public.profiles for each row execute function update_updated_at_column();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can update own profile" ON public.profiles
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = id));
CREATE POLICY "Users can view own profile" ON public.profiles
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = id));


-- public.seo_metrics definition

-- Drop table

-- DROP TABLE public.seo_metrics;

CREATE TABLE public.seo_metrics (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	brand_id uuid NULL,
	"domain" text NOT NULL,
	domain_authority int4 NULL,
	page_authority int4 NULL,
	linking_root_domains int4 NULL,
	external_links int4 NULL,
	fetched_at timestamptz DEFAULT now() NULL,
	created_at timestamptz DEFAULT now() NULL,
	performance_desktop int4 NULL,
	accessibility_desktop int4 NULL,
	best_practices_desktop int4 NULL,
	seo_desktop int4 NULL,
	lcp_desktop numeric NULL,
	cls_desktop numeric NULL,
	tbt_desktop int4 NULL,
	fcp_desktop numeric NULL,
	recommendations_desktop jsonb DEFAULT '[]'::jsonb NULL,
	performance_mobile int4 NULL,
	accessibility_mobile int4 NULL,
	best_practices_mobile int4 NULL,
	seo_mobile int4 NULL,
	lcp_mobile numeric NULL,
	cls_mobile numeric NULL,
	tbt_mobile int4 NULL,
	fcp_mobile numeric NULL,
	recommendations_mobile jsonb DEFAULT '[]'::jsonb NULL,
	status text DEFAULT 'completed'::text NULL,
	error_message text NULL,
	CONSTRAINT seo_metrics_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_seo_metrics_brand ON public.seo_metrics USING btree (brand_id);
CREATE INDEX idx_seo_metrics_domain ON public.seo_metrics USING btree (domain);
CREATE INDEX idx_seo_metrics_status ON public.seo_metrics USING btree (user_id, domain, status);
CREATE UNIQUE INDEX idx_seo_metrics_unique ON public.seo_metrics USING btree (user_id, domain);
CREATE INDEX idx_seo_metrics_user ON public.seo_metrics USING btree (user_id);
ALTER TABLE public.seo_metrics ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can insert own metrics" ON public.seo_metrics
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own metrics" ON public.seo_metrics
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own metrics" ON public.seo_metrics
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.shopify_connections definition

-- Drop table

-- DROP TABLE public.shopify_connections;

CREATE TABLE public.shopify_connections (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	store_name text NOT NULL,
	store_domain text NOT NULL,
	access_token text NOT NULL,
	blog_id text NOT NULL,
	blog_title text NULL,
	is_default bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT shopify_connections_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_shopify_connections_user ON public.shopify_connections USING btree (user_id);
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own shopify connections" ON public.shopify_connections
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own shopify connections" ON public.shopify_connections
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own shopify connections" ON public.shopify_connections
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own shopify connections" ON public.shopify_connections
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.topical_audits definition

-- Drop table

-- DROP TABLE public.topical_audits;

CREATE TABLE public.topical_audits (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	brand_id uuid NOT NULL,
	niche_blueprint jsonb DEFAULT '{}'::jsonb NOT NULL,
	user_coverage jsonb DEFAULT '{}'::jsonb NOT NULL,
	competitor_coverages jsonb DEFAULT '[]'::jsonb NOT NULL,
	authority_score int4 DEFAULT 0 NOT NULL,
	pillar_scores jsonb DEFAULT '[]'::jsonb NOT NULL,
	projected_score int4 DEFAULT 0 NOT NULL,
	gap_matrix jsonb DEFAULT '[]'::jsonb NOT NULL,
	pillar_suggestions jsonb DEFAULT '[]'::jsonb NOT NULL,
	competitors_scanned int4 DEFAULT 0 NOT NULL,
	topics_analyzed int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	generation_status text DEFAULT 'pending'::text NULL,
	generation_phase text NULL,
	generation_error text NULL,
	user_pages_scanned int4 DEFAULT 0 NULL,
	CONSTRAINT topical_audits_pkey PRIMARY KEY (id),
	CONSTRAINT topical_audits_user_id_brand_id_key UNIQUE (user_id, brand_id)
);
CREATE INDEX idx_topical_audits_user_brand ON public.topical_audits USING btree (user_id, brand_id);
ALTER TABLE public.topical_audits ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Service role full access" ON public.topical_audits
 AS PERMISSIVE
 FOR ALL
 USING ((auth.role() = 'service_role'::text));
CREATE POLICY "Users can insert own audits" ON public.topical_audits
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own audits" ON public.topical_audits
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own audits" ON public.topical_audits
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.user_feedback definition

-- Drop table

-- DROP TABLE public.user_feedback;

CREATE TABLE public.user_feedback (
	id int8 GENERATED BY DEFAULT AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	user_id uuid NOT NULL,
	feedback_text text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT user_feedback_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own feedback" ON public.user_feedback
 AS PERMISSIVE
 FOR DELETE
 TO authenticated
 USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can insert own feedback" ON public.user_feedback
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can select own feedback" ON public.user_feedback
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can update own feedback" ON public.user_feedback
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((( SELECT auth.uid() AS uid) = user_id))
 WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


-- public.webflow_connections definition

-- Drop table

-- DROP TABLE public.webflow_connections;

CREATE TABLE public.webflow_connections (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	site_name text NULL,
	api_token text NOT NULL,
	site_id text NOT NULL,
	collection_id text NOT NULL,
	field_mapping jsonb DEFAULT '{"slug": "slug", "title": "name", "content": "post-body", "excerpt": "post-summary"}'::jsonb NULL,
	is_default bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT webflow_connections_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_webflow_connections_user ON public.webflow_connections USING btree (user_id);
ALTER TABLE public.webflow_connections ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own webflow connections" ON public.webflow_connections
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own webflow connections" ON public.webflow_connections
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own webflow connections" ON public.webflow_connections
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own webflow connections" ON public.webflow_connections
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.wordpress_connections definition

-- Drop table

-- DROP TABLE public.wordpress_connections;

CREATE TABLE public.wordpress_connections (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	user_id uuid NOT NULL,
	site_url text NOT NULL,
	site_name text NULL,
	username text NOT NULL,
	app_password text NOT NULL,
	is_default bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	default_category_id int4 NULL,
	CONSTRAINT wordpress_connections_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_wordpress_connections_user ON public.wordpress_connections USING btree (user_id);
ALTER TABLE public.wordpress_connections ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Users can delete own connections" ON public.wordpress_connections
 AS PERMISSIVE
 FOR DELETE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own connections" ON public.wordpress_connections
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own connections" ON public.wordpress_connections
 AS PERMISSIVE
 FOR UPDATE
 USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own connections" ON public.wordpress_connections
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.uid() = user_id));


-- public.ai_token_usage foreign keys

ALTER TABLE public.ai_token_usage ADD CONSTRAINT ai_token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.answer_coverage foreign keys

ALTER TABLE public.answer_coverage ADD CONSTRAINT answer_coverage_article_fkey FOREIGN KEY (first_covered_by) REFERENCES public.articles(id) ON DELETE SET NULL;


-- public.articles foreign keys

ALTER TABLE public.articles ADD CONSTRAINT articles_shopify_connection_id_fkey FOREIGN KEY (shopify_connection_id) REFERENCES public.shopify_connections(id);
ALTER TABLE public.articles ADD CONSTRAINT articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.articles ADD CONSTRAINT articles_webflow_site_id_fkey FOREIGN KEY (webflow_site_id) REFERENCES public.webflow_connections(id);
ALTER TABLE public.articles ADD CONSTRAINT articles_wordpress_site_id_fkey FOREIGN KEY (wordpress_site_id) REFERENCES public.wordpress_connections(id);


-- public.brand_details foreign keys

ALTER TABLE public.brand_details ADD CONSTRAINT brand_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.content_plans foreign keys

ALTER TABLE public.content_plans ADD CONSTRAINT content_plans_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_details(id) ON DELETE SET NULL;
ALTER TABLE public.content_plans ADD CONSTRAINT content_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.credits foreign keys

ALTER TABLE public.credits ADD CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.dodo_payments foreign keys

ALTER TABLE public.dodo_payments ADD CONSTRAINT dodo_payments_pricing_plan_id_fkey FOREIGN KEY (pricing_plan_id) REFERENCES public.dodo_pricing_plans(id);
ALTER TABLE public.dodo_payments ADD CONSTRAINT dodo_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.dodo_subscription_changes foreign keys

ALTER TABLE public.dodo_subscription_changes ADD CONSTRAINT dodo_subscription_changes_from_plan_id_fkey FOREIGN KEY (from_plan_id) REFERENCES public.dodo_pricing_plans(id);
ALTER TABLE public.dodo_subscription_changes ADD CONSTRAINT dodo_subscription_changes_to_plan_id_fkey FOREIGN KEY (to_plan_id) REFERENCES public.dodo_pricing_plans(id);
ALTER TABLE public.dodo_subscription_changes ADD CONSTRAINT dodo_subscription_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.dodo_subscriptions foreign keys

ALTER TABLE public.dodo_subscriptions ADD CONSTRAINT dodo_subscriptions_pricing_plan_id_fkey FOREIGN KEY (pricing_plan_id) REFERENCES public.dodo_pricing_plans(id);
ALTER TABLE public.dodo_subscriptions ADD CONSTRAINT dodo_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.gsc_connections foreign keys

ALTER TABLE public.gsc_connections ADD CONSTRAINT gsc_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.internal_links foreign keys

ALTER TABLE public.internal_links ADD CONSTRAINT internal_links_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_details(id) ON DELETE CASCADE;
ALTER TABLE public.internal_links ADD CONSTRAINT internal_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.profiles foreign keys

ALTER TABLE public.profiles ADD CONSTRAINT profiles_default_brand_id_fkey FOREIGN KEY (default_brand_id) REFERENCES public.brand_details(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.seo_metrics foreign keys

ALTER TABLE public.seo_metrics ADD CONSTRAINT seo_metrics_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_details(id) ON DELETE CASCADE;
ALTER TABLE public.seo_metrics ADD CONSTRAINT seo_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.shopify_connections foreign keys

ALTER TABLE public.shopify_connections ADD CONSTRAINT shopify_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.topical_audits foreign keys

ALTER TABLE public.topical_audits ADD CONSTRAINT topical_audits_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_details(id) ON DELETE CASCADE;
ALTER TABLE public.topical_audits ADD CONSTRAINT topical_audits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_feedback foreign keys

ALTER TABLE public.user_feedback ADD CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.webflow_connections foreign keys

ALTER TABLE public.webflow_connections ADD CONSTRAINT webflow_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.wordpress_connections foreign keys

ALTER TABLE public.wordpress_connections ADD CONSTRAINT wordpress_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;





CREATE UNIQUE INDEX ai_token_usage_pkey ON public.ai_token_usage USING btree (user_id);

CREATE INDEX ai_token_usage_user_id_idx ON public.ai_token_usage USING btree (user_id);

CREATE UNIQUE INDEX answer_coverage_pkey ON public.answer_coverage USING btree (id);

CREATE UNIQUE INDEX answer_coverage_user_id_brand_id_cluster_answer_unit_key ON public.answer_coverage USING btree (user_id, brand_id, cluster, answer_unit);

CREATE INDEX idx_answer_coverage_user_cluster ON public.answer_coverage USING btree (user_id, cluster);

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE INDEX articles_slug_idx ON public.articles USING btree (slug);

CREATE INDEX articles_topic_embedding_idx ON public.articles USING ivfflat (topic_embedding vector_cosine_ops) WITH (lists='100');

CREATE INDEX idx_articles_status ON public.articles USING btree (status);

CREATE INDEX idx_articles_user ON public.articles USING btree (user_id);

CREATE UNIQUE INDEX brand_details_pkey ON public.brand_details USING btree (id);

CREATE INDEX brand_details_user_id_idx ON public.brand_details USING btree (user_id);

CREATE UNIQUE INDEX content_plans_pkey ON public.content_plans USING btree (id);

CREATE INDEX idx_content_plans_automation ON public.content_plans USING btree (automation_status) WHERE (automation_status = 'active'::text);

CREATE INDEX idx_content_plans_brand ON public.content_plans USING btree (brand_id);

CREATE INDEX idx_content_plans_generation_status ON public.content_plans USING btree (generation_status) WHERE (generation_status = ANY (ARRAY['pending'::text, 'generating'::text]));

CREATE INDEX idx_content_plans_user ON public.content_plans USING btree (user_id);

CREATE UNIQUE INDEX credits_pkey ON public.credits USING btree (id);

CREATE INDEX credits_user_id_idx ON public.credits USING btree (user_id);

CREATE INDEX dodo_payments_dodo_payment_id_idx ON public.dodo_payments USING btree (dodo_payment_id);

CREATE UNIQUE INDEX dodo_payments_dodo_payment_id_key ON public.dodo_payments USING btree (dodo_payment_id);

CREATE UNIQUE INDEX dodo_payments_pkey ON public.dodo_payments USING btree (id);

CREATE INDEX dodo_payments_status_idx ON public.dodo_payments USING btree (status);

CREATE INDEX dodo_payments_user_id_idx ON public.dodo_payments USING btree (user_id);

CREATE INDEX dodo_pricing_plans_active_idx ON public.dodo_pricing_plans USING btree (is_active);

CREATE INDEX dodo_pricing_plans_dodo_product_id_idx ON public.dodo_pricing_plans USING btree (dodo_product_id);

CREATE UNIQUE INDEX dodo_pricing_plans_pkey ON public.dodo_pricing_plans USING btree (id);

CREATE INDEX dodo_subscription_changes_change_type_idx ON public.dodo_subscription_changes USING btree (change_type);

CREATE INDEX dodo_subscription_changes_checkout_session_idx ON public.dodo_subscription_changes USING btree (checkout_session_id);

CREATE INDEX dodo_subscription_changes_created_at_idx ON public.dodo_subscription_changes USING btree (created_at DESC);

CREATE UNIQUE INDEX dodo_subscription_changes_pkey ON public.dodo_subscription_changes USING btree (id);

CREATE INDEX dodo_subscription_changes_status_idx ON public.dodo_subscription_changes USING btree (status);

CREATE INDEX dodo_subscription_changes_user_id_idx ON public.dodo_subscription_changes USING btree (user_id);

CREATE INDEX dodo_subscriptions_cancel_next_idx ON public.dodo_subscriptions USING btree (cancel_at_period_end, next_billing_date);

CREATE INDEX dodo_subscriptions_dodo_subscription_id_idx ON public.dodo_subscriptions USING btree (dodo_subscription_id);

CREATE UNIQUE INDEX dodo_subscriptions_dodo_subscription_id_key ON public.dodo_subscriptions USING btree (dodo_subscription_id);

CREATE UNIQUE INDEX dodo_subscriptions_pkey ON public.dodo_subscriptions USING btree (id);

CREATE INDEX dodo_subscriptions_status_idx ON public.dodo_subscriptions USING btree (status);

CREATE INDEX dodo_subscriptions_status_next_idx ON public.dodo_subscriptions USING btree (status, next_billing_date);

CREATE INDEX dodo_subscriptions_user_id_idx ON public.dodo_subscriptions USING btree (user_id);

CREATE INDEX dodo_webhook_events_dodo_event_id_idx ON public.dodo_webhook_events USING btree (dodo_event_id);

CREATE UNIQUE INDEX dodo_webhook_events_dodo_event_id_key ON public.dodo_webhook_events USING btree (dodo_event_id);

CREATE INDEX dodo_webhook_events_event_type_idx ON public.dodo_webhook_events USING btree (event_type);

CREATE UNIQUE INDEX dodo_webhook_events_pkey ON public.dodo_webhook_events USING btree (id);

CREATE INDEX dodo_webhook_events_processed_idx ON public.dodo_webhook_events USING btree (processed);

CREATE UNIQUE INDEX gsc_connections_pkey ON public.gsc_connections USING btree (id);

CREATE UNIQUE INDEX gsc_connections_user_id_key ON public.gsc_connections USING btree (user_id);

CREATE INDEX internal_links_embedding_idx ON public.internal_links USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');

CREATE UNIQUE INDEX internal_links_pkey ON public.internal_links USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX idx_seo_metrics_brand ON public.seo_metrics USING btree (brand_id);

CREATE INDEX idx_seo_metrics_domain ON public.seo_metrics USING btree (domain);

CREATE INDEX idx_seo_metrics_status ON public.seo_metrics USING btree (user_id, domain, status);

CREATE UNIQUE INDEX idx_seo_metrics_unique ON public.seo_metrics USING btree (user_id, domain);

CREATE INDEX idx_seo_metrics_user ON public.seo_metrics USING btree (user_id);

CREATE UNIQUE INDEX seo_metrics_pkey ON public.seo_metrics USING btree (id);

CREATE INDEX idx_shopify_connections_user ON public.shopify_connections USING btree (user_id);

CREATE UNIQUE INDEX shopify_connections_pkey ON public.shopify_connections USING btree (id);

CREATE INDEX idx_topical_audits_user_brand ON public.topical_audits USING btree (user_id, brand_id);

CREATE UNIQUE INDEX topical_audits_pkey ON public.topical_audits USING btree (id);

CREATE UNIQUE INDEX topical_audits_user_id_brand_id_key ON public.topical_audits USING btree (user_id, brand_id);

CREATE UNIQUE INDEX user_feedback_pkey ON public.user_feedback USING btree (id);

CREATE INDEX idx_webflow_connections_user ON public.webflow_connections USING btree (user_id);

CREATE UNIQUE INDEX webflow_connections_pkey ON public.webflow_connections USING btree (id);

CREATE INDEX idx_wordpress_connections_user ON public.wordpress_connections USING btree (user_id);

CREATE UNIQUE INDEX wordpress_connections_pkey ON public.wordpress_connections USING btree (id);




