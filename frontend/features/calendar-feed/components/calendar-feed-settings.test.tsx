import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarFeedSettings } from "./calendar-feed-settings";

const calendar = vi.hoisted(() => ({
  getOrCreateRoomCalendarUrl: vi.fn(),
  refreshRoomCalendarUrl: vi.fn(),
}));

vi.mock("@/lib/rpc/clients", () => ({
  getRpcClients: () => ({ calendar }),
}));

const oldUrl = "https://rooms.example/api/rooms/ical/stream/old-token";
const newUrl = "https://rooms.example/api/rooms/ical/stream/new-token";

beforeEach(() => {
  calendar.getOrCreateRoomCalendarUrl
    .mockReset()
    .mockResolvedValue({ url: oldUrl });
  calendar.refreshRoomCalendarUrl.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("カレンダー配信URL", () => {
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
      .mockResolvedValueOnce({ url: newUrl });
    render(<CalendarFeedSettings />);
    await screen.findByDisplayValue(oldUrl);

    fireEvent.click(screen.getByRole("button", { name: "トークンを再生成" }));
    await screen.findByRole("alert");
    expect(screen.getByDisplayValue(oldUrl)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "トークンを再生成" }));
    expect(await screen.findByDisplayValue(newUrl)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "URLをコピー" }));
    await screen.findByText("URLをコピーしました。");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(newUrl);
  });
});
