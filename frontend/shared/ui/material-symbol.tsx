import { type MaterialSymbolName } from "@/shared/config/material-symbols";

interface MaterialSymbolFontVariationSettings {
  FILL: 0 | 1;
  wght: number;
  GRAD: number;
  opsz: number;
}

const defaultFontVariationSettings = {
  FILL: 0,
  wght: 400,
  GRAD: 0,
  opsz: 24,
} as const satisfies MaterialSymbolFontVariationSettings;

export function MaterialSymbol({
  name,
  className,
  fill
}: {
  name: MaterialSymbolName;
  className?: string;
  fill?: boolean;
}) {
  const fontVariationSettings = {
    ...defaultFontVariationSettings,
    FILL: fill ? 1 : 0,
  } as const satisfies MaterialSymbolFontVariationSettings;

  return (
    <span
      className={
        className
          ? `material-symbols-rounded ${className}`
          : "material-symbols-rounded"
      }
      aria-hidden="true"
      style={{
        fontVariationSettings: getFontVariationSettingsValue(fontVariationSettings)
      }}
    >
      {name}
    </span>
  );
}

function getFontVariationSettingsValue(
  settings: MaterialSymbolFontVariationSettings
): string {
  return Object.entries(settings)
    .map(([key, value]) => `"${key}" ${value}`)
    .join(", ");
}
