import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité · CagetteGuessr",
  description: "Informations sur les données utilisées par CagetteGuessr.",
};

export default function PrivacyPage() {
  return (
    <main className="summary">
      <article className="summary__card privacy">
        <p className="eyebrow">CagetteGuessr</p>
        <h1>Confidentialité</h1>
        <p>
          CagetteGuessr fonctionne sans compte utilisateur et ne stocke pas vos
          parties sur un serveur. Les données des marchés sont intégrées au
          site.
        </p>
        <p>
          Le jeu charge Google Street View, les tuiles OpenStreetMap et les
          photos du CDN de Cagette. Ces services reçoivent les informations
          techniques nécessaires à leur fonctionnement, selon leurs propres
          politiques de confidentialité.
        </p>
        <p>
          Aucune régie publicitaire, mesure d’audience ou connexion à un ancien
          service tiers n’est intégrée à cette version.
        </p>
        <Link className="button button--secondary" href="/">
          Retour au jeu
        </Link>
      </article>
    </main>
  );
}
