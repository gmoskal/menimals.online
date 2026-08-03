# Bug 001 — Lekka, obracająca się panda

> Start pracy: 2026-08-03 22:02 CEST
> Koniec pracy: 2026-08-03 22:14 CEST
> Status: regresja: 1
> Regresja: [panda nadal spada w zwolnionym tempie, a odbicie nie jest widoczne](./001-lekka-obracajaca-sie-panda-regresja-1.md)
> Zgłoszenie: „no ale to sie jakoś obraca działa jak balonik to ma byc dokładnie ten sam enginge pieczątka ma spaść i się odbić o potroczyć dokładnie jak w grze. teraz renderujesz jakas głupote obracjącą się piecztke która zachowuje sie jakby miała 10gramów, popraw to i wrzuć na domene”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: b1bf6ad
> Commit builda nagrania przed: b1bf6ad
> Commit builda nagrania po: 46bb60f
> Wynik obserwacji compositora: produkcja po zmianie pokazuje pionowy, nieobracający się lot, kontakt po około 2,5 s, krótkie odbicie oraz obrót i toczenie wyłącznie po kontakcie; ciało zatrzymuje się po około 3 s

## TL;DR

W wersji `b1bf6ad` wartości prędkości i grawitacji SpriteKit zostały potraktowane jak piksele CSS na sekundę, a symulacja utraciła wcześniejsze tempo świata fizyki `3.6`. Pełnoekranowy lot trwa przez to około 10–11 sekund. Jednocześnie konstruktor nadaje pandzie losowy kąt i prędkość kątową do `1.499 rad/s` jeszcze przed pierwszym kontaktem, więc długi lot pokazuje kilka pełnych obrotów. Masa `×3` jest ustawiona poprawnie, ale zgodnie z fizyką nie zwiększa przyspieszenia swobodnego spadku; sama nie może naprawić wrażenia lekkości.


## Kryteria akceptacji

1. AC-1: Panda spada ciężko ruchem przyspieszonym, a nie unosi się jak balonik.
2. AC-2: Panda nie obraca się swobodnie podczas lotu; obrót i toczenie wynikają z kontaktu z podłożem.
3. AC-3: Panda odbija się od dolnej krawędzi i naturalnie przetacza tak jak pieczątka w grze.
4. AC-4: Plansza pozostaje absolutnym światem `100vw × 100vh` od `(0,0)`, a końcowa pozycja nie jest wymuszana.
5. AC-5: Masa pandy pozostaje trzykrotnością masy pandy w grze.
6. AC-6: Zmiana zostaje opublikowana na `https://menimals.online`.

Poza zakresem: wygląd pandy, kontrolki Light/Dark, polityka prywatności i animacja przycisku App Store nie zmieniają się.

## Szczegóły — odpowiedzialny kod

Numery linii według bazowego commita `b1bf6ad`:

- `app/_lib/panda-drop-physics.ts:191-198`, `PandaDropSimulation.constructor`: grawitacja `13.92` jest przeliczona bez skali czasu świata i daje tylko `13.92 px/s²`.
- `app/_lib/panda-drop-physics.ts:202-205`: ciało dostaje losowy kąt przed startem.
- `app/_lib/panda-drop-physics.ts:235-243`: ciało dostaje losową prędkość kątową przed pierwszym kontaktem z podłożem.
- `app/_components/physics-panda.tsx:70-86`, `animate`: czas klatki trafia do solvera w skali `1:1`, więc przebycie całego `100vh` trwa wielokrotnie dłużej niż drop pieczątki obserwowany w grze.
- `app/_lib/panda-drop-physics.ts:224`: masa wynosi `14.729...`, czyli dokładnie trzykrotność masy pandy z gry. To wyklucza brak mnożnika masy jako przyczynę.
- Jedyny produkcyjny konsument modelu to `app/_components/physics-panda.tsx`; testy w `tests/site.test.mjs` są jedynym pozostałym konsumentem. Zmiana nie wpływa na politykę prywatności, kontrolki ani CTA.

Interpretacja „ten sam engine” jest związana z wcześniejszym wymaganiem „przepisz to na TypeScript”: zachowujemy rigid-body solver, obrys, grawitację, tarcie, tłumienie, sprężystość i masę z gry, a tempo pełnoekranowej prezentacji przeliczamy przez odpowiednik `physicsWorld.speed`. Nie próbujemy uruchamiać binarnego SpriteKit w przeglądarce, bo ten framework działa wyłącznie na platformach Apple.

### Wykluczone przyczyny

- Zły obrys: model używa dokładnego 10-punktowego wielokąta wygenerowanego z `panda-wielka.png` (`app/_lib/panda-drop-physics.ts:43-57`).
- Zła plansza: `.panda-stage` i `.panda-physics-stage` pozostają absolutne, `100vw × 100vh`, od `(0,0)`.
- Wymuszona pozycja końcowa: model nie ustawia końcowego `x/y`; ciało kończy ruch dopiero po uśpieniu przez solver.
- Zły pomiar obróconego obrazka: produkcja mierzy `panda.offsetWidth`, niezależnie od transformacji.

## Proponowany test (najpierw czerwony)

Mapowanie kryteriów:

- AC-1, AC-2, AC-3, AC-5 → `panda falls heavily without airborne spin and rolls only after impact` w `tests/site.test.mjs`.
- AC-4 → istniejący `physics board is an absolute 100vw by 100vh world at the origin` oraz asercje niewymuszonej pozycji w teście modelu.
- AC-6 → nagranie E2E po wdrożeniu z produkcyjnego `https://menimals.online`.

Test zachowania tworzy prawdziwy `PandaDropSimulation`, wykonuje prawdziwe kroki solvera i wymaga: kąta oraz prędkości kątowej równych zero przed lotem, pierwszego odbicia przed `2700 ms`, braku obrotu przed odbiciem, obrotu po kontakcie oraz pełnego zatrzymania przed `4000 ms`.

RED:

```text
$ node --test --test-name-pattern='panda falls heavily without airborne spin and rolls only after impact' tests/site.test.mjs
✖ panda falls heavily without airborne spin and rolls only after impact (2.936416ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected
+ 0.08726646259971647
- 0
at tests/site.test.mjs:143:10
```

## Rozwiązanie

1. Ustawić startowy kąt i startową prędkość kątową na zero. Toczenie ma powstać wyłącznie z impulsu kontaktowego asymetrycznego obrysu oraz tarcia.
2. Przywrócić skalę czasu świata fizyki `3.6` w pętli prezentacji, zachowując stały krok solvera `1/120 s`. Grawitacja pozostaje ruchem przyspieszonym, ale pełnoekranowy lot ma tempo ciężkiego dropu.
3. Zachować losową prędkość poziomą gry, obrys kolizji, tarcie, sprężystość, tłumienie, brak wymuszonej pozycji oraz masę `×3`.
4. Zaktualizować stary test, który utrwalał błędny startowy obrót, ponieważ najnowsze wymaganie użytkownika jawnie zmienia ten kontrakt.

## Raport z implementacji i testów

Zmieniono:

- `app/_lib/panda-drop-physics.ts`: startowy kąt i prędkość kątowa są zerowe; parametry rigid-body, obrys i masa `×3` pozostają bez zmian; dodano pojedyncze źródło override'ów prezentacji.
- `app/_components/physics-panda.tsx`: pętla przekazuje do solvera czas świata w skali `3.6`, nadal w stałych krokach `1/120 s`.
- `tests/site.test.mjs`: dodano trwały test ciężkiego spadku, braku obrotu w locie, odbicia, obrotu po kontakcie i czasu zatrzymania; zaktualizowano poprzedni kontrakt startowego obrotu zgodnie z nowym wymaganiem użytkownika.
- `.gitignore`: lokalne dowody `bugs/assets/` są ignorowane i nie trafiają do repozytorium.

Dostarczenie: commit `46bb60f` na `main`; wdrożenie Vercel `Fur3HSUdSmVCZpaCT99robffLzKj`, alias `https://menimals.online`.

GREEN — test regresji:

```text
$ node --test --test-name-pattern='panda falls heavily without airborne spin and rolls only after impact' tests/site.test.mjs
✔ panda falls heavily without airborne spin and rolls only after impact (10.335ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ duration_ms 121.942583
```

GREEN — pełna bramka:

```text
$ npm test
✔ home reveals the App Store scribble after the physical panda settles
✔ panda ports the game's rigid-body drop with three times its game mass
✔ panda falls heavily without airborne spin and rolls only after impact
✔ physics board is an absolute 100vw by 100vh world at the origin
✔ privacy policy is complete in Polish and English
✔ panda asset is present
✔ the exact app icon asset is present
✔ the exact App Store badge mask is present
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ duration_ms 125.752375

$ npm run typecheck
> tsc --noEmit
exit 0

$ npm run build
✓ Compiled successfully
✓ Generating static pages using 5 workers (4/4)
Route (app): /, /_not-found, /privacy
exit 0
```

Weryfikacja produkcji:

```text
$ curl -fsSIL https://menimals.online
HTTP/2 200
server: Vercel
x-matched-path: /
```

Pokrycie AC:

- AC-1: zielony — test regresji mierzy pierwsze odbicie przed `2700 ms`; obserwacja produkcji pokazuje ciężki, przyspieszony lot.
- AC-2: zielony — test wymaga kąta i prędkości kątowej `0` w locie; klatka produkcyjna po `1,5 s` pokazuje pionową pandę.
- AC-3: zielony — test wykrywa zmianę znaku prędkości pionowej i późniejszy obrót; nagranie produkcji pokazuje odbicie i toczenie.
- AC-4: zielony — istniejący test planszy przechodzi; końcowe `x/y` pozostaje wynikiem solvera.
- AC-5: zielony — test potwierdza masę `14.729010886846453`, czyli `0.82 × 1.22^9 × 3`.
- AC-6: zielony — produkcja odpowiada `HTTP/2 200`, a nagranie pochodzi z `https://menimals.online` po aliasowaniu wdrożenia.

### Cleanup

- Proces lokalnego `next start` został zatrzymany.
- Nie utworzono worktree ani brancha roboczego; zmiana została dostarczona bezpośrednio na `main` zgodnie z `AGENTS.md`.
- XcodeBuildMCP zwrócił `Transport closed` przed utworzeniem builda lub artefaktów; nie ma artefaktów Xcode do czyszczenia.
- Surowe nagrania WebM, lokalne nagranie pomocnicze, arkusz kontaktu i wcześniejsze pliki `/tmp/menimals-*` przeniesiono do systemowego Kosza; zachowano wyłącznie dowody wymienione w raporcie.
- Pobrany przez Playwright cache FFmpeg `~/Library/Caches/ms-playwright/ffmpeg-1011` przeniesiono do systemowego Kosza.
- Lokalne nagrania dowodowe `before.mp4` i `after.mp4` pozostają w ignorowanym `bugs/assets/001-lekka-obracajaca-sie-panda/` przez wymagane pięć dni od zamknięcia raportu.
- Końcowy rozmiar katalogu dowodów: `664K`. Wolne miejsce po cleanupie: `33 GiB` na `/System/Volumes/Data`.

## Dowód końcowego compositora

- Nagranie przed: [produkcja b1bf6ad — długi lot i swobodny obrót](assets/001-lekka-obracajaca-sie-panda/before.mp4)
- Nagranie po: [produkcja 46bb60f — ciężki pionowy spadek, odbicie i toczenie po kontakcie](assets/001-lekka-obracajaca-sie-panda/after.mp4)
- Klatka w locie po zmianie: [1,5 s — kąt 0](assets/001-lekka-obracajaca-sie-panda/after-production-airborne.png)
- Klatka po zatrzymaniu: [obrót nadany przez kontakt](assets/001-lekka-obracajaca-sie-panda/after-production-settled.png)

## Protokół weryfikacji

1. Red reproduction: w detached worktree na `b1bf6ad` uruchomić niezmieniony test `node --test --test-name-pattern='panda falls heavily without airborne spin and rolls only after impact' tests/site.test.mjs`; oczekiwany RED to startowy kąt `0.08726646259971647` zamiast `0`.
2. Green reproduction: na `main` uruchomić `npm test && npm run typecheck && npm run build`; oczekiwane jest 8/8 testów, TypeScript exit `0` i trzy statyczne route'y.
3. Test wykonuje prawdziwy `PandaDropSimulation` i prawdziwe kroki Matter.js; kontrolowana jest tylko sekwencja losowa kierunku poziomego, aby wynik był deterministyczny.
4. Environment verification: otworzyć `https://menimals.online` w viewport `390 × 844`; panda ma pozostać pionowa w locie, odbić się od dolnej krawędzi, przechylić/toczyć dopiero po kontakcie i pokazać CTA po około 3 s. Ten scenariusz wykonano i zapisano w `after.mp4`.
5. Diff inspection: sprawdzić wyłącznie `PandaDropSimulation`, akumulator czasu w `PhysicsPanda` i testy. Kontrolki, polityka prywatności, asset pandy i CTA nie mogą się zmienić.
6. Delivery check: `git merge-base --is-ancestor 46bb60f main` ma zwrócić `0`; tag `fix/001-lekka-obracajaca-sie-panda` ma wskazywać terminalny commit raportu, którego przodkiem jest `46bb60f`.
7. Znane ograniczenie: SpriteKit nie działa w przeglądarce; strona używa TypeScriptowego solvera rigid-body z parametrami i obrysem gry oraz dopasowaną skalą czasu pełnoekranowej prezentacji.

Walidacja prawdy wizualnej:

```text
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan
VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony
```
