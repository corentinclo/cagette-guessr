import type {
  ClientMessage,
  Coordinates,
  RoomOptions,
  ServerMessage,
} from "@/domain/types";
import {
  MAX_ROUND_DURATION_SECONDS,
  MIN_ROUND_DURATION_SECONDS,
} from "@/domain/room";

export const PROTOCOL_VERSION = 1 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinates(value: unknown): value is Coordinates {
  return (
    isRecord(value) &&
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lng)
  );
}

function isRoomOptions(value: unknown): value is RoomOptions {
  return (
    isRecord(value) &&
    typeof value.rounds === "number" &&
    Number.isInteger(value.rounds) &&
    value.rounds > 0 &&
    typeof value.timePerRound === "number" &&
    Number.isInteger(value.timePerRound) &&
    value.timePerRound >= MIN_ROUND_DURATION_SECONDS &&
    value.timePerRound <= MAX_ROUND_DURATION_SECONDS
  );
}

function hasProtocolVersion(value: Record<string, unknown>): boolean {
  return value.version === PROTOCOL_VERSION;
}

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!isRecord(value) || !hasProtocolVersion(value)) return false;

  switch (value.type) {
    case "verify":
      return (
        typeof value.secret === "string" &&
        typeof value.playerName === "string" &&
        (typeof value.rejoinCode === "string" || value.rejoinCode === null) &&
        typeof value.tz === "string"
      );
    case "createPrivateGame":
    case "startGameHost":
    case "leaveGame":
      return true;
    case "joinPrivateGame":
      return typeof value.code === "string";
    case "setPrivateGameOptions":
      return isRoomOptions(value.options);
    case "place":
      return (
        typeof value.roundNumber === "number" &&
        Number.isInteger(value.roundNumber) &&
        isCoordinates(value.coordinates) &&
        typeof value.final === "boolean"
      );
    default:
      return false;
  }
}

export function isServerMessage(value: unknown): value is ServerMessage {
  if (!isRecord(value) || !hasProtocolVersion(value)) return false;

  if (value.type === "error" || value.type === "gameJoinError") {
    return typeof value.message === "string";
  }

  return (
    value.type === "game" &&
    isRecord(value.room) &&
    typeof value.myId === "string"
  );
}
