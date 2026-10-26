/**
 * CagetteGuessr — Vérificateur Street View (sans clé Google).
 *
 * Ouvre chaque marché de data/cagette-markets.json dans un navigateur
 * headless via l'URL publique Street View (aucune clé requise) et détecte
 * les coordonnées sans panorama (message « Aucune image Street View
 * disponible »). Les marchés concernés sont écrits dans
 * data/streetview-excluded.json et exclus du jeu.
 *
 * Usage :
 *   pnpm check-streetview
 *   CHECK_LIMIT=10 pnpm check-streetview   # tester sur les 10 premiers
 *
 * Nécessite Chrome/Chromium installé localement, ou CHROME_PATH défini.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

interface RawMarket {
  id: string | number;
  name?: string | null;
  lat?: unknown;
  lng?: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKETS_FILE = path.join(__dirname, "..", "data", "cagette-markets.json");
const EXCLUDED_FILE = path.join(
  __dirname,
  "..",
  "data",
  "streetview-excluded.json"
);

const CONCURRENCY = 4;
const NAVIGATION_TIMEOUT_MS = 15_000;
const MISSING_CHECK_TIMEOUT_MS = 9_000;

const MISSING_MARKERS = [
  "Aucune image Street",
  "No street view",
  "We have no imagery here",
];

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/snap/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    "Chrome/Chromium introuvable. Installez-le ou définissez CHROME_PATH."
  );
}

function buildEmbedUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    q: "",
    layer: "c",
    cbll: `${lat},${lng}`,
    cbp: "11,0,0,0,0",
    output: "svembed",
    hl: "fr",
  });
  return `https://www.google.com/maps?${params.toString()}`;
}

function buildIframeHtml(url: string): string {
  return (
    `<iframe id="sv" src="${url}" ` +
    `style="position:fixed;inset:0;width:100vw;height:100vh;border:0" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" ` +
    `referrerpolicy="no-referrer-when-downgrade"></iframe>`
  );
}

async function hasStreetView(
  page: Page,
  lat: number,
  lng: number
): Promise<boolean> {
  // L'embed Google refuse de s'afficher hors iframe : on l'insère donc dans
  // une page locale puis on inspecte le contenu du frame via le CDP.
  await page.setContent(buildIframeHtml(buildEmbedUrl(lat, lng)));

  const frame = await page.waitForFrame(
    (candidate) => candidate.url().includes("google.com/maps"),
    { timeout: NAVIGATION_TIMEOUT_MS }
  );

  try {
    await frame.waitForFunction(
      (markers: string[]) => {
        const text = document.body?.innerText ?? "";
        return markers.some((marker) => text.includes(marker));
      },
      { timeout: MISSING_CHECK_TIMEOUT_MS, polling: 250 },
      MISSING_MARKERS
    );
    return false;
  } catch {
    return true;
  }
}

async function main(): Promise<void> {
  const raw = JSON.parse(fs.readFileSync(MARKETS_FILE, "utf-8")) as RawMarket[];
  let markets = raw.filter(
    (market) => isValidCoordinate(market.lat) && isValidCoordinate(market.lng)
  ) as Array<RawMarket & { lat: number; lng: number }>;

  const limit = Number(process.env.CHECK_LIMIT);
  if (Number.isFinite(limit) && limit > 0) {
    markets = markets.slice(0, limit);
  }

  if (markets.length === 0) {
    console.log("Aucun marché à vérifier.");
    return;
  }

  const browser: Browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const pageCount = Math.min(CONCURRENCY, markets.length);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, async () => {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      );
      await page.setViewport({ width: 1280, height: 800 });
      return page;
    })
  );

  const missing: string[] = [];
  const errors: string[] = [];
  let checked = 0;
  const queue = [...markets];

  async function worker(page: Page): Promise<void> {
    while (queue.length > 0) {
      const market = queue.shift();
      if (!market) return;

      try {
        const available = await hasStreetView(page, market.lat, market.lng);
        checked += 1;

        if (!available) {
          missing.push(String(market.id));
          console.log(
            `✖ ${market.id} — ${market.name ?? "marché sans nom"} (pas de Street View)`
          );
        }
      } catch (error) {
        checked += 1;
        errors.push(String(market.id));
        console.warn(`⚠️ ${market.id} — erreur : ${String(error)}`);
      }

      if (checked % 25 === 0 || checked === markets.length) {
        console.log(`  … ${checked}/${markets.length} vérifiés`);
      }
    }
  }

  await Promise.all(pages.map((page) => worker(page)));
  await browser.close();

  missing.sort((left, right) =>
    left.localeCompare(right, "fr", { numeric: true })
  );
  fs.writeFileSync(
    EXCLUDED_FILE,
    `${JSON.stringify(missing, null, 2)}\n`,
    "utf-8"
  );

  console.log("");
  console.log(`✅ ${checked} marchés vérifiés.`);
  console.log(`🗑 ${missing.length} sans Street View → exclus du jeu.`);
  if (errors.length > 0) {
    console.warn(
      `⚠️ ${errors.length} vérifications en erreur (marchés conservés par sécurité).`
    );
  }
  console.log(`Liste écrite dans ${EXCLUDED_FILE}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
