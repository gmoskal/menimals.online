# Halloween i natychmiastowy przycisk pobierania

**Opublikowane na https://menimals.online 11 października 2026.** Deployment
`dpl_H45fJYXpnAzJPTsoTSVaFdmXxcVo` jest READY i ma alias produkcyjny.
Wdrożony commit `f9d4c0d` zawiera zmianę grafiki i CTA z `ff66573`.

Przycisk App Store uruchamia animację markera wraz ze stroną, niezależnie od
końca spadania postaci. Panda, kiwi i pingwin używają dokładnych, przezroczystych
grafik Halloween z aplikacji. Zachowano fizykę, gesty, języki, motywy i geometrię CTA.

Wcześniejsza kontrola lokalna: typecheck, 27 testów Node i produkcyjny build Next
PASS. Browser mobile 390×844 i desktop dark 1440×1000 PASS. CTA widoczne w serii
0–900 ms, gdy panda jeszcze spadała, także po podrzucie klawiaturą. Brak poziomego
overflow. Szczegóły: `browser-results.json`. To kontrola wyglądu, bez pomiaru FPS.

Wcześniejsze próby publikacji zatrzymywał nieważny token Vercela. 11 października
wieczorem odświeżono istniejące logowanie CLI przez standardowy OAuth Device Flow.
Przycisk Allow Access uaktywnił się po interakcji w oryginalnej karcie otwartej
przez CLI. Nie rozszerzono uprawnień GitHub: szkic dodania repozytorium anulowano,
a instalacja Vercel nadal obejmuje dotychczasowe trzy repozytoria. Pytanie o zgodę
stało się nieaktualne.

Publikacja: `vercel deploy --prod --yes --json` na istniejący projekt. Zdalny build
produkcyjny i TypeScript PASS. Nowy `.vercelignore` wyklucza lokalne QA i buildy
z uploadu; dry run potwierdził 37 plików (`deployment-inputs.json`).

Publiczne HTTPS bez uwierzytelnienia: strona i trzy PNG Halloween zwracają 200.
SHA256 grafik zgadza się ze źródłami (`production-http.json`). Pierwszy matcher
HTML wymagał poprawienia dekodowania percent-encoding URL-i Next Image; końcowa
kontrola PASS. Bieżący browser mobile 390×844: trzy grafiki załadowane, CTA widoczne,
gdy żadna postać jeszcze nie osiadła, brak poziomego overflow. Ten odczyt DOM
(`production-browser.json`) jest pojedynczą obserwacją, bez nowego pomiaru 900 ms/FPS.

Po kontroli przywrócono zwykły rozmiar przeglądarki. Obejrzany zrzut produkcji
`bugs/assets/2026-10-11-halloween-publish/production.png` zachowano na pięć dni.
Nie utworzono lokalnych buildów. Usunięto zbędny zrzut szkicu dostępu GitHub
(1 plik / 32151 B). Zastany `.next` zachowano jako zasób innego zadania. Wcześniejszy
własny output `.build/task-web-menimals` został już usunięty (`cleanup.json`).
