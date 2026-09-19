import type { Metadata } from "next";
import { CalendarFeedSettings } from "@/features/calendar-feed/components/calendar-feed-settings";

export const metadata: Metadata = {
  title: "カレンダー配信URL",
};

export default function IcalSettingsPage() {
  return <CalendarFeedSettings />;
}
