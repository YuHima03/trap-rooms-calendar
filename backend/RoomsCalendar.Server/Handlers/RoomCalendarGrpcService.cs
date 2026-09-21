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

    public override async Task<RefreshRoomCalendarUrlResponse> RefreshRoomCalendarUrl(RefreshRoomCalendarUrlRequest request, ServerCallContext context)
    {
        if (!RoomsIcalHandler.TryParseRoomsIcalUrl(request.OldUrl, out var oldUrlData))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid old URL format"));
        }
        var username = GetUsername(context.GetHttpContext().User);
        var oldStream = await calendarStreams.TryGetCalendarStreamAsync(oldUrlData.Id, context.CancellationToken);
        if (oldStream is null || oldStream.Token != oldUrlData.Token || oldStream.Username != username)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Calendar stream not found")); // do not imply that the URL is invalid, just that it doesn't belong to the user
        }
        var newStream = await calendarStreams.TryRefreshCalendarStreamTokenAsync(oldUrlData.Id, context.CancellationToken);
        if (newStream is null)
        {
            throw new RpcException(new Status(StatusCode.Internal, "Failed to refresh calendar stream token"));
        }
        return new RefreshRoomCalendarUrlResponse
        {
            Url = RoomsIcalHandler.GetRoomsIcalUrl(newStream.Id, newStream.Token)
        };
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
