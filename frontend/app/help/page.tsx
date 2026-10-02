'use client';

import { MaterialSymbol } from "@/shared/ui/material-symbol";
import Link from "next/link";
import { HTMLAttributes } from "react";

export default function HelpPage() {
  return (
    <>
      <div className="flex flex-col gap-y-4">
        <h2>ヘルプ</h2>
      </div>
      <div className="flex flex-col gap-y-6">
        <HelpSection title="APIについて" id="api">
          <div className="flex flex-col gap-y-2">
            <p>
              HTTP API を公開しています。
            </p>
            <p>
              進捗部屋の情報は
              <Link href="/api/rooms" target="_blank">
                <span className="font-mono">/api/rooms</span>
                <MaterialSymbol name="open_in_new" className="text-base!" />
              </Link>
              から、イベントの情報は
              <Link href="/api/events" target="_blank">
                <span className="font-mono">/api/events</span>
                <MaterialSymbol name="open_in_new" className="text-base!" />
              </Link>
              から取得することができます。
            </p>
            <p>
              それぞれ、クエリパラメータ
              <code>since</code>
              と
              <code>until</code>
              に
              ISO8601
              形式の日時を指定して絞り込むことができます。
            </p>
          </div>
        </HelpSection>
      </div>
    </>
  );
}

function HelpSection({ title, children, ...props }: HTMLAttributes<HTMLElement> & {
  title: string;
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-y-4" {...props}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
