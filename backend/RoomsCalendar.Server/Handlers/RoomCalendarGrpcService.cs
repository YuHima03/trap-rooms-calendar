using System.Diagnostics.CodeAnalysis;
using System.Security.Claims;
using Grpc.Core;
using RoomsCalendar.Server.Protos.Room.V1;
using RoomsCalendar.Share.Domain.Repository;

namespace RoomsCalendar.Server.Handlers;

sealed class RoomCalendarGrpcService(ICalendarStreamsRepository calendarStreams) : RoomCalendarService.RoomCalendarServiceBase
{
    public override async Task<GetOrCreateRoomCalendarUrlResponse> GetOrCreateRoomCalendarUrl(GetOrCreateRoomCalendarUrlRequest request, ServerCallContext context)
    {
        var username = GetUsername(context.GetHttpContext().User);
        var stream = await calendarStreams.GetOrCreateUserCalendarStreamAsync(username, context.CancellationToken);
        return new GetOrCreateRoomCalendarUrlResponse
        {
            Url = RoomsIcalHandler.GetRoomsIcalUrl(stream.Id, stream.Token)
        };
    }

    public override Task<RefreshRoomCalendarUrlResponse> RefreshRoomCalendarUrl(RefreshRoomCalendarUrlRequest request, ServerCallContext context)
    {
        return base.RefreshRoomCalendarUrl(request, context);
    }

    static string GetUsername([NotNull] ClaimsPrincipal? user)
    {
        if (user?.Identity is not { IsAuthenticated: true })
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "User is not authenticated"));
        }
        return user.FindFirstValue(ClaimTypes.Name) ?? throw new RpcException(new Status(StatusCode.Internal, "User name claim is missing"));
    }
}
