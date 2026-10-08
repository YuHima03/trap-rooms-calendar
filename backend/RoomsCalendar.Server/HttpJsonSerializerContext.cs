using System.Text.Json;
using System.Text.Json.Serialization;
using RoomsCalendar.Server.Handlers;
using RoomsCalendar.Share.Domain.Room;
using RoomsCalendar.Share.Domain.Event;

namespace RoomsCalendar.Server;

[JsonSourceGenerationOptions(JsonSerializerDefaults.Web)]
[JsonSerializable(typeof(ReservedRoom[]))]
[JsonSerializable(typeof(EventInfo[]))]
[JsonSerializable(typeof(RoomsIcalHandler.ErrorResponse))]
partial class HttpJsonSerializerContext : JsonSerializerContext;
