/** Shared restaurant settings. Browser-only keys such as carts and visit counters are intentionally absent. */
export const SHARED_SETTING_KEYS = [
  "matamly_name",
  "matamly_open_time",
  "matamly_close_time",
  "matamly_delivery_start_time",
  "matamly_banner_name",
  "matamly_banner_slogan",
  "matamly_banner_size",
  "matamly_banner_color_1",
  "matamly_banner_color_2",
  "matamly_banner_color_3",
  "matamly_banner_bg",
  "matamly_banner_align",
  "matamly_banner_visible",
  "matamly_banner_preset",
  "matamly_logo",
  "matamly_logo_size",
  "matamly_logo_position",
  "matamly_phone1",
  "matamly_phone2",
  "matamly_theme",
  "matamly_primary_color",
  "matamly_accent_color",
  "matamly_bg_color",
  "matamly_header_color",
  "matamly_header_size",
  "matamly_footer_color",
  "matamly_footer_size",
  "matamly_footer_text",
  "matamly_footer_text_size",
  "matamly_footer_text_color",
  "matamly_footer_align",
  "matamly_footer_visible",
  "matamly_edge_color",
  "matamly_shape",
  "matamly_layout",
  "matamly_category_images",
  "matamly_home_category_limit",
  "matamly_home_category_products",
  "matamly_category_order",
  "matamly_category_card_height",
  "matamly_category_card_shape",
  "matamly_featured_visible",
  "matamly_offer_visible",
  "matamly_offer_title",
  "matamly_offer_subtitle",
  "matamly_offer_badge",
  "matamly_offer_image",
  "matamly_offer_text_color",
  "matamly_offer_bg_color",
  "matamly_hero_visible",
  "matamly_hero_title",
  "matamly_hero_subtitle",
  "matamly_hero_kicker",
  "matamly_hero_text_color",
  "matamly_hero_bg_color",
  "matamly_hero_image",
  "matamly_hero_size",
  "matamly_meta_pixel",
  "matamly_twitter_pixel",
  "matamly_tiktok_pixel",
] as const;

export type SharedSettingKey = (typeof SHARED_SETTING_KEYS)[number];

const allowed = new Set<string>(SHARED_SETTING_KEYS);

export function pickSharedSettings(input: Record<string, unknown>) {
  const settings: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key) || typeof value !== "string" || value.length > 1_500_000) continue;
    settings[key] = value;
  }
  return settings;
}
