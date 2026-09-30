import "leaflet/dist/leaflet.css";
import "@/styles/app.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { cabin, sanchez } from "@/app/fonts";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "CagetteGuessr",
  description:
    "Explorez les marchés Cagette dans Street View et retrouvez leur position sur la carte de France.",
};

export const viewport: Viewport = {
  themeColor: "#2f6b4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="icon" href={`${basePath}/icon.png`} type="image/png" />
      </head>
      <body className={`${cabin.variable} ${sanchez.variable}`}>
        {children}
      </body>
    </html>
  );
}
