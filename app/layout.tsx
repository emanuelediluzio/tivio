import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Ti Vitti — il gioco di carte siciliano";
const description =
  "Gioca a Ti Vitti, il tradizionale gioco di carte siciliano e calabrese, contro il CPU. Peschi, giochi le fondazioni e attento a chi grida 'Ti vitti!'.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Ti Vitti",
  openGraph: {
    title,
    description,
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f4d38",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-emerald-950">{children}</body>
    </html>
  );
}
