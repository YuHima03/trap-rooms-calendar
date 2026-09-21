"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/features/auth/auth-provider";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/settings/ical/", label: "カレンダー配信" },
  { href: "/vacancies/", label: "空き教室" },
] as const;

export function Header() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const user = useCurrentUser();
  const traqUrl = process.env.NEXT_PUBLIC_TRAQ_API_BASE_URL?.replace(/\/$/, "");

  return (
    <header className="sticky top-0 h-16 flex flex-row flex-nowrap items-center px-6 bg-default-secondary">
      <nav
        aria-label="メインナビゲーション"
        className="flex flex-row gap-x-6 grow"
      >
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={
              pathname === (href.replace(/\/$/, "") || "/") ? "page" : undefined
            }
            className="tx-button py-2 hover:opacity-80 aria-[current=page]:text-note-primary aria-[current=page]:border-b-2 aria-[current=page]:border-tx-note-primary"
          >
            <span className="flex flex-row gap-x-1 items-center">
              {label}
              {href === "/vacancies/" && (
                <span className="leading-none px-1 py-0.5 rounded-lg font-bold font-sans text-[.5rem] text-inv-primary bg-pink-600">
                  BETA
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>
      {user && (
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
      )}
    </header>
  );
}
