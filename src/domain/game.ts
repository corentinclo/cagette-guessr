import type {
  CoordinateBounds,
  CoordinateTuple,
  Coordinates,
  Market,
} from "@/domain/types";

export const CLASSIC_ROUND_COUNT = 5;
export const TUTORIAL_ROUND_COUNT = 3;
export const MAX_POINTS_PER_ROUND = 5000;
export const FRANCE_CENTER: CoordinateTuple = [46.6, 2.4];
export const FRANCE_BOUNDS: CoordinateBounds = [
  [41.1, -5.8],
  [51.4, 10],
];

const EARTH_RADIUS_KM = 6371;
export const MAX_SCORE_DISTANCE_KM = 500;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function isInMetropolitanFrance({ lat, lng }: Coordinates): boolean {
  const [
    [minimumLatitude, minimumLongitude],
    [maximumLatitude, maximumLongitude],
  ] = FRANCE_BOUNDS;

  return (
    lat >= minimumLatitude &&
    lat <= maximumLatitude &&
    lng >= minimumLongitude &&
    lng <= maximumLongitude
  );
}

export function distanceInKm(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function pointsForDistance(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  if (distanceKm >= MAX_SCORE_DISTANCE_KM) return 0;

  return Math.round(
    MAX_POINTS_PER_ROUND * (1 - distanceKm / MAX_SCORE_DISTANCE_KM)
  );
}

export function scoreForGuess(
  market: Coordinates,
  guess: Coordinates | null
): { distanceKm: number; points: number } {
  if (!guess) return { distanceKm: 0, points: 0 };

  const distanceKm = distanceInKm(market, guess);
  return { distanceKm, points: pointsForDistance(distanceKm) };
}

export function selectMarkets(
  markets: readonly Market[],
  count: number,
  random: () => number = Math.random
): Market[] {
  const shuffled = [...markets];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("fr-FR").format(points);
}

export function shortMarketName(name?: string | null): string {
  return name?.split(" — ")[0] || "Marché Cagette";
}
