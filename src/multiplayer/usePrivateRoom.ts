"use client";

import { useCallback, useRef, useState } from "react";
import type { DataConnection, Peer } from "peerjs";
import { markets } from "@/data/markets";
import { isClientMessage, isServerMessage } from "@/domain/protocol";
import {
  createRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  roomPeerId,
} from "@/domain/room";
import type {
  ClientMessage,
  GameMessage,
  Player,
  Room,
  RoomOptions,
  ServerMessage,
} from "@/domain/types";
import { scoreForGuess, selectMarkets } from "@/domain/game";

const MAX_PLAYERS = 8;

export type RoomConnectionState = "idle" | "connecting" | "connected" | "error";

export interface PrivateRoomState {
  connectionState: RoomConnectionState;
  error: string | null;
  isHost: boolean;
  myId: string | null;
  room: Room | null;
  roomCode: string | null;
}

export interface PrivateRoomActions {
  createRoom: (playerName: string) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  setOptions: (options: RoomOptions) => void;
  startGame: () => void;
  nextRound: () => void;
  placeGuess: (
    coordinates: { lat: number; lng: number },
    final: boolean
  ) => void;
}

export type UsePrivateRoomResult = PrivateRoomState & PrivateRoomActions;

function createPlayer(id: string, name: string, isHost: boolean): Player {
  return {
    id,
    name: name.trim() || (isHost ? "Hôte" : "Joueur"),
    isHost,
    status: "connected",
    totalPoints: 0,
  };
}

function createRoomState(code: string, host: Player): Room {
  return {
    id: crypto.randomUUID(),
    code,
    state: "waiting",
    hostId: host.id,
    players: [host],
    currentRound: 0,
    rounds: [],
    options: { rounds: 5, timePerRound: 30 },
    nextEventAt: null,
  };
}

function verifyMessage(playerName: string, rejoinCode: string): ClientMessage {
  return {
    type: "verify",
    version: 1,
    secret: "not_logged_in",
    playerName: playerName.trim() || "Joueur",
    rejoinCode,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function getGuestId(): string {
  const storageKey = "cagette-guessr-player-id";
  const existingId = localStorage.getItem(storageKey);
  if (existingId) return existingId;

  const playerId = crypto.randomUUID();
  localStorage.setItem(storageKey, playerId);
  return playerId;
}

function send(connection: DataConnection, message: ServerMessage): void {
  if (connection.open) connection.send(message);
}

export function usePrivateRoom(): UsePrivateRoomResult {
  const [state, setState] = useState<PrivateRoomState>({
    connectionState: "idle",
    error: null,
    isHost: false,
    myId: null,
    room: null,
    roomCode: null,
  });
  const peerRef = useRef<Peer | null>(null);
  const guestConnectionRef = useRef<DataConnection | null>(null);
  const roomRef = useRef<Room | null>(null);
  const connectionsRef = useRef(new Map<string, DataConnection>());
  const marketIdsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateRoom = useCallback((nextRoom: Room): void => {
    roomRef.current = nextRoom;
    setState((current) => ({ ...current, room: nextRoom }));
  }, []);

  const broadcastRoom = useCallback((room: Room): void => {
    const message: GameMessage = {
      type: "game",
      version: 1,
      room,
      myId: room.hostId,
    };

    for (const connection of connectionsRef.current.values()) {
      send(connection, message);
    }
  }, []);

  const leaveRoom = useCallback((): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    for (const connection of connectionsRef.current.values()) {
      connection.close();
    }
    connectionsRef.current.clear();
    guestConnectionRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    roomRef.current = null;
    setState({
      connectionState: "idle",
      error: null,
      isHost: false,
      myId: null,
      room: null,
      roomCode: null,
    });
  }, []);

  const finishRound = useCallback((): void => {
    const room = roomRef.current;
    if (!room || room.state !== "guess") return;

    const currentRound = room.rounds[room.currentRound - 1];
    const marketId =
      currentRound?.marketId ??
      marketIdsRef.current[room.currentRound - 1] ??
      null;
    const market = markets.find((candidate) => candidate.id === marketId);
    if (!currentRound || !market) return;

    const results = room.players.map((player) => {
      const guess = currentRound.guesses.find(
        (item) => item.playerId === player.id
      );
      const score = scoreForGuess(
        { lat: market.lat, lng: market.lng },
        guess?.coordinates ?? null
      );
      return { playerId: player.id, ...score };
    });

    const nextRoom: Room = {
      ...room,
      state: "end",
      nextEventAt: null,
      players: room.players.map((player) => {
        const result = results.find((item) => item.playerId === player.id);
        return result
          ? { ...player, totalPoints: player.totalPoints + result.points }
          : player;
      }),
      rounds: room.rounds.map((round) =>
        round.number === currentRound.number
          ? { ...round, marketId, results, revealed: true }
          : round
      ),
    };
    updateRoom(nextRoom);
    broadcastRoom(nextRoom);
  }, [broadcastRoom, updateRoom]);

  const beginGuess = useCallback((): void => {
    const room = roomRef.current;
    if (!room || room.state !== "getready") return;

    const nextRoom: Room = {
      ...room,
      state: "guess",
      nextEventAt: Date.now() + room.options.timePerRound * 1000,
    };
    updateRoom(nextRoom);
    broadcastRoom(nextRoom);
    timerRef.current = setTimeout(
      finishRound,
      room.options.timePerRound * 1000
    );
  }, [broadcastRoom, finishRound, updateRoom]);

  const nextRound = useCallback((): void => {
    const room = roomRef.current;
    if (!room || !state.isHost || room.state !== "end") return;
    if (room.currentRound >= room.options.rounds) return;

    const nextRoom: Room = {
      ...room,
      state: "getready",
      currentRound: room.currentRound + 1,
      nextEventAt: Date.now() + 5000,
      rounds: [
        ...room.rounds,
        {
          number: room.currentRound + 1,
          marketId: marketIdsRef.current[room.currentRound] ?? null,
          guesses: [],
          results: [],
          revealed: false,
        },
      ],
    };
    updateRoom(nextRoom);
    broadcastRoom(nextRoom);
    timerRef.current = setTimeout(beginGuess, 5000);
  }, [beginGuess, broadcastRoom, state.isHost, updateRoom]);

  const startGame = useCallback((): void => {
    const room = roomRef.current;
    if (!room || !state.isHost || room.state !== "waiting") return;

    const selectedMarkets = selectMarkets(markets, room.options.rounds);
    marketIdsRef.current = selectedMarkets.map((market) => market.id);
    const firstRound = {
      number: 1,
      marketId: selectedMarkets[0]?.id ?? null,
      guesses: [],
      results: [],
      revealed: false,
    };
    const nextRoom: Room = {
      ...room,
      state: "getready",
      currentRound: 1,
      nextEventAt: Date.now() + 5000,
      rounds: [firstRound],
    };
    updateRoom(nextRoom);
    broadcastRoom(nextRoom);
    timerRef.current = setTimeout(beginGuess, 5000);
  }, [beginGuess, broadcastRoom, state.isHost, updateRoom]);

  const placeGuess = useCallback(
    (coordinates: { lat: number; lng: number }, final: boolean): void => {
      const room = roomRef.current;
      if (!room || room.state !== "guess") return;

      if (!state.isHost) {
        const connection = guestConnectionRef.current;
        if (connection?.open) {
          connection.send({
            type: "place",
            version: 1,
            roundNumber: room.currentRound,
            coordinates,
            final,
          });
        }
        return;
      }

      const currentRound = room.rounds[room.currentRound - 1];
      if (!currentRound) return;
      const playerId = room.hostId;
      const guess = {
        playerId,
        roundNumber: room.currentRound,
        coordinates,
        final,
        submittedAt: Date.now(),
      };
      const nextRoom = {
        ...room,
        rounds: room.rounds.map((round) =>
          round.number === currentRound.number
            ? {
                ...round,
                guesses: [
                  ...round.guesses.filter((item) => item.playerId !== playerId),
                  guess,
                ],
              }
            : round
        ),
      };
      updateRoom(nextRoom);
      broadcastRoom(nextRoom);
    },
    [broadcastRoom, state.isHost, updateRoom]
  );

  const createRoom = useCallback(
    async (playerName: string): Promise<void> => {
      leaveRoom();
      setState((current) => ({
        ...current,
        connectionState: "connecting",
        error: null,
        isHost: true,
      }));

      const { default: PeerConstructor } = await import("peerjs");
      let peer: Peer | null = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = createRoomCode();
        peer = new PeerConstructor(roomPeerId(code));

        const opened = await new Promise<boolean>((resolve) => {
          peer?.once("open", () => resolve(true));
          peer?.once("error", (error) => {
            if (error.type === "unavailable-id") resolve(false);
            else resolve(false);
          });
        });

        if (opened) {
          const host = createPlayer(crypto.randomUUID(), playerName, true);
          const room = createRoomState(code, host);
          peerRef.current = peer;
          updateRoom(room);
          setState((current) => ({
            ...current,
            connectionState: "connected",
            myId: host.id,
            roomCode: code,
          }));

          peer.on("connection", (connection) => {
            connection.on("data", (value) => {
              if (!isClientMessage(value)) return;
              const currentRoom = roomRef.current;
              if (!currentRoom) return;

              if (value.type === "place") {
                if (
                  currentRoom.state !== "guess" ||
                  value.roundNumber !== currentRoom.currentRound
                ) {
                  return;
                }
                const currentRound =
                  currentRoom.rounds[currentRoom.currentRound - 1];
                if (!currentRound) return;
                const guess = {
                  playerId: connection.peer,
                  roundNumber: value.roundNumber,
                  coordinates: value.coordinates,
                  final: value.final,
                  submittedAt: Date.now(),
                };
                const nextRoom = {
                  ...currentRoom,
                  rounds: currentRoom.rounds.map((round) =>
                    round.number === currentRound.number
                      ? {
                          ...round,
                          guesses: [
                            ...round.guesses.filter(
                              (item) => item.playerId !== connection.peer
                            ),
                            guess,
                          ],
                        }
                      : round
                  ),
                };
                updateRoom(nextRoom);
                broadcastRoom(nextRoom);
                return;
              }

              if (value.type !== "verify") return;
              const rejoiningPlayer = value.rejoinCode
                ? currentRoom.players.find(
                    (player) =>
                      player.id === value.rejoinCode &&
                      player.status === "disconnected"
                  )
                : undefined;
              if (rejoiningPlayer) {
                connectionsRef.current.set(rejoiningPlayer.id, connection);
                const reconnectedRoom = {
                  ...currentRoom,
                  players: currentRoom.players.map((player) =>
                    player.id === rejoiningPlayer.id
                      ? {
                          ...player,
                          status: "connected" as const,
                          name: value.playerName,
                        }
                      : player
                  ),
                };
                updateRoom(reconnectedRoom);
                broadcastRoom(reconnectedRoom);
                send(connection, {
                  type: "game",
                  version: 1,
                  room: reconnectedRoom,
                  myId: rejoiningPlayer.id,
                });
                connection.on("close", () => {
                  const latestRoom = roomRef.current;
                  if (!latestRoom) return;
                  const disconnectedRoom = {
                    ...latestRoom,
                    players: latestRoom.players.map((player) =>
                      player.id === rejoiningPlayer.id
                        ? { ...player, status: "disconnected" as const }
                        : player
                    ),
                  };
                  connectionsRef.current.delete(rejoiningPlayer.id);
                  updateRoom(disconnectedRoom);
                  broadcastRoom(disconnectedRoom);
                });
                return;
              }
              if (currentRoom.players.length >= MAX_PLAYERS) {
                send(connection, {
                  type: "gameJoinError",
                  version: 1,
                  message: "Cette salle est pleine.",
                });
                connection.close();
                return;
              }

              const player = createPlayer(
                connection.peer,
                value.playerName,
                false
              );
              connectionsRef.current.set(player.id, connection);
              const nextRoom = {
                ...currentRoom,
                players: [...currentRoom.players, player],
              };
              updateRoom(nextRoom);
              broadcastRoom(nextRoom);
              connection.on("close", () => {
                const latestRoom = roomRef.current;
                if (!latestRoom) return;
                const disconnectedRoom = {
                  ...latestRoom,
                  players: latestRoom.players.map((currentPlayer) =>
                    currentPlayer.id === player.id
                      ? { ...currentPlayer, status: "disconnected" as const }
                      : currentPlayer
                  ),
                };
                connectionsRef.current.delete(player.id);
                updateRoom(disconnectedRoom);
                broadcastRoom(disconnectedRoom);
              });
              send(connection, {
                type: "game",
                version: 1,
                room: nextRoom,
                myId: player.id,
              });
            });
          });
          return;
        }

        peer.destroy();
        peer = null;
      }

      setState((current) => ({
        ...current,
        connectionState: "error",
        error: "Impossible de créer une salle pour le moment.",
      }));
    },
    [broadcastRoom, leaveRoom, updateRoom]
  );

  const joinRoom = useCallback(
    async (roomCode: string, playerName: string): Promise<void> => {
      const normalizedCode = normalizeRoomCode(roomCode);
      if (!isValidRoomCode(normalizedCode)) {
        setState((current) => ({
          ...current,
          connectionState: "error",
          error: "Le code doit contenir cinq lettres.",
        }));
        return;
      }

      leaveRoom();
      setState((current) => ({
        ...current,
        connectionState: "connecting",
        error: null,
        isHost: false,
        roomCode: normalizedCode,
      }));
      const { default: PeerConstructor } = await import("peerjs");
      const peer = new PeerConstructor();
      peerRef.current = peer;
      const guestId = getGuestId();

      peer.on("open", () => {
        const connection = peer.connect(roomPeerId(normalizedCode));
        guestConnectionRef.current = connection;
        connection.on("open", () => {
          connection.send(verifyMessage(playerName, guestId));
          setState((current) => ({ ...current, connectionState: "connected" }));
        });
        connection.on("data", (value) => {
          if (!isServerMessage(value)) return;
          if (value.type === "game") {
            updateRoom(value.room);
            setState((current) => ({
              ...current,
              connectionState: "connected",
              myId: value.myId,
            }));
          } else {
            setState((current) => ({ ...current, error: value.message }));
          }
        });
        connection.on("close", () => {
          setState((current) => ({
            ...current,
            connectionState: "error",
            error: "La connexion avec l’hôte est fermée.",
          }));
        });
        connection.on("error", () => {
          setState((current) => ({
            ...current,
            connectionState: "error",
            error: "Impossible de rejoindre cette salle.",
          }));
        });
      });
      peer.on("error", () => {
        setState((current) => ({
          ...current,
          connectionState: "error",
          error: "Impossible de joindre cette salle.",
        }));
      });
    },
    [leaveRoom, updateRoom]
  );

  const setOptions = useCallback(
    (options: RoomOptions): void => {
      const room = roomRef.current;
      if (!room || !state.isHost || room.state !== "waiting") return;
      const nextRoom = { ...room, options };
      updateRoom(nextRoom);
      broadcastRoom(nextRoom);
    },
    [broadcastRoom, state.isHost, updateRoom]
  );

  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    setOptions,
    startGame,
    nextRound,
    placeGuess,
  };
}
