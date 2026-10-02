using RoomsCalendar.Share.Domain;
using System.Runtime.InteropServices;
using Yuh.Collections.Searching;
using ZLinq;

namespace RoomsCalendar.Server.Services
{
    sealed class RoomsProvider(string providerName) : IRoomsProvider
    {
        readonly List<Share.Domain.Room> _rooms = [];

        public DateTimeOffset LastUpdatedAt { get; private set; }

        public string ProviderName { get; } = providerName;

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
            switch (rooms)
            {
                case Share.Domain.Room[] array:
                    return UpdateRoomsAsync(array.AsSpan(), since, ct);
                case List<Share.Domain.Room> list:
                    return UpdateRoomsAsync(CollectionsMarshal.AsSpan(list), since, ct);
                case ArraySegment<Share.Domain.Room> arraySegment:
                    return UpdateRoomsAsync(arraySegment.AsSpan(), since, ct);
            }
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
                _rooms.Sort(RoomsExtensions.CompareToAvailableUntil);
                LastUpdatedAt = DateTimeOffset.UtcNow;
            }
            return ValueTask.CompletedTask;
        }
    }
}
