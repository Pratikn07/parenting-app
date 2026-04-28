-- =====================================================
-- DROP LEGACY AFFILIATE TABLES
-- =====================================================
--
-- Removes the deprecated affiliate_* surface area after the consolidation
-- onto shop_products / shop_clicks (migrations 20260427210000_consolidate_*
-- and 20260427210001_track_legacy_*) had ~9h of soak with no regressions.
--
-- Pre-drop verification (2026-04-28):
--   - affiliate_products: 10 rows, last write 2025-12-16 (pre-consolidation)
--   - affiliate_clicks:    4 rows, last write 2025-12-16 (pre-consolidation)
--   - all rows backfilled into shop_products / shop_clicks
--   - no code path writes to these tables (AffiliateService deleted, chat
--     Edge Function rewired to enrichWithShopProducts)
--
-- shop_products.legacy_affiliate_id was only meaningful while
-- affiliate_products existed (it was the join key for the click backfill).
-- Dropping the table makes the column a dangling UUID, so it goes too.
--
-- product_mentions_log is intentionally kept: still actively written by the
-- chat Edge Function and provides analytics signal we want to preserve.

DROP INDEX IF EXISTS idx_shop_products_legacy_affiliate_id;

ALTER TABLE shop_products DROP COLUMN IF EXISTS legacy_affiliate_id;

DROP TABLE IF EXISTS affiliate_clicks;
DROP TABLE IF EXISTS affiliate_products;

-- Orphaned RPC from the deleted AffiliateService.trackClick path. Lives in
-- the live DB but never had a CREATE FUNCTION migration in this repo.
DROP FUNCTION IF EXISTS increment_affiliate_click(uuid);
