import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { EventSchema } from "proto/event/v1/event_pb";
import {
  RoomWithPeriodSchema,
  VerifiedRoomSchema,
} from "proto/room/v1/room_pb";
import { describe, expect, it } from "vitest";
import {
  compareVacantRooms,
  eventsForRoom,
  groupRoomsByDate,
  roomState,
} from "./room-view";
import { dateLabel, formatPeriod, jstDateKey, jstDayRange } from "./time";

const timestamp = (value: string) => timestampFromDate(new Date(value));
const room = create(VerifiedRoomSchema, { id: "room-1", name: "M-101" });
const period = (start: string, end: string) =>
  create(RoomWithPeriodSchema, {
    room,
    startTime: timestamp(`2026-09-19T${start}:00+09:00`),
    endTime: timestamp(`2026-09-19T${end}:00+09:00`),
  });

describe("日本時間の部屋表示", () => {
  it("UTC の前日15時を日本時間の当日開始として問い合わせる", () => {
    const now = Date.parse("2026-09-18T15:00:00Z");
    const range = jstDayRange(now);
    expect(jstDateKey(now)).toBe("2026-09-19");
    expect(range.start.toISOString()).toBe("2026-09-18T15:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-19T14:59:59.999Z");
    expect(dateLabel("2026-09-19", now)).toBe("今日");
    expect(dateLabel("2026-09-20", now)).toBe("明日");
  });

  it("旧画面同様に24時間未満は時刻のみ、24時間以上は終了日も表示する", () => {
    expect(
      formatPeriod(
        Date.parse("2026-09-19T23:00:00+09:00"),
        Date.parse("2026-09-20T01:00:00+09:00"),
      ),
    ).toBe("23:00 ~ 01:00");
    expect(
      formatPeriod(
        Date.parse("2026-09-19T09:00:00+09:00"),
        Date.parse("2026-09-20T10:00:00+09:00"),
      ),
    ).toBe("09:00 ~ 09/20 10:00");
  });

  it("同室の複数期間を日本時間の日付ごとにまとめ時刻順に並べる", () => {
    const later = period("13:00", "17:00");
    const earlier = period("09:00", "12:00");
    const groups = groupRoomsByDate([later, earlier]);
    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe("2026-09-19");
    expect(groups[0].rooms[0].periods).toEqual([earlier, later]);
  });

  it("時刻や部屋が欠けたレスポンスを利用可能扱いにしない", () => {
    expect(groupRoomsByDate([create(RoomWithPeriodSchema, { room })])).toEqual(
      [],
    );
    expect(roomState([], [], Date.now()).available).toBe(false);
  });
});

describe("利用可能時間とイベントの突合", () => {
  const available = [period("09:00", "12:00"), period("13:00", "17:00")];
  const meeting = create(EventSchema, {
    id: "meeting",
    place: { case: "room", value: room },
    startTime: timestamp("2026-09-19T10:00:00+09:00"),
    endTime: timestamp("2026-09-19T11:00:00+09:00"),
    occupiesPlace: true,
  });

  it("部屋IDを優先し、名前指定にも対応し、期間外のイベントは表示しない", () => {
    const group = groupRoomsByDate(available)[0].rooms[0];
    const named = create(EventSchema, {
      ...meeting,
      id: "named",
      place: { case: "placeName", value: "m-101" },
    });
    const otherRoom = create(EventSchema, {
      ...meeting,
      id: "other",
      place: {
        case: "room",
        value: create(VerifiedRoomSchema, { id: "room-2", name: room.name }),
      },
    });
    const outside = create(EventSchema, {
      ...meeting,
      id: "outside",
      startTime: timestamp("2026-09-19T12:00:00+09:00"),
      endTime: timestamp("2026-09-19T13:00:00+09:00"),
    });
    expect(eventsForRoom(group, [meeting, named, otherRoom, outside])).toEqual([
      meeting,
      named,
    ]);
  });

  it("旧画面同様に開催中イベントが1件で占有する場合だけ占有中にする", () => {
    const gathering = create(EventSchema, {
      ...meeting,
      id: "gathering",
      occupiesPlace: false,
    });
    const now = Date.parse("2026-09-19T10:30:00+09:00");
    expect(roomState(available, [meeting], now).occupied).toBe(true);
    expect(roomState(available, [gathering, meeting], now).occupied).toBe(
      false,
    );
    expect(roomState(available, [gathering], now).occupied).toBe(false);
    expect(roomState(available, [gathering], now).available).toBe(true);
  });

  it("イベント取得失敗時に現在利用可を表示しない", () => {
    const now = Date.parse("2026-09-19T10:30:00+09:00");
    expect(roomState(available, undefined, now).available).toBe(false);
    expect(roomState(available, [], now).available).toBe(true);
  });

  it("昼休みの空白は利用不可、終了時刻を過ぎたら終了済みになる", () => {
    const gap = roomState(
      available,
      [],
      Date.parse("2026-09-19T12:00:01+09:00"),
    );
    expect(gap.available).toBe(false);
    expect(gap.closed).toBe(false);
    const boundary = roomState(
      available,
      [],
      Date.parse("2026-09-19T17:00:00+09:00"),
    );
    expect(boundary.available).toBe(true);
    const ended = roomState(
      available,
      [],
      Date.parse("2026-09-19T17:00:01+09:00"),
    );
    expect(ended.available).toBe(false);
    expect(ended.closed).toBe(true);
  });

  it("空き教室は旧画面と同じ建物優先順で表示する", () => {
    const groups = [
      "I1-101",
      "WL1-101",
      "WL2-101",
      "W9-101",
      "W5-101",
      "S1-101",
      "M-101",
    ].map((name) => ({
      key: name,
      room: create(VerifiedRoomSchema, { id: name, name }),
      periods: [],
    }));
    expect(
      groups.sort(compareVacantRooms).map((group) => group.room.name),
    ).toEqual([
      "M-101",
      "S1-101",
      "W5-101",
      "W9-101",
      "WL2-101",
      "WL1-101",
      "I1-101",
    ]);
  });
});
