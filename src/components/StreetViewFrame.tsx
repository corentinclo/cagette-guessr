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
  const source = useMemo(() => buildStreetViewUrl(market), [market]);

  return (
    <div className="street-view">
      {loading && (
        <div className="street-view__loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Chargement de Street View…
        </div>
      )}
      <iframe
        key={market.id}
        title="Vue Street View à localiser"
        src={source}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
