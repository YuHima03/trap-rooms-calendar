namespace RoomsCalendar.Share.Domain.Room;

public interface IRoomProvider
{
    /// <summary>
    /// Gets the timestamp of the last update from the source.
    /// </summary>
    public DateTimeOffset LastUpdatedAt { get; }

    /// <summary>
    /// Gets the source of the room provider.
    /// </summary>
    public RoomProviderSource Source { get; }

    /// <summary>
    /// Finds all reserved rooms between the given time range.
    /// </summary>
    /// <remarks>
    /// The returned list includes all rooms that are reserved for any part of the given time range, even if they are only partially reserved.
    /// </remarks>
    public ValueTask<ReservedRoom[]> FindReservedRoomsAsync(DateTimeOffset since, DateTimeOffset until, CancellationToken cancellationToken);

    /// <summary>
    /// Finds all vacant rooms between the given time range.
    /// </summary>
    /// <remarks>
    /// The returned list includes all rooms that are vacant for any part of the given time range, even if they are only partially vacant.
    /// </remarks>
    public ValueTask<VacantRoom[]> FindVacantRoomsAsync(DateTimeOffset since, DateTimeOffset until, CancellationToken cancellationToken);
}
