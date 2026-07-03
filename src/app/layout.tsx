import type { Metadata } from "next";
import { Afacad_Flux, Playfair_Display } from "next/font/google";
import "./globals.css";

const afacad = Afacad_Flux({
  variable: "--font-afacad",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ramayana Admin",
  description: "Admin panel for the Ramayana app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${afacad.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
