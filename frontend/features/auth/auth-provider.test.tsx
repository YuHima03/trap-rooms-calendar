import { Code, ConnectError } from "@connectrpc/connect";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useCurrentUser } from "./auth-provider";

const getMe = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api/rpc/clients", () => ({
  getRpcClients: () => ({ user: { getMe } }),
}));

function PrivateContent() {
  const user = useCurrentUser();
  return <p>ログイン中: {user?.name}</p>;
}

beforeEach(() => {
  getMe.mockReset();
});

describe("認証", () => {
  it("未認証時は非公開画面を表示せずログインへ案内する", async () => {
    getMe.mockRejectedValue(
      new ConnectError("login required", Code.Unauthenticated),
    );
    render(
      <AuthProvider>
        <PrivateContent />
      </AuthProvider>,
    );
    expect(
      await screen.findByRole("link", { name: "ログイン" }),
    ).toHaveAttribute("href", "/_oauth/login?redirect=/");
    expect(screen.queryByText(/ログイン中/)).not.toBeInTheDocument();
  });

  it("API未実装時にも再試行でき、成功後に画面へ進める", async () => {
    getMe
      .mockRejectedValueOnce(
        new ConnectError("not implemented", Code.Unimplemented),
      )
      .mockResolvedValueOnce({ user: { id: "1", name: "testuser" } });
    render(
      <AuthProvider>
        <PrivateContent />
      </AuthProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "現在利用できません",
    );
    expect(
      screen.queryByRole("link", { name: "ログイン" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(await screen.findByText("ログイン中: testuser")).toBeInTheDocument();
  });
});
