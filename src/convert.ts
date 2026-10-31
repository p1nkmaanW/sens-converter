import type { Game } from "./games";

const CM_PER_INCH = 2.54;

export function cmPer360(game: Game, sens: number, dpi: number): number {
  return (360 * CM_PER_INCH) / (dpi * game.degPerCount(sens));
}

export function sensForCm360(game: Game, cm360: number, dpi: number): number {
  return game.sensFor((360 * CM_PER_INCH) / (dpi * cm360));
}

export function edpi(sens: number, dpi: number): number {
  return sens * dpi;
}

export function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
