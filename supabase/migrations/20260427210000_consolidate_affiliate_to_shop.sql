-- =====================================================
-- AFFILIATE CONSOLIDATION: legacy affiliate_* -> shop_*
-- =====================================================
--
-- Goal: make shop_products / shop_clicks the single source of truth for
-- product recommendations across the app (chat enrichment + Shop tab).
--
-- This migration:
--   1. Adds name_variants TEXT[] to shop_products so chat's LLM bold-text
--      matching keeps working after the rewire.
--   2. Adds legacy_affiliate_id UUID for traceability + click backfill.
--   3. Backfills affiliate_products -> shop_products + shop_product_affiliates.
--   4. Backfills affiliate_clicks -> shop_clicks (mapped via legacy_affiliate_id).
--
-- Idempotent: every step uses NOT EXISTS / IF NOT EXISTS guards so re-running
-- is safe.
--
-- The legacy affiliate_products / affiliate_clicks / product_mentions_log
-- tables are intentionally NOT dropped here. They remain as a safety net for
-- one release. A follow-up migration will drop them after soak time.
--
-- Note: 'development' is the only legacy category without a shop_categories
-- match; it is mapped to 'toys' (closest fit; shop's "Toys & Development").

-- =====================================================
-- 1. Schema additions on shop_products
-- =====================================================

ALTER TABLE shop_products
    ADD COLUMN IF NOT EXISTS name_variants TEXT[];

ALTER TABLE shop_products
    ADD COLUMN IF NOT EXISTS legacy_affiliate_id UUID;

COMMENT ON COLUMN shop_products.name_variants IS
    'Alternative names / aliases used to match LLM bold-text mentions in chat enrichment';
COMMENT ON COLUMN shop_products.legacy_affiliate_id IS
    'Original id from the legacy affiliate_products table (for click backfill traceability). Will be dropped after deprecation soak.';

CREATE INDEX IF NOT EXISTS idx_shop_products_name_variants
    ON shop_products USING GIN (name_variants);

CREATE INDEX IF NOT EXISTS idx_shop_products_legacy_affiliate_id
    ON shop_products(legacy_affiliate_id)
    WHERE legacy_affiliate_id IS NOT NULL;

-- =====================================================
-- 2. Backfill: affiliate_products -> shop_products
-- =====================================================
-- Skip rows whose legacy id has already been ported (idempotency guard).
-- 'development' -> 'toys' is the only category remap needed.

INSERT INTO shop_products (
    name,
    description,
    image_url,
    price,
    category_slug,
    category_id,
    age_range_min,
    age_range_max,
    is_active,
    click_count,
    name_variants,
    legacy_affiliate_id
)
SELECT
    ap.product_name,
    ap.description,
    ap.image_url,
    ap.price,
    CASE ap.category WHEN 'development' THEN 'toys' ELSE ap.category END AS category_slug,
    (
        SELECT id FROM shop_categories
        WHERE slug = CASE ap.category WHEN 'development' THEN 'toys' ELSE ap.category END
    ) AS category_id,
    COALESCE(ap.age_range_min, 0),
    ap.age_range_max,
    COALESCE(ap.is_active, TRUE),
    COALESCE(ap.click_count, 0),
    ap.name_variants,
    ap.id
FROM affiliate_products ap
WHERE NOT EXISTS (
    SELECT 1 FROM shop_products sp WHERE sp.legacy_affiliate_id = ap.id
);

-- =====================================================
-- 3. Backfill: affiliate URLs -> shop_product_affiliates
-- =====================================================
-- Every legacy product is on Amazon (verified), but the join on
-- shop_affiliates.slug = ap.affiliate_network keeps this generic for any
-- future Walmart/Target rows.

INSERT INTO shop_product_affiliates (
    product_id,
    affiliate_id,
    affiliate_url,
    price,
    is_primary,
    is_available
)
SELECT
    sp.id,
    sa.id,
    ap.affiliate_url,
    ap.price,
    TRUE,
    TRUE
FROM shop_products sp
JOIN affiliate_products ap ON sp.legacy_affiliate_id = ap.id
JOIN shop_affiliates sa ON sa.slug = ap.affiliate_network
WHERE NOT EXISTS (
    SELECT 1 FROM shop_product_affiliates spa
    WHERE spa.product_id = sp.id AND spa.affiliate_id = sa.id
);

-- =====================================================
-- 4. Backfill: affiliate_clicks -> shop_clicks
-- =====================================================
-- shop_clicks.session_id is TEXT; affiliate_clicks.session_id is UUID
-- so we cast. Set source='chat' and section_type='chat_based' since every
-- legacy click came from the chat product card flow.
-- Dedupe via (user_id, product_id, clicked_at) so re-runs are safe.

INSERT INTO shop_clicks (
    user_id,
    product_id,
    affiliate_id,
    session_id,
    source,
    section_type,
    clicked_at
)
SELECT
    ac.user_id,
    sp.id,
    spa.affiliate_id,
    ac.session_id::TEXT,
    'chat',
    'chat_based'::recommendation_section,
    ac.clicked_at
FROM affiliate_clicks ac
JOIN shop_products sp ON sp.legacy_affiliate_id = ac.product_id
LEFT JOIN shop_product_affiliates spa
    ON spa.product_id = sp.id AND spa.is_primary = TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM shop_clicks sc
    WHERE sc.user_id IS NOT DISTINCT FROM ac.user_id
      AND sc.product_id = sp.id
      AND sc.clicked_at = ac.clicked_at
);
