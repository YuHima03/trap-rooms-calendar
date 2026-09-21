"use client";

import { Code, ConnectError } from "@connectrpc/connect";
import type { User } from "proto/user/v1/user_pb";
import { createContext, type ReactNode, useContext } from "react";
import { getRpcClients } from "@/shared/api/rpc/clients";
import { useRpcQuery } from "@/shared/api/rpc/use-rpc-query";

type AuthResult =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

async function loadUser(signal: AbortSignal): Promise<AuthResult> {
  try {
    const { user } = await getRpcClients().user.getMe({}, { signal });
    if (!user) throw new Error("User missing from GetMe response");
    return { status: "authenticated", user };
  } catch (error) {
    if (ConnectError.from(error).code === Code.Unauthenticated) {
      return { status: "unauthenticated" };
    }
    throw error;
  }
}

const UserContext = createContext<User | null>(null);

export function useCurrentUser() {
  return useContext(UserContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, refetch } = useRpcQuery(loadUser);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1>進捗部屋情報</h1>
        <output className="mt-4 block">ログイン情報を確認しています…</output>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1>進捗部屋情報</h1>
        <p role="alert" className="mt-4 text-dangerous-primary">
          {error}
        </p>
        <button type="button" className="button-primary mt-4" onClick={refetch}>
          再試行
        </button>
      </main>
    );
  }
  if (data?.status !== "authenticated") {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1>進捗部屋情報</h1>
        <p className="my-4">利用するにはログインしてください。</p>
        <a className="button-primary" href="/_oauth/login?redirect=/">
          ログイン
        </a>
      </main>
    );
  }

  return <UserContext value={data.user}>{children}</UserContext>;
}
