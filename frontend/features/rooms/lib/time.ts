import { type Timestamp, timestampDate } from "@bufbuild/protobuf/wkt";

const JST_OFFSET = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export function timestampMillis(value: Timestamp | undefined) {
  return value ? timestampDate(value).getTime() : undefined;
}

export function jstDateKey(time: number): string {
  return new Date(time + JST_OFFSET).toISOString().slice(0, 10);
}

export function jstDayRange(time: number) {
  const start = Date.parse(`${jstDateKey(time)}T00:00:00+09:00`);
  return { start: new Date(start), end: new Date(start + DAY - 1) };
}

export function dateLabel(date: string, now: number) {
  if (date === jstDateKey(now)) return "今日";
  if (date === jstDateKey(now + DAY)) return "明日";
  const day = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00+09:00`));
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
  return `${day} (${weekday})`;
}

export function formatPeriod(start: number, end: number) {
  const clock = (time: number) =>
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(time);
  const endDate =
    end - start < DAY ? "" : `${jstDateKey(end).slice(5).replace("-", "/")} `;
  return `${clock(start)} ~ ${endDate}${clock(end)}`;
}
