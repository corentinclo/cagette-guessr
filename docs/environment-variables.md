# Variables d’environnement

CagetteGuessr est un site statique. Toutes les variables sont optionnelles et intégrées au moment du build.

## `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`

Clé navigateur restreinte pour l’API Google Maps Embed. Quand elle est absente, le jeu utilise la vue Street View intégrable standard.

```bash
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_restricted_browser_key
```

La clé doit être limitée au domaine de déploiement dans la console Google Cloud.

## `NEXT_PUBLIC_BASE_PATH`

Sous-chemin public utilisé lorsque le site n’est pas servi à la racine du domaine.

```bash
NEXT_PUBLIC_BASE_PATH=/cagetteguessr
```
