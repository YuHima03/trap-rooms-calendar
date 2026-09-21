"use client";

import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { RoomCard } from "@/features/rooms/components/room-card";
import { useRoomClock } from "@/features/rooms/hooks/use-room-clock";
import { compareVacantRooms, groupRooms } from "@/features/rooms/lib/room-view";
import { jstDayRange } from "@/features/rooms/lib/time";
import { getRpcClients } from "@/shared/api/rpc/clients";
import { useRpcQuery } from "@/shared/api/rpc/use-rpc-query";

const loadVacancies = async (signal: AbortSignal) => {
  const { start, end } = jstDayRange(Date.now());
  return getRpcClients().rooms.getVacantRooms(
    { startTime: timestampFromDate(start), endTime: timestampFromDate(end) },
    { signal },
  );
};

export function Vacancies() {
  const { data, error, isLoading, refetch } = useRpcQuery(loadVacancies);
  const now = useRoomClock(refetch);
  if (isLoading || now === undefined) {
    return <output>空き教室を読み込み中...</output>;
  }
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p>空き教室を取得できませんでした。{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-note-primary underline"
        >
          再試行
        </button>
      </div>
    );
  }
  const rooms = groupRooms(data?.vacantRooms ?? []).sort(compareVacantRooms);

  return (
    <div className="grid md:grid-cols-2 gap-3 grow">
      {rooms.length === 0 ? (
        <p>現在利用可能な部屋はありません。</p>
      ) : (
        rooms.map((group) => (
          <RoomCard key={group.key} group={group} events={[]} now={now} />
        ))
      )}
    </div>
  );
}
