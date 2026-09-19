"use client";

import { useEffect, useState } from "react";
import { jstDateKey } from "../lib/time";

export function useRoomClock(onDateChange: () => void) {
  const [now, setNow] = useState<number>();
  useEffect(() => {
    let date = jstDateKey(Date.now());
    const tick = () => {
      const time = Date.now();
      const nextDate = jstDateKey(time);
      setNow(time);
      if (date !== nextDate) {
        date = nextDate;
        onDateChange();
      }
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [onDateChange]);
  return now;
}
