import * as migration_20260608_075027_web_native_collections from './20260608_075027_web_native_collections';
import * as migration_20260608_075800_fix_group_offers_enum from './20260608_075800_fix_group_offers_enum';
import * as migration_20260608_081500_rename_cms_pricing_rels from './20260608_081500_rename_cms_pricing_rels';
import * as migration_20260608_120000_drop_legacy_inventory from './20260608_120000_drop_legacy_inventory';
import * as migration_20260608_130000_drop_legacy_variants_usd_prices from './20260608_130000_drop_legacy_variants_usd_prices';
import * as migration_20260608_105220_promo_banner_storefront_link from './20260608_105220_promo_banner_storefront_link';
import * as migration_20260608_140000_product_brands from './20260608_140000_product_brands';
import * as migration_20260608_150000_product_reviews from './20260608_150000_product_reviews';

export const migrations = [
  {
    up: migration_20260608_075027_web_native_collections.up,
    down: migration_20260608_075027_web_native_collections.down,
    name: '20260608_075027_web_native_collections',
  },
  {
    up: migration_20260608_075800_fix_group_offers_enum.up,
    down: migration_20260608_075800_fix_group_offers_enum.down,
    name: '20260608_075800_fix_group_offers_enum',
  },
  {
    up: migration_20260608_081500_rename_cms_pricing_rels.up,
    down: migration_20260608_081500_rename_cms_pricing_rels.down,
    name: '20260608_081500_rename_cms_pricing_rels',
  },
  {
    up: migration_20260608_120000_drop_legacy_inventory.up,
    down: migration_20260608_120000_drop_legacy_inventory.down,
    name: '20260608_120000_drop_legacy_inventory',
  },
  {
    up: migration_20260608_130000_drop_legacy_variants_usd_prices.up,
    down: migration_20260608_130000_drop_legacy_variants_usd_prices.down,
    name: '20260608_130000_drop_legacy_variants_usd_prices',
  },
  {
    up: migration_20260608_105220_promo_banner_storefront_link.up,
    down: migration_20260608_105220_promo_banner_storefront_link.down,
    name: '20260608_105220_promo_banner_storefront_link',
  },
  {
    up: migration_20260608_140000_product_brands.up,
    down: migration_20260608_140000_product_brands.down,
    name: '20260608_140000_product_brands',
  },
  {
    up: migration_20260608_150000_product_reviews.up,
    down: migration_20260608_150000_product_reviews.down,
    name: '20260608_150000_product_reviews',
  },
];
