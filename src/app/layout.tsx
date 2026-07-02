import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailygeography.app";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Daily Geography",
    template: "%s · Daily Geography",
  },
  description:
    "Three daily geography games on a 3D globe — Sweep borders, Tap landmarks, and Hunt hidden countries.",
  openGraph: {
    title: "Daily Geography",
    description:
      "Three daily geography games on a 3D globe — Sweep, Tap, and Hunt.",
    url: siteUrl,
    siteName: "Daily Geography",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Geography",
    description:
      "Three daily geography games on a 3D globe — Sweep, Tap, and Hunt.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Daily Geography",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-[var(--ui-bg-deep)] text-[var(--ui-text-primary)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
