"use client";

import { useEffect, useMemo, useState } from "react";
import GameScreen from "@/components/GameScreen";
import HomeScreen from "@/components/HomeScreen";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import TutorialDialog from "@/components/TutorialDialog";
import { markets } from "@/data/markets";
import {
  CLASSIC_ROUND_COUNT,
  TUTORIAL_ROUND_COUNT,
  distanceInKm,
  formatDistance,
  formatPoints,
  pointsForDistance,
  selectMarkets,
  shortMarketName,
} from "@/domain/game";
import type {
  Coordinates,
  GameScreenName,
  Market,
  RoundResult,
} from "@/domain/types";

export default function CagetteGuessrApp() {
  const [screen, setScreen] = useState<GameScreenName>("home");
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [rounds, setRounds] = useState<Market[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("room")) {
      setScreen("multiplayer");
    }
  }, []);

  const market = rounds[roundIndex];
  const totalPoints = useMemo(
    () => results.reduce((total, round) => total + round.points, 0),
    [results]
  );

  function startGame(isTutorial = false): void {
    const count = isTutorial ? TUTORIAL_ROUND_COUNT : CLASSIC_ROUND_COUNT;
    const selectedMarkets = isTutorial
      ? markets.slice(0, count)
      : selectMarkets(markets, count);

    setTutorial(isTutorial);
    setRounds(selectedMarkets);
    setRoundIndex(0);
    setGuess(null);
    setResult(null);
    setResults([]);
    setTutorialDialogOpen(false);
    setScreen("game");
  }

  function validateGuess(): void {
    if (!guess || !market || result) return;

    const distanceKm = distanceInKm(guess, {
      lat: market.lat,
      lng: market.lng,
    });
    const nextResult: RoundResult = {
      market,
      guess,
      distanceKm,
      points: pointsForDistance(distanceKm),
    };

    setResult(nextResult);
    setResults((current) => [...current, nextResult]);
  }

  function nextRound(): void {
    if (roundIndex + 1 >= rounds.length) {
      setScreen("summary");
      return;
    }

    setRoundIndex((current) => current + 1);
    setGuess(null);
    setResult(null);
  }

  function returnHome(): void {
    setScreen("home");
    setRounds([]);
    setGuess(null);
    setResult(null);
    setResults([]);
  }

  if (screen === "game" && market) {
    return (
      <GameScreen
        market={market}
        roundNumber={roundIndex + 1}
        roundCount={rounds.length}
        totalPoints={totalPoints}
        guess={guess}
        result={result}
        tutorial={tutorial}
        onGuess={setGuess}
        onValidate={validateGuess}
        onNext={nextRound}
        onQuit={returnHome}
      />
    );
  }

  if (screen === "summary") {
    const maximum = results.length * 5000;
    return (
      <main className="summary">
        <section className="summary__card">
          <p className="eyebrow">tournée terminée</p>
          <h1>{tutorial ? "Tutoriel terminé !" : "Votre bilan"}</h1>
          <div className="summary__score">
            <strong>{formatPoints(totalPoints)}</strong>
            <span>sur {formatPoints(maximum)} points</span>
          </div>
          <ol className="summary__rounds">
            {results.map((round, index) => (
              <li key={round.market.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{shortMarketName(round.market.name)}</strong>
                  <small>{formatDistance(round.distanceKm)}</small>
                </div>
                <b>{formatPoints(round.points)} pts</b>
              </li>
            ))}
          </ol>
          <div className="summary__actions">
            <button
              className="button button--primary"
              type="button"
              onClick={() => startGame(false)}
            >
              {tutorial ? "Jouer une vraie partie" : "Rejouer"}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={returnHome}
            >
              Retour à l’accueil
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "multiplayer") {
    return <MultiplayerScreen onQuit={() => setScreen("home")} />;
  }

  return (
    <>
      <HomeScreen
        onPlay={() => startGame(false)}
        onTutorial={() => setTutorialDialogOpen(true)}
        onMultiplayer={() => setScreen("multiplayer")}
      />
      {tutorialDialogOpen && (
        <TutorialDialog
          onClose={() => setTutorialDialogOpen(false)}
          onStart={() => startGame(true)}
        />
      )}
    </>
  );
}
