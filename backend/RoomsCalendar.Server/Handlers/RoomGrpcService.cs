using System.Collections.Frozen;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using RoomsCalendar.Server.Protos.Room.V1;
using RoomsCalendar.Share.Constants;
using RoomsCalendar.Share.Domain;
using RoomsCalendar.Share.Usecase;

namespace RoomsCalendar.Server.Handlers;

sealed class RoomGrpcService(
    [FromKeyedServices(RoomsProviderNames.KnoqRegistered)] IRoomsProvider reservedRoomsProviderFromKnoq,
    [FromKeyedServices(RoomsProviderNames.TitechReserved)] IRoomsProvider reservedRoomsProviderFromTitech,
    [FromKeyedServices(RoomsProviderNames.TitechVacant)] IRoomsProvider vacantRoomsProvider
    )
    : RoomService.RoomServiceBase
{
    static readonly FrozenSet<string>.AlternateLookup<ReadOnlySpan<char>> ReservableRooms = TitechRooms.ReservableRoomNames.GetAlternateLookup<ReadOnlySpan<char>>();

    public override async Task<GetReservedRoomsResponse> GetReservedRooms(GetReservedRoomsRequest request, ServerCallContext context)
    {
        var since = request.StartTime?.ToDateTimeOffset() ?? DateTimeOffset.MinValue;
        var until = request.EndTime?.ToDateTimeOffset() ?? DateTimeOffset.MaxValue;
        ThrowIfInvalidTimeRange(since, until);

        var useOfficialDataUntil = DateTimeOffset.UtcNow.AddDays(6); // Use officially reserved rooms instead of knoQ registered rooms for the next 6 days
        // Get all reserved rooms from the different providers
        var officiallyReservedRooms = (await reservedRoomsProviderFromTitech.GetRoomsAsync(since, until, context.CancellationToken))
            .OrderBy(r => r.AvailableUntil)
            .TakeWhile(r => r.AvailableUntil <= useOfficialDataUntil);
        var knoqRegisteredRooms = (await reservedRoomsProviderFromKnoq.GetRoomsAsync(since, until, context.CancellationToken))
            .OrderBy(r => r.AvailableUntil)
            .SkipWhile(r => r.AvailableUntil <= useOfficialDataUntil);

        var rooms = Enumerable.SelectMany([officiallyReservedRooms, knoqRegisteredRooms], r => r)
            .OrderBy(r => r.AvailableSince)
            .ThenBy(r => r.AvailableUntil)
            .ToList();
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

        var rooms = (await vacantRoomsProvider.GetRoomsAsync(since, until, context.CancellationToken))
            .Select(r => (WithPeriod: r, Info: new TitechRoomInfo(r.PlaceName)))
            .Where(r => ReservableRooms.Contains(r.Info.Name))
            .OrderBy(r => r.Info, TitechRooms.DefaultBuildingComparerForReservation)
            .ThenBy(r => r.WithPeriod.AvailableSince)
            .ToList();
        GetVacantRoomsResponse response = new();
        response.VacantRooms.AddRange(rooms.Select(r => new RoomWithPeriod
        {
            Room = new()
            {
                Id = r.Info.Name.ToString(),
                Name = r.WithPeriod.PlaceName
            },
            StartTime = r.WithPeriod.AvailableSince.ToTimestamp(),
            EndTime = r.WithPeriod.AvailableUntil.ToTimestamp(),
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
