export const materialSymbolNames = [
  "check_circle",
  "do_not_disturb_on",
  "lightbulb_2",
  "open_in_new",
] as const;

export type MaterialSymbolName = (typeof materialSymbolNames)[number];

export const materialSymbolsStylesheetUrl =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0" +
  `&icon_names=${[...materialSymbolNames].sort().join(",")}&display=block`;
