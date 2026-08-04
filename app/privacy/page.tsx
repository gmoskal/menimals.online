import type { Metadata } from "next";
import { SitePage } from "../_components/site-page";
import {
  absoluteSiteUrl,
  siteConfig,
  siteSocialImage,
  siteSocialTwitterImage,
} from "../_lib/site-content";

const privacyTitle = "Privacy policy";
const privacyDescription = "Privacy policy for the Menimals game and website.";
const privacyUrl = absoluteSiteUrl("/privacy");

export const metadata: Metadata = {
  title: privacyTitle,
  description: privacyDescription,
  alternates: { canonical: privacyUrl },
  openGraph: {
    type: "article",
    url: privacyUrl,
    title: `${privacyTitle} | ${siteConfig.name}`,
    description: privacyDescription,
    siteName: siteConfig.name,
    locale: "en_US",
    alternateLocale: ["pl_PL"],
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${privacyTitle} | ${siteConfig.name}`,
    description: privacyDescription,
    images: [siteSocialTwitterImage],
  },
};

export default function PrivacyPage() {
  return <SitePage page="privacy" />;
}
