"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { MaterialSymbolName } from "@/shared/config/material-symbols";
import { Route } from "next";
import { MaterialSymbolSizes, MaterialSymbol } from "@/shared/ui/material-symbol";
import { getPreferredTheme, usePreferredTheme, useStoredTheme } from "@/shared/ui/theme";
import { isThemeName, ThemeName, themes } from "@/shared/config/themes";
import clsx from "clsx";

const links = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/settings/ical", label: "カレンダー配信", icon: "calendar_today" },
  { href: "/vacancies", label: "空き教室", icon: "search", beta: true },
] as {
  href: Route;
  label: string;
  icon: MaterialSymbolName;
  beta?: boolean
}[];

export function Header() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const user = useCurrentUser();
  const traqUrl = process.env.NEXT_PUBLIC_TRAQ_API_BASE_URL?.replace(/\/$/, "");

  return (
    <header className="sticky top-0 h-16 flex flex-row gap-x-4 flex-nowrap items-center px-6 bg-default-secondary">
      <nav
        aria-label="メインナビゲーション"
        className="flex flex-row gap-x-6 grow"
      >
        {links.map(linkInfo => {
          const isCurrentPage = pathname === (linkInfo.href.replace(/\/$/, "") || "/");
          return <NavLink key={linkInfo.href} {...linkInfo} isCurrentPage={isCurrentPage} />;
        })}
      </nav>
      <ThemeSwitcher />
      {user && <UserIcon user={user} traqUrl={traqUrl} />}
    </header>
  );
}

function NavLink({ href, label, icon, beta, isCurrentPage }: (typeof links)[number] & {
  isCurrentPage: boolean;
}) {
  return (
    <Link
      key={href}
      href={href}
      aria-current={isCurrentPage ? "page" : undefined}
      className="tx-button py-2 hover:opacity-80 aria-[current=page]:text-note-primary aria-[current=page]:border-b-2 aria-[current=page]:border-tx-note-primary"
      aria-label={`${label} に移動する`}
    >
      <span className="sm:hidden">
        <MaterialSymbol className="text-2xl!" name={icon} fill={isCurrentPage} />
      </span>
      <span className="hidden sm:flex flex-row gap-x-1 items-center">
        {label}
        {beta && (
          <span className="leading-none px-1 py-0.5 rounded-lg font-bold font-sans text-[.5rem] text-inv-primary bg-pink-600">
            BETA
          </span>
        )}
      </span>
    </Link>
  );
}

function UserIcon({ user, traqUrl }: {
  user: { name: string; };
  traqUrl?: string;
}) {
  return (
    <span
      className="w-fit h-fit rounded-full overflow-hidden"
      title={user.name}
    >
      {traqUrl && (
        <Image
          src={`${traqUrl}/public/icon/${encodeURIComponent(user.name)}`}
          alt={`Icon of ${user.name}`}
          width={36}
          height={36}
          unoptimized
          className="rounded-full"
        />
      )}
      {!traqUrl && <span className="tx-body2">{user.name}</span>}
    </span>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useStoredTheme();

  const ThemeIconRadioButton = ({ theme, selected }: { theme: ThemeName; selected?: boolean; }) => {
    const iconName = ({
      light: "light_mode",
      dark: "dark_mode",
      system: "desktop_windows"
    } as const satisfies Record<ThemeName, MaterialSymbolName>)[theme];

    const label = ({
      light: "ライトモード",
      dark: "ダークモード",
      system: "システム設定に従う"
    } as const satisfies Record<ThemeName, string>)[theme];

    return (
      <span
        className={clsx(
          "w-6 h-6 flex items-center justify-center select-none rounded-full",
          !selected && "hover:cursor-pointer hover:border border-transparent hover:border-tx-default-tertiary transition ease-out",
          selected && "text-inv-primary bg-inv-primary"
        )}
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

  return (
    <div 
      className="flex flex-row gap-x-0.5 p-1 rounded-full border border-default-secondary"
      role="radiogroup"
      aria-label="テーマ切り替え"
    >
      {themes.map(themeName => (
        <ThemeIconRadioButton key={themeName} theme={themeName} selected={theme === themeName} />
      ))}
    </div>
  )
}
