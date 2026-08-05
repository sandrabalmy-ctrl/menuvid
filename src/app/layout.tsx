import type { Metadata, Viewport } from "next";
import { Geist, Fraunces, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CookieNotice } from "@/components/CookieNotice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police d'affichage élégante (titres, nom du restaurant) — touche "premium".
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Serif romantique et raffiné, mais très lisible (messages d'accueil).
const cormorant = Cormorant_Garamond({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "MenuVid — le menu qui donne faim",
  description:
    "Menu digital vidéo par QR code : découvrez chaque plat en vidéo et commandez directement à table.",
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  // Mobile-first : l'écran ne doit pas zoomer, l'app doit se comporter en plein écran.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${fraunces.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
