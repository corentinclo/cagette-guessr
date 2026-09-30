import { useEffect, useRef } from "react";
import L from "leaflet";
import { FRANCE_BOUNDS, FRANCE_CENTER } from "@/domain/game";
import type { Coordinates } from "@/domain/types";

export interface GuessMapProps {
  guess: Coordinates | null;
  answer: Coordinates | null;
  onGuess: (coordinates: Coordinates) => void;
  disabled: boolean;
}

const guessIcon = L.divIcon({
  className: "map-pin map-pin--guess",
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 38],
});

const answerIcon = L.divIcon({
  className: "map-pin map-pin--answer",
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 38],
});

export default function GuessMap({
  guess,
  answer,
  onGuess,
  disabled,
}: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const resultLayerRef = useRef<L.LayerGroup | null>(null);
  const onGuessRef = useRef<(coordinates: Coordinates) => void>(onGuess);
  const disabledRef = useRef<boolean>(disabled);

  useEffect(() => {
    onGuessRef.current = onGuess;
    disabledRef.current = disabled;
  }, [disabled, onGuess]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: FRANCE_CENTER,
      zoom: 5,
      minZoom: 4,
      maxZoom: 16,
      maxBounds: FRANCE_BOUNDS,
      maxBoundsViscosity: 0.75,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const resultLayer = L.layerGroup().addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (!disabledRef.current) {
        onGuessRef.current({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        });
      }
    });

    mapRef.current = map;
    resultLayerRef.current = resultLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      resultLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return undefined;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const resultLayer = resultLayerRef.current;
    if (!map || !resultLayer) return;

    resultLayer.clearLayers();

    if (guess) {
      L.marker([guess.lat, guess.lng], { icon: guessIcon }).addTo(resultLayer);
    }

    if (guess && answer) {
      L.marker([answer.lat, answer.lng], { icon: answerIcon }).addTo(
        resultLayer
      );
      L.polyline(
        [
          [guess.lat, guess.lng],
          [answer.lat, answer.lng],
        ],
        { color: "#2f6b4f", dashArray: "7 9", weight: 3 }
      ).addTo(resultLayer);

      map.fitBounds(
        L.latLngBounds([guess.lat, guess.lng], [answer.lat, answer.lng]),
        { padding: [56, 56], maxZoom: 11 }
      );
    }
  }, [answer, guess]);

  return (
    <div
      ref={containerRef}
      className="guess-map"
      role="application"
      aria-label="Carte de France pour placer votre réponse"
    />
  );
}
