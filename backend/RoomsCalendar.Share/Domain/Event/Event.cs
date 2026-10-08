namespace RoomsCalendar.Share.Domain.Event;

using OneOf;
using RoomsCalendar.Share.Domain.Room;

/// <summary>
/// Represents an event.
/// </summary>
public sealed record class EventInfo(
    Guid Id,
    string Name,
    EventPlace Place,
    bool OccupiesRoom,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt
);

/// <summary>
/// Represents the place of an event, which can be either a reserved room or a name for the place.
/// </summary>
[GenerateOneOf]
public sealed partial class EventPlace : OneOfBase<ReservedRoom, string>;
