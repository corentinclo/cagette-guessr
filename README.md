# CagetteGuessr

CagetteGuessr est un jeu de géographie consacré aux marchés Cagette en France métropolitaine. Chaque partie présente cinq lieux dans Google Street View : le joueur explore les alentours, place un repère sur une carte et marque jusqu’à 5 000 points selon la distance.

## Fonctionnalités

- partie solo de cinq marchés tirés au hasard ;
- prise en main sur trois marchés ;
- carte de réponse OpenStreetMap ;
- bilan détaillé à la fin de la tournée ;
- fonctionnement sans compte, base de données ou serveur applicatif.

## Architecture

Le projet produit un site statique avec Next.js et TypeScript strict. Le code produit se trouve dans `src/` et suit les concepts propres à CagetteGuessr :

```text
src/
├── app/          orchestration des écrans et des manches
├── components/   interface CagetteGuessr
├── data/         adaptation des données de marchés
├── domain/       sélection, distance et score
└── styles/       identité visuelle du jeu
```

Le fichier source `data/cagette_markets.csv` est transformé en `data/cagette-markets.json`, directement intégré au build. L’adaptateur de données écarte les coordonnées situées hors de France métropolitaine. Il n’existe aucun backend, compte, classement ou service multijoueur dans cette version.

## Développement

Prérequis : Node.js 20 et pnpm 9.

```bash
pnpm install
pnpm dev
```

Pour vérifier le typage avant un build :

```bash
pnpm typecheck
```

Le jeu est alors disponible sur [http://localhost:3000](http://localhost:3000).

Une clé Google Maps Embed peut être fournie pour utiliser l’endpoint officiel :

```bash
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_restricted_browser_key
```

Sans cette variable, l’application utilise la vue Street View intégrable standard de Google Maps.

## Données des marchés

Pour reconstruire le JSON après une mise à jour du CSV :

```bash
pnpm convert-csv
```

## Build et déploiement

```bash
pnpm build
```

Le dossier `out/` obtenu peut être servi par n’importe quel hébergement statique. Le workflow principal publie sur `https://corentinclo.github.io/cagette-geo-guessr/` et définit donc `NEXT_PUBLIC_BASE_PATH=/cagette-geo-guessr`.

## Licence et provenance

Ce dépôt est distribué sous la licence MIT. Consultez le fichier [LICENSE](LICENSE) pour en lire les conditions.
