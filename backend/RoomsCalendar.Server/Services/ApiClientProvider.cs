namespace RoomsCalendar.Server.Services;

sealed class ApiClientProvider<T>(ILogger<ApiClientProvider<T>> logger) where T : class
{
    /// <summary>
    /// Gets or sets the instance of <typeparamref name="T"/>. This property is nullable to indicate that the client may not be initialized yet.
    /// </summary>
    T? Client { get; set; }

    SemaphoreSlim Semaphore { get; } = new(1, 1);

    /// <summary>
    /// Gets or sets the factory method to create an instance of <typeparamref name="T"/>.
    /// </summary>
    public required Func<CancellationToken, ValueTask<T>> Factory { private get; init; }

    /// <summary>
    /// Gets or sets the function to check if an instance of <typeparamref name="T"/> is alive.
    /// </summary>
    public required Func<T, CancellationToken, ValueTask<bool>> AliveChecker { private get; init; }

    /// <summary>
    /// Gets or sets the last time a factory failure occurred and the time to wait before retrying.
    /// </summary>
    (DateTime At, TimeSpan RetryAfter) LastFactoryFailure { get; set; } = (DateTime.MinValue, TimeSpan.Zero);

    /// <summary>
    /// Attempts to get the client instance of <typeparamref name="T"/>. If the client is not initialized or is not alive, it will attempt to create a new instance using the factory method.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns>An instance of <typeparamref name="T"/>; <see langword="null"/> if the client is not available.</returns>
    public async ValueTask<T?> TryGetClientAsync(CancellationToken cancellationToken = default)
    {
        await Semaphore.WaitAsync(cancellationToken);
        try
        {
            if (Client is not null && await AliveChecker(Client, cancellationToken))
            {
                return Client;
            }
            else if (DateTime.UtcNow - LastFactoryFailure.At < LastFactoryFailure.RetryAfter)
            {
                // If the last factory failure was recent, return null to avoid retrying too soon.
                return null;
            }
            else
            {
                // Attempt to create a new client instance using the factory method.
                try
                {
                    var newClient = await Factory(cancellationToken);
                    Client = newClient;
                    LastFactoryFailure = (DateTime.MinValue, TimeSpan.Zero);
                    return newClient;
                }
                catch (Exception e)
                {
                    if (logger.IsEnabled(LogLevel.Warning))
                    {
                        logger.LogWarning(e, "Failed to create an instance of {ClientType} using the factory method.", typeof(T).Name);
                    }

                    // If the factory fails, record the failure time and set a retry delay.
                    LastFactoryFailure = (
                        At: DateTime.UtcNow,
                        RetryAfter: Clamp(
                            LastFactoryFailure.RetryAfter * 2,
                            TimeSpan.FromSeconds(30), // min: 30 seconds
                            TimeSpan.FromMinutes(5))  // max: 5 minutes
                    );
                    return null;
                }
            }
        }
        finally
        {
            _ = Semaphore.Release();
        }

        static TimeSpan Clamp(TimeSpan t, TimeSpan min, TimeSpan max)
        {
            return t < min ? min : (t > max ? max : t);
        }
    }
}

static class ApiClientProvider
{
    extension(Knoq.KnoqApiClient knoq)
    {
        public async ValueTask<bool> CheckSessionIsAliveAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var user = await knoq.Users.Me.GetAsync(null, cancellationToken);
                if (user is not null)
                {
                    return true;
                }
            }
            catch
            {
                // If an exception occurs, it indicates that the session is not alive.
            }
            return false;
        }

        public static async ValueTask<Knoq.KnoqApiClient> CreateClientAsync(
            Knoq.Extensions.Authentication.TraqAuthenticationInfo authInfo,
            Knoq.KnoqApiClientOptions knoqOptions,
            Traq.TraqApiClientOptions traqOptions,
            CancellationToken cancellationToken = default)
        {
            var accessToken = await Knoq.Extensions.Authentication.AuthenticationExtensions.GetKnoqAccessTokenAsync(
                knoqOptions.BaseAddress,
                traqOptions.BaseAddress,
                authInfo,
                cancellationToken);

            return Knoq.KnoqApiClientHelper.CreateFromOptions(new Knoq.KnoqApiClientOptions
            {
                BaseAddress = knoqOptions.BaseAddress,
                AuthMethodPreference = Knoq.KnoqAuthMethodPreference.PreferCookieAuth,
                CookieAuthToken = accessToken
            });
        }
    }
}
