import { MaterialSymbolName } from "@/shared/config/material-symbols";
import { ThemeName, themes } from "@/shared/config/themes";
import { MaterialSymbol } from "@/shared/ui/material-symbol";
import { useStoredTheme } from "@/shared/ui/theme";
import clsx from "clsx";
import styles from "./theme-switcher.module.css";

export function ThemeSwitcher() {
  const { theme, setTheme } = useStoredTheme();

  return (
    <div
      className={styles.wrap}
      role="radiogroup"
      aria-label="テーマ切り替え"
    >
      {themes.map(themeName => (
        <ThemeIconRadioButton
          key={themeName}
          theme={themeName}
          setTheme={setTheme}
          selected={theme === themeName}
        />
      ))}
    </div>
  )
}

const ThemeIconInfo = {
  light: {
    iconName: "light_mode",
    label: "ライトモード"
  },
  dark: {
    iconName: "dark_mode",
    label: "ダークモード"
  },
  system: {
    iconName: "desktop_windows",
    label: "システム設定に従う"
  }
} as const satisfies Record<ThemeName, {
  iconName: MaterialSymbolName;
  label: string
}>;

function ThemeIconRadioButton({ theme, setTheme, selected }: {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  selected?: boolean;
}) {
  const { iconName, label } = ThemeIconInfo[theme];
  return (
    <span
      className={styles.radioButton}
      role="radio"
      title={label}
      aria-checked={selected}
      tabIndex={selected ? -1 : 0}
      onClick={() => !selected && setTheme(theme)}
    >
      <MaterialSymbol className="text-lg!" name={iconName} weight={300} fill={selected} />
    </span>
  )
}
