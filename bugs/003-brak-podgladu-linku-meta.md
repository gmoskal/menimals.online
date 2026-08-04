# Bug 003 — brak podglądu linku w Meta

> Start pracy: 2026-08-04 23:28
> Koniec pracy: 2026-08-04 23:49 CEST
> Status: zweryfikowany
> Zgłoszenie: „nadal na meta się nie buduje preview, to samo było na 28gor.app zobacz wszytkie tricki które tam są zrobione” — [zrzut zgłoszenia](assets/003-brak-podgladu-linku-meta/before-meta-preview.png)
> Klasyfikacja: serwer
> Rodzaj dowodu: wizualny-statyczny
> Baza analizy: `85e39bd1137d892f4036a5e50b88fc589e8a9075`
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —
> Dostarczenie: commit `5cfbf77db1408545b56f01a77c7ea4c20fb05288` na `main`

## TL;DR

Świeże pobranie nie odtwarza braku metadanych: produkcja zwraca ten sam HTML
dla zwykłej przeglądarki, `facebookexternalhit`, `meta-externalagent` i
`Applebot`, tag `og:image` znajduje się po 3557 bajtach, systemowy parser Apple
zwraca tytuł, obraz i ikonę, a Sharing Debugger Meta po pobraniu
`https://menimals.online/` konstruuje pełny podgląd. Bezpośrednią przyczyną
widocznej „gołej” bańki jest więc stary cache podglądu w kliencie/usłudze, nie
renderowanie metadanych przez JavaScript.

W porównaniu z aktualnym `28gor.app` Menimals ma jednak dwie luki odporności:
brakuje jawnego `robots.txt` ze zgodą na crawl oraz stałego aliasu
`/og-image.jpeg` z tymi samymi nagłówkami co obraz wersjonowany. Naprawa
przeniesie te nadal używane mechanizmy, nada obrazowi nowy wersjonowany URL i po
wdrożeniu wymusi świeży scrape w Meta. Historyczne odpowiedzi HTML zależne od
User-Agent nie wrócą — 28gor usunął je z produkcji w commitach `93b7aff` i
`13e662a`, a aktualny `proxy.ts` nie rozgałęzia metadanych po crawlerze.

## Kryteria akceptacji

- **AC-1:** Udostępnienie `https://menimals.online/` w usłudze Meta buduje pełny podgląd z obrazem, tytułem i opisem zamiast samego adresu.
- **AC-2:** Dostarczanie metadanych i obrazu stosuje wszystkie mające zastosowanie mechanizmy produkcyjne użyte przez `28gor.app` dla crawlerów społecznościowych.
- **AC-3:** Grafika podglądu zachowuje zaakceptowany układ: ciemne tło, bold „menimals”, panda, odwrócony pingwin i kiwi.
- **AC-4:** Widoczna strona, fizyka zwierzaków i polityka prywatności pozostają bez zmian.

Zakres: główna strona `https://menimals.online/`, odpowiedź dla crawlerów społecznościowych, metadane Open Graph/Twitter, canonical, przekierowania hosta i statyczny obraz społecznościowy.

Poza zakresem: zakładanie aplikacji Facebook/Meta oraz wpisywanie nieistniejącego `fb:app_id`; pozostałe trasy i treść produktu poza metadanymi nie będą zmieniane.

## Szczegóły — odpowiedzialny kod

- Baza `85e39bd1137d892f4036a5e50b88fc589e8a9075` definiuje jeden wersjonowany
  obraz `/og-image-20260804-02.jpeg` w `app/_lib/site-content.ts:17-39`, a
  `app/layout.tsx:11-43` wystawia go równolegle jako Open Graph,
  `twitter:image` oraz `image_src`.
- `next.config.ts:24-34` na tej samej bazie daje nagłówki obrazu wyłącznie
  ścieżkom pasującym do `/og-image-:path(.*)`. Nie istnieje plik
  `public/og-image.jpeg`; żądanie produkcyjne zwraca `404`. Nie istnieje też
  `app/robots.ts`; `https://menimals.online/robots.txt` zwraca `404`.
- Dla porównania baza 28gor
  `f15c500adc32d7f9e7f96d04753de5fba64a65f6` ma jawne stałe aliasy obrazów w
  `next.config.ts:21-49`, plik `public/og-image.jpeg` generowany z bieżącego
  obrazu (`scripts/generate-og-images.mjs:253-261`) oraz zgodę na crawl i mapę
  witryny w `app/robots.ts:1-12`.
- Aktualny `28gor.app/proxy.ts:29-50` zajmuje się wyłącznie kanonikalizacją
  języka. Historia repo potwierdza, że eksperymentalne minimalne HTML-e dla
  crawlerów zostały usunięte (`93b7aff`, następnie `13e662a`); nie są częścią
  działającego dziś rozwiązania referencyjnego.
- Zapisane odpowiedzi produkcyjne w
  `assets/003-brak-podgladu-linku-meta/http/` mają identyczne sumy dla czterech
  User-Agentów. HTML Menimals ma 14 906 bajtów, a `og:image` zaczyna się przy
  bajcie 3557, znacznie poniżej limitu 1 MB opisanego przez Apple.
- Systemowy `LPMetadataProvider` na macOS zwrócił dla Menimals
  `title=menimals`, `imageTypes=["public.png"]` i ikonę; pełny wynik jest w
  `assets/003-brak-podgladu-linku-meta/link-preview-probe.txt`.
- Sharing Debugger Meta 4 sierpnia 2026 zwrócił kod `200`, kanoniczny URL,
  wersjonowany JPEG oraz pełny „Link Preview”. Ostrzeżenie o `fb:app_id` nie
  blokuje podglądu i nie będzie obchodzone fikcyjnym identyfikatorem.

## Proponowany test (najpierw czerwony)

- **AC-1 →** `social crawlers receive a complete preview contract from the real
  Next server` w `tests/site.test.mjs`: uruchamia prawdziwy serwer Next, pobiera
  stronę jako `facebookexternalhit` i sprawdza tytuł, opis, canonical,
  `og:image`, `twitter:image` i `image_src`. Świeży baseline już spełnia tę część;
  objaw cache zostanie sprawdzony osobno w środowisku Meta po wdrożeniu.
- **AC-2 →** ten sam test pobiera bez mocków `/robots.txt`, bieżący obraz
  wersjonowany i `/og-image.jpeg`; wymaga `200`, `image/jpeg`, CORS, cache
  immutable oraz identycznych bajtów obu JPEG-ów. Na bazie test ma być czerwony
  przez `404` dla stałego aliasu i robots.
- **AC-3 →** ten sam test wymaga bajtowej zgodności nowego obrazu
  wersjonowanego i stałego aliasu z zaakceptowanym plikiem bazowym
  `og-image-20260804-02.jpeg`; dodatkowo końcowy Debugger Meta jest dowodem
  statycznym kompozycji podglądu.
- **AC-4 →** istniejący pełny `npm test`, `npm run typecheck`, `npm run build`
  oraz inspekcja diffu. Te zachowania już są zielone na bazie i nie powinny
  uzyskać sztucznego czerwonego testu.

Test graniczny uruchamia realny Next i realny parser HTTP; nie stosuje atrap.
Zewnętrzny cache Meta pozostaje poza procesem i dlatego jego dowodem jest
kontrolowany scrape produkcyjnego URL-a.

## Rozwiązanie

- Zachować `siteSocialImage` jako jedno źródło prawdy, skopiować zaakceptowany
  JPEG pod nową nazwę wersjonowaną i stały alias `/og-image.jpeg`; stary URL
  pozostawić, by nie łamać już zapisanych odwołań.
- Dodać `app/robots.ts` w natywnym typie `MetadataRoute.Robots`, z jawnym
  `allow: "/"`, tak jak w 28gor. Sitemap nie jest potrzebny do podglądu i nie
  będzie dokładany bez osobnej potrzeby produktu.
- Wyprowadzić listę stabilnych aliasów w `next.config.ts` z jednej stałej i
  nadać im dokładnie nagłówki obrazu wersjonowanego.
- Po wdrożeniu sprawdzić publiczne HTTP dla crawlerów, uruchomić systemowy
  LinkPresentation, kliknąć `Scrape Again` w Meta i zachować wynik jako dowód.
- Nie zmieniać komponentów strony, styli, fizyki ani treści polityki prywatności.

## Raport z implementacji i testów

### RED

Polecenie (cwd: `/Users/gmm/prv/menimals.online`):

```text
node --test --test-name-pattern 'social crawlers receive a complete preview contract from the real Next server' tests/site.test.mjs
```

Pierwszy wynik na bazie `85e39bd1137d892f4036a5e50b88fc589e8a9075`:

```text
✖ social crawlers receive a complete preview contract from the real Next server (8733.782125ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13834.759792

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

404 !== 200

    at TestContext.<anonymous> (tests/site.test.mjs:262:12)
```

Linia 262 sprawdza odpowiedź prawdziwego serwera dla `/og-image.jpeg`.
Wcześniejsze asercje w tym samym teście potwierdziły `200` dla strony i obrazu
wersjonowanego; porażka nie jest błędem konfiguracji runnera. Ten przebieg jest
zapisany jako diagnostyczny, ale nie przenosi dowodu, ponieważ po nim test został
sformatowany. Finalny, zamrożony test (SHA-256
`b3b3a1c12828b8a4621f3f10a8b7243646c3c775a5e61e7a4464c7307ee753f3`) zostanie
uruchomiony retroaktywnie w detached worktree na tej samej bazie przed uznaniem
RED/GREEN.

Finalny retroaktywny RED (cwd: `~/tmp/codex/bug-003-retro`, detached HEAD
`85e39bd1137d892f4036a5e50b88fc589e8a9075`):

```text
$ node --test --test-name-pattern 'social crawlers receive a complete preview contract from the real Next server' tests/site.test.mjs
✖ social crawlers receive a complete preview contract from the real Next server (8173.00075ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13364.400916

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

404 !== 200

    at TestContext.<anonymous> (tests/site.test.mjs:268:12)
```

### Implementacja

- `app/_lib/site-content.ts`: bieżący adres obrazu ma wersję `20260804-03`.
- `public/og-image-20260804-03.jpeg` i `public/og-image.jpeg`: bajtowo identyczne
  kopie zaakceptowanego `public/og-image-20260804-02.jpeg`; suma SHA-256 każdego
  pliku to `c43b8345bff01b635d551113ba561f85d66f28dfef15a826ac2feb8175984cd6`.
- `app/robots.ts`: statyczna odpowiedź Next pozwalająca wszystkim agentom
  pobierać `/`.
- `next.config.ts`: lista stabilnych aliasów wyprowadza dla `/og-image.jpeg`
  te same immutable/CORS headers co dla wersjonowanych obrazów.
- `tests/site.test.mjs`: trwały test integracyjny granicy HTTP oraz aktualizacja
  wcześniejszego pomocniczego testu wersji.

Nie zmieniono żadnego komponentu, CSS, fizyki ani treści polityki prywatności.

### GREEN

Niezmieniony test przenoszący:

```text
$ node --test --test-name-pattern 'social crawlers receive a complete preview contract from the real Next server' tests/site.test.mjs
✔ social crawlers receive a complete preview contract from the real Next server (4154.988209ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9336.441417
```

Pełny zakres testów:

```text
$ npm test
✔ social sharing uses a static versioned JPEG like 28gor (3.703ms)
✔ social crawlers receive a complete preview contract from the real Next server (4326.706917ms)
ℹ tests 24
ℹ suites 0
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9404.835542
```

Kontrola typów:

```text
$ npm run typecheck
> tsc --noEmit
```

Build produkcyjny:

```text
$ npm run build
✓ Compiled successfully in 2.6s
✓ Generating static pages using 6 workers (5/5) in 259ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /privacy
└ ○ /robots.txt
```

- **AC-1:** zielony — realny serwer zwraca komplet tagów crawlerowi, a świeży
  scrape produkcji w Meta wyrenderował pełną kartę.
- **AC-2:** zielony — test integracyjny potwierdza robots, oba obrazy i headers.
- **AC-3:** zielony — wszystkie trzy pliki mają identyczny SHA-256, a końcowy
  render Meta zachowuje zaakceptowaną kompozycję.
- **AC-4:** zielony — 24/24, typecheck i build; diff nie obejmuje UI ani privacy.

### Weryfikacja produkcji i dostarczenie

- Commit `5cfbf77db1408545b56f01a77c7ea4c20fb05288` jest przodkiem lokalnego
  `main` i `origin/main`; wskazuje go tag `fix/003-brak-podgladu-linku-meta`.
- Vercel deployment `dpl_7Cqb2XRVN6MXhnqz7cipsjmHJ2Bi` osiągnął
  `readyState=READY`, `target=production` i został przypisany do
  `https://menimals.online`.
- Produkcyjna strona zwróciła identyczne 14 906 bajtów HTML dla przeglądarki,
  `facebookexternalhit`, `meta-externalagent` i `Applebot`; każdy wariant
  wskazuje `https://menimals.online/og-image-20260804-03.jpeg`.
- `/robots.txt`, `/og-image-20260804-03.jpeg` i `/og-image.jpeg` zwracają `200`.
  Oba JPEG-i mają `Content-Type: image/jpeg`, CORS `*`, immutable cache i sumę
  SHA-256 zaakceptowanej grafiki
  `c43b8345bff01b635d551113ba561f85d66f28dfef15a826ac2feb8175984cd6`.
- Systemowy `LPMetadataProvider` po deployu zwrócił `title=menimals`, obraz i
  ikonę, tak jak dla `28gor.app`.
- Po `Scrape Again` Sharing Debugger Meta pokazał `Response Code 200`, pełny
  podgląd i nowy `og:image ...-03.jpeg`. Jedynym ostrzeżeniem pozostało
  opcjonalne `fb:app_id`.
- `git diff --exit-code 85e39bd..5cfbf77 -- app/_components app/globals.css
  app/privacy` zakończył się kodem `0`; wynik: `UI/privacy diff: empty`.
- Finalna walidacja raportu: `VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan`.

### Cleanup — ledger tymczasowych zasobów

- `~/tmp/codex/bug-003-retro` — detached worktree bazy `85e39bd` służący
  wyłącznie do finalnego retroaktywnego RED; usunięty przez
  `git worktree remove --force`, a nieobecność ścieżki i wpisu worktree
  potwierdzona.
- Proces Next uruchamiany przez test — test rejestruje `context.after` i kończy
  go przez `SIGTERM` (z awaryjnym `SIGKILL`); końcowa kontrola procesu nie
  znalazła żadnego task-owned Next.
- `bugs/assets/003-brak-podgladu-linku-meta/` — ignorowany, zachowany dowód
  raportu, 812 KB, do usunięcia po pięciu dniach od zamknięcia zgodnie z
  retencją skilla.
- Karta Sharing Debugger Meta w Chrome — zamknięta przez finalizację sesji.
- Poprzednie ścieżki `~/tmp/codex/bug-001` i `~/tmp/codex/bug-002` oraz bieżąca
  `bug-003-retro` są nieobecne. Sweep wzorców Codex starszych niż cztery godziny
  nie znalazł pozostałości.
- Inne katalogi w `~/tmp/codex` (`bug-177-regresja-1`, `bug-180`–`bug-183`,
  `task-testflight-1.0.1`) nie były zasobami tego zadania; celowo ich nie
  dotykano.
- Wspólne katalogi repo `.next` (159 MB) i `node_modules` (374 MB) istniały
  przed zadaniem i nie są wyłączną własnością tego przebiegu; zachowano je.
- Końcowy `df -h`: `/dev/disk3s5` 460 GiB, 407 GiB użyte, 8.0 GiB wolne
  (99%).

## Dowód wizualny

- Przed: [podgląd ograniczony do samego URL-a](assets/003-brak-podgladu-linku-meta/before-meta-preview.png)
- Po: [Sharing Debugger Meta po deployu i świeżym scrape](assets/003-brak-podgladu-linku-meta/after-meta-debugger.png)

Obserwacja: końcowy render zawiera pełną kartę z bold „menimals”, pandą,
odwróconym pingwinem i kiwi, a tabela surowych właściwości wskazuje obraz
`og-image-20260804-03.jpeg`.

## Protokół weryfikacji

1. **Red od zera.** Utworzyć detached worktree na
   `85e39bd1137d892f4036a5e50b88fc589e8a9075`, skopiować do niego niezmieniony
   `tests/site.test.mjs` z commita `5cfbf77`, udostępnić istniejące
   `node_modules`, a następnie uruchomić:

   ```text
   node --test --test-name-pattern 'social crawlers receive a complete preview contract from the real Next server' tests/site.test.mjs
   ```

   Oczekiwane: `404 !== 200` przy odpowiedzi `/og-image.jpeg`. Test uruchamia
   realny Next i niczego nie mockuje.
2. **Green.** Na `main` uruchomić powyższy test (1/1), `npm test` (24/24),
   `npm run typecheck` i `npm run build`. Oczekiwane trasy builda: `/`,
   `/privacy`, `/robots.txt` oraz `/_not-found`.
3. **Środowisko.** Sprawdzić `curl -I` dla `/robots.txt`, bieżącego JPEG-a i
   `/og-image.jpeg`, następnie użyć Apple `LPMetadataProvider` i Meta Sharing
   Debugger → `Scrape Again`. Oczekiwane: `200`, pełny preview oraz
   `og:image-20260804-03.jpeg`. Zostało to wykonane na deploymencie
   `dpl_7Cqb2XRVN6MXhnqz7cipsjmHJ2Bi`.
4. **Inspekcja diffu.** Zmiany produkcyjne mogą obejmować wyłącznie
   `app/_lib/site-content.ts`, `app/robots.ts`, `next.config.ts` oraz dwa nowe
   aliasy JPEG; test jest w `tests/site.test.mjs`. Komponenty, CSS, fizyka i
   privacy nie mogą się zmienić.
5. **Spot-check AC.** AC-1: wynik Debuggera Meta i test HTML; AC-2: żądania
   robots/obrazów i headers; AC-3: identyczny SHA-256 oraz screenshot po; AC-4:
   `git diff 85e39bd..5cfbf77 -- app/_components app/globals.css app/privacy`
   ma być pusty, a pełne bramki zielone.
6. **Znane ograniczenie.** Już wysłana bańka w aplikacji może pozostać lokalnie
   zcache'owana; serwer nie może przepisać istniejącej wiadomości. Świeży cache
   Meta został unieważniony. `fb:app_id` nie dodano, bo projekt nie ma aplikacji
   Meta i ostrzeżenie nie blokuje obrazu.
