-- Add show_brand_url toggle to brand_settings
-- When false, pins skip the render-pin step entirely (raw fal.ai image = final pin)
ALTER TABLE brand_settings ADD COLUMN show_brand_url boolean NOT NULL DEFAULT true;
