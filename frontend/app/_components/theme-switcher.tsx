import { useId } from "react";
import type { MaterialSymbolName } from "@/shared/config/material-symbols";
import { type ThemeName, themes } from "@/shared/config/themes";
import { MaterialSymbol } from "@/shared/ui/material-symbol";
import { useStoredTheme } from "@/shared/ui/theme";
import styles from "./theme-switcher.module.css";

export function ThemeSwitcher() {
  const { theme, setTheme } = useStoredTheme();
  const groupName = useId();

  return (
    <div className={styles.wrap} role="radiogroup" aria-label="テーマ切り替え">
      {themes.map((themeName) => (
        <ThemeIconRadioButton
          key={themeName}
          name={groupName}
          theme={themeName}
          setTheme={setTheme}
          selected={theme === themeName}
        />
      ))}
    </div>
  );
}

const ThemeIconInfo = {
  light: {
    iconName: "light_mode",
    label: "ライトモード",
  },
  dark: {
    iconName: "dark_mode",
    label: "ダークモード",
  },
  system: {
    iconName: "desktop_windows",
    label: "システム設定に従う",
  },
} as const satisfies Record<
  ThemeName,
  {
    iconName: MaterialSymbolName;
    label: string;
  }
>;

function ThemeIconRadioButton({
  name,
  theme,
  setTheme,
  selected,
}: {
  name: string;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  selected?: boolean;
}) {
  const { iconName, label } = ThemeIconInfo[theme];
  return (
    <label className={styles.radioButton} title={label}>
      <input
        className={styles.radioInput}
        type="radio"
        name={name}
        value={theme}
        aria-label={label}
        checked={selected}
        onChange={() => setTheme(theme)}
      />
      <MaterialSymbol
        className="text-lg!"
        name={iconName}
        weight={300}
        fill={selected}
      />
    </label>
  );
}
