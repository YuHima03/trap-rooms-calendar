using Knoq;
using Knoq.Extensions.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RoomsCalendar.Server.Configurations;
using RoomsCalendar.Server.Services;
using RoomsCalendar.Share.Configuration;
using RoomsCalendar.Share.Constants;
using RoomsCalendar.Share.Domain;
using Traq;

namespace RoomsCalendar.Server;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        LoadConfigurationFromEnvFiles(builder.Configuration);

        ConfigureCalendarServices(builder.Services, builder.Configuration);

        // API controllers
        _ = builder.Services.AddControllers();

        // Razor (View)
        _ = builder.Services.AddRazorComponents()
            .AddInteractiveWebAssemblyComponents();

        var app = builder.Build();
        var logger = app.Services.GetRequiredService<ILogger<Program>>();

        ConfigureEndpoints(app);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("App timezone: {TimeZone}", app.Services.GetRequiredService<TimeZoneInfo>().Id);
        }

        app.Run();
    }

    static void LoadConfigurationFromEnvFiles(ConfigurationManager config)
    {
        const string DefaultEnvFileName = ".env";

        if (File.Exists(DefaultEnvFileName))
        {
            _ = config.AddIniStream(File.OpenRead(DefaultEnvFileName));
            Console.WriteLine($"Loaded configuration from {DefaultEnvFileName}");
        }
    }

    static void ConfigureCalendarServices(IServiceCollection services, IConfiguration configuration)
#pragma warning disable IDE0058 // Computed value is never used
    {
        ConfigureTimezone(services, configuration);
        services.AddHttpClient();
        services.AddHttpContextAccessor();
        services.AddHostedService<MemoryMonitoringService>();

        //
        // Configure external service clients (knoQ, traQ)
        //
        services.Configure<KnoqClientOptions>(configuration);
        services.Configure<TraqClientOptions>(configuration);
        services.AddSingleton<IOptions<ITraqClientConfiguration>>(sp => sp.GetRequiredService<IOptions<TraqClientOptions>>());
        services.AddSingleton<IConfigureOptions<TraqApiClientOptions>>(sp =>
        {
            return new ConfigureOptions<TraqApiClientOptions>(opt =>
            {
                var baseOptions = sp.GetRequiredService<IOptions<TraqClientOptions>>().Value;
                opt.BaseAddress = baseOptions.TraqApiBaseAddress ?? string.Empty;
                opt.CookieAuthToken = baseOptions.TraqCookieAuthenticationToken;
            });
        });
        services.AddSingleton<IConfigureOptions<KnoqApiClientOptions>>(sp =>
        {
            return new ConfigureOptions<KnoqApiClientOptions>(opt =>
            {
                var baseOptions = sp.GetRequiredService<IOptions<KnoqClientOptions>>().Value;
                opt.BaseAddress = baseOptions.KnoqApiBaseAddress ?? string.Empty;
            });
        });
        services.AddSingleton(sp =>
        {
            return new ApiClientProvider<KnoqApiClient>(sp.GetRequiredService<ILogger<ApiClientProvider<KnoqApiClient>>>())
            {
                AliveChecker = (client, ct) => client.CheckSessionIsAliveAsync(ct),
                Factory = ct =>
                {
                    TraqAuthenticationInfo authInfo = new();
                    authInfo.UseCookieAuthentication(
                        sp.GetRequiredService<IOptions<TraqClientOptions>>().Value.TraqCookieAuthenticationToken ?? throw new Exception("The cookie token for traQ service is not set."));

                    return KnoqApiClient.CreateClientAsync(
                        authInfo,
                        sp.GetRequiredService<IOptions<KnoqApiClientOptions>>().Value,
                        sp.GetRequiredService<IOptions<TraqApiClientOptions>>().Value,
                        ct);
                }
            };
        });

        //
        // Configure collectors and providers for rooms and events
        //
        services
            .AddHostedService<RoomsAndEventsCollector>()
            .AddSingleton<RoomsAndEventsProvider>()
            .AddSingleton(sp => sp.GetRequiredService<RoomsAndEventsProvider>() as IEventsProvider)
            .AddKeyedSingleton<IRoomsProvider, RoomsAndEventsProvider>(RoomsProviderNames.KnoqRegistered, (sp, _) => sp.GetRequiredService<RoomsAndEventsProvider>());
        services
            .Configure<TitechRoomsCollectorConfiguration>(configuration)
            .AddSingleton<IConfigureOptions<TitechRoomsCollectorOptions>>(sp =>
            {
                var config = sp.GetRequiredService<IOptions<TitechRoomsCollectorConfiguration>>().Value;
                return new ConfigureNamedOptions<TitechRoomsCollectorOptions>(Options.DefaultName, o => config.ConfigureTitechRoomsCollectorOptions(o, sp.GetService<TimeZoneInfo>()));
            })
            .AddHostedService<TitechRoomsCollector>();
        services.Add(new ServiceDescriptor(typeof(IRoomsProvider), RoomsProviderNames.TitechReserved, new RoomsProvider(RoomsProviderNames.TitechReserved)));
        services.Add(new ServiceDescriptor(typeof(IRoomsProvider), RoomsProviderNames.TitechVacant, new RoomsProvider(RoomsProviderNames.TitechVacant)));

        services.AddSingleton<RoomsCalendarProvider>();

        //
        // Configure database context and repositories
        //
        services.Configure<NsMySqlConfiguration>(configuration);
        services.AddDbContextFactory<Infrastructure.Repository.CalendarStreamsRepository>((sp, opt) =>
        {
            opt.UseMySQL(sp.GetRequiredService<IOptions<NsMySqlConfiguration>>().Value.GetConnectionString());
        });
        services.AddScoped<Share.Domain.Repository.ICalendarStreamsRepository>(sp => sp.GetRequiredService<Infrastructure.Repository.CalendarStreamsRepository>());

        //
        // Configure authentication
        //
        services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, Authentication.NsAuthenticationHandler>(Authentication.NsAuthenticationDefaults.AuthenticationScheme, _ => { });
        services.AddSingleton<AuthenticationStateProvider, ServerAuthenticationStateProvider>()
            .AddCascadingAuthenticationState();
    }
#pragma warning restore IDE0058 // Computed value is never used

    static void ConfigureTimezone(IServiceCollection services, IConfiguration configuration)
    {
        const string TimeZoneKey = "TimeZone:Id";
        const string TimeZoneIanaKey = "TimeZone:IanaId";

        var timezone = TimeZoneInfo.Utc;
        {
            // First, try to get the timezone by the Windows style ID
            var id = configuration[TimeZoneKey];
            if (!string.IsNullOrWhiteSpace(id) && TimeZoneInfo.TryFindSystemTimeZoneById(id, out var tzi))
            {
                timezone = tzi;
            }
            else
            {
                // If that fails, try to get the timezone by the IANA style ID
                var ianaId = configuration[TimeZoneIanaKey];
                if (!string.IsNullOrWhiteSpace(ianaId) && TimeZoneInfo.TryFindSystemTimeZoneById(ianaId, out tzi))
                {
                    timezone = tzi;
                }
            }
        }

        _ = services.AddSingleton(timezone);
    }

    static void ConfigureEndpoints(WebApplication app)
#pragma warning disable IDE0058 // Computed value is never used
    {
        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseWebAssemblyDebugging();
        }
        else
        {
            app.UseExceptionHandler("/Error");
        }

        app.UseHttpsRedirection();

        app.UseAntiforgery();

        var handler = new Handlers.Handler();
        handler.MapHandlers(app);

        app.MapStaticAssets();
        app.MapRazorComponents<Client.App>()
            .AddInteractiveWebAssemblyRenderMode();
    }
#pragma warning restore IDE0058 // Computed value is never used
}
