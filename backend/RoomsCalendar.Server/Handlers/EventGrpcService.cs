using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Mvc;
using RoomsCalendar.Server.Protos.Event.V1;
using RoomsCalendar.Share.Domain;

namespace RoomsCalendar.Server.Handlers;

sealed class EventGrpcService(
    [FromServices] IEventsProvider eventsProvider
    )
    : EventService.EventServiceBase
{
    public override async Task<GetEventsResponse> GetEvents(GetEventsRequest request, ServerCallContext context)
    {
        var since = request.StartTime?.ToDateTimeOffset() ?? DateTimeOffset.MinValue;
        var until = request.EndTime?.ToDateTimeOffset() ?? DateTimeOffset.MaxValue;
        ThrowIfInvalidTimeRange(since, until);

        var events = await eventsProvider.GetEventsAsync(since, until, context.CancellationToken);
        GetEventsResponse response = new();
        response.Events.AddRange(events.Select(e =>
        {
            Protos.Event.V1.Event protoEvent = new()
            {
                Id = e.Id.ToString(),
                Name = e.Name,
                StartTime = e.StartsAt.ToTimestamp(),
                EndTime = e.EndsAt.ToTimestamp(),
                OccupiesPlace = e.OccupiesRoom,
            };
            if (e.PlaceIsVerified)
            {
                protoEvent.Room = new()
                {
                    Id = e.PlaceName,
                    Name = e.PlaceName,
                };
            }
            else
            {
                protoEvent.PlaceName = e.PlaceName;
            }
            return protoEvent;
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
