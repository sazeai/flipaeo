-- Add handle to products table for deduplication
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_user_handle_key;
ALTER TABLE public.products ADD CONSTRAINT products_user_handle_key UNIQUE (user_id, handle);

-- Add custom app token to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shopify_custom_app_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shopify_store_url text;
