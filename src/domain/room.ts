export const ROOM_CODE_LENGTH = 5;
export const ROOM_PEER_PREFIX = "cagette-guessr-";
export const MIN_ROUND_DURATION_SECONDS = 10;
export const MAX_ROUND_DURATION_SECONDS = 300;
export const DEFAULT_ROUND_DURATION_SECONDS = 60;

const ROOM_CODE_PATTERN = /^[A-Z]{5}$/;

export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(value));
}

export function roomPeerId(roomCode: string): string {
  const normalizedCode = normalizeRoomCode(roomCode);

  if (!isValidRoomCode(normalizedCode)) {
    throw new Error("A room code must contain five letters");
  }

  return `${ROOM_PEER_PREFIX}${normalizedCode}`;
}

export function createRoomCode(random: () => number = Math.random): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    const letterIndex = Math.floor(random() * 26);
    return String.fromCharCode("A".charCodeAt(0) + letterIndex);
  }).join("");
}
