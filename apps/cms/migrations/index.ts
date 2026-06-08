import * as migration_20260608_075027_web_native_collections from './20260608_075027_web_native_collections';
import * as migration_20260608_075800_fix_group_offers_enum from './20260608_075800_fix_group_offers_enum';
import * as migration_20260608_081500_rename_cms_pricing_rels from './20260608_081500_rename_cms_pricing_rels';
import * as migration_20260608_120000_drop_legacy_inventory from './20260608_120000_drop_legacy_inventory';

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
];
