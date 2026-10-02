using RoomsCalendar.Share.Constants;
using RoomsCalendar.Share.Domain;
using System.Runtime.InteropServices;
using Yuh.Collections.Searching;
using ZLinq;

namespace RoomsCalendar.Server.Services
{
    sealed class RoomsAndEventsProvider : IEventsProvider, IRoomsProvider
    {
        readonly List<Event> _events = [];
        readonly List<Share.Domain.Room> _rooms = [];

        public DateTimeOffset LastUpdatedAt { get; private set; }

        public string ProviderName => RoomsProviderNames.KnoqRegistered;

        public ValueTask<Event[]> GetEventsAsync(DateTimeOffset since, DateTimeOffset until, CancellationToken ct)
        {
            lock (_events)
            {
                var events = CollectionsMarshal.AsSpan(_events);
                var idxStart = BinarySearch.LowerBound<Event, DateTimeOffset>(events, since, EventsExtensions.CompareStartsAt);
                if (idxStart == -1)
                {
                    return ValueTask.FromResult(Array.Empty<Event>());
                }
                return ValueTask.FromResult(events[idxStart..]
                    .AsValueEnumerable()
                    .Where(e => e.StartsAt <= until)
                    .Order(EventsExtensions.StartsAtComparer)
                    .ToArray());
            }
        }

        public ValueTask<Share.Domain.Room[]> GetRoomsAsync(DateTimeOffset since, DateTimeOffset until, CancellationToken ct)
        {
            lock (_rooms)
            {
                var rooms = CollectionsMarshal.AsSpan(_rooms);
                var idxStart = BinarySearch.LowerBound(rooms, since, RoomsExtensions.CompareAvailableUntil);
                if (idxStart == -1)
                {
                    return ValueTask.FromResult(Array.Empty<Share.Domain.Room>());
                }
                return ValueTask.FromResult(rooms[idxStart..]
                    .AsValueEnumerable()
                    .Where(r => r.AvailableSince <= until)
                    .Order(RoomsExtensions.AvailableSinceComparer)
                    .ToArray());
            }
        }

        public ValueTask UpdateEventsAsync(IEnumerable<Event> events, DateTimeOffset since, CancellationToken ct)
        {
            lock (_events)
            {
                var idx = BinarySearch.LowerBound<Event, DateTimeOffset>(CollectionsMarshal.AsSpan(_events), since, EventsExtensions.CompareStartsAt);
                if (idx == 0)
                {
                    _events.Clear();
                }
                else if (idx > 0)
                {
                    CollectionsMarshal.SetCount(_events, idx);
                }
                _events.AddRange(events);
                _events.Sort(EventsExtensions.StartsAtComparer);
                LastUpdatedAt = DateTimeOffset.UtcNow;
            }
            return ValueTask.CompletedTask;
        }

        public ValueTask UpdateRoomsAsync(ReadOnlySpan<Share.Domain.Room> rooms, DateTimeOffset since, CancellationToken ct)
        {
            lock (_rooms)
            {
                var idx = BinarySearch.LowerBound(CollectionsMarshal.AsSpan(_rooms), since, RoomsExtensions.CompareAvailableUntil);
                if (idx == 0)
                {
                    _rooms.Clear();
                }
                else if (idx > 0)
                {
                    CollectionsMarshal.SetCount(_rooms, idx);
                }
                _rooms.AddRange(rooms);
                _rooms.Sort(RoomsExtensions.CompareToAvailableUntil);
                LastUpdatedAt = DateTimeOffset.UtcNow;
            }
            return ValueTask.CompletedTask;
        }

        public ValueTask UpdateRoomsAsync<TRooms>(TRooms rooms, DateTimeOffset since, CancellationToken ct) where TRooms : IEnumerable<Share.Domain.Room>
        {
            lock (_rooms)
            {
                var idx = BinarySearch.LowerBound(CollectionsMarshal.AsSpan(_rooms), since, RoomsExtensions.CompareAvailableUntil);
                if (idx == 0)
                {
                    _rooms.Clear();
                }
                else if (idx > 0)
                {
                    CollectionsMarshal.SetCount(_rooms, idx);
                }
                _rooms.AddRange(rooms);
                _rooms.Sort(RoomsExtensions.CompareToAvailableUntil);
                LastUpdatedAt = DateTimeOffset.UtcNow;
            }
            return ValueTask.CompletedTask;
        }
    }

    static class EventsExtensions
    {
        public static readonly Comparer<Event> StartsAtComparer = Comparer<Event>.Create(CompareToStartsAt);

        public static int CompareStartsAt(this Event @event, DateTimeOffset other)
        {
            return @event.StartsAt.CompareTo(other);
        }

        public static int CompareToStartsAt(this Event @event, Event other)
        {
            return @event.StartsAt.CompareTo(other.StartsAt);
        }
    }

    static class RoomsExtensions
    {
        public static readonly Comparer<Share.Domain.Room> AvailableSinceComparer = Comparer<Share.Domain.Room>.Create(CompareToAvailableSince);

        public static int CompareToAvailableSince(this Share.Domain.Room room, Share.Domain.Room other)
        {
            return room.AvailableSince.CompareTo(other.AvailableSince);
        }

        public static int CompareToAvailableUntil(this Share.Domain.Room room, Share.Domain.Room other)
        {
            return room.AvailableUntil.CompareTo(other.AvailableUntil);
        }

        public static int CompareAvailableUntil(this Share.Domain.Room room, DateTimeOffset since)
        {
            return room.AvailableUntil.CompareTo(since);
        }

        public static Share.Domain.Room ToRoom(this Knoq.Models.ResponseRoom room)
        {
            return new Share.Domain.Room(
                room.Place ?? "",
                DateTimeOffset.Parse(room.TimeStart ?? ""),
                DateTimeOffset.Parse(room.TimeEnd ?? "")
            );
        }
    }
}
