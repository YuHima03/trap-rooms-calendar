namespace RoomsCalendar.Share.Domain.Room;

/// <summary>
/// Represents a verified room, which is valid for use in the system.
/// </summary>
/// <param name="Id"></param>
/// <param name="Name"></param>
public sealed record class VerifiedRoom(
    Guid Id,
    string Name
);
