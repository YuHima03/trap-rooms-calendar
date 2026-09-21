using System.Security.Claims;
using Grpc.Core;
using Microsoft.AspNetCore.Components.Authorization;
using RoomsCalendar.Server.Authentication;
using RoomsCalendar.Server.Protos.User.V1;

namespace RoomsCalendar.Server.Handlers;

sealed class UserGrpcService : UserService.UserServiceBase
{
    public override async Task<GetMeResponse> GetMe(GetMeRequest request, ServerCallContext context)
    {
        var user = context.GetHttpContext().User;
        if (user.Identity is not { IsAuthenticated: true })
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "User is not authenticated"));
        }
        var username = user.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new RpcException(new Status(StatusCode.Internal, "Authenticated user has no username"));
        }
        return new GetMeResponse
        {
            User = new()
            {
                Id = username,
                Name = username,
            }
        };
    }
}
