/**
 * CagetteGuessr — Convertisseur CSV → JSON pour les marchés Cagette.
 *
 * Prend data/cagette_markets.csv (colonnes id, name, cdate,
 * distributionSchedule, imageUrl, name, address1, zipCode, city, lng, lat)
 * et produit data/cagette-markets.json au format utilisé par l'application.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Market } from "../src/domain/types";

type StoredMarket = Omit<Market, "heading" | "pitch">;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, "..", "data", "cagette_markets.csv");
const OUTPUT = path.join(__dirname, "..", "data", "cagette-markets.json");

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanName(name?: string): string {
  return (
    name
      ?.replaceAll("à‰", "É")
      .replaceAll("Â ", " ")
      .replaceAll("Â´", "’")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, " ") || ""
  );
}

function main(): void {
  if (!fs.existsSync(INPUT)) {
    console.error(`Fichier introuvable : ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error("CSV vide ou sans données");
    process.exit(1);
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  // On s'attend à : id,name,cdate,distributionSchedule,imageUrl,name,address1,zipCode,city,lng,lat
  const expected = [
    "id",
    "name",
    "cdate",
    "distributionschedule",
    "imageurl",
    "name",
    "address1",
    "zipcode",
    "city",
    "lng",
    "lat",
  ];
  if (expected.some((h, i) => headers[i] !== h)) {
    console.warn(
      "En-têtes inattendues, on continue avec les indices fixes :",
      headers
    );
  }

  const markets: StoredMarket[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 11) {
      skipped++;
      continue;
    }

    const id = cols[0].trim();
    const marketName = cleanName(cols[1]);
    const placeName = cleanName(cols[5]);
    const address = cleanName(cols[6]);
    const zipCode = cleanName(cols[7]).replace(/\s/g, "");
    const city = cleanName(cols[8]);
    const lng = parseFloat(cols[9]);
    const lat = parseFloat(cols[10]);
    const imageUrl = cols[4].trim();

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.warn(`Ligne ${i + 1} ignorée : coordonnées invalides`);
      skipped++;
      continue;
    }

    const name =
      placeName && placeName !== marketName
        ? `${marketName} — ${placeName}`
        : marketName || placeName || `Marché #${id}`;

    markets.push({
      id,
      name,
      lat,
      lng,
      imageUrl: imageUrl || null,
      city: city || null,
      zipCode: zipCode || null,
      address: address || null,
    });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(markets, null, 2), "utf-8");

  console.log(`✅ ${markets.length} marchés écrits dans ${OUTPUT}`);
  if (skipped > 0) console.log(`⚠️ ${skipped} lignes ignorées`);
}

main();
