"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ScribbleAppStoreCta } from "./scribble-app-store-cta";
import {
  localeCodes,
  Locale,
  siteConfig,
  siteContent,
  Theme,
  themeCodes,
} from "../_lib/site-content";

const storageKeys = {
  locale: "menimals.locale",
  theme: "menimals.theme",
} as const;

const defaultPreferences = {
  locale: "pl",
  theme: "light",
} as const satisfies Preferences;

const storyAppStoreScribble = {
  height: 125,
  markerStrokeWidth: 71,
  mobileScale: 0.72,
  strokeAxis: "horizontal",
  strokeCount: 6,
  width: 470,
} as const;
const storyAppStoreBaseScale = 0.6;
const storyAppStoreScaleMultiplier = 1.5;
const storyAppStoreScale =
  storyAppStoreBaseScale * storyAppStoreScaleMultiplier;
const storyAppStoreScaledFrameStyle = {
  height: storyAppStoreScribble.height * storyAppStoreScale,
  width: "100%",
} satisfies CSSProperties;
const storyAppStoreTransformStyle = {
  transform: `translateX(-50%) scale(${storyAppStoreScale})`,
  transformOrigin: "top center",
} satisfies CSSProperties;

type Preferences = {
  locale: Locale;
  theme: Theme;
};

type SitePageProps = {
  page: "home" | "privacy";
};

function isLocale(value: string | null): value is Locale {
  return localeCodes.some((locale) => locale === value);
}

function isTheme(value: string | null): value is Theme {
  return themeCodes.some((theme) => theme === value);
}

function storedValue(key: (typeof storageKeys)[keyof typeof storageKeys]) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readPreferences(): Preferences {
  const browserLocale = storedValue(storageKeys.locale);
  const browserTheme = storedValue(storageKeys.theme);
  const locale = isLocale(browserLocale)
    ? browserLocale
    : navigator.language.toLowerCase().startsWith("pl")
      ? "pl"
      : "en";
  const theme = isTheme(browserTheme)
    ? browserTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  return { locale, theme };
}

export function SitePage(p: SitePageProps) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const activePreferences = preferences ?? defaultPreferences;
  const content = siteContent[activePreferences.locale];

  useEffect(() => setPreferences(readPreferences()), []);

  useEffect(() => {
    if (!preferences) {
      return;
    }

    document.documentElement.lang = preferences.locale;
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.style.colorScheme = preferences.theme;
    try {
      window.localStorage.setItem(storageKeys.locale, preferences.locale);
      window.localStorage.setItem(storageKeys.theme, preferences.theme);
    } catch {
      // Preferences remain active for this visit if browser storage is unavailable.
    }
  }, [preferences]);

  const selectLocale = (locale: Locale) =>
    setPreferences({ ...activePreferences, locale });
  const selectTheme = (theme: Theme) =>
    setPreferences({ ...activePreferences, theme });

  return (
    <div className={p.page === "home" ? "site site--home" : "site site--privacy"}>
      <header className="controls">
        <div className="segmented" aria-label={content.themeLabel}>
          {themeCodes.map((theme) => (
            <button
              className="segmented__button"
              data-active={activePreferences.theme === theme}
              type="button"
              aria-pressed={activePreferences.theme === theme}
              onClick={() => selectTheme(theme)}
              key={theme}
            >
              {content[theme]}
            </button>
          ))}
        </div>

        <div className="segmented" aria-label={content.languageLabel}>
          {localeCodes.map((locale) => (
            <button
              className="segmented__button"
              data-active={activePreferences.locale === locale}
              type="button"
              aria-pressed={activePreferences.locale === locale}
              onClick={() => selectLocale(locale)}
              key={locale}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {p.page === "home" ? (
        <>
          <main className="panda-stage" aria-label={siteConfig.name}>
            <Image
              className="panda"
              src="/panda.png"
              width={1024}
              height={1024}
              sizes="(max-aspect-ratio: 1/1) 90vw, 70vh"
              alt={content.pandaAlt}
              priority
            />
            <div
              className="app-store-cta-frame"
              style={storyAppStoreScaledFrameStyle}
            >
              <div
                className="app-store-cta-transform"
                style={storyAppStoreTransformStyle}
              >
                <ScribbleAppStoreCta
                  ariaLabel={content.appStoreDownloadLabel}
                  height={storyAppStoreScribble.height}
                  href={siteConfig.appStoreUrl}
                  isActive={preferences !== null}
                  markerStrokeWidth={storyAppStoreScribble.markerStrokeWidth}
                  mobileScale={storyAppStoreScribble.mobileScale}
                  strokeAxis={storyAppStoreScribble.strokeAxis}
                  strokeCount={storyAppStoreScribble.strokeCount}
                  width={storyAppStoreScribble.width}
                />
              </div>
            </div>
          </main>
          <footer className="footer">
            <Link href="/privacy">{content.privacyLink}</Link>
          </footer>
        </>
      ) : (
        <main className="privacy-shell">
          <article className="privacy-document">
            <Link className="back-link" href="/">
              <span aria-hidden="true">← </span>
              {siteConfig.name}
            </Link>
            <h1>{content.privacy.title}</h1>
            <p className="updated">{content.privacy.updated}</p>
            <p className="intro">{content.privacy.intro}</p>
            {content.privacy.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <a className="email-link" href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
          </article>
        </main>
      )}
    </div>
  );
}
