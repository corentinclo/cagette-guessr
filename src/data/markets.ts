import rawMarkets from "../../data/cagette-markets.json";
import { isInMetropolitanFrance } from "@/domain/game";
import type { Market } from "@/domain/types";

type RawMarket = Record<string, unknown>;

function isRecord(value: unknown): value is RawMarket {
  return typeof value === "object" && value !== null;
}

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidMarketId(value: unknown): boolean {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalNumber(value: unknown): number | null {
  return isValidCoordinate(value) ? value : null;
}

function normalizeMarket(value: unknown): Market | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  const lat = value.lat;
  const lng = value.lng;

  if (
    !isValidMarketId(id) ||
    !isValidCoordinate(lat) ||
    !isValidCoordinate(lng) ||
    !isInMetropolitanFrance({ lat, lng })
  ) {
    return null;
  }

  return {
    id: String(id),
    name:
      typeof value.name === "string" && value.name.length > 0
        ? value.name
        : `Marché #${id}`,
    lat,
    lng,
    city: optionalText(value.city),
    zipCode: optionalText(value.zipCode),
    address: optionalText(value.address),
    imageUrl: optionalText(value.imageUrl),
    heading: optionalNumber(value.heading),
    pitch: optionalNumber(value.pitch),
  };
}

const rawMarketValues: unknown = rawMarkets;

export const markets: Market[] = Array.isArray(rawMarketValues)
  ? rawMarketValues.flatMap((value) => {
      const market = normalizeMarket(value);
      return market ? [market] : [];
    })
  : [];

export const cityCount = new Set(
  markets.map((market) => market.city).filter(Boolean)
).size;
