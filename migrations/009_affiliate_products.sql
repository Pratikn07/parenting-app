-- Affiliate Products Feature
-- Stores product catalog for affiliate link enrichment

-- Main products table
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,              -- Canonical name for matching
  name_variants TEXT[] DEFAULT '{}',       -- Alternative names AI might use
  description TEXT,                        -- Short product description
  affiliate_url TEXT NOT NULL,             -- Full affiliate link
  affiliate_network TEXT DEFAULT 'amazon', -- amazon, target, walmart, etc.
  image_url TEXT,                          -- Product image URL
  price DECIMAL(10,2),                     -- Price in USD
  category TEXT,                           -- sleep, feeding, development, safety, gear, toys, books
  age_range_min INTEGER DEFAULT 0,         -- Min age in months
  age_range_max INTEGER,                   -- Max age in months (null = no limit)
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track clicks for analytics
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES affiliate_products(id) ON DELETE CASCADE,
  session_id UUID,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Log all product mentions (for catalog expansion insights)
CREATE TABLE IF NOT EXISTS product_mentions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  had_affiliate BOOLEAN DEFAULT false,
  session_id UUID,
  user_id UUID,
  mentioned_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active ON affiliate_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_mentions_name ON product_mentions_log(product_name);

-- RLS Policies
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mentions_log ENABLE ROW LEVEL SECURITY;

-- Products are readable by all authenticated users
CREATE POLICY "affiliate_products_read" ON affiliate_products
  FOR SELECT TO authenticated USING (is_active = true);

-- Clicks can be inserted by authenticated users
CREATE POLICY "affiliate_clicks_insert" ON affiliate_clicks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Mentions can be inserted by service role (edge function)
CREATE POLICY "product_mentions_service" ON product_mentions_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to increment click count atomically
CREATE OR REPLACE FUNCTION increment_affiliate_click(product_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_products 
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE id = product_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_affiliate_click(UUID) TO authenticated;

-- Seed some popular parenting products for testing
INSERT INTO affiliate_products (product_name, name_variants, description, affiliate_url, category, price, age_range_min, age_range_max) VALUES
  ('Hatch Rest', ARRAY['Hatch Rest Sound Machine', 'Hatch', 'Hatch Rest Mini'], 'Sound machine and night light', 'https://amzn.to/PLACEHOLDER_HATCH', 'sleep', 59.99, 0, 60),
  ('Time Timer', ARRAY['Time Timer Visual', 'Visual Timer'], 'Visual countdown timer for routines', 'https://amzn.to/PLACEHOLDER_TIMER', 'development', 34.99, 18, null),
  ('Sophie the Giraffe', ARRAY['Sophie Giraffe', 'Sophie Teether'], 'Classic natural rubber teether', 'https://amzn.to/PLACEHOLDER_SOPHIE', 'development', 24.99, 0, 24),
  ('Nose Frida', ARRAY['NoseFrida', 'Fridababy Nose', 'Snot Sucker'], 'Baby nasal aspirator', 'https://amzn.to/PLACEHOLDER_FRIDA', 'health', 15.99, 0, 36),
  ('Lovevery Play Kit', ARRAY['Lovevery', 'Lovevery Subscription'], 'Stage-based developmental toys', 'https://amzn.to/PLACEHOLDER_LOVEVERY', 'toys', 80.00, 0, 48),
  ('Owlet Smart Sock', ARRAY['Owlet', 'Owlet Sock', 'Owlet Monitor'], 'Baby oxygen and heart rate monitor', 'https://amzn.to/PLACEHOLDER_OWLET', 'safety', 299.99, 0, 18),
  ('Boon Grass Drying Rack', ARRAY['Boon Grass', 'Grass Drying Rack'], 'Bottle drying rack', 'https://amzn.to/PLACEHOLDER_BOON', 'feeding', 19.99, 0, 24),
  ('Haakaa Breast Pump', ARRAY['Haakaa', 'Haakaa Silicone Pump'], 'Manual silicone breast pump', 'https://amzn.to/PLACEHOLDER_HAAKAA', 'feeding', 12.99, 0, 12),
  ('Baby Brezza Formula Pro', ARRAY['Baby Brezza', 'Formula Maker', 'Formula Pro'], 'Automatic formula dispenser', 'https://amzn.to/PLACEHOLDER_BREZZA', 'feeding', 199.99, 0, 12),
  ('EZPZ Happy Mat', ARRAY['EZPZ', 'Happy Mat', 'Suction Plate'], 'Suction silicone placemat', 'https://amzn.to/PLACEHOLDER_EZPZ', 'feeding', 24.99, 6, 36)
ON CONFLICT DO NOTHING;
