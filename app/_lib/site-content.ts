export const localeCodes = ["pl", "en"] as const;
export type Locale = (typeof localeCodes)[number];

export const themeCodes = ["light", "dark"] as const;
export type Theme = (typeof themeCodes)[number];

export const siteConfig = {
  name: "Menimals",
  siteUrl: "https://menimals.online",
  appStoreUrl: "https://apps.apple.com/",
  appIcon: "/app-icon.png",
  description: "A quiet little game about dropping and merging animals.",
  contactEmail: "contact@menimals.online",
  operator: "Async.Studio",
} as const;

export const siteSocialImageVersion = "20260804-01";

export function absoluteSiteUrl(pathname = "/") {
  return new URL(pathname, siteConfig.siteUrl).toString();
}

export const siteHomeUrl = absoluteSiteUrl("/");
export const siteSocialContent = {
  title: siteConfig.name.toLowerCase(),
  description: siteConfig.description,
  imageAlt: "Menimals panda, upside-down penguin, and kiwi plush toys.",
} as const;

const siteSocialImagePath = `/social-card?v=${siteSocialImageVersion}`;

export const siteSocialImage = {
  url: siteSocialImagePath,
  secureUrl: absoluteSiteUrl(siteSocialImagePath),
  width: 1_200,
  height: 630,
  type: "image/png",
  alt: siteSocialContent.imageAlt,
} as const;

export const siteSocialTwitterImage = {
  url: siteSocialImagePath,
  alt: siteSocialContent.imageAlt,
} as const;

const sharedLabels = {
  light: "Light",
  dark: "Dark",
} as const;

type PrivacySection = {
  readonly title: string;
  readonly paragraphs: readonly string[];
};

type LocaleContent = {
  readonly appStoreDownloadLabel: string;
  readonly pandaAlt: string;
  readonly privacyLink: string;
  readonly themeLabel: string;
  readonly light: string;
  readonly dark: string;
  readonly back: string;
  readonly privacy: {
    readonly title: string;
    readonly updated: string;
    readonly intro: string;
    readonly sections: readonly PrivacySection[];
  };
};

export const siteContent = {
  pl: {
    appStoreDownloadLabel: "Pobierz Menimals w App Store",
    pandaAlt: "Panda Menimals",
    privacyLink: "Polityka prywatności",
    themeLabel: "Motyw",
    light: sharedLabels.light,
    dark: sharedLabels.dark,
    back: "Wróć do pandy",
    privacy: {
      title: "Polityka prywatności",
      updated:
        "Ostatnia aktualizacja: 3 sierpnia 2026, 18:55 CEST (UTC+02:00; Europe/Warsaw).",
      intro:
        "Ta polityka opisuje prywatność w grze Menimals oraz na stronie menimals.online.",
      sections: [
        {
          title: "Administrator i kontakt",
          paragraphs: [
            `Operatorem Menimals jest ${siteConfig.operator}. W sprawach prywatności napisz na ${siteConfig.contactEmail}.`,
          ],
        },
        {
          title: "Dane w aplikacji",
          paragraphs: [
            "Menimals nie zakłada kont, nie zbiera ani nie przesyła danych osobowych, nie używa reklam, analityki ani zewnętrznych narzędzi śledzących.",
            "Wybrany motyw, poziom trudności i najlepsze wyniki są zapisywane wyłącznie lokalnie na urządzeniu. Dane ruchu urządzenia służą sterowaniu fizyką gry, są przetwarzane na bieżąco na urządzeniu i nie są zapisywane ani wysyłane.",
          ],
        },
        {
          title: "Przechowywanie i usuwanie",
          paragraphs: [
            "Dane lokalne pozostają na urządzeniu do czasu usunięcia aplikacji lub jej danych. Operator nie ma do nich dostępu ani kopii, dlatego nie może usuwać ich zdalnie.",
          ],
        },
        {
          title: "Strona internetowa",
          paragraphs: [
            "Strona nie używa analityki, reklam ani plików cookie. Zapamiętuje wybrany język i motyw wyłącznie w pamięci przeglądarki.",
            "Vercel, dostawca hostingu, przetwarza niezbędne dane techniczne żądań, takie jak adres IP, czas, adres strony i informacje o przeglądarce, aby dostarczać i zabezpieczać witrynę. Operator nie wykorzystuje tych danych do profilowania ani reklamy.",
          ],
        },
        {
          title: "App Store i dzieci",
          paragraphs: [
            "Apple może niezależnie przetwarzać dane związane z pobraniem aplikacji i działaniem App Store zgodnie z własnymi zasadami. Menimals nie przekazuje Apple ani innym podmiotom danych z rozgrywki.",
            "Gra nie zbiera danych dzieci ani dorosłych i nie zawiera reklam, czatu ani funkcji społecznościowych.",
          ],
        },
        {
          title: "Prawa i zmiany",
          paragraphs: [
            `Pytania oraz żądania dotyczące danych można wysłać na ${siteConfig.contactEmail}. Jeżeli sposób działania Menimals się zmieni, ta polityka zostanie zaktualizowana przed rozpoczęciem nowego przetwarzania.`,
          ],
        },
      ],
    },
  },
  en: {
    appStoreDownloadLabel: "Download Menimals on the App Store",
    pandaAlt: "Menimals panda",
    privacyLink: "Privacy policy",
    themeLabel: "Theme",
    light: sharedLabels.light,
    dark: sharedLabels.dark,
    back: "Back to the panda",
    privacy: {
      title: "Privacy policy",
      updated:
        "Last updated: 3 August 2026, 18:55 CEST (UTC+02:00; Europe/Warsaw).",
      intro:
        "This policy explains privacy in the Menimals game and on menimals.online.",
      sections: [
        {
          title: "Controller and contact",
          paragraphs: [
            `Menimals is operated by ${siteConfig.operator}. For privacy questions, email ${siteConfig.contactEmail}.`,
          ],
        },
        {
          title: "Data in the app",
          paragraphs: [
            "Menimals does not create accounts, collect or transmit personal data, or use advertising, analytics, or third-party tracking tools.",
            "The selected theme, difficulty, and best scores are stored only on the device. Device motion data controls the game physics, is processed live on the device, and is neither stored nor transmitted.",
          ],
        },
        {
          title: "Retention and deletion",
          paragraphs: [
            "Local data remains on the device until the app or its data is removed. The operator has no access to or copy of this data and therefore cannot delete it remotely.",
          ],
        },
        {
          title: "Website",
          paragraphs: [
            "The website does not use analytics, advertising, or cookies. It remembers the selected language and theme only in browser storage.",
            "Vercel, the hosting provider, processes necessary request data such as IP address, time, page address, and browser information to deliver and secure the website. The operator does not use this data for profiling or advertising.",
          ],
        },
        {
          title: "App Store and children",
          paragraphs: [
            "Apple may independently process data related to downloading the app and operating the App Store under its own policies. Menimals does not provide Apple or any other party with gameplay data.",
            "The game collects no data from children or adults and contains no advertising, chat, or social features.",
          ],
        },
        {
          title: "Rights and changes",
          paragraphs: [
            `Questions and data requests can be sent to ${siteConfig.contactEmail}. If the way Menimals works changes, this policy will be updated before any new processing begins.`,
          ],
        },
      ],
    },
  },
} as const satisfies Record<Locale, LocaleContent>;
