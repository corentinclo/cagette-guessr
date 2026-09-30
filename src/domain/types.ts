export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Market extends Coordinates {
  id: string;
  name: string;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  imageUrl: string | null;
  heading: number | null;
  pitch: number | null;
}

export interface RoundResult {
  market: Market;
  guess: Coordinates;
  distanceKm: number;
  points: number;
}

export type RoomState = "waiting" | "guess" | "end";
export type PlayerStatus = "connected" | "disconnected";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  status: PlayerStatus;
  totalPoints: number;
}

export interface Guess {
  playerId: string;
  roundNumber: number;
  coordinates: Coordinates;
  final: boolean;
  submittedAt: number;
}

export interface MultiplayerGuessResult {
  playerId: string;
  distanceKm: number;
  points: number;
}

export interface MultiplayerRound {
  number: number;
  marketId: string | null;
  guesses: Guess[];
  results: MultiplayerGuessResult[];
  revealed: boolean;
}

export interface RoomOptions {
  rounds: number;
  /** Maximum placement time for each round, in seconds. */
  timePerRound: number;
}

export interface Room {
  id: string;
  code: string;
  state: RoomState;
  hostId: string;
  players: Player[];
  currentRound: number;
  rounds: MultiplayerRound[];
  options: RoomOptions;
  nextEventAt: number | null;
}

export interface VerifyMessage {
  type: "verify";
  version: 1;
  secret: string;
  playerName: string;
  rejoinCode: string | null;
  tz: string;
}

export interface CreatePrivateGameMessage {
  type: "createPrivateGame";
  version: 1;
}

export interface JoinPrivateGameMessage {
  type: "joinPrivateGame";
  version: 1;
  code: string;
}

export interface SetPrivateGameOptionsMessage {
  type: "setPrivateGameOptions";
  version: 1;
  options: RoomOptions;
}

export interface StartGameHostMessage {
  type: "startGameHost";
  version: 1;
}

export interface PlaceMessage {
  type: "place";
  version: 1;
  roundNumber: number;
  coordinates: Coordinates;
  final: boolean;
}

export interface LeaveGameMessage {
  type: "leaveGame";
  version: 1;
}

export type ClientMessage =
  | VerifyMessage
  | CreatePrivateGameMessage
  | JoinPrivateGameMessage
  | SetPrivateGameOptionsMessage
  | StartGameHostMessage
  | PlaceMessage
  | LeaveGameMessage;

export interface GameMessage {
  type: "game";
  version: 1;
  room: Room;
  myId: string;
}

export interface ErrorMessage {
  type: "error" | "gameJoinError";
  version: 1;
  message: string;
}

export type ServerMessage = GameMessage | ErrorMessage;

export type GameScreenName = "home" | "game" | "summary" | "multiplayer";

export type CoordinateTuple = [latitude: number, longitude: number];
export type CoordinateBounds = [
  southWest: CoordinateTuple,
  northEast: CoordinateTuple,
];
