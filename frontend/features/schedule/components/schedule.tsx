"use client";

import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { useCallback } from "react";
import { RoomCard } from "@/features/rooms/components/room-card";
import { useRoomClock } from "@/features/rooms/hooks/use-room-clock";
import {
  eventsForRoom,
  groupRoomsByDate,
} from "@/features/rooms/lib/room-view";
import { dateLabel, jstDateKey, jstDayRange } from "@/features/rooms/lib/time";
import { getRpcClients } from "@/lib/rpc/clients";
import { useRpcQuery } from "@/lib/rpc/use-rpc-query";

const loadRooms = async (signal: AbortSignal) =>
  getRpcClients().rooms.getReservedRooms(
    { startTime: timestampFromDate(jstDayRange(Date.now()).start) },
    { signal },
  );

const loadEvents = async (signal: AbortSignal) =>
  getRpcClients().events.getEvents(
    { startTime: timestampFromDate(jstDayRange(Date.now()).start) },
    { signal },
  );

export function Schedule() {
  const rooms = useRpcQuery(loadRooms);
  const events = useRpcQuery(loadEvents);
  const refreshRooms = rooms.refetch;
  const refreshEvents = events.refetch;
  const refresh = useCallback(() => {
    refreshRooms();
    refreshEvents();
  }, [refreshRooms, refreshEvents]);
  const now = useRoomClock(refresh);

  if (rooms.isLoading || now === undefined) {
    return <output>読み込み中......</output>;
  }
  if (rooms.error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p>部屋情報を取得できませんでした。{rooms.error}</p>
        <button
          type="button"
          className="text-note-primary underline"
          onClick={refresh}
        >
          再試行
        </button>
      </div>
    );
  }

  const days = groupRoomsByDate(rooms.data?.reservedRooms ?? []);

  return (
    <>
      {events.error && (
        <div
          role="alert"
          className="grow flex flex-col gap-y-3 p-4 rounded-xl text-warning-primary bg-warning-primary border-1 border-default-secondary"
        >
          <p>イベント情報を取得できないため、占有状況を確認できません。</p>
          <p className="tx-body2">{events.error}</p>
          <button
            type="button"
            className="mt-2 text-note-primary underline"
            onClick={refreshEvents}
          >
            イベント情報を再取得
          </button>
        </div>
      )}
      {events.isLoading && <output>イベント情報を読み込み中...</output>}
      {days.length === 0 ? (
        <p>部屋情報がありません。</p>
      ) : (
        <>
          {!days.some(({ date }) => date === jstDateKey(now)) && (
            <div className="flex flex-col gap-y-3 md:flex-row md:flex-nowrap md:gap-x-4 md:items-center">
              <div className="tx-body-strong w-[6rem] shrink-0">
                <h3>今日</h3>
              </div>
              <p>本日は進捗部屋がありません。</p>
            </div>
          )}
          {days.map(({ date, rooms: groups }) => (
            <div
              key={date}
              className="flex flex-col gap-y-3 md:flex-row md:flex-nowrap md:gap-x-4"
            >
              <div className="tx-body-strong w-[6rem] md:pt-2 shrink-0">
                <h3>
                  <span>{dateLabel(date, now)}</span>
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3 grow">
                {groups.map((group) => (
                  <RoomCard
                    key={group.key}
                    group={group}
                    events={
                      events.data && !events.error && !events.isLoading
                        ? eventsForRoom(group, events.data.events)
                        : undefined
                    }
                    now={now}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
