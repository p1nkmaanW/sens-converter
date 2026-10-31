// How far a value can be trusted:
// confirmed: at least two independent converters agree
// single: only one source found
// check: sources disagree or no source was found, so test it in game
export type Confidence = "confirmed" | "single" | "check";

export type Game = {
  id: string;
  name: string;
  confidence: Confidence;
  label?: string;
  note?: string;
  // Degrees turned per mouse count at a given in-game sensitivity.
  degPerCount: (sens: number) => number;
  // Inverse of degPerCount.
  sensFor: (deg: number) => number;
};

type Extra = Pick<Game, "label" | "note">;

function linear(
  id: string,
  name: string,
  yaw: number,
  confidence: Confidence,
  extra: Extra = {},
): Game {
  return {
    id,
    name,
    confidence,
    ...extra,
    degPerCount: (sens) => sens * yaw,
    sensFor: (deg) => deg / yaw,
  };
}

// Java Edition uses a cubic curve. The slider shows 100% at an options value of 0.5.
const minecraft: Game = {
  id: "minecraft",
  name: "Minecraft (Java)",
  confidence: "check",
  label: "Slider %",
  note: "Formula from memory, no source confirmed it.",
  degPerCount: (percent) => ((percent / 200) * 0.6 + 0.2) ** 3 * 8 * 0.15,
  sensFor: (deg) => ((Math.cbrt(deg / (8 * 0.15)) - 0.2) / 0.6) * 200,
};

export const GAMES: Game[] = [
  linear("cs2", "Counter-Strike 2", 0.022, "confirmed"),
  linear("csgo", "CS:GO", 0.022, "confirmed"),
  linear("apex", "Apex Legends", 0.022, "confirmed"),
  linear("tf2", "Team Fortress 2", 0.022, "confirmed"),
  linear("valorant", "Valorant", 0.07, "confirmed"),
  linear("overwatch2", "Overwatch 2", 0.0066, "confirmed"),
  linear("mw3", "CoD: Modern Warfare III", 0.0066, "confirmed"),
  linear("warzone", "CoD: Warzone", 0.0066, "confirmed"),
  linear("bo6", "CoD: Black Ops 6", 0.0066, "confirmed"),
  linear("destiny2", "Destiny 2", 0.0066, "confirmed"),
  linear("fortnite", "Fortnite", 0.005555, "confirmed", {
    label: "X/Y %",
    note: "Enter the percentage shown in game.",
  }),
  linear("tarkov", "Escape from Tarkov", 0.125, "confirmed", {
    note: "Gear and weapon ergonomics also change turn speed.",
  }),
  linear("siege", "Rainbow Six Siege", 0.00572957795, "single", {
    note: "Assumes the default sensitivity multiplier of 0.02.",
  }),
  linear("the-finals", "The Finals", 0.0066, "single"),
  linear("cs16", "Counter-Strike 1.6", 0.022, "single"),
  linear("css", "Counter-Strike: Source", 0.022, "single"),
  linear("hl2", "Half-Life 2", 0.022, "single"),
  linear("l4d2", "Left 4 Dead 2", 0.022, "single"),
  linear("portal2", "Portal 2", 0.022, "single"),
  linear("gmod", "Garry's Mod", 0.022, "single"),
  linear("titanfall2", "Titanfall 2", 0.022, "single"),
  linear("quake-champions", "Quake Champions", 0.022, "single"),
  linear("quake-live", "Quake Live", 0.022, "single"),
  linear("doom-eternal", "Doom Eternal", 0.022, "single"),
  linear("kovaaks", "KovaaK's", 0.022, "single"),
  linear("marvel-rivals", "Marvel Rivals", 0.0219999, "check", {
    note: "Sources disagree: 0.022 or 0.0066.",
  }),
  linear("deadlock", "Deadlock", 0.022, "check", {
    note: "Sources disagree: 0.022 or 0.044.",
  }),
  linear("rust", "Rust", 0.1125, "check", {
    note: "Sources disagree: 0.1125, 0.1 or 0.00222.",
  }),
  linear("bfv", "Battlefield V", 0.0055555, "check", {
    note: "Sources disagree: 0.0056 or 0.022.",
  }),
  linear("bf2042", "Battlefield 2042", 0.0055555, "check", {
    note: "Sources disagree: 0.0056, 0.0066 or 0.022.",
  }),
  linear("halo-infinite", "Halo Infinite", 0.0225, "check", {
    note: "Sources disagree: 0.0225 or 0.022.",
  }),
  minecraft,
];

export const GAMES_BY_ID = new Map(GAMES.map((game) => [game.id, game]));

export function getGame(id: string): Game {
  return GAMES_BY_ID.get(id) ?? GAMES[0];
}
