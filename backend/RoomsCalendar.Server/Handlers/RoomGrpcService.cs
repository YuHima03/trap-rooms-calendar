using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using RoomsCalendar.Server.Protos.Room.V1;
using RoomsCalendar.Share.Constants;
using RoomsCalendar.Share.Domain;

namespace RoomsCalendar.Server.Handlers;

sealed class RoomGrpcService(
    [FromKeyedServices(RoomsProviderNames.KnoqRegistered)] IRoomsProvider roomsProvider
    )
    : RoomService.RoomServiceBase
{
    public override async Task<GetVacantRoomsResponse> GetVacantRooms(GetVacantRoomsRequest request, ServerCallContext context)
    {
        var since = request.StartTime?.ToDateTimeOffset() ?? DateTimeOffset.MinValue;
        var until = request.EndTime?.ToDateTimeOffset() ?? DateTimeOffset.MaxValue;
        ThrowIfInvalidTimeRange(since, until);

        var rooms = await roomsProvider.GetRoomsAsync(since, until, context.CancellationToken);
        GetVacantRoomsResponse response = new();
        response.VacantRooms.AddRange(rooms.Select(r => new VacantRoom
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
}
