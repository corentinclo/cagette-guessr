"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import StreetViewFrame from "@/components/StreetViewFrame";
import {
  formatDistance,
  formatPoints,
  formatRoundDuration,
} from "@/domain/game";
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
  isHost: boolean;
  onGuess: (coordinates: Coordinates, final: boolean) => void;
  onNextRound: () => void;
  onQuit: () => void;
}

function getFinalStandings(players: Room["players"]) {
  let currentRank = 0;
  let previousPoints: number | null = null;

  return [...players]
    .sort(
      (left, right) =>
        right.totalPoints - left.totalPoints ||
        left.name.localeCompare(right.name, "fr")
    )
    .map((player, index) => {
      if (player.totalPoints !== previousPoints) {
        currentRank = index + 1;
        previousPoints = player.totalPoints;
      }
      return { player, rank: currentRank };
    });
}

export default function MultiplayerRoundView({
  room,
  market,
  myId,
  isHost,
  onGuess,
  onNextRound,
  onQuit,
}: MultiplayerRoundViewProps) {
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [locked, setLocked] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const finalDialogRef = useRef<HTMLDialogElement | null>(null);
  const round = room.rounds[room.currentRound - 1];
  const result = round?.results.find((item) => item.playerId === myId);
  const isGuessing = room.state === "guess";
  const isRevealed = room.state === "end" && Boolean(round?.revealed);
  const isFinalRound =
    isRevealed && room.currentRound >= room.options.rounds;
  const remainingSeconds =
    isGuessing && room.nextEventAt !== null
      ? Math.max(0, Math.ceil((room.nextEventAt - now) / 1000))
      : null;
  const playerGuesses = isRevealed
    ? (round?.guesses ?? []).map((item) => ({
        coordinates: item.coordinates,
        playerName:
          room.players.find((player) => player.id === item.playerId)?.name ??
          "Joueur",
        isOwnGuess: item.playerId === myId,
      }))
    : undefined;
  const finalStandings = isFinalRound ? getFinalStandings(room.players) : [];

  useEffect(() => {
    const dialog = finalDialogRef.current;
    if (isFinalRound && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [isFinalRound]);

  useEffect(() => {
    if (!isGuessing || room.nextEventAt === null) return;

    const updateNow = (): void => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 1000);
    return () => window.clearInterval(interval);
  }, [isGuessing, room.nextEventAt]);

  useEffect(() => {
    setGuess(null);
    setLocked(false);
  }, [room.currentRound]);

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
          {remainingSeconds !== null && (
            <span
              aria-label={`Temps restant : ${formatRoundDuration(remainingSeconds)}`}
              className={`multiplayer-game__timer${
                remainingSeconds <= 10 ? " multiplayer-game__timer--urgent" : ""
              }`}
              role="timer"
            >
              {formatRoundDuration(remainingSeconds)}
            </span>
          )}
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

        <aside
          className="guess-dock multiplayer-round__dock"
          aria-label="Carte de réponse"
        >
          <div className="guess-panel__heading">
            <div>
              <p className="eyebrow">manche en cours</p>
              <h1>{isRevealed ? "Résultat" : "Où sommes-nous ?"}</h1>
            </div>
            {isGuessing && <span>Placez votre repère</span>}
          </div>

          <div className="guess-map-overlay">
            <GuessMap
              guess={isRevealed ? null : guess}
              answer={isRevealed ? market : null}
              playerGuesses={playerGuesses}
              onGuess={handleGuess}
              disabled={!isGuessing || isRevealed || locked}
            />
          </div>

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
              {room.currentRound < room.options.rounds ? (
                isHost && (
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={onNextRound}
                  >
                    Manche suivante
                  </button>
                )
              ) : null}
            </div>
          )}
        </aside>
      </div>

      {isFinalRound && (
        <dialog
          ref={finalDialogRef}
          aria-labelledby="multiplayer-final-title"
          className="multiplayer-final-dialog"
          onCancel={(event) => event.preventDefault()}
        >
          <div className="multiplayer-final-dialog__content">
            <p className="eyebrow">partie terminée</p>
            <h2 id="multiplayer-final-title">Classement final</h2>
            <ol className="multiplayer-final-standings">
              {finalStandings.map(({ player, rank }) => (
                <li key={player.id}>
                  <span className="multiplayer-final-standings__rank">
                    {rank}
                  </span>
                  <strong>{player.name}</strong>
                  {player.id === myId && (
                    <small className="multiplayer-final-standings__you">
                      vous
                    </small>
                  )}
                  <b>{formatPoints(player.totalPoints)} pts</b>
                </li>
              ))}
            </ol>
            <button
              className="button button--primary"
              type="button"
              onClick={onQuit}
            >
              Retour à l’accueil
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
}
