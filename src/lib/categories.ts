export const STORE_CATEGORIES = [
  { name: "Football", slug: "football" },
  { name: "Basketball", slug: "basketball" },
  { name: "Tennis", slug: "tennis" },
  { name: "Jerseys", slug: "jerseys" },
  { name: "Gym & Fitness", slug: "gym-fitness" },
  { name: "Accessories", slug: "accessories" },
  { name: "Lifestyle", slug: "lifestyle" },
];

export function normalizeCategory(name: string): string | null {
  const match = STORE_CATEGORIES.find((category) => category.name.toLowerCase() === name.toLowerCase());
  if (match) return match.name;
  if (["fashion & lifestyle", "fashionl", "swagl", "t-shirts", "shorts", "sets", "bundles"].includes(name.toLowerCase())) return "Lifestyle";
  return null;
}
