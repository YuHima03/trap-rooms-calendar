# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
EXPOSE 8080
USER root
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
RUN apk add --upgrade --no-cache icu-data-full icu-libs tzdata

# Frontend build (pnpm + Next.js static export)
FROM node:26-slim AS frontend
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@12.4.2
WORKDIR /src
COPY frontend/ frontend/
COPY proto/ proto/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    pnpm install --frozen-lockfile
# Exported static files will be placed in `/src/frontend/out` directory.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=bind,source=buf.yaml,target=buf.yaml \
    --mount=type=bind,source=buf.gen.yaml,target=buf.gen.yaml \
    pnpm --filter frontend build

# Backend build (ASP.NET)
FROM mcr.microsoft.com/dotnet/sdk:10.0-azurelinux3.0 AS backend
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
RUN --mount=type=cache,target=/root/.nuget/packages \
    --mount=type=bind,source=backend/RoomsCalendar.Server/RoomsCalendar.Server.csproj,target=backend/RoomsCalendar.Server/RoomsCalendar.Server.csproj \
    --mount=type=bind,source=backend/RoomsCalendar.Share/RoomsCalendar.Share.csproj,target=backend/RoomsCalendar.Share/RoomsCalendar.Share.csproj \
    --mount=type=bind,source=backend/RoomsCalendar.Infrastructure/RoomsCalendar.Infrastructure.csproj,target=backend/RoomsCalendar.Infrastructure/RoomsCalendar.Infrastructure.csproj \
    --mount=type=bind,source=frontend/RoomsCalendar.Client.esproj,target=frontend/RoomsCalendar.Client.esproj \
    dotnet restore backend/RoomsCalendar.Server
COPY backend/ backend/
# Exported binary files will be placed in `/publish` directory.
RUN --mount=type=cache,target=/root/.nuget/packages \
    --mount=type=bind,source=frontend/RoomsCalendar.Client.esproj,target=frontend/RoomsCalendar.Client.esproj \
    --mount=type=bind,source=proto,target=proto \
    dotnet publish backend/RoomsCalendar.Server --no-restore -c ${BUILD_CONFIGURATION} -o /publish

FROM runtime AS final
WORKDIR /app
COPY --from=backend /publish/ .
COPY --from=frontend /src/frontend/out/ wwwroot/
ENTRYPOINT ["dotnet", "RoomsCalendar.Server.dll"]
