import { useMemo, useState } from "react";
import type { Market } from "@/domain/types";

function buildStreetViewUrl(market: Market): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const location = `${market.lat},${market.lng}`;
  const heading = market.heading ?? 0;

  if (apiKey) {
    const params = new URLSearchParams({
      key: apiKey,
      location,
      fov: "100",
      heading: String(heading),
      language: "fr",
    });
    return `https://www.google.com/maps/embed/v1/streetview?${params}`;
  }

  const params = new URLSearchParams({
    q: "",
    layer: "c",
    cbll: location,
    cbp: `11,${heading},0,0,0`,
    output: "svembed",
    hl: "fr",
  });
  return `https://www.google.com/maps?${params}`;
}

interface StreetViewFrameProps {
  market: Market;
}

export default function StreetViewFrame({ market }: StreetViewFrameProps) {
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const source = useMemo(() => buildStreetViewUrl(market), [market]);

  function resetView(): void {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  return (
    <div className="street-view">
      {loading && (
        <div className="street-view__loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Chargement de Street View…
        </div>
      )}
      <iframe
        key={`${market.id}-${reloadCount}`}
        title="Vue Street View à localiser"
        src={source}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoading(false)}
      />
      <button
        className="street-view__reset"
        type="button"
        onClick={resetView}
        aria-label="Revenir au point de départ"
        title="Revenir au point de départ"
      >
        <svg
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 24 24"
          width="22"
          height="22"
        >
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
        </svg>
      </button>
    </div>
  );
}
