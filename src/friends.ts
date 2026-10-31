import { GAMES_BY_ID } from "./games";

export type Friend = {
  id: string;
  name: string;
  gameId: string;
  sens: number;
  dpi: number;
};

const STORAGE_KEY = "sens-converter.friends";
const MAX_SHARED_FRIENDS = 50;

function isFriend(value: unknown): value is Friend {
  if (typeof value !== "object" || value === null) return false;
  const friend = value as Record<string, unknown>;
  return (
    typeof friend.id === "string" &&
    typeof friend.name === "string" &&
    typeof friend.gameId === "string" &&
    GAMES_BY_ID.has(friend.gameId) &&
    typeof friend.sens === "number" &&
    friend.sens > 0 &&
    typeof friend.dpi === "number" &&
    friend.dpi > 0
  );
}

function parseFriends(text: string): Friend[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isFriend).slice(0, MAX_SHARED_FRIENDS);
}

export function loadFriends(): Friend[] {
  try {
    return parseFriends(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
  } catch {
    // Storage can be blocked. The list still works until the page closes.
  }
}

export function encodeGroupCode(friends: Friend[]): string {
  return btoa(encodeURIComponent(JSON.stringify(friends)));
}

export function decodeGroupCode(code: string): Friend[] | null {
  try {
    return parseFriends(decodeURIComponent(atob(code.trim())));
  } catch {
    return null;
  }
}

export function mergeFriends(current: Friend[], incoming: Friend[]): Friend[] {
  const known = new Set(current.map((friend) => friend.id));
  return [...current, ...incoming.filter((friend) => !known.has(friend.id))];
}
