import { describe, expect, it } from "vitest";
import { cmPer360, sensForCm360 } from "./convert";
import { decodeGroupCode, encodeGroupCode, mergeFriends, type Friend } from "./friends";
import { GAMES, getGame } from "./games";

function convert(from: string, sens: number, to: string, dpi = 800): number {
  const cm = cmPer360(getGame(from), sens, dpi);
  return sensForCm360(getGame(to), cm, dpi);
}

describe("conversions", () => {
  it("calculates cm/360 for CS2", () => {
    expect(cmPer360(getGame("cs2"), 1.6, 800)).toBeCloseTo(32.47, 2);
  });

  it("matches the 0.07 / 0.022 Valorant ratio", () => {
    expect(convert("cs2", 1, "valorant")).toBeCloseTo(0.3143, 4);
  });

  it("matches the 0.0066 / 0.022 Overwatch ratio", () => {
    expect(convert("overwatch2", 10, "cs2")).toBeCloseTo(3, 6);
  });

  it("converts Valorant 0.5 to Fortnite 6.3%", () => {
    expect(convert("valorant", 0.5, "fortnite")).toBeCloseTo(6.3, 1);
  });

  it("converts between games at different DPIs", () => {
    const cm = cmPer360(getGame("valorant"), 0.4, 800);
    expect(sensForCm360(getGame("cs2"), cm, 400)).toBeCloseTo(2.545, 3);
  });

  it("keeps cm/360 when DPI changes", () => {
    const cm = cmPer360(getGame("cs2"), 2, 400);
    expect(cmPer360(getGame("cs2"), sensForCm360(getGame("cs2"), cm, 800), 800)).toBeCloseTo(cm, 6);
  });

  it("gives Minecraft 0.15 degrees at 100%", () => {
    expect(getGame("minecraft").degPerCount(100)).toBeCloseTo(0.15, 6);
  });

  it.each(GAMES.map((game) => [game.name, game] as const))("round-trips %s", (_, game) => {
    expect(game.sensFor(game.degPerCount(50))).toBeCloseTo(50, 6);
  });
});

describe("group codes", () => {
  const friends: Friend[] = [
    { id: "1", name: "Adem", gameId: "valorant", sens: 0.4, dpi: 800 },
    { id: "2", name: "Zoë", gameId: "cs2", sens: 1.2, dpi: 400 },
  ];

  it("round-trips a group, including non-Latin names", () => {
    expect(decodeGroupCode(encodeGroupCode(friends))).toEqual(friends);
  });

  it("ignores spaces around a pasted code", () => {
    expect(decodeGroupCode(`  ${encodeGroupCode(friends)}\n`)).toEqual(friends);
  });

  it("rejects a broken code", () => {
    expect(decodeGroupCode("%%%")).toBeNull();
  });

  it("drops entries with unknown games", () => {
    const bad = [{ ...friends[0], gameId: "not-a-game" }, friends[1]];
    expect(decodeGroupCode(encodeGroupCode(bad))).toEqual([friends[1]]);
  });

  it("does not add a player twice when merging", () => {
    expect(mergeFriends([friends[0]], friends)).toEqual(friends);
  });
});
