import type { ProductVariantRecord } from "@/lib/commerce-types";

export type ProductPurchaseMode = "single" | "size" | "option" | "colour";

type VariantLike = Pick<ProductVariantRecord, "size" | "colour" | "option_values">;

const NON_SIZE_VALUES = new Set(["", "one size", "one-size", "onesize", "os", "default"]);

export function isSelectableSize(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return Boolean(normalized) && !NON_SIZE_VALUES.has(normalized) && !/^\d+\s*(pc|pcs|piece|pieces|pack)$/.test(normalized);
}

export function getNamedOption(variant: VariantLike) {
  const option = variant.option_values?.option;
  return typeof option === "string" && option.trim() ? option.trim() : null;
}

export function getProductPurchaseMode(variants: VariantLike[]): ProductPurchaseMode {
  if (variants.length <= 1) return "single";
  if (variants.some((variant) => getNamedOption(variant))) return "option";

  const sizes = new Set(
    variants
      .map((variant) => variant.size?.trim())
      .filter((size): size is string => isSelectableSize(size)),
  );
  if (sizes.size > 1) return "size";

  const colours = new Set(
    variants
      .map((variant) => variant.colour?.trim())
      .filter((colour): colour is string => typeof colour === "string" && Boolean(colour) && colour.toLowerCase() !== "default"),
  );
  return colours.size > 1 ? "colour" : "single";
}

export function getVariantChoiceLabel(variant: VariantLike, mode: ProductPurchaseMode) {
  if (mode === "option") return getNamedOption(variant) ?? "Option";
  if (mode === "size") return variant.size?.trim() || "Size";
  if (mode === "colour") return variant.colour?.trim() || "Colour";
  return "Item";
}
