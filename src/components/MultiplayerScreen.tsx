"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import MultiplayerRoundView from "@/components/MultiplayerRoundView";
import { markets } from "@/data/markets";
import { usePrivateRoom } from "@/multiplayer/usePrivateRoom";

interface MultiplayerScreenProps {
  onQuit: () => void;
}

function connectionLabel(state: string): string {
  if (state === "connecting") return "Connexion en cours…";
  if (state === "connected") return "Connecté";
  if (state === "error") return "Connexion interrompue";
  return "Prêt à créer ou rejoindre une salle";
}

export default function MultiplayerScreen({ onQuit }: MultiplayerScreenProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const autoJoinStarted = useRef(false);
  const {
    connectionState,
    createRoom,
    error,
    isHost,
    joinRoom,
    leaveRoom,
    myId,
    room,
    roomCode,
    nextRound,
    placeGuess,
    startGame,
  } = usePrivateRoom();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search)
      .get("room")
      ?.trim();
    if (!code) return;

    setRoomCodeInput(code);
    if (autoJoinStarted.current) return;
    autoJoinStarted.current = true;
    void joinRoom(code, playerName);
  }, [joinRoom, playerName]);

  function handleCreate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void createRoom(playerName);
  }

  function handleJoin(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void joinRoom(roomCodeInput, playerName);
  }

  async function copyInvite(): Promise<void> {
    if (!roomCode) return;
    const url = new URL(window.location.href);
    url.search = `?room=${roomCode}`;
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  }

  function exitRoom(): void {
    leaveRoom();
    onQuit();
  }

  const activeRound = room?.rounds[room.currentRound - 1];
  const activeMarket = activeRound?.marketId
    ? markets.find((market) => market.id === activeRound.marketId)
    : undefined;

  if (room && room.state !== "waiting" && activeMarket) {
    return (
      <MultiplayerRoundView
        room={room}
        market={activeMarket}
        myId={myId ?? ""}
        onGuess={placeGuess}
        onQuit={exitRoom}
      />
    );
  }

  return (
    <main className="multiplayer">
      <section className="multiplayer__panel">
        <button className="game__quit" type="button" onClick={exitRoom}>
          ← Retour
        </button>
        <p className="eyebrow">partie privée</p>
        <h1>Jouez avec vos proches.</h1>
        <p className="multiplayer__lede">
          Une salle reste active tant que son hôte garde cette page ouverte.
        </p>

        {!room ? (
          <div className="multiplayer__forms">
            <label>
              Votre prénom
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                maxLength={24}
                placeholder="Camille"
              />
            </label>
            <form onSubmit={handleCreate}>
              <button
                className="button button--primary"
                type="submit"
                disabled={connectionState === "connecting"}
              >
                Créer une salle
              </button>
            </form>
            <div className="multiplayer__separator">ou</div>
            <form className="multiplayer__join" onSubmit={handleJoin}>
              <label>
                Code de salle
                <input
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(event.target.value)}
                  maxLength={5}
                  placeholder="KQZPT"
                  autoCapitalize="characters"
                />
              </label>
              <button
                className="button button--secondary"
                type="submit"
                disabled={connectionState === "connecting"}
              >
                Rejoindre
              </button>
            </form>
          </div>
        ) : (
          <div className="multiplayer__room">
            <div className="multiplayer__room-heading">
              <div>
                <span className="eyebrow">code de salle</span>
                <strong>{room.code}</strong>
              </div>
              {isHost && (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void copyInvite()}
                >
                  {copied ? "Lien copié" : "Copier le lien"}
                </button>
              )}
            </div>
            <p className="multiplayer__status">
              {connectionLabel(connectionState)} · étape « {room.state} »
            </p>
            <h2>Joueurs · {room.players.length}</h2>
            <ul className="multiplayer__players">
              {room.players.map((player) => (
                <li key={player.id}>
                  <span className={`player-dot player-dot--${player.status}`} />
                  <strong>{player.name}</strong>
                  {player.isHost && <small>hôte</small>}
                </li>
              ))}
            </ul>
            {room.state === "end" && (
              <div className="multiplayer__results">
                <h2>Résultats de la manche</h2>
                {room.rounds[room.currentRound - 1]?.results.map((result) => {
                  const player = room.players.find(
                    (item) => item.id === result.playerId
                  );
                  return (
                    <p key={result.playerId}>
                      <strong>{player?.name ?? "Joueur"}</strong>
                      <span>
                        {result.points.toLocaleString("fr-FR")} points
                      </span>
                    </p>
                  );
                })}
              </div>
            )}
            {isHost && room.state === "waiting" ? (
              <button
                className="button button--primary"
                type="button"
                onClick={startGame}
              >
                Lancer la première manche
              </button>
            ) : isHost &&
              room.state === "end" &&
              room.currentRound < room.options.rounds ? (
              <button
                className="button button--primary"
                type="button"
                onClick={nextRound}
              >
                Manche suivante
              </button>
            ) : (
              <p className="multiplayer__waiting">
                {room.state === "end"
                  ? "La partie est terminée."
                  : room.state === "waiting"
                    ? "En attente du lancement par l’hôte."
                    : "La manche avance automatiquement côté hôte."}
              </p>
            )}
            <button
              className="button button--secondary"
              type="button"
              onClick={exitRoom}
            >
              Quitter la salle
            </button>
          </div>
        )}

        {error && (
          <p className="multiplayer__error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
