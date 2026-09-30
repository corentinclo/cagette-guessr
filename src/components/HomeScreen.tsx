import Link from "next/link";
import { useEffect, useState } from "react";
import { cityCount, markets } from "@/data/markets";
import { shortMarketName } from "@/domain/game";
import type { Market } from "@/domain/types";

function formatApproximateCount(value: number): string {
  return `${Math.floor(value / 100) * 100}+`;
}

interface HomeScreenProps {
  onPlay: () => void;
  onTutorial: () => void;
  onMultiplayer: () => void;
}

export default function HomeScreen({
  onPlay,
  onTutorial,
  onMultiplayer,
}: HomeScreenProps) {
  const [spotlightMarket, setSpotlightMarket] = useState<Market | undefined>(
    markets[0]
  );

  useEffect(() => {
    if (markets.length > 0) {
      const randomIndex = Math.floor(Math.random() * markets.length);
      setSpotlightMarket(markets[randomIndex]);
    }
  }, []);

  return (
    <main className="landing">
      <header className="landing__header">
        <div className="logo">
          <div className="logo-icon">
            <img src="./logo.png" alt="Cagette" className="logo-img" />
          </div>
          <img
            src="./logo-title.png"
            alt="Cagette Guessr"
            className="logo-title-img"
          />
        </div>
      </header>

      <section className="landing__content">
        <div className="landing__intro">
          <h1>
            Retrouvez le
            <br />
            <em>marché Cagette.</em>
          </h1>
          <p className="landing__lede">
            Observez les alentours dans Street View, puis placez votre repère
            sur la carte de France métropolitaine. Une partie comporte cinq
            marchés.
          </p>
          <div className="landing__actions">
            <button
              className="button button--primary"
              type="button"
              onClick={onPlay}
            >
              Commencer une partie <span aria-hidden="true">→</span>
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={onTutorial}
            >
              Découvrir le tutoriel
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={onMultiplayer}
            >
              Jouer à plusieurs
            </button>
          </div>
          <dl className="landing__facts">
            <div>
              <dt>Marchés</dt>
              <dd>{formatApproximateCount(markets.length)}</dd>
            </div>
            <div>
              <dt>Manches</dt>
              <dd>5</dd>
            </div>
          </dl>
        </div>

        <aside className="market-card" aria-label="Marché à la une">
          <div
            className="market-card__photo"
            style={
              spotlightMarket?.imageUrl
                ? { backgroundImage: `url("${spotlightMarket.imageUrl}")` }
                : undefined
            }
          >
            <span>marché à la une</span>
          </div>
          <div className="market-card__body">
            <h2>{shortMarketName(spotlightMarket?.name)}</h2>
            <span>{spotlightMarket?.city || "France"}</span>
          </div>
        </aside>
      </section>

      <footer className="landing__footer">
        <span>Un jeu de géographie signé Cagette</span>
        <Link href="/confidentialite">Confidentialité</Link>
        <span>SCOP ALILO · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
