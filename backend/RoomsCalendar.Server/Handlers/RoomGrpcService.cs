using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using RoomsCalendar.Server.Protos.Room.V1;
using RoomsCalendar.Share.Constants;
using RoomsCalendar.Share.Domain;

namespace RoomsCalendar.Server.Handlers;

sealed class RoomGrpcService(
    [FromKeyedServices(RoomsProviderNames.KnoqRegistered)] IRoomsProvider reservedRoomsProviderFromKnoq,
    [FromKeyedServices(RoomsProviderNames.TitechReserved)] IRoomsProvider reservedRoomsProviderFromTitech,
    [FromKeyedServices(RoomsProviderNames.TitechVacant)] IRoomsProvider vacantRoomsProvider
    )
    : RoomService.RoomServiceBase
{
    public override async Task<GetReservedRoomsResponse> GetReservedRooms(GetReservedRoomsRequest request, ServerCallContext context)
    {
        var since = request.StartTime?.ToDateTimeOffset() ?? DateTimeOffset.MinValue;
        var until = request.EndTime?.ToDateTimeOffset() ?? DateTimeOffset.MaxValue;
        ThrowIfInvalidTimeRange(since, until);

        // Get all reserved rooms from the different providers
        var rooms = await AsyncEnumerable.ToAsyncEnumerable([reservedRoomsProviderFromKnoq, reservedRoomsProviderFromTitech])
            .SelectMany<IRoomsProvider, Room>(async (p, ct) => await p.GetRoomsAsync(since, until, ct))
            .OrderBy(r => r.AvailableSince)
            .ThenBy(r => r.AvailableUntil)
            .Distinct()
            .ToListAsync(context.CancellationToken);
        GetReservedRoomsResponse response = new();
        response.ReservedRooms.AddRange(rooms.Select(r => new RoomWithPeriod
        {
            Room = new()
            {
                Id = r.PlaceName,
                Name = r.PlaceName,
            },
            StartTime = r.AvailableSince.ToTimestamp(),
            EndTime = r.AvailableUntil.ToTimestamp(),
        }));
        return response;
    }

    public override async Task<GetVacantRoomsResponse> GetVacantRooms(GetVacantRoomsRequest request, ServerCallContext context)
    {
        var since = request.StartTime?.ToDateTimeOffset() ?? DateTimeOffset.MinValue;
        var until = request.EndTime?.ToDateTimeOffset() ?? DateTimeOffset.MaxValue;
        ThrowIfInvalidTimeRange(since, until);

        var rooms = await vacantRoomsProvider.GetRoomsAsync(since, until, context.CancellationToken);
        GetVacantRoomsResponse response = new();
        response.VacantRooms.AddRange(rooms.Select(r => new RoomWithPeriod
        {
            Room = new()
            {
                Id = r.PlaceName,
                Name = r.PlaceName
            },
            StartTime = r.AvailableSince.ToTimestamp(),
            EndTime = r.AvailableUntil.ToTimestamp(),
        }));
        return response;
    }

    static void ThrowIfInvalidTimeRange(DateTimeOffset since, DateTimeOffset until)
    {
        if (since > until)
        {
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                "The 'start_time' parameter must be less than or equal to the 'end_time' parameter."
            ));
        }
    }
}
