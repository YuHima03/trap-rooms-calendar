namespace RoomsCalendar.Share.Domain.Event;

public interface IEventProvider
{
    /// <summary>
    /// Gets the timestamp of the last update from the source.
    /// </summary>
    public DateTimeOffset LastUpdatedAt { get; }

    /// <summary>
    /// Gets the source of the event provider.
    /// </summary>
    public EventProviderSource Source { get; }

    /// <summary>
    /// Finds all events between the given time range.
    /// </summary>
    /// <remarks>
    /// The returned list includes all events that occur for any part of the given time range, even if they are only partially within the range.
    /// </remarks>
    public ValueTask<EventInfo[]> FindEventsAsync(DateTimeOffset since, DateTimeOffset until, CancellationToken cancellationToken);
}

public enum EventProviderSource
{
    KnoqService
}

