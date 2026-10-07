using System.Data;
using Dapper;
using MySqlConnector;
using RoomsCalendar.Share.Domain;
using RoomsCalendar.Share.Domain.Repository;

namespace RoomsCalendar.Infrastructure.Repository;

sealed class CalendarStreamsRepository(MySqlConnection connection) : ICalendarStreamsRepository
{
    const string TableName = "calendar_streams";

    public static async ValueTask<CalendarStreamsRepository> CreateAsync(string connectionString, CancellationToken ct = default)
    {
        var conn = new MySqlConnection(connectionString);
        await conn.OpenAsync(ct);
        return new CalendarStreamsRepository(conn);
    }

    public void Dispose()
    {
        connection?.Dispose();
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        if (connection is not null)
        {
            await connection.DisposeAsync();
        }
        GC.SuppressFinalize(this);
    }

    ~CalendarStreamsRepository()
    {
        Dispose();
    }

    async ValueTask<CalendarStream?> ICalendarStreamsRepository.TryGetCalendarStreamAsync(Guid streamId, CancellationToken ct)
    {
        return await TryGetCalendarStreamAsync(streamId, null, ct);
    }

    async ValueTask<CalendarStream?> TryGetCalendarStreamAsync(Guid streamId, IDbTransaction? transaction, CancellationToken ct)
    {
        return (await connection.QuerySingleOrDefaultAsync<CalendarStreamDto>(
            $"""
                SELECT
                    id, username, token, created_at, updated_at
                FROM {TableName}
                WHERE id = @streamId
                """,
            new { streamId },
            transaction
        ))?.ToDomain();
    }

    async ValueTask<CalendarStream> ICalendarStreamsRepository.GetOrCreateUserCalendarStreamAsync(string username, CancellationToken ct)
    {
        await using var tx = await connection.BeginTransactionAsync(ct);
        var cs = await connection.QuerySingleOrDefaultAsync<CalendarStreamDto>(
            $"""
                SELECT
                    id, username, token, created_at, updated_at
                FROM {TableName}
                WHERE username = @username
                """,
            new { username },
            tx
        );
        if (cs is not null)
        {
            return cs.ToDomain();
        }
        CalendarStreamDto newStreamInfo = new()
        {
            Id = Guid.CreateVersion7(),
            Username = username,
            Token = GenerateToken(),
        };
        await connection.ExecuteAsync(
            $"""
                INSERT INTO {TableName} (id, username, token)
                VALUES (@Id, @Username, @Token)
                """,
            newStreamInfo,
            tx
        );
        await tx.CommitAsync(ct);
        return newStreamInfo.ToDomain();
    }

    async ValueTask<CalendarStream?> ICalendarStreamsRepository.TryRefreshCalendarStreamTokenAsync(Guid streamId, CancellationToken ct)
    {
        await using var tx = await connection.BeginTransactionAsync(ct);
        var cs = await TryGetCalendarStreamAsync(streamId, tx, ct);
        if (cs is null)
        {
            return null;
        }
        var newStreamInfo = cs with { Token = GenerateToken() };
        await connection.ExecuteAsync(
            $"""
                UPDATE {TableName}
                SET token = @Token
                WHERE id = @id
                """,
            new { newStreamInfo.Token, newStreamInfo.Id },
            tx
        );
        await tx.CommitAsync(ct);
        return newStreamInfo;
    }

    const string TokenChars = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    const int TokenLength = 16;

    static string GenerateToken()
    {
        Span<char> token = stackalloc char[TokenLength];
        Random.Shared.GetItems(TokenChars.AsSpan(), token);
        return token.ToString();
    }
}

