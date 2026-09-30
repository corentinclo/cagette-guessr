import { Cabin, Sanchez } from "next/font/google";

export const cabin = Cabin({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cabin",
});

export const sanchez = Sanchez({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-sanchez",
});
