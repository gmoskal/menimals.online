# Bug 001 regresja 1 — panda spada w zwolnionym tempie i nie odbija się

> Start pracy: 2026-08-03 23:20 CEST
> Koniec pracy: 2026-08-03 23:37 CEST
> Status: zablokowany: brak dowodu końcowego compositora
> Zgłoszenie: „no to nadal nie wygląda tak jak powinno, wygląda jak w zwolnionym tempie nie odbija się zrób głęboką analize tego i popraw”
> Uzupełnienie 1: „użyj react-spring moze do tych animacji bo to też nie jest płynne”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: afd28526ed6b0d7e6e1d400094f94a3a3b0dc10d
> Commit builda nagrania przed: 46bb60f
> Commit builda nagrania po: 15b7188
> Wynik obserwacji compositora: niezweryfikowany — brak dostępnej przeglądarki do nagrania końcowego renderu
> Raport bazowy: ./001-lekka-obracajaca-sie-panda.md

## TL;DR

Poprzednia poprawka przyspieszyła cały nieprawidłowo zamodelowany przebieg przez `timeScale: 3.6`, ale nie zmieniła jego geometrii. Produkcyjny pomiar nadal daje **2528 ms widocznego lotu** i tylko **16,2 px pierwszego odbicia**. Stary test sprawdzał wyłącznie, czy prędkość choć raz zmieniła znak, więc pozostał zielony mimo obu widocznych wad.

Głębsza różnica względem gry jest architektoniczna: `MatchGameScene.updateAutomaticDrop` prowadzi pieczątkę osobno aż do `landingY`, a `SKPhysicsBody` tworzy dopiero przy powierzchni. Strona natomiast uruchamia Matter.js już nad ekranem i każe temu samemu ciału pokonać całe `100vh` z wartością grawitacji skopiowaną 1:1 do pikseli CSS. Sam mnożnik czasu nie może zwiększyć wysokości odbicia, a ręczne skoki transformacji raz na `requestAnimationFrame` nie interpolują pozy między próbkami solvera.

## Kryteria akceptacji

- **AC-1:** Panda porusza się w czasie rzeczywistym z ciężkim, przyspieszonym tempem; od pierwszej widocznej klatki do pierwszego kontaktu upływa najwyżej `1200 ms` w każdym wspieranym formacie ekranu.
- **AC-2:** Po pierwszym kontakcie z dolną krawędzią panda wykonuje wyraźnie widoczne odbicie o wysokości co najmniej `10%` własnego rozmiaru, zamiast jedynie numerycznej zmiany znaku prędkości.
- **AC-3:** Panda nie obraca się podczas swobodnego lotu; obrót i toczenie zaczynają się dopiero wskutek kontaktu z podłożem lub ścianą.
- **AC-4:** Warstwa DOM nanosi kolejne pozy fizyki płynnie przy użyciu `react-spring`, bez zastępowania nią silnika kolizji ani dodawania sprężynowego „balonikowego” ruchu.
- **AC-5:** Plansza pozostaje absolutnie ustawiona w `(0, 0)` i ma dokładnie `100vw × 100vh`; panda, przycisk App Store, ikona aplikacji, Light/Dark i link do polityki zachowują dotychczasowy układ i działanie poza zmianą trajektorii pandy.
- **AC-6:** Zmiana zostaje wdrożona na `menimals.online`, a końcowy ruch jest zweryfikowany nagraniem z produkcyjnego compositora.

Dokładny cel: `app/_lib/panda-drop-physics.ts` oraz sposób prezentowania pozy w `app/_components/physics-panda.tsx`. Konsumenci współdzielonych elementów zostaną zinwentaryzowani przed zmianą. Poza zakresem: fizyka aplikacji iOS, treść polityki prywatności, routing, konfiguracja poczty/DNS i wygląd pozostałych kontrolek.

## Szczegóły — odpowiedzialny kod

Numery linii strony odnoszą się do bazowego commita `afd28526ed6b0d7e6e1d400094f94a3a3b0dc10d`; numery linii gry do `806a819b0a2347782f89b34835e62436d0ed8acd`:

- `app/_lib/panda-drop-physics.ts:197-199` przypisuje `13.92` bezpośrednio jako `px/s²`. Jest to parametr krótkiej fazy fizycznej SpriteKit, a nie kalibracja pełnoekranowej prezentacji WWW.
- `app/_lib/panda-drop-physics.ts:41-46` ustawia `timeScale: 3.6`. Skalowanie zegara skraca czas odtwarzania tej samej trajektorii, lecz z definicji nie zmienia jej przestrzennej amplitudy; dlatego odbicie pozostało na poziomie `16,2 px`.
- `app/_components/physics-panda.tsx:70-97` wykonuje wiele kroków solvera w jednym `requestAnimationFrame`, a potem zapisuje tylko ostatnią transformację DOM. Przy nierównych klatkach pozycje pośrednie nie są prezentowane.
- W grze `MatchGameScene.swift:2082-2110` kontrolowany obiekt dojeżdża do wyliczonego `landingY`; dopiero `dropCurrentStamp` (`2453-2469`) przekazuje tę pozycję do `spawnDroppedStamp`, który tworzy ciało i nadaje mu prędkość (`2503-2558`). Poprzedni port błędnie potraktował fazę rigid-body jako pełnoekranowy lot.
- Odtworzenie protokołu raportu bazowego na bieżącym kodzie: test `panda falls heavily without airborne spin and rolls only after impact` nadal przechodzi. To dowodzi, że wcześniejszy green mierzył zbyt słaby kontrakt, nie że zgłoszenie użytkownika zniknęło.
- Rejestr wzorców `bugs/PATTERNS.md` nie zawiera jeszcze klasy dla błędnej skali świata fizycznego ani testu temporalnego mierzącego tylko zmianę znaku.
- Jedynym produkcyjnym konsumentem `PandaDropSimulation` jest `PhysicsPanda`; drugim konsumentem są trwałe testy `tests/site.test.mjs`. `PhysicsPanda` jest używany tylko na stronie głównej przez `SitePage`. Zmiana pozostaje lokalna dla pandy i nie modyfikuje CTA, nagłówka, routingu ani polityki.

### Dlaczego poprzedni fix zawiódł

Tryb regresji: **fix niepełny / test sprawdzał niewłaściwy wynik**. Usunięto obrót w locie i skrócono przebieg z około 10 s do około 2,5 s, lecz test dopuścił każde odbicie większe od zera i lot do `2700 ms`. Nie mierzył tego, co użytkownik ocenia na ekranie: ciężkiego tempa w pikselach i widocznej wysokości odbicia.

Debugger iOS nie dostarczył pomiaru runtime (`XcodeBuildMCP/session_show_defaults`: `Transport closed`). Wniosek o dwuetapowej ścieżce pochodzi bezpośrednio z produkcyjnego kodu gry; pomiary `2528 ms` i `16,2 px` pochodzą z prawdziwej produkcyjnej ścieżki WWW i stały się asercjami RED.

## Proponowany test (najpierw czerwony)

- AC-1 → `panda crosses the visible screen at full speed instead of slow motion` mierzy czas od pierwszej widocznej pozy do pierwszego odbicia (`tests/site.test.mjs`).
- AC-2 → `panda's first floor impact creates a visibly tall rebound` mierzy wysokość pierwszego odbicia w pikselach i odnosi ją do rozmiaru pandy (`tests/site.test.mjs`).
- AC-3 → test kąta przed pierwszym kontaktem i zmiany kąta po kontakcie (`tests/site.test.mjs`).
- AC-4 → `react-spring presents the sampled rigid-body trajectory` pilnuje produkcyjnego adaptera, a końcowe nagranie compositora jest dowodem płynności.
- AC-5 → istniejący `physics board is an absolute 100vw by 100vh world at the origin` oraz E2E produkcji.
- AC-6 → deploy produkcyjny, nagranie `after.mp4` i walidator Visual Truth Gate.

AC-5 już jest zielony na bazie; ta regresja nie przeczy temu zachowanemu wymaganiu. AC-6 nie może być RED w teście jednostkowym — czerwonym dowodem środowiska jest zachowane nagranie obecnej produkcji `before.mp4`.

## Rozwiązanie

1. Zachować Matter.js, dokładny obrys, masę `×3`, tarcie, tłumienie i zerowy obrót startowy. Zamiast globalnego `timeScale` wyrazić przyspieszenie fazy pełnoekranowej względem wysokości viewportu, bo to ta faza nie istnieje jako pełny rigid-body w grze.
2. Dla nagiej dolnej granicy użyć istniejącej w profilu gry wartości `lightStampRestitution = 0.34`. Na stronie nie ma stosu innych pieczątek, który w grze dostarcza kolejnych kontaktów; ta wartość daje wymagane, falsyfikowalne minimum odbicia bez wymyślania parametru spoza profilu gry.
3. Próbkować niezmieniony solver stałym krokiem `120 Hz` do kompletnej trajektorii. Po kontakcie zachować osobną skalę prezentacji toczenia, aby długa faza usypiania Matter nie przywracała slow motion, bez zmiany geometrycznej ścieżki.
4. Odtwarzać playhead liniowym `useSpring` z `@react-spring/web` i interpolować zapisane pozy w `animated(Image)`. React Spring służy wyłącznie jako płynny zegar/adapter DOM; nie zastępuje kolizji sprężyną. Oficjalna dokumentacja potwierdza, że `animated` aktualizuje element poza renderem React, a interpolacje mogą mapować `SpringValue` na transformację.
5. Zachować obecne zachowanie reduced motion: natychmiast pokazać ostatnią pozę i CTA.

Wybrana kalibracja jest repo-native i odwracalna: najwyżej `1200 ms` widocznego lotu i co najmniej `10%` rozmiaru pierwszego odbicia. Nie zmieniamy fizyki aplikacji iOS ani współdzielonych assetów.

## Raport z implementacji i testów

### RED

Polecenie (cwd `/Users/gmm/prv/menimals.online`):

```sh
node --test --test-name-pattern="panda crosses the visible screen|panda's first floor impact|react-spring presents" tests/site.test.mjs
```

Wynik na bazie `afd28526ed6b0d7e6e1d400094f94a3a3b0dc10d` z finalnymi, niezmienianymi później asercjami:

```text
✖ panda crosses the visible screen at full speed instead of slow motion (12.53575ms)
✖ panda's first floor impact creates a visibly tall rebound (6.148042ms)
✖ react-spring presents the sampled rigid-body trajectory (3.291833ms)
ℹ tests 3
ℹ pass 0
ℹ fail 3

AssertionError [ERR_ASSERTION]: visible drop took 2528 ms
AssertionError [ERR_ASSERTION]: first rebound rose 16.2 px; expected at least 22.8 px
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /@react-spring\/web/.
```

Wcześniejsza bramka, która nie wykrywa regresji:

```text
✔ panda falls heavily without airborne spin and rolls only after impact (10.642833ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

### Implementacja

- `app/_lib/panda-drop-physics.ts`:
  - skaluje grawitację pełnoekranowej fazy wejścia do wysokości viewportu zamiast odtwarzać całą fizykę z globalnym `timeScale: 3.6`;
  - konfiguruje właściwości statycznych granic po utworzeniu ciała. Matter.js zerował `restitution` i nadpisywał `friction` przy `isStatic: true`, więc wcześniejsza podłoga miała w runtime `restitution = 0`, mimo deklarowanego `0.22`;
  - dolna granica używa istniejącego parametru gry `lightStampRestitution = 0.34`, ściany zachowują `boundaryRestitution = 0.22`;
  - tworzy pełną, deterministyczną trajektorię Matter w `120 Hz`, rejestruje pierwszy kontakt i interpoluje pozy między próbkami;
  - zachowuje dokładny wielokąt pandy, masę `14.729…` (`3×` masa gry), tarcie, tłumienie i brak obrotu przed kontaktem.
- `app/_components/physics-panda.tsx`:
  - usuwa ręczny akumulator `requestAnimationFrame` i wielokrotne skoki transformacji;
  - odtwarza liniowy playhead przez `useSpring`, a `animated(Image)` nanosi interpolowaną transformację bez renderu React dla każdej klatki;
  - sprężyna nie liczy trajektorii ani zderzeń — te nadal pochodzą wyłącznie z Matter.js;
  - zachowuje restart przy zmianie rozmiaru, reduced motion oraz callback pozy końcowej dla CTA.
- `package.json` / `package-lock.json`: dodano docelowy pakiet webowy `@react-spring/web@10.1.2`.
- `tests/site.test.mjs`: dodano trzy trwałe bramki regresji bez zmiany asercji po RED.

Dostarczenie: commit `15b7188` na `main`.

### GREEN i bramki zakresu

Nowe testy, to samo polecenie i te same asercje co w RED:

```text
✔ panda crosses the visible screen at full speed instead of slow motion (5.36275ms)
✔ panda's first floor impact creates a visibly tall rebound (2.213875ms)
✔ react-spring presents the sampled rigid-body trajectory (1.719208ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Pełny standardowy zestaw `npm test`:

```text
✔ home reveals the App Store scribble after the physical panda settles
✔ panda ports the game's rigid-body drop with three times its game mass
✔ panda falls heavily without airborne spin and rolls only after impact
✔ panda crosses the visible screen at full speed instead of slow motion
✔ panda's first floor impact creates a visibly tall rebound
✔ react-spring presents the sampled rigid-body trajectory
✔ physics board is an absolute 100vw by 100vh world at the origin
✔ privacy policy is complete in Polish and English
✔ panda asset is present
✔ the exact app icon asset is present
✔ the exact App Store badge mask is present
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

`npm run typecheck`:

```text
> tsc --noEmit
```

`npm run build`:

```text
✓ Compiled successfully
✓ Generating static pages using 5 workers (4/4)
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /privacy
```

Pomiar kompletnej trajektorii z produkcyjnego modelu dla kierunku deterministycznego:

```text
1440×900, panda 420 px: lot 1012 ms, odbicie 76.8 px (18.3%), koniec 4218 ms
390×844, panda 228 px: lot 1003 ms, odbicie 34.2 px (15.0%), koniec 2040 ms
320×568, panda 188 px: lot  995 ms, odbicie 23.2 px (12.3%), koniec 2247 ms
```

Produkcja:

```text
deployment dpl_2xe1QaJnTkUhBsXjiM8nT3N3fYNq
target production
status Ready
alias https://menimals.online
HTTP/2 200
```

Mapa AC:

- AC-1: zielony — test czasu lotu + pomiar trzech viewportów.
- AC-2: zielony — test wysokości odbicia + pomiar trzech viewportów.
- AC-3: zielony — `panda falls heavily without airborne spin and rolls only after impact`.
- AC-4: kod/test pomocniczy zielony; końcowa płynność nadal wymaga nagrania compositora.
- AC-5: zielony — `physics board is an absolute 100vw by 100vh world at the origin`.
- AC-6: deploy i HTTP zielone; brak końcowego nagrania uniemożliwia wizualne zamknięcie.

Visual Truth Gate przy zamknięciu przebiegu:

```text
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan
VISUAL_TRUTH_GATE=FAIL
- `--claim-fixed` wymaga dokładnie `> Status: zweryfikowany`
- brak pliku dowodowego: /Users/gmm/prv/menimals.online/bugs/assets/001-lekka-obracajaca-sie-panda-regresja-1/after.mp4
```

Porażka trybu `--claim-fixed` jest zamierzonym fail-closed: kod jest na produkcji, ale bez nagrania nie wolno nazwać wyniku zweryfikowanym fixem.

### Pozostałe kroki dostarczenia

- Nagrać końcowy render z `https://menimals.online` w `390 × 844` przez dostępny browser/compositor i zapisać jako `bugs/assets/001-lekka-obracajaca-sie-panda-regresja-1/after.mp4`.
- Porównać klatki spadku, pierwszego kontaktu, wierzchołka odbicia i końca toczenia z `before.mp4`, następnie uruchomić oba tryby walidatora Visual Truth Gate.

### Cleanup

- Zatrzymano lokalny proces `next start` (sesja `58788`); port `3000` nie ma procesu nasłuchującego.
- XcodeBuildMCP nie uruchomił builda (`Transport closed`). Natywne `xcodebuildmcp-cleanup --dry-run`: `candidateCount: 0`, `bytes: 0`; nic do usunięcia.
- Nie utworzono worktree, brancha ani taskowego DerivedData. Jedyny worktree repozytorium to `main`; `~/tmp/codex/bug-000` i `~/tmp/codex/bug--001` nie istnieją.
- Globalny sweep `~/tmp`: 69 nieużywanych `TemporaryDirectory.*` starszych niż cztery godziny (około `0.14 MB`) przeniesiono odzyskiwalnie do Kosza; po operacji pozostało `0`. Dwa aktywnie używane sockety SSH/VS Code pozostawiono.
- `/tmp`: brak rozpoznawalnych taskowych `bug*.mp4/png/jpg` i `codex-*`.
- Wygasłe dowody (>5 dni): `0` katalogów, `0 B`. Oryginalny i bieżący katalog dowodów zamknięto dzisiaj, więc pozostają w pięciodniowym oknie.
- Zachowano `bugs/assets/001-lekka-obracajaca-sie-panda-regresja-1/` (`120 KB`, potwierdzone przez `git check-ignore`) z odrzuconym `before.mp4`; musi przetrwać do zdobycia końcowego dowodu.
- Zachowano obce katalogi `~/tmp/codex/bug-177-regresja-1` (`1.3 GB`), `bug-181` (`61 MB`), `bug-183` (`225 MB`) i `task-testflight-1.0.1` (`1.4 MB`): nie należą do tego repozytorium i nie da się tu udowodnić ich dostarczenia ani braku aktywnego właściciela. Puste obce katalogi także pozostawiono.
- Stan końcowy: `~/tmp` `1.6 GB`, `~/.codex` `18 GB`, globalny Xcode DerivedData `182 MB`; wolne `33 GiB` na wolumenie danych.

## Dowód końcowego compositora

- Nagranie przed: [odrzucony przez użytkownika ruch z poprzedniej poprawki](assets/001-lekka-obracajaca-sie-panda-regresja-1/before.mp4)
- Nagranie po: [ruch po poprawce](assets/001-lekka-obracajaca-sie-panda-regresja-1/after.mp4)

## Protokół weryfikacji

1. **RED:** w detached worktree na `afd28526ed6b0d7e6e1d400094f94a3a3b0dc10d` skopiować niezmieniony `tests/site.test.mjs` z commita `15b7188` i uruchomić:
   `node --test --test-name-pattern="panda crosses the visible screen|panda's first floor impact|react-spring presents" tests/site.test.mjs`.
   Oczekiwane są trzy porażki: `2528 ms`, `16.2 px < 22.8 px` oraz brak `@react-spring/web`.
2. **GREEN:** na `main` uruchomić `npm test && npm run typecheck && npm run build`; oczekiwane `11/11`, TypeScript exit `0` i trzy statyczne route'y. Test fizyki uruchamia prawdziwy Matter.js i prawdziwe granice; kontrolowana jest tylko funkcja losująca kierunek poziomy. Test źródłowy React Spring jest bramką pomocniczą, nie dowodem wizualnym.
3. **Środowisko:** `npx --yes vercel@latest inspect https://menimals-online-zfgiogvoo-gmoskals-projects-1e7a5b2a.vercel.app --wait` ma pokazać deployment `dpl_2xe1QaJnTkUhBsXjiM8nT3N3fYNq`, `target production`, `Ready` i alias `https://menimals.online`; `curl -I https://menimals.online` ma zwrócić `200`.
4. **Dowód wizualny pozostaje zablokowany:** otworzyć produkcję w `390 × 844`, nagrać pełny przebieg do pojawienia CTA i zapisać `after.mp4`. Oczekiwane: około 1 s widocznego lotu bez obrotu, wyraźne odbicie, obrót/toczenie dopiero po kontakcie i płynna interpolacja bez skoków. In-app Browser zwrócił `No browser is available`; iOS debugger zwrócił `Transport closed`.
5. **Diff:** sprawdzić `createBoundary`, `PandaDropSimulation`, `createPandaDropTrajectory`, `samplePandaDropTrajectory` oraz `PhysicsPanda`. Nie mogą zmienić się asset pandy, plansza `100vw × 100vh`, polityka, kontrolki i CTA.
6. **Delivery:** `git merge-base --is-ancestor 15b7188 main` ma zwrócić `0`; `git rev-parse 'fix/001-lekka-obracajaca-sie-panda-regresja-1^{commit}'` ma wskazać `15b7188`.
7. **Spot-check AC:** AC-1/2 — dwa nowe testy i pomiar trzech viewportów; AC-3 — istniejący test lotu/obrotu; AC-4 — import i playhead plus obowiązkowe nagranie; AC-5 — test planszy; AC-6 — Vercel Ready + końcowe nagranie.
8. **Znane ograniczenia:** końcowa prawda compositora nie została zdobyta, więc raport jest zablokowany mimo deployu. `npm audit --omit=dev` zgłasza trzy wysokie podatności w istniejącym `next@16.2.6`/jego zależnościach; aktualizacja frameworka jest osobnym zakresem i nie była mieszana z poprawką fizyki.

### Uzupełnienie 2 — wspólny świat pandy i kiwi

Na późniejsze, jawne życzenie użytkownika pojedynczy interfejs `createPandaDropTrajectory(release)` został zastąpiony wspólnym `createMenimalDropTrajectory(releases)`. Pomocnicza asercja źródłowa została zaktualizowana do nowej nazwy; rzeczywisty kontrakt pozostaje ten sam: gest tworzy trajektorię Matter.js, a React Spring wyłącznie prezentuje jej klatki.
