namespace RoomsCalendar.Share.Domain.Room;

/// <summary>
/// Represents a reserved room.
/// </summary>
public sealed record class ReservedRoom(
    VerifiedRoom Room,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt
);
