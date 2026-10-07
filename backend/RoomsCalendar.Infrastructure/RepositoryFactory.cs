using System.Runtime.CompilerServices;
using RoomsCalendar.Infrastructure.Repository;
using RoomsCalendar.Share.Domain.Repository;

namespace RoomsCalendar.Infrastructure;

public sealed class RepositoryFactory(string connectionString)
{
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public async ValueTask<TRepository> CreateRepositoryAsync<TRepository>(CancellationToken ct = default)
        where TRepository : class, IAsyncDisposable
    {
        if (typeof(TRepository) == typeof(ICalendarStreamsRepository))
        {
            return ((await CalendarStreamsRepository.CreateAsync(connectionString, ct)) as TRepository)!;
        }
        throw new NotSupportedException($"Repository type {typeof(TRepository).Name} is not supported.");
    }
}
