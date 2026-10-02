import type { Event } from "proto/event/v1/event_pb";
import type { RoomWithPeriod, VerifiedRoom } from "proto/room/v1/room_pb";
import { jstDateKey, timestampMillis } from "./time";

export type RoomGroup = {
  key: string;
  room: VerifiedRoom;
  periods: RoomWithPeriod[];
};

export function validPeriod(period: {
  startTime?: RoomWithPeriod["startTime"];
  endTime?: RoomWithPeriod["endTime"];
}) {
  const start = timestampMillis(period.startTime);
  const end = timestampMillis(period.endTime);
  return start !== undefined && end !== undefined && start < end
    ? { start, end }
    : undefined;
}

export function groupRoomsByDate(rooms: readonly RoomWithPeriod[]) {
  const dates = new Map<string, Map<string, RoomGroup>>();
  for (const entry of rooms) {
    const period = validPeriod(entry);
    if (!entry.room || !period) continue;
    const date = jstDateKey(period.start);
    const key = entry.room.id || entry.room.name;
    let groups = dates.get(date);
    if (!groups) {
      groups = new Map();
      dates.set(date, groups);
    }
    const group = groups.get(key);
    if (group) group.periods.push(entry);
    else groups.set(key, { key, room: entry.room, periods: [entry] });
  }
  return [...dates.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groups]) => ({
      date,
      rooms: [...groups.values()].map((group) => ({
        ...group,
        periods: group.periods.sort(
          (a, b) =>
            (timestampMillis(a.startTime) ?? 0) -
            (timestampMillis(b.startTime) ?? 0),
        ),
      })),
    }));
}

export function groupRooms(rooms: readonly RoomWithPeriod[]) {
  const groups = new Map<string, RoomGroup>();
  for (const { rooms: dateRooms } of groupRoomsByDate(rooms)) {
    for (const group of dateRooms) {
      const existing = groups.get(group.key);
      if (existing) existing.periods.push(...group.periods);
      else groups.set(group.key, group);
    }
  }
  return [...groups.values()];
}

export function eventsForRoom(group: RoomGroup, events: readonly Event[]) {
  return events
    .filter((event) => {
      const period = validPeriod(event);
      if (!period) return false;
      const sameRoom =
        event.place.case === "room"
          ? group.room.id && event.place.value.id
            ? group.room.id === event.place.value.id
            : group.room.name.toLowerCase() ===
              event.place.value.name.toLowerCase()
          : event.place.case === "placeName" &&
            group.room.name.toLowerCase() === event.place.value.toLowerCase();
      return (
        sameRoom &&
        group.periods.some((entry) => {
          const available = validPeriod(entry);
          return (
            available &&
            period.start < available.end &&
            available.start < period.end
          );
        })
      );
    })
    .sort(
      (a, b) =>
        (timestampMillis(a.startTime) ?? 0) -
        (timestampMillis(b.startTime) ?? 0),
    );
}

export function roomState(
  periods: readonly RoomWithPeriod[],
  events: readonly Event[] | undefined,
  now: number,
) {
  const times = periods.flatMap((entry) => {
    const period = validPeriod(entry);
    return period ? [period] : [];
  });
  const available = times.some(({ start, end }) => start <= now && now <= end);
  const currentEvents = (events ?? []).filter((event) => {
    const period = validPeriod(event);
    return period && period.start <= now && now <= period.end;
  });
  return {
    closed: times.length > 0 && times.every(({ end }) => end < now),
    available: available && events !== undefined,
    occupied: currentEvents.length === 1 && currentEvents[0].occupiesPlace,
    currentEvents,
  };
}

// Preserve the old vacancy view's building preference without copying the
// university's reservable-room master data into the browser.
export function compareVacantRooms(a: RoomGroup, b: RoomGroup) {
  const priority = (name: string) => {
    const building = /\b([A-Z]+\d*)-/i.exec(name)?.[1].toUpperCase() ?? "";
    if (building.startsWith("M")) return 0;
    if (building.startsWith("S")) return 1;
    if (building === "W5") return 2;
    if (/^W\d/.test(building)) return 3;
    if (building === "WL2") return 4;
    if (building === "WL1") return 5;
    if (building.startsWith("I")) return 6;
    return 7;
  };
  return (
    priority(a.room.name) - priority(b.room.name) ||
    a.room.name.localeCompare(b.room.name, "ja", { sensitivity: "base" })
  );
}
