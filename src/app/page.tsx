import type { Metadata } from "next";
import CagetteGuessrApp from "@/app/CagetteGuessrApp";

export const metadata: Metadata = {
  title: "CagetteGuessr · Retrouvez les marchés Cagette",
  alternates: {
    canonical: "https://corentinclo.github.io/cagette-geo-guessr/",
  },
};

export default function HomePage() {
  return <CagetteGuessrApp />;
}
