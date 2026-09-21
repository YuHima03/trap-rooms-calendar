import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarFeedSettings } from "./calendar-feed-settings";

const calendar = vi.hoisted(() => ({
  getOrCreateRoomCalendarUrl: vi.fn(),
  refreshRoomCalendarUrl: vi.fn(),
}));

vi.mock("@/shared/api/rpc/clients", () => ({
  getRpcClients: () => ({ calendar }),
}));

const oldPath = "/api/rooms/ical/0123456789abcdef0123456789abcdef/old-token";
const newPath = "/api/rooms/ical/0123456789abcdef0123456789abcdef/new-token";
const oldUrl = `${window.location.origin}${oldPath}`;
const newUrl = `${window.location.origin}${newPath}`;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
  calendar.getOrCreateRoomCalendarUrl
    .mockReset()
    .mockResolvedValue({ url: oldPath });
  calendar.refreshRoomCalendarUrl.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("カレンダー配信URL", () => {
  it.each([
    "",
    "https://rooms.example:8443/",
  ])("接続先（%s）でパスを補完したURLを表示・コピーする", async (apiBaseUrl) => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", apiBaseUrl);
    const expectedUrl = apiBaseUrl
      ? `https://rooms.example:8443${oldPath}`
      : oldUrl;
    render(<CalendarFeedSettings />);
    await screen.findByDisplayValue(expectedUrl);

    fireEvent.click(screen.getByRole("button", { name: "URLをコピー" }));
    await screen.findByText("URLをコピーしました。");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
  });

  it("確認を取り消したときは再生成APIを呼ばない", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<CalendarFeedSettings />);
    await screen.findByDisplayValue(oldUrl);

    fireEvent.click(screen.getByRole("button", { name: "トークンを再生成" }));

    expect(calendar.refreshRoomCalendarUrl).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue(oldUrl)).toBeTruthy();
  });

  it("再生成失敗時は旧URLを維持し、再試行の成功時に返されたURLへ切り替える", async () => {
    calendar.refreshRoomCalendarUrl
      .mockRejectedValueOnce(new Error("再生成失敗"))
      .mockResolvedValueOnce({ url: newPath });
    render(<CalendarFeedSettings />);
    await screen.findByDisplayValue(oldUrl);

    fireEvent.click(screen.getByRole("button", { name: "トークンを再生成" }));
    await screen.findByRole("alert");
    expect(screen.getByDisplayValue(oldUrl)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "トークンを再生成" }));
    expect(await screen.findByDisplayValue(newUrl)).toBeTruthy();
    expect(calendar.refreshRoomCalendarUrl).toHaveBeenNthCalledWith(
      1,
      { oldUrl: oldPath },
      { signal: expect.any(AbortSignal) },
    );
    expect(calendar.refreshRoomCalendarUrl).toHaveBeenNthCalledWith(
      2,
      { oldUrl: oldPath },
      { signal: expect.any(AbortSignal) },
    );

    fireEvent.click(screen.getByRole("button", { name: "URLをコピー" }));
    await screen.findByText("URLをコピーしました。");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(newUrl);
  });
});
