export const localeCodes = [
  "en",
  "ja",
  "ko",
  "pl",
  "fr",
  "es",
  "de",
  "sv",
  "he",
] as const;
export type Locale = (typeof localeCodes)[number];

export const appNames = {
  en: "Merge Plushies",
  ja: "ぬいぐるみマージ",
  ko: "봉제인형 머지",
  pl: "Łącz Pluszaki",
  fr: "Fusion de Peluches",
  es: "Fusión de Peluches",
  de: "Plüsch-Merge",
  sv: "Gosedjurs-Merge",
  he: "Merge Plushies",
} as const satisfies Record<Locale, string>;

export const localeDisplayNames = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
  pl: "Polski",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  sv: "Svenska",
  he: "עברית",
} as const satisfies Record<Locale, string>;

export const themeCodes = ["light", "dark"] as const;
export type Theme = (typeof themeCodes)[number];

export const siteConfig = {
  name: appNames.en,
  siteUrl: "https://menimals.online",
  appStoreUrl: "https://apps.apple.com/us/app/menimals/id6797433697",
  appIcon: "/app-icon.png",
  description: "A quiet little game about dropping and merging plush creatures.",
  contactEmail: "contact@menimals.online",
  operator: "Async.Studio",
} as const;

export const siteSocialImageVersion = "20260804-03";

export function absoluteSiteUrl(pathname = "/") {
  return new URL(pathname, siteConfig.siteUrl).toString();
}

export const siteHomeUrl = absoluteSiteUrl("/");
export const siteSocialContent = {
  title: siteConfig.name,
  description: siteConfig.description,
  imageAlt: "Menimals panda, upside-down penguin, and kiwi plush toys.",
} as const;

const siteSocialImagePath = `/og-image-${siteSocialImageVersion}.jpeg`;

export const siteSocialImage = {
  url: siteSocialImagePath,
  secureUrl: absoluteSiteUrl(siteSocialImagePath),
  width: 1_200,
  height: 630,
  type: "image/jpeg",
  alt: siteSocialContent.imageAlt,
} as const;

export const siteSocialTwitterImage = {
  url: siteSocialImagePath,
  alt: siteSocialContent.imageAlt,
} as const;

type PrivacySection = {
  readonly title: string;
  readonly paragraphs: readonly string[];
};

type LocaleContent = {
  readonly appStoreDownloadLabel: string;
  readonly pandaAlt: string;
  readonly privacyLink: string;
  readonly languageLabel: string;
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
  en: {
    appStoreDownloadLabel: `Download ${appNames.en} on the App Store`,
    pandaAlt: "Menimal panda",
    privacyLink: "Privacy policy",
    languageLabel: "Language",
    themeLabel: "Theme",
    light: "Light",
    dark: "Dark",
    back: "Back to the panda",
    privacy: {
      title: "Privacy policy",
      updated: "Last updated: 21 August 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `This policy explains privacy in ${appNames.en} and on menimals.online.`,
      sections: [
        { title: "Controller and contact", paragraphs: [`${appNames.en} is operated by ${siteConfig.operator}. For privacy questions, email ${siteConfig.contactEmail}.`] },
        { title: "Data in the app", paragraphs: [`${appNames.en} does not create accounts, collect or transmit personal data, or use advertising, analytics, or third-party tracking. The selected theme, difficulty, and best scores are stored only on the device. Device motion controls the game physics, is processed live on the device, and is neither stored nor transmitted.`] },
        { title: "Retention and deletion", paragraphs: ["Local data remains on the device until the app or its data is removed. The operator has no access to or copy of it and therefore cannot delete it remotely."] },
        { title: "Website", paragraphs: ["The website does not use analytics, advertising, or cookies. It stores only the selected language and theme in the browser. Vercel processes necessary request data such as IP address, time, page address, and browser information to deliver and secure the site; the operator does not use it for profiling or advertising."] },
        { title: "App Store and children", paragraphs: [`Apple may independently process data related to downloading ${appNames.en} and operating the App Store under its own policies. The app does not provide gameplay data to Apple or others. The game collects no data from children or adults and contains no advertising, chat, or social features.`] },
        { title: "Rights and changes", paragraphs: [`Questions and data requests can be sent to ${siteConfig.contactEmail}. If the way ${appNames.en} works changes, this policy will be updated before any new processing begins.`] },
      ],
    },
  },
  ja: {
    appStoreDownloadLabel: `App Storeで${appNames.ja}をダウンロード`,
    pandaAlt: "メニマルのパンダ",
    privacyLink: "プライバシーポリシー",
    languageLabel: "言語",
    themeLabel: "テーマ",
    light: "ライト",
    dark: "ダーク",
    back: "パンダに戻る",
    privacy: {
      title: "プライバシーポリシー",
      updated: "最終更新：2026年8月21日 23:53 CEST（UTC+02:00、Europe/Warsaw）。",
      intro: `本ポリシーは、${appNames.ja}およびmenimals.onlineにおけるプライバシーについて説明します。`,
      sections: [
        { title: "管理者とお問い合わせ", paragraphs: [`${appNames.ja}は${siteConfig.operator}が運営しています。プライバシーに関するお問い合わせは${siteConfig.contactEmail}までご連絡ください。`] },
        { title: "アプリ内のデータ", paragraphs: [`${appNames.ja}はアカウントを作成せず、個人データを収集・送信せず、広告、分析、第三者のトラッキングを使用しません。選択したテーマ、難易度、ベストスコアは端末内にのみ保存されます。端末のモーションデータはゲームの物理演算に使用され、端末上でリアルタイムに処理され、保存も送信もされません。`] },
        { title: "保存と削除", paragraphs: ["ローカルデータはアプリまたはそのデータを削除するまで端末に残ります。運営者はこのデータにアクセスできず、コピーも保持しないため、遠隔で削除することはできません。"] },
        { title: "ウェブサイト", paragraphs: ["本ウェブサイトは分析、広告、Cookieを使用せず、選択した言語とテーマのみをブラウザに保存します。Vercelはサイトの配信と保護に必要なIPアドレス、時刻、ページアドレス、ブラウザ情報などを処理しますが、運営者はプロファイリングや広告に使用しません。"] },
        { title: "App Storeと子ども", paragraphs: [`Appleは${appNames.ja}のダウンロードおよびApp Storeの運営に関するデータを独自のポリシーに基づき処理する場合があります。本アプリはゲームプレイデータをAppleその他の第三者に提供しません。本ゲームは子どもまたは大人のデータを収集せず、広告、チャット、ソーシャル機能を含みません。`] },
        { title: "権利と変更", paragraphs: [`データに関するご質問やご要望は${siteConfig.contactEmail}までお送りください。${appNames.ja}の動作が変更される場合、新たな処理を開始する前に本ポリシーを更新します。`] },
      ],
    },
  },
  ko: {
    appStoreDownloadLabel: `App Store에서 ${appNames.ko} 다운로드`,
    pandaAlt: "메니멀 판다",
    privacyLink: "개인정보 처리방침",
    languageLabel: "언어",
    themeLabel: "테마",
    light: "라이트",
    dark: "다크",
    back: "판다로 돌아가기",
    privacy: {
      title: "개인정보 처리방침",
      updated: "최종 업데이트: 2026년 8월 21일 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `이 방침은 ${appNames.ko} 및 menimals.online의 개인정보 보호 방식을 설명합니다.`,
      sections: [
        { title: "운영자 및 문의", paragraphs: [`${appNames.ko}은(는) ${siteConfig.operator}에서 운영합니다. 개인정보 관련 문의는 ${siteConfig.contactEmail}로 보내 주세요.`] },
        { title: "앱 내 데이터", paragraphs: [`${appNames.ko}은(는) 계정을 만들거나 개인정보를 수집·전송하지 않으며 광고, 분석 또는 제3자 추적을 사용하지 않습니다. 선택한 테마, 난이도 및 최고 점수는 기기에만 저장됩니다. 기기 모션 데이터는 게임 물리를 위해 기기에서 실시간으로 처리되며 저장되거나 전송되지 않습니다.`] },
        { title: "보관 및 삭제", paragraphs: ["로컬 데이터는 앱 또는 앱 데이터가 삭제될 때까지 기기에 남습니다. 운영자는 이 데이터에 접근하거나 사본을 보유하지 않으므로 원격으로 삭제할 수 없습니다."] },
        { title: "웹사이트", paragraphs: ["웹사이트는 분석, 광고 또는 쿠키를 사용하지 않으며 선택한 언어와 테마만 브라우저에 저장합니다. Vercel은 사이트 제공과 보안을 위해 IP 주소, 시간, 페이지 주소 및 브라우저 정보와 같은 필수 요청 데이터를 처리하지만 운영자는 이를 프로파일링이나 광고에 사용하지 않습니다."] },
        { title: "App Store 및 아동", paragraphs: [`Apple은 자체 정책에 따라 ${appNames.ko} 다운로드 및 App Store 운영과 관련된 데이터를 독립적으로 처리할 수 있습니다. 앱은 게임 플레이 데이터를 Apple 또는 다른 제3자에게 제공하지 않습니다. 게임은 아동이나 성인의 데이터를 수집하지 않으며 광고, 채팅 또는 소셜 기능을 포함하지 않습니다.`] },
        { title: "권리 및 변경", paragraphs: [`데이터 관련 질문이나 요청은 ${siteConfig.contactEmail}로 보내 주세요. ${appNames.ko}의 작동 방식이 변경되면 새로운 처리를 시작하기 전에 이 방침을 업데이트합니다.`] },
      ],
    },
  },
  pl: {
    appStoreDownloadLabel: `Pobierz ${appNames.pl} w App Store`,
    pandaAlt: "Panda Menimal",
    privacyLink: "Polityka prywatności",
    languageLabel: "Język",
    themeLabel: "Motyw",
    light: "Jasny",
    dark: "Ciemny",
    back: "Wróć do pandy",
    privacy: {
      title: "Polityka prywatności",
      updated: "Ostatnia aktualizacja: 21 sierpnia 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `Ta polityka opisuje prywatność w grze ${appNames.pl} oraz na stronie menimals.online.`,
      sections: [
        { title: "Administrator i kontakt", paragraphs: [`Operatorem ${appNames.pl} jest ${siteConfig.operator}. W sprawach prywatności napisz na ${siteConfig.contactEmail}.`] },
        { title: "Dane w aplikacji", paragraphs: [`${appNames.pl} nie zakłada kont, nie zbiera ani nie przesyła danych osobowych oraz nie używa reklam, analityki ani zewnętrznego śledzenia. Wybrany motyw, poziom trudności i najlepsze wyniki są zapisywane wyłącznie na urządzeniu. Dane ruchu urządzenia służą fizyce gry, są przetwarzane na bieżąco i nie są zapisywane ani wysyłane.`] },
        { title: "Przechowywanie i usuwanie", paragraphs: ["Dane lokalne pozostają na urządzeniu do czasu usunięcia aplikacji lub jej danych. Operator nie ma do nich dostępu ani kopii, dlatego nie może usuwać ich zdalnie."] },
        { title: "Strona internetowa", paragraphs: ["Strona nie używa analityki, reklam ani plików cookie. Zapamiętuje wyłącznie język i motyw w pamięci przeglądarki. Vercel przetwarza niezbędne dane techniczne żądań, takie jak adres IP, czas, adres strony i informacje o przeglądarce, aby dostarczać i zabezpieczać witrynę; operator nie używa ich do profilowania ani reklamy."] },
        { title: "App Store i dzieci", paragraphs: [`Apple może zgodnie z własnymi zasadami niezależnie przetwarzać dane związane z pobraniem ${appNames.pl} i działaniem App Store. Aplikacja nie przekazuje Apple ani innym podmiotom danych z rozgrywki. Gra nie zbiera danych dzieci ani dorosłych i nie zawiera reklam, czatu ani funkcji społecznościowych.`] },
        { title: "Prawa i zmiany", paragraphs: [`Pytania oraz żądania dotyczące danych można wysłać na ${siteConfig.contactEmail}. Jeżeli sposób działania ${appNames.pl} się zmieni, ta polityka zostanie zaktualizowana przed rozpoczęciem nowego przetwarzania.`] },
      ],
    },
  },
  fr: {
    appStoreDownloadLabel: `Télécharger ${appNames.fr} sur l’App Store`,
    pandaAlt: "Panda Menimal",
    privacyLink: "Politique de confidentialité",
    languageLabel: "Langue",
    themeLabel: "Thème",
    light: "Clair",
    dark: "Sombre",
    back: "Retour au panda",
    privacy: {
      title: "Politique de confidentialité",
      updated: "Dernière mise à jour : 21 août 2026 à 23:53 CEST (UTC+02:00 ; Europe/Warsaw).",
      intro: `Cette politique explique la confidentialité dans ${appNames.fr} et sur menimals.online.`,
      sections: [
        { title: "Responsable et contact", paragraphs: [`${appNames.fr} est exploité par ${siteConfig.operator}. Pour toute question relative à la confidentialité, écrivez à ${siteConfig.contactEmail}.`] },
        { title: "Données dans l’application", paragraphs: [`${appNames.fr} ne crée pas de comptes, ne collecte ni ne transmet de données personnelles et n’utilise ni publicité, ni analyse, ni suivi tiers. Le thème, la difficulté et les meilleurs scores sont stockés uniquement sur l’appareil. Les données de mouvement contrôlent la physique du jeu, sont traitées en direct sur l’appareil et ne sont ni conservées ni transmises.`] },
        { title: "Conservation et suppression", paragraphs: ["Les données locales restent sur l’appareil jusqu’à la suppression de l’application ou de ses données. L’opérateur n’y a pas accès et n’en possède aucune copie ; il ne peut donc pas les supprimer à distance."] },
        { title: "Site web", paragraphs: ["Le site n’utilise ni analyse, ni publicité, ni cookies et mémorise uniquement la langue et le thème dans le navigateur. Vercel traite les données techniques nécessaires, comme l’adresse IP, l’heure, l’adresse de la page et les informations du navigateur, afin de fournir et sécuriser le site ; l’opérateur ne les utilise ni pour le profilage ni pour la publicité."] },
        { title: "App Store et enfants", paragraphs: [`Apple peut traiter indépendamment les données liées au téléchargement de ${appNames.fr} et au fonctionnement de l’App Store selon ses propres règles. L’application ne transmet aucune donnée de jeu à Apple ni à un tiers. Le jeu ne collecte aucune donnée concernant les enfants ou les adultes et ne contient ni publicité, ni chat, ni fonction sociale.`] },
        { title: "Droits et modifications", paragraphs: [`Les questions et demandes relatives aux données peuvent être envoyées à ${siteConfig.contactEmail}. Si le fonctionnement de ${appNames.fr} change, cette politique sera mise à jour avant tout nouveau traitement.`] },
      ],
    },
  },
  es: {
    appStoreDownloadLabel: `Descargar ${appNames.es} en el App Store`,
    pandaAlt: "Panda Menimal",
    privacyLink: "Política de privacidad",
    languageLabel: "Idioma",
    themeLabel: "Tema",
    light: "Claro",
    dark: "Oscuro",
    back: "Volver al panda",
    privacy: {
      title: "Política de privacidad",
      updated: "Última actualización: 21 de agosto de 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `Esta política explica la privacidad en ${appNames.es} y en menimals.online.`,
      sections: [
        { title: "Responsable y contacto", paragraphs: [`${appNames.es} está operado por ${siteConfig.operator}. Para consultas sobre privacidad, escribe a ${siteConfig.contactEmail}.`] },
        { title: "Datos en la aplicación", paragraphs: [`${appNames.es} no crea cuentas, no recopila ni transmite datos personales y no utiliza publicidad, analítica ni seguimiento de terceros. El tema, la dificultad y las mejores puntuaciones se guardan únicamente en el dispositivo. Los datos de movimiento controlan la física del juego, se procesan en tiempo real y no se almacenan ni transmiten.`] },
        { title: "Conservación y eliminación", paragraphs: ["Los datos locales permanecen en el dispositivo hasta que se elimina la aplicación o sus datos. El operador no tiene acceso ni copia de ellos y, por tanto, no puede eliminarlos a distancia."] },
        { title: "Sitio web", paragraphs: ["El sitio no utiliza analítica, publicidad ni cookies y solo recuerda el idioma y el tema en el navegador. Vercel procesa los datos técnicos necesarios, como dirección IP, hora, dirección de la página e información del navegador, para ofrecer y proteger el sitio; el operador no los utiliza para elaborar perfiles ni para publicidad."] },
        { title: "App Store y menores", paragraphs: [`Apple puede procesar de forma independiente datos relacionados con la descarga de ${appNames.es} y el funcionamiento del App Store conforme a sus políticas. La aplicación no proporciona datos de juego a Apple ni a terceros. El juego no recopila datos de menores ni adultos y no contiene publicidad, chat ni funciones sociales.`] },
        { title: "Derechos y cambios", paragraphs: [`Las preguntas y solicitudes sobre datos pueden enviarse a ${siteConfig.contactEmail}. Si cambia el funcionamiento de ${appNames.es}, esta política se actualizará antes de iniciar cualquier nuevo tratamiento.`] },
      ],
    },
  },
  de: {
    appStoreDownloadLabel: `${appNames.de} im App Store laden`,
    pandaAlt: "Menimal-Panda",
    privacyLink: "Datenschutz",
    languageLabel: "Sprache",
    themeLabel: "Darstellung",
    light: "Hell",
    dark: "Dunkel",
    back: "Zurück zum Panda",
    privacy: {
      title: "Datenschutzerklärung",
      updated: "Zuletzt aktualisiert: 21. August 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `Diese Erklärung beschreibt den Datenschutz in ${appNames.de} und auf menimals.online.`,
      sections: [
        { title: "Verantwortlicher und Kontakt", paragraphs: [`${appNames.de} wird von ${siteConfig.operator} betrieben. Datenschutzfragen können an ${siteConfig.contactEmail} gesendet werden.`] },
        { title: "Daten in der App", paragraphs: [`${appNames.de} erstellt keine Konten, erhebt oder übermittelt keine personenbezogenen Daten und verwendet weder Werbung noch Analysen oder Tracking Dritter. Design, Schwierigkeitsgrad und Bestwerte werden nur auf dem Gerät gespeichert. Bewegungsdaten steuern die Spielphysik, werden live auf dem Gerät verarbeitet und weder gespeichert noch übertragen.`] },
        { title: "Speicherung und Löschung", paragraphs: ["Lokale Daten bleiben auf dem Gerät, bis die App oder ihre Daten gelöscht werden. Der Betreiber hat weder Zugriff noch eine Kopie und kann sie daher nicht aus der Ferne löschen."] },
        { title: "Website", paragraphs: ["Die Website verwendet keine Analysen, Werbung oder Cookies und speichert nur Sprache und Darstellung im Browser. Vercel verarbeitet notwendige technische Anfragedaten wie IP-Adresse, Zeitpunkt, Seitenadresse und Browserinformationen, um die Website bereitzustellen und zu schützen; der Betreiber nutzt sie nicht für Profilbildung oder Werbung."] },
        { title: "App Store und Kinder", paragraphs: [`Apple kann Daten zum Download von ${appNames.de} und zum Betrieb des App Store nach eigenen Richtlinien selbstständig verarbeiten. Die App übermittelt weder Apple noch anderen Stellen Spieldaten. Das Spiel erhebt keine Daten von Kindern oder Erwachsenen und enthält keine Werbung, Chats oder sozialen Funktionen.`] },
        { title: "Rechte und Änderungen", paragraphs: [`Fragen und Datenanfragen können an ${siteConfig.contactEmail} gesendet werden. Ändert sich die Funktionsweise von ${appNames.de}, wird diese Erklärung vor Beginn einer neuen Verarbeitung aktualisiert.`] },
      ],
    },
  },
  sv: {
    appStoreDownloadLabel: `Hämta ${appNames.sv} i App Store`,
    pandaAlt: "Menimal-panda",
    privacyLink: "Integritetspolicy",
    languageLabel: "Språk",
    themeLabel: "Tema",
    light: "Ljust",
    dark: "Mörkt",
    back: "Tillbaka till pandan",
    privacy: {
      title: "Integritetspolicy",
      updated: "Senast uppdaterad: 21 augusti 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `Denna policy beskriver integriteten i ${appNames.sv} och på menimals.online.`,
      sections: [
        { title: "Personuppgiftsansvarig och kontakt", paragraphs: [`${appNames.sv} drivs av ${siteConfig.operator}. Frågor om integritet kan skickas till ${siteConfig.contactEmail}.`] },
        { title: "Data i appen", paragraphs: [`${appNames.sv} skapar inga konton, samlar inte in eller överför personuppgifter och använder inte annonsering, analys eller spårning från tredje part. Tema, svårighetsgrad och bästa resultat lagras endast på enheten. Rörelsedata styr spelets fysik, behandlas direkt på enheten och varken lagras eller överförs.`] },
        { title: "Lagring och radering", paragraphs: ["Lokala data finns kvar på enheten tills appen eller dess data tas bort. Operatören har varken åtkomst till eller en kopia av dessa data och kan därför inte radera dem på distans."] },
        { title: "Webbplats", paragraphs: ["Webbplatsen använder inte analys, annonsering eller cookies och minns endast språk och tema i webbläsaren. Vercel behandlar nödvändiga tekniska uppgifter som IP-adress, tid, sidadress och webbläsarinformation för att leverera och skydda webbplatsen; operatören använder dem inte för profilering eller annonsering."] },
        { title: "App Store och barn", paragraphs: [`Apple kan självständigt behandla data som rör hämtningen av ${appNames.sv} och driften av App Store enligt sina regler. Appen lämnar inte speldata till Apple eller andra. Spelet samlar inte in data från barn eller vuxna och innehåller ingen annonsering, chatt eller sociala funktioner.`] },
        { title: "Rättigheter och ändringar", paragraphs: [`Frågor och databegäranden kan skickas till ${siteConfig.contactEmail}. Om hur ${appNames.sv} fungerar ändras kommer denna policy att uppdateras innan någon ny behandling börjar.`] },
      ],
    },
  },
  he: {
    appStoreDownloadLabel: `הורדת ${appNames.he} מה-App Store`,
    pandaAlt: "פנדה מסוג Menimal",
    privacyLink: "מדיניות פרטיות",
    languageLabel: "שפה",
    themeLabel: "ערכת נושא",
    light: "בהיר",
    dark: "כהה",
    back: "חזרה לפנדה",
    privacy: {
      title: "מדיניות פרטיות",
      updated: "עדכון אחרון: 21 באוגוסט 2026, 23:53 CEST (UTC+02:00; Europe/Warsaw).",
      intro: `מדיניות זו מסבירה את נוהלי הפרטיות ב-${appNames.he} ובאתר menimals.online.`,
      sections: [
        { title: "הגורם האחראי ויצירת קשר", paragraphs: [`${appNames.he} מופעלת על ידי ${siteConfig.operator}. לשאלות בנושא פרטיות ניתן לפנות אל ${siteConfig.contactEmail}.`] },
        { title: "נתונים באפליקציה", paragraphs: [`${appNames.he} אינה יוצרת חשבונות, אינה אוספת או מעבירה מידע אישי ואינה משתמשת בפרסום, בניתוח נתונים או במעקב של צד שלישי. ערכת הנושא, רמת הקושי והתוצאות נשמרות במכשיר בלבד. נתוני התנועה שולטים בפיזיקה של המשחק, מעובדים בזמן אמת במכשיר ואינם נשמרים או מועברים.`] },
        { title: "שמירה ומחיקה", paragraphs: ["הנתונים המקומיים נשארים במכשיר עד למחיקת האפליקציה או הנתונים שלה. למפעיל אין גישה או עותק שלהם, ולכן אינו יכול למחוק אותם מרחוק."] },
        { title: "אתר האינטרנט", paragraphs: ["האתר אינו משתמש בניתוח נתונים, בפרסום או בעוגיות ושומר רק את השפה ואת ערכת הנושא בדפדפן. Vercel מעבדת נתוני בקשה טכניים הכרחיים, כגון כתובת IP, שעה, כתובת עמוד ופרטי דפדפן, כדי לספק ולאבטח את האתר; המפעיל אינו משתמש בהם ליצירת פרופילים או לפרסום."] },
        { title: "App Store וילדים", paragraphs: [`Apple עשויה לעבד באופן עצמאי נתונים הקשורים להורדת ${appNames.he} ולהפעלת ה-App Store בהתאם למדיניות שלה. האפליקציה אינה מוסרת נתוני משחק ל-Apple או לאחרים. המשחק אינו אוסף נתונים מילדים או ממבוגרים ואינו כולל פרסום, צ'אט או תכונות חברתיות.`] },
        { title: "זכויות ושינויים", paragraphs: [`שאלות ובקשות בנושא נתונים ניתן לשלוח אל ${siteConfig.contactEmail}. אם אופן הפעולה של ${appNames.he} ישתנה, המדיניות תעודכן לפני תחילת עיבוד חדש.`] },
      ],
    },
  },
} as const satisfies Record<Locale, LocaleContent>;
