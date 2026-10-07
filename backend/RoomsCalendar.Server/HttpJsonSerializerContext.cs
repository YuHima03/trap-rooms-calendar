using System.Text.Json;
using System.Text.Json.Serialization;
using RoomsCalendar.Server.Handlers;
using RoomsCalendar.Share.Domain;

namespace RoomsCalendar.Server;

[JsonSourceGenerationOptions(JsonSerializerDefaults.Web)]
[JsonSerializable(typeof(Room[]))]
[JsonSerializable(typeof(Event[]))]
[JsonSerializable(typeof(RoomsIcalHandler.ErrorResponse))]
partial class HttpJsonSerializerContext : JsonSerializerContext;
