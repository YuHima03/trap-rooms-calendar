import type { Event } from "proto/event/v1/event_pb";
import { Fragment } from "react";
import { MaterialSymbol } from "@/shared/ui/material-symbol";
import { type RoomGroup, roomState, validPeriod } from "../lib/room-view";
import { formatPeriod } from "../lib/time";
import styles from "./room-card.module.css";

export function RoomCard({
  group,
  events,
  now,
}: {
  group: RoomGroup;
  events: readonly Event[] | undefined;
  now: number;
}) {
  const state = roomState(group.periods, events, now);
  const periods = group.periods.flatMap((entry) => {
    const period = validPeriod(entry);
    return period ? [period] : [];
  });
  const finished = periods.filter(({ end }) => end < now);
  const remaining = periods.filter(({ end }) => end >= now);
  const status = state.occupied
    ? "occupied"
    : state.available
      ? "available"
      : state.closed
        ? "closed"
        : undefined;

  return (
    <div
      data-status={status}
      className={styles.wrap}
    >
      <div className="flex flex-row flex-wrap gap-2">
        <span className="grow tx-body-strong truncate text-inherit">
          {group.room.name}
        </span>
        {state.occupied ? (
          <span className={styles.statusText_occupied}>
            <MaterialSymbol className="text-sm!" name="do_not_disturb_on" />
            占有中
          </span>
        ) : state.available ? (
          <span className={styles.statusText_available}>
            <MaterialSymbol className="text-sm!" name="check_circle" fill />
            現在利用可
          </span>
        ) : null}
      </div>
      <div className="flex flex-row flex-wrap gap-1 text-inherit">
        {finished.map((period, index) => (
          <Fragment key={`${period.start}-${period.end}`}>
            {index !== 0 && <span className="text-disabled-primary">,</span>}
            <span className="tx-body text-disabled-primary">
              {index === 0 ? "(" : ""}
              {formatPeriod(period.start, period.end)}
              {index === finished.length - 1 ? ")" : ""}
            </span>
          </Fragment>
        ))}
        {remaining.map((period, index) => (
          <Fragment key={`${period.start}-${period.end}`}>
            {(index !== 0 || finished.length !== 0) && <span>,</span>}
            <span className="tx-body">
              {formatPeriod(period.start, period.end)}
            </span>
          </Fragment>
        ))}
      </div>
      {state.closed ? (
        <span className="tx-body2 text-default-tertiary">
          本日の利用可能時間は終了しました。
        </span>
      ) : events === undefined ? (
        <span className="tx-body2 text-default-secondary">
          イベント情報未取得
        </span>
      ) : state.currentEvents.length > 0 ? (
        <div className="tx-body2 text-default-secondary flex flex-row flex-nowrap gap-x-2">
          <div className="shrink-0">開催中:</div>
          <div className="flex flex-col gap-y-1">
            {state.currentEvents.map((event) => (
              <a
                key={event.id}
                href={`https://knoq.trap.jp/events/${encodeURIComponent(event.id)}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-note-primary text-balance underline hover:no-underline"
              >
                {event.name}
                <MaterialSymbol name="open_in_new" className="text-sm!" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
