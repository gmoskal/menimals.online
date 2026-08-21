"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { PhysicsPanda } from "./physics-panda";
import { ScribbleAppStoreCta } from "./scribble-app-store-cta";
import type { PandaDropPose } from "../_lib/panda-drop-physics";
import {
  appNames,
  localeCodes,
  localeDisplayNames,
  siteConfig,
  siteContent,
  themeCodes,
} from "../_lib/site-content";
import type { Locale, Theme } from "../_lib/site-content";

const storageKeys = {
  locale: "menimals.locale",
  theme: "menimals.theme",
} as const;

const fallbackLocale = "en" satisfies Locale;
const defaultPreferences = {
  locale: fallbackLocale,
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
const storyAppStoreGap = 100;
const storyAppStoreScaledHeight =
  storyAppStoreScribble.height * storyAppStoreScale;
const storyAppStoreScaledFrameStyle = {
  height: storyAppStoreScaledHeight,
  width: 0,
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

function isTheme(value: string | null): value is Theme {
  return themeCodes.some((theme) => theme === value);
}

function isLocale(value: string | null): value is Locale {
  return localeCodes.some((locale) => locale === value);
}

function storedValue(key: (typeof storageKeys)[keyof typeof storageKeys]) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readPreferences(): Preferences {
  const storedLocale = storedValue(storageKeys.locale);
  const browserTheme = storedValue(storageKeys.theme);
  const browserLocales = navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  const locale = isLocale(storedLocale)
    ? storedLocale
    : browserLocales
        .map((language) => language.toLowerCase().split(/[-_]/)[0])
        .find(isLocale) ?? fallbackLocale;
  const theme = isTheme(browserTheme)
    ? browserTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  return { locale, theme };
}

export function SitePage(p: SitePageProps) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [settledPanda, setSettledPanda] = useState<PandaDropPose | null>(null);
  const activePreferences = preferences ?? defaultPreferences;
  const content = siteContent[activePreferences.locale];

  useEffect(() => setPreferences(readPreferences()), []);

  useEffect(() => {
    if (!preferences) {
      return;
    }

    document.documentElement.lang = preferences.locale;
    document.documentElement.dir = preferences.locale === "he" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.style.colorScheme = preferences.theme;
    try {
      window.localStorage.setItem(storageKeys.locale, preferences.locale);
      window.localStorage.setItem(storageKeys.theme, preferences.theme);
    } catch {
      // Preferences remain active for this visit if browser storage is unavailable.
    }
  }, [preferences]);

  const selectTheme = (theme: Theme) =>
    setPreferences({ ...activePreferences, theme });
  const selectLocale = (locale: Locale) =>
    setPreferences({ ...activePreferences, locale });

  return (
    <div className={p.page === "home" ? "site site--home" : "site site--privacy"}>
      <header className="controls">
        <div className="control-stack">
          <label className="language-control">
            <span className="visually-hidden">{content.languageLabel}</span>
            <select
              aria-label={content.languageLabel}
              className="language-select"
              onChange={(event) => selectLocale(event.target.value as Locale)}
              value={activePreferences.locale}
            >
              {localeCodes.map((locale) => (
                <option key={locale} value={locale}>
                  {localeDisplayNames[locale]}
                </option>
              ))}
            </select>
          </label>
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
          {p.page === "home" ? (
            <Link className="privacy-shortcut" href="/privacy">
              {content.privacyLink}
            </Link>
          ) : null}
        </div>
      </header>

      {p.page === "home" ? (
        <main
          className="panda-stage"
          aria-label={appNames[activePreferences.locale]}
        >
          <h1 className="localized-app-title">
            {appNames[activePreferences.locale]}
          </h1>
          <PhysicsPanda
            alt={content.pandaAlt}
            isActive={preferences !== null}
            onSettledChange={setSettledPanda}
          />
          {settledPanda ? (
            <div
              className="app-store-cta-frame"
              style={{
                ...storyAppStoreScaledFrameStyle,
                left: settledPanda.centerX,
                top:
                  settledPanda.topY -
                  storyAppStoreGap -
                  storyAppStoreScaledHeight,
              }}
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
          ) : null}
        </main>
      ) : (
        <main className="privacy-shell">
          <article className="privacy-document">
            <Link className="back-link" href="/">
              <span aria-hidden="true">← </span>
              {appNames[activePreferences.locale]}
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
