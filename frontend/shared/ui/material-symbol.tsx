import { type MaterialSymbolName } from "@/shared/config/material-symbols";
import { usePreferredTheme } from "./theme";
import clsx from "clsx";

interface MaterialSymbolFontVariationSettings {
  /** `0` for outlined, `1` for filled */
  FILL: 0 | 1;
  /** weight of the font, `100` to `700` */
  wght: number;
  /** slant of the font, `-25` to `200`:  */
  GRAD: number;
  /** optical size, `20` to `48` */
  opsz: number;
}

export const MaterialSymbolGrades = {
  LowEmphasis: -25,
  Normal: 0,
  HighEmphasis: 200,
} as const;

export const MaterialSymbolSizes = {
  Small: 20,
  Medium: 24,
  Large: 48,
} as const;

const DefaultFontVariationSettings = {
  FILL: 0,
  wght: 400,
  GRAD: 0,
  opsz: 24,
} as const satisfies MaterialSymbolFontVariationSettings;

export function MaterialSymbol({
  name,
  fill = false,
  weight = DefaultFontVariationSettings.wght,
  grade = "Auto",
  className,
}: {
  name: MaterialSymbolName;
  fill?: boolean;
  weight?: number;
  grade?: keyof typeof MaterialSymbolGrades | "Auto";
  className?: string;
}) {
  const fontVariationSettings: MaterialSymbolFontVariationSettings = {
    FILL: fill ? 1 : 0,
    GRAD:  MaterialSymbolGrades[grade == "Auto" ? getPreferredGrade() : grade],
    wght: Math.max(100, Math.min(700, weight)), // clamp weight to 100-700 range
    opsz: DefaultFontVariationSettings.opsz,
  }

  return (
    <span
      className={clsx(
        "material-symbols-rounded select-none",
        className,
      )}
      aria-hidden="true"
      style={{
        fontVariationSettings: getFontVariationSettingsValue(fontVariationSettings)
      }}
    >
      {name}
    </span>
  );
}

/**
 * Returns the preferred grade based on the current theme.
 */
function getPreferredGrade() {
  const theme = usePreferredTheme();
  if (theme === "dark") {
    return "LowEmphasis";
  } else {
    return "Normal";
  }
}

function getFontVariationSettingsValue(
  settings: MaterialSymbolFontVariationSettings
): string {
  return Object.entries(settings)
    .map(([key, value]) => `"${key}" ${value}`)
    .join(", ");
}
