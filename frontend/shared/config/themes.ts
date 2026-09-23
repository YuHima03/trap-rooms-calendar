export const themes = ["system", "light", "dark"] as const;

export type ThemeName = (typeof themes)[number];
export type DeterminedThemeName = Exclude<ThemeName, "system">;

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && themes.includes(value as ThemeName);
}
