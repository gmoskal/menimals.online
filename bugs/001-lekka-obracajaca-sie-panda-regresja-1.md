# Bug 001 regresja 1 — panda spada w zwolnionym tempie i nie odbija się

> Start pracy: 2026-08-03 23:20 CEST
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „no to nadal nie wygląda tak jak powinno, wygląda jak w zwolnionym tempie nie odbija się zrób głęboką analize tego i popraw”
> Uzupełnienie 1: „użyj react-spring moze do tych animacji bo to też nie jest płynne”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: afd28526ed6b0d7e6e1d400094f94a3a3b0dc10d
> Commit builda nagrania przed: 46bb60f
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —
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

### Cleanup

- Zachowywane lokalnie podczas pracy: `bugs/assets/001-lekka-obracajaca-sie-panda-regresja-1/` — dowody compositora wymagane przez Visual Truth Gate.

## Dowód końcowego compositora

- Nagranie przed: [odrzucony przez użytkownika ruch z poprzedniej poprawki](assets/001-lekka-obracajaca-sie-panda-regresja-1/before.mp4)
- Nagranie po: [ruch po poprawce](assets/001-lekka-obracajaca-sie-panda-regresja-1/after.mp4)

## Protokół weryfikacji

Do uzupełnienia po implementacji.
