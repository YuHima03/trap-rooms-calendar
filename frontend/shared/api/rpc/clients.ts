import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { EventService } from "proto/event/v1/event_pb";
import { RoomCalendarService } from "proto/room/v1/room_calendar_pb";
import { RoomService } from "proto/room/v1/room_pb";
import { UserService } from "proto/user/v1/user_pb";

function createClients() {
  const transport = createGrpcWebTransport({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin,
    defaultTimeoutMs: 15_000,
    fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
  });
  return {
    rooms: createClient(RoomService, transport),
    events: createClient(EventService, transport),
    user: createClient(UserService, transport),
    calendar: createClient(RoomCalendarService, transport),
  };
}

let clients: ReturnType<typeof createClients> | undefined;

// Called from effects and event handlers only: static builds never contact the API.
export function getRpcClients() {
  clients ??= createClients();
  return clients;
}
