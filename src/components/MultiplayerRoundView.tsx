"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import StreetViewFrame from "@/components/StreetViewFrame";
import { formatDistance, formatPoints } from "@/domain/game";
import type { Coordinates, Market, Room } from "@/domain/types";
import type { GuessMapProps } from "@/components/GuessMap";

const GuessMap = dynamic<GuessMapProps>(() => import("@/components/GuessMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement de la carte…</div>,
});

interface MultiplayerRoundViewProps {
  room: Room;
  market: Market;
  myId: string;
  onGuess: (coordinates: Coordinates, final: boolean) => void;
  onQuit: () => void;
}

export default function MultiplayerRoundView({
  room,
  market,
  myId,
  onGuess,
  onQuit,
}: MultiplayerRoundViewProps) {
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [locked, setLocked] = useState(false);
  const round = room.rounds[room.currentRound - 1];
  const result = round?.results.find((item) => item.playerId === myId);
  const isGuessing = room.state === "guess";
  const isRevealed = room.state === "end" && Boolean(round?.revealed);

  function handleGuess(coordinates: Coordinates): void {
    setGuess(coordinates);
    onGuess(coordinates, false);
  }

  function validateGuess(): void {
    if (guess && !locked) {
      onGuess(guess, true);
      setLocked(true);
    }
  }

  return (
    <main className="game multiplayer-game">
      <header className="game__header">
        <button className="game__quit" type="button" onClick={onQuit}>
          ← Quitter
        </button>
        <div>
          <strong>Partie privée</strong>
          <span>
            Manche {room.currentRound} / {room.options.rounds} · {room.code}
          </span>
        </div>
        <div className="game__score">
          <span>Votre score</span>
          <strong>
            {formatPoints(
              room.players.find((player) => player.id === myId)?.totalPoints ??
                0
            )}
          </strong>
        </div>
      </header>

      <div className="game__workspace">
        <StreetViewFrame market={market} />

        <aside className="guess-dock multiplayer-round__dock" aria-label="Carte de réponse">
          <div className="guess-panel__heading">
            <div>
              <p className="eyebrow">
                {room.state === "getready" ? "préparation" : "manche en cours"}
              </p>
              <h1>
                {room.state === "getready"
                  ? "Préparez-vous"
                  : isRevealed
                    ? "Résultat"
                    : "Où sommes-nous ?"}
              </h1>
            </div>
            {isGuessing && <span>Placez votre repère</span>}
          </div>

          <div className="guess-map-overlay">
            <GuessMap
              guess={guess}
              answer={isRevealed ? market : null}
              onGuess={handleGuess}
              disabled={!isGuessing || isRevealed || locked}
            />
          </div>

          {room.state === "getready" && (
            <p className="multiplayer-round__message">
              La manche commence dans quelques secondes.
            </p>
          )}

          {isGuessing && (
            <button
              className="button button--primary guess-panel__validate"
              type="button"
              disabled={!guess || locked}
              onClick={validateGuess}
            >
              {locked
                ? "Proposition verrouillée"
                : "Verrouiller ma proposition"}
            </button>
          )}

          {isRevealed && result && (
            <div className="round-result" aria-live="polite">
              <div className="round-result__score">
                <strong>{formatPoints(result.points)}</strong>
                <span>points</span>
              </div>
              <div className="round-result__market">
                <span>à {formatDistance(result.distanceKm)} du marché</span>
                <h2>{market.name.split(" — ")[0]}</h2>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
