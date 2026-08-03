import type { Metadata } from "next";
import { SitePage } from "../_components/site-page";
import { siteConfig } from "../_lib/site-content";

export const metadata: Metadata = {
  title: `Privacy policy | ${siteConfig.name}`,
  description: "Privacy policy for the Menimals game and website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <SitePage page="privacy" />;
}
