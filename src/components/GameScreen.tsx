import dynamic from "next/dynamic";
import StreetViewFrame from "@/components/StreetViewFrame";
import { formatDistance, formatPoints, shortMarketName } from "@/domain/game";
import type { Coordinates, Market, RoundResult } from "@/domain/types";
import type { GuessMapProps } from "@/components/GuessMap";

const GuessMap = dynamic<GuessMapProps>(() => import("@/components/GuessMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement de la carte…</div>,
});

export interface GameScreenProps {
  market: Market;
  roundNumber: number;
  roundCount: number;
  totalPoints: number;
  guess: Coordinates | null;
  result: RoundResult | null;
  tutorial: boolean;
  onGuess: (coordinates: Coordinates) => void;
  onValidate: () => void;
  onNext: () => void;
  onQuit: () => void;
}

export default function GameScreen({
  market,
  roundNumber,
  roundCount,
  totalPoints,
  guess,
  result,
  tutorial,
  onGuess,
  onValidate,
  onNext,
  onQuit,
}: GameScreenProps) {
  return (
    <main className="game">
      <header className="game__header">
        <button className="game__quit" type="button" onClick={onQuit}>
          ← Quitter
        </button>
        <div>
          <strong>{tutorial ? "Tutoriel" : "CagetteGuessr"}</strong>
          <span>
            Manche {roundNumber} / {roundCount}
          </span>
        </div>
        <div className="game__score">
          <span>Score</span>
          <strong>{formatPoints(totalPoints)}</strong>
        </div>
      </header>

      <div className="game__workspace">
        <StreetViewFrame key={market.id} market={market} />

        <div className="guess-dock">
          <div className="guess-dock__heading">
            <h1>{result ? "Marché retrouvé" : "Où sommes-nous ?"}</h1>
            {!result && <span>Cliquez sur la carte</span>}
          </div>

          <div className="guess-map-overlay">
            <GuessMap
              key={market.id}
              guess={guess}
              answer={result ? { lat: market.lat, lng: market.lng } : null}
              onGuess={onGuess}
              disabled={Boolean(result)}
            />
          </div>

          {result ? (
            <div className="round-result" aria-live="polite">
              <div className="round-result__score">
                <strong>{formatPoints(result.points)}</strong>
                <span>points</span>
              </div>
              <div className="round-result__market">
                <span>à {formatDistance(result.distanceKm)} du marché</span>
                <h2>{shortMarketName(market.name)}</h2>
                <p>
                  {[market.address, market.zipCode, market.city]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                className="button button--primary"
                type="button"
                onClick={onNext}
              >
                {roundNumber === roundCount
                  ? "Voir le bilan"
                  : "Marché suivant"}
              </button>
            </div>
          ) : (
            <button
              className="button button--primary guess-dock__validate"
              type="button"
              disabled={!guess}
              onClick={onValidate}
            >
              Valider ce repère
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
