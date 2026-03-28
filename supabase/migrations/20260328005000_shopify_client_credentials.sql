-- Add Client ID and Client Secret columns for the 2026 Shopify Authentication architecture
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shopify_client_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shopify_client_secret text;

-- Remove the deprecated permanent access token column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS shopify_custom_app_token;
