namespace RoomsCalendar.Share.Domain.Room;

/// <summary>
/// Represents a vacant room.
/// </summary>
public sealed record class VacantRoom(
    VerifiedRoom Room,
    DateTimeOffset AvailableSince,
    DateTimeOffset AvailableUntil
);
