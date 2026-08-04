import type { Metadata, Viewport } from "next";
import {
  siteConfig,
  siteHomeUrl,
  siteSocialContent,
  siteSocialImage,
  siteSocialTwitterImage,
} from "./_lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  creator: siteConfig.operator,
  publisher: siteConfig.operator,
  category: "game",
  alternates: { canonical: siteHomeUrl },
  icons: {
    icon: [{ url: "/panda.png", type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: "/panda.png", type: "image/png", sizes: "1024x1024" }],
    other: [{ rel: "image_src", url: siteSocialImage.secureUrl }],
  },
  openGraph: {
    type: "website",
    url: siteHomeUrl,
    title: siteSocialContent.title,
    description: siteSocialContent.description,
    siteName: siteConfig.name,
    locale: "en_US",
    alternateLocale: ["pl_PL"],
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteSocialContent.title,
    description: siteSocialContent.description,
    images: [siteSocialTwitterImage],
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
