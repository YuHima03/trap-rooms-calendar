export const materialSymbolNames = [
  "calendar_today",
  "check_circle",
  "dark_mode",
  "desktop_windows",
  "do_not_disturb_on",
  "help",
  "home",
  "lightbulb_2",
  "light_mode",
  "open_in_new",
  "search",
] as const;

export type MaterialSymbolName = (typeof materialSymbolNames)[number];

export const materialSymbolsStylesheetUrl =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,100..700,0..1,-25..200" +
  `&icon_names=${[...materialSymbolNames].sort().join(",")}&display=block`;
