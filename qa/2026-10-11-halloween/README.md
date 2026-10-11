# Halloween i natychmiastowy przycisk pobierania

Przycisk App Store jest montowany wraz ze stroną i uruchamia istniejącą animację markera, niezależnie od zakończenia spadania postaci. Zachowane gesty, fizyka, języki i geometria przycisku. Trzy postacie używają dokładnych Halloweenowych grafik pluszowych z aplikacji Menimals (panda, kiwi, pingwin), na przezroczystym tle.

Weryfikacja: typecheck,27 testów Node, produkcyjny build Next PASS. Rzeczywista przeglądarka: mobile390×844, desktop dark1440×1000, CTA widoczne przez pierwsze900ms, gdy panda nadal spada, oraz podczas ponownego podrzutu klawiaturą. Brak poziomego overflow. Dane w browser-results.json. Obejrzane zrzuty w ignored media; to kontrola wyglądu, bez twierdzenia o pomiarze FPS.

Jedyny własny output: .build/task-web-menimals; nie usuwać zastanego .next. Publikacja i cleanup mają osobne receipts.

Zmiany ff66573 na main wysłane na GitHub. Produkcja jeszcze niepotwierdzona: token Vercel jest nieważny, logowanie w Brave czeka na passkey właściciela. Nie deklarować strony jako opublikowanej. Własny serwer zatrzymany, output/logi/duplikaty usunięte; cleanup.json. Pozostały jeden lekki ignored podgląd mobile do przeglądu gotowego wyglądu (5dni).

Ponowna próba publikacji11.10wieczorem: panelVercel jest zalogowany, lecz
produkcja nadal wskazuje3HVjF6GSs/f34e551. VercelCLI63.1.2 odrzuca stary
token, a formularzOAuthDeviceFlow dwukrotnie pozostawił przyciskAllowAccess
nieaktywny (również po odświeżeniu/nowejkarcie). Własne procesylogin zatrzymano.
Istniejąca instalacjaGitHubVercel11300083 obejmuje tylko3inne repozytoria.
Przygotowano szkic dodania wyłączniegmoskal/menimals.online; Save niekliknięte,
czekamy na wymaganą zgodę użytkownika na rozszerzenie dostępu integracji.
Nie zmieniono kodu strony ani uprawnień. Brak nowychbuildów/ciężkichoutputów.
