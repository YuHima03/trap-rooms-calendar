"use client";

import { useEffect, useRef, useState } from "react";
import { getRpcClients } from "@/shared/api/rpc/clients";
import { getRpcErrorMessage } from "@/shared/api/rpc/errors";
import { useRpcQuery } from "@/shared/api/rpc/use-rpc-query";

const loadCalendarUrl = (signal: AbortSignal) =>
  getRpcClients().calendar.getOrCreateRoomCalendarUrl({}, { signal });

export function CalendarFeedSettings() {
  const { data, error, isLoading, refetch } = useRpcQuery(loadCalendarUrl);
  const [refreshedPath, setRefreshedPath] = useState<string>();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyNotice, setCopyNotice] = useState<{
    url: string;
    message: string;
  } | null>(null);
  const refreshRequest = useRef<AbortController | null>(null);
  const path = refreshedPath ?? data?.url;
  // The path is loaded after mount, so static rendering never accesses window.
  const url = path
    ? new URL(
        path,
        process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin,
      ).href
    : undefined;

  useEffect(() => () => refreshRequest.current?.abort(), []);

  async function refreshUrl() {
    if (!path || refreshRequest.current) return;
    if (
      !window.confirm(
        "トークンを再生成すると、これまでの配信URLは使えなくなります。カレンダーアプリへの再登録が必要です。再生成しますか？",
      )
    ) {
      return;
    }

    const controller = new AbortController();
    refreshRequest.current = controller;
    setIsRefreshing(true);
    setRefreshError(null);
    setCopyNotice(null);
    try {
      const response = await getRpcClients().calendar.refreshRoomCalendarUrl(
        { oldUrl: path },
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) {
        if (!response.url) throw new Error("配信URLが取得できませんでした。");
        setRefreshedPath(response.url);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setRefreshError(getRpcErrorMessage(cause));
      }
    } finally {
      refreshRequest.current = null;
      if (!controller.signal.aborted) setIsRefreshing(false);
    }
  }

  async function copyUrl() {
    if (!url || refreshRequest.current) return;
    if (!navigator.clipboard?.writeText) {
      setCopyNotice({
        url,
        message:
          "このブラウザーではコピーできません。配信URLを選択してコピーしてください。",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyNotice({ url, message: "URLをコピーしました。" });
    } catch {
      setCopyNotice({
        url,
        message: "コピーに失敗しました。配信URLを選択してコピーしてください。",
      });
    }
  }

  return (
    <section className="flex flex-col gap-y-4">
      <h2>カレンダー配信URL</h2>
      <p>
        このURLをカレンダーアプリ等に登録すると、進捗部屋をカレンダー上で確認できるようになります。
      </p>

      {isLoading && <output>配信URLを読み込み中…</output>}
      {error && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert">{error}</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            再試行
          </button>
        </div>
      )}
      {!isLoading && !error && !url && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert">配信URLが取得できませんでした。</p>
          <button type="button" className="button-secondary" onClick={refetch}>
            再試行
          </button>
        </div>
      )}
      {url && (
        <>
          <input
            type="url"
            aria-label="配信URL"
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            className="tx-body2 px-3 py-2 border-1 border-default-secondary hover:border-default-primary focus:border-default-primary rounded-sm"
          />
          <div className="flex flex-row flex-wrap gap-4">
            <button
              type="button"
              className="button-primary"
              disabled={isRefreshing}
              onClick={copyUrl}
            >
              URLをコピー
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={isRefreshing}
              onClick={refreshUrl}
            >
              {isRefreshing ? "再生成中…" : "トークンを再生成"}
            </button>
          </div>
          {refreshError && <p role="alert">{refreshError}</p>}
          {copyNotice?.url === url && <output>{copyNotice.message}</output>}
          {refreshedPath && !refreshError && !isRefreshing && (
            <output>
              トークンを再生成しました。新しいURLを登録してください。
            </output>
          )}
        </>
      )}
    </section>
  );
}
