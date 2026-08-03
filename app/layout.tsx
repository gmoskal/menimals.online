import type { Metadata, Viewport } from "next";
import { siteConfig } from "./_lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: siteConfig.name,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/panda.png", type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: "/panda.png", type: "image/png", sizes: "1024x1024" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/panda.png",
        width: 1024,
        height: 1024,
        alt: "Menimals panda",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/panda.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eadf" },
    { media: "(prefers-color-scheme: dark)", color: "#171411" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
