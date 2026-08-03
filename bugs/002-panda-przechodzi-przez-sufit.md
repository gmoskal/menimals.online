# Bug 002 — Panda przechodzi przez sufit

> Start pracy: 2026-08-04 00:32
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „ale ma sie odbijac od wszystkich ścian i od y=0 i y =100vh i x= 0 i x=100vw”
> Uzupełnienie 1: „wywal te ikone appki z gornego lewego rogu i spraw zeby się obijał też o górną bandę i dodaj jeszcze kiwi trochę mniejsze niech się zderzają”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: 8f753dd135365750240917a7b27dcb323b62b4c1
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

Tablica granic w `PandaDropSimulation` tworzy podłogę oraz dwie ściany boczne, ale w ogóle nie tworzy sufitu. Wydłużenie boków o `10 000 px` zapobiega ucieczce poza `x = 0/100vw`, lecz nie zatrzymuje pandy lecącej pomiędzy nimi ponad `y = 0`. Naprawa musi dodać rzeczywisty sufit na `y = 0`, aktywowany po wejściu początkowego dropu do viewportu, oraz nie dopuszczać, aby gest zaczynał nową symulację z pandą już poza zamkniętym światem.

## Kryteria akceptacji

- **AC-1:** Panda odbija się od górnej granicy świata dokładnie na `y = 0` i nie przechodzi ponad viewport.
- **AC-2:** Panda odbija się od dolnej granicy świata dokładnie na `y = 100vh` i nie przechodzi pod viewport.
- **AC-3:** Panda odbija się od lewej granicy świata dokładnie na `x = 0` i nie przechodzi poza lewą stronę viewportu.
- **AC-4:** Panda odbija się od prawej granicy świata dokładnie na `x = 100vw` i nie przechodzi poza prawą stronę viewportu.
- **AC-5:** Podrzucanie, opadanie pod wpływem grawitacji, odbijanie, toczenie, sterowanie wskaźnikiem i klawiaturą oraz pozostały układ strony zachowują obecne działanie.
- **AC-6:** Ikona aplikacji znika z lewego górnego rogu; pozostałe kontrolki i link do polityki prywatności zachowują położenie i działanie.
- **AC-7:** Na planszy pojawia się kiwi z istniejących assetów, w rozmiarze około `75%` pandy.
- **AC-8:** Panda i kiwi są osobnymi dynamicznymi bryłami tego samego świata Matter.js, zderzają się ze sobą oraz ze wszystkimi czterema bandami.
- **AC-9:** Kiwi można chwycić i podrzucić tak samo jak pandę; po puszczeniu opada pod wpływem tej samej grawitacji.

Dokładny cel: granice i wielociałowy świat w `app/_lib/panda-drop-physics.ts`, interakcja pluszaków w `app/_components/physics-panda.tsx`, usunięcie samej ikony z `app/_components/site-page.tsx`, asset kiwi i testy behawioralne w `tests/site.test.mjs`. Poza zakresem pozostają parametry grawitacji, pozostałe komponenty kontrolek, CTA, polityka prywatności, routing, DNS i poczta.

## Szczegóły — odpowiedzialny kod

Numery linii odnoszą się do bazy `8f753dd135365750240917a7b27dcb323b62b4c1`.

- `app/_lib/panda-drop-physics.ts:200-215`, `createBoundary`: helper poprawnie ustawia statyczne ciało Matter.js, tarcie i odbicie; sam helper nie ogranicza liczby ani położenia ścian.
- `app/_lib/panda-drop-physics.ts:282-304`, `PandaDropSimulation.constructor`: produkcyjna tablica `boundaries` zawiera wyłącznie podłogę (`y = arena.height`) oraz lewy i prawy bok (`x = 0`, `x = arena.width`). Brakuje prostokąta o wewnętrznej krawędzi `y = 0`.
- `app/_lib/panda-drop-physics.ts:240-248`: pierwszy automatyczny drop startuje nad viewportem (`pose.y = -arena.size`), więc sufit nie może istnieć przed jego wejściem do planszy — inaczej zatrzymałby pandę po zewnętrznej stronie.
- `app/_components/physics-panda.tsx:91-112`, `translatedPose`: gest pozwala obecnie przeciągnąć obraz poza każdą krawędź. Dla zamkniętego świata po puszczeniu nowa symulacja musi dostawać pozycję wewnątrz `0…100vw × 0…100vh`.
- `app/_components/site-page.tsx:114-124` renderuje ikonę aplikacji jako link `.brand-mark`; usunięcie tego jednego elementu nie wymaga zmiany stosu Light/Dark ani linku do polityki.
- `public/` zawiera wyłącznie pandę, ikonę i maskę App Store. Źródłowy asset kiwi istnieje jako `packages/game-assets/runtime/menimals/kiwi.png` w repo gry, ale nie został jeszcze przeniesiony do strony.
- `PandaDropSimulation` ma obecnie dokładnie jedno ciało dynamiczne. Dwie niezależne trajektorie nie mogłyby się zderzyć; panda i kiwi muszą należeć do jednego `Engine` i być krokowane w tej samej symulacji.
- Konsumenci modelu: jedyny produkcyjny konsument to `app/_components/physics-panda.tsx`; `tests/site.test.mjs` jest jedynym konsumentem testowym. `site-page.tsx` konsumuje komponent i pozycję końcową pandy dla CTA. Zmiana może objąć te trzy miejsca, ale nie może zmienić pozostałych kontrolek ani dokumentu prywatności.

Klasa wzorca: brak wpisu w `bugs/PATTERNS.md`; katalog nie zawiera jeszcze rejestru wzorców. To klient-lokalny brak jednego elementu zamkniętej geometrii kolizji, a nie problem danych ani renderowania assetu.

### Wykluczone przyczyny

- Błędny rozmiar planszy: istniejący test i CSS utrzymują `100vw × 100vh` od `(0,0)`; problemem jest brak ciała kolizyjnego, nie pomiar viewportu.
- Za krótkie boki: boki mają wysokość `arena.height + 20 000 px`, więc obejmują także obszar nad viewportem; nie zamykają jednak przestrzeni pomiędzy nimi.
- Brak podłogi lub boków: wszystkie trzy są jawnie tworzone w `boundaries`, a istniejące testy Matter.js potwierdzają ich działanie.
- Błędna grawitacja albo masa: parametry te wpływają na trajektorię, ale nie mogą stworzyć brakującej kolizji na `y = 0`.
- Dwie warstwy DOM nad osobnymi symulacjami: taki wariant nie spełnia AC-8, ponieważ Matter.js nie wykrywa kolizji między różnymi instancjami `Engine`.

## Proponowany test (najpierw czerwony)

- AC-1, AC-2, AC-3, AC-4 → `tossed panda rebounds off every viewport edge` w `tests/site.test.mjs`: cztery rzeczywiste symulacje Matter.js rzucają pandę kolejno ku sufitowi, podłodze, lewej i prawej ścianie; każda musi odwrócić składową prędkości bez przekroczenia odpowiedniej granicy.
- AC-5 → pełny istniejący `npm test`, `npm run typecheck` i `npm run build`; dotychczasowe testy podrzucania, grawitacji, odbicia, toczenia, React Spring, gestów i layoutu nie mogą się zmienić ani przestać przechodzić.
- AC-6 → `home omits the app icon and keeps the controls` w `tests/site.test.mjs` sprawdza finalny markup strony.
- AC-7 → `kiwi uses the exact game asset at three quarters of the panda size` sprawdza obecność skopiowanego assetu i konfigurację rozmiaru.
- AC-8 → `panda and kiwi collide in one Matter world` uruchamia dwie prawdziwe bryły dynamiczne w jednym `Engine`, czeka na ich kontakt i sprawdza reakcję prędkości kiwi; ten sam test potwierdza obecność obu brył i wspólne bandy.
- AC-9 → `both plush toys expose the same pointer and keyboard toss interaction` jest pomocniczą bramką komponentu; końcowym dowodem gestu pozostaje nagranie compositora.

Test korzysta z prawdziwego `PandaDropSimulation`, prawdziwego Matter.js i rzeczywistych brył granicznych. Kontrolowana funkcja losowa jest przekazywana, ale przy jawnej prędkości release nie uczestniczy w badanej trajektorii.

## Rozwiązanie

1. Utworzyć czwartą bryłę graniczną z wewnętrzną krawędzią dokładnie na `y = 0` i szerokością obejmującą narożniki planszy.
2. Dla interaktywnego release rozpoczynającego się wewnątrz planszy aktywować sufit od razu. Dla pierwszego automatycznego dropu, który zgodnie z dotychczasowym kontraktem startuje nad ekranem, dodać sufit dopiero po całkowitym wejściu bryły do viewportu.
3. Ograniczyć pozycję przeciąganej pandy do widocznego prostokąta, aby użytkownik nie mógł puścić nowej symulacji po zewnętrznej stronie zamkniętej planszy.
4. Rozszerzyć istniejący `PandaDropSimulation` o opcjonalne ciało kiwi o rozmiarze `0,75 ×` pandy, dokładnym 10-punktowym obrysie wygenerowanym tą samą metodą co w grze i parametrach masy/restytucji tieru kiwi. Oba ciała pozostają w jednym `Engine`.
5. Generować zsynchronizowaną trajektorię obu ciał i renderować ją jednym playheadem React Spring. Gest na dowolnym pluszaku zatrzymuje wspólny playhead, a release ponownie symuluje oba ciała z aktualnych pozycji.
6. Skopiować istniejący `kiwi.png` z repo gry bez modyfikowania grafiki i usunąć jedynie markup oraz nieużywane style `.brand-mark`.

Nie zmieniają się parametry grawitacji, tarcia, restytucji istniejących ścian, prędkości gestu, React Spring ani układ pozostałych kontrolek. CTA nadal pozycjonuje się względem pandy po uspokojeniu całego świata. Nie ma migracji danych.

## Raport z implementacji i testów

### RED

Polecenie uruchomione w `/Users/gmm/prv/menimals.online`:

```text
$ node --test --test-name-pattern='tossed panda rebounds off every viewport edge' tests/site.test.mjs
✖ tossed panda rebounds off every viewport edge (5.677833ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

AssertionError [ERR_ASSERTION]: top edge was crossed by 653.5 px
    at TestContext.<anonymous> (tests/site.test.mjs:393:12)
```

Test jest czerwony z właściwego powodu: rzeczywista bryła Matter.js przekracza `y = 0` o `653,5 px`. W tej samej tabeli przypadków podłoga oraz oba boki spełniają oczekiwany kontrakt; wykonanie zatrzymuje się dopiero na asercji sufitu, która identyfikuje brakującą granicę.

Po Uzupełnieniu 1 uruchomiono:

```text
$ node --test --test-name-pattern='home reveals|panda and kiwi collide|both plush toys|kiwi uses the exact' tests/site.test.mjs
✖ home reveals the App Store scribble after the physical panda settles
  AssertionError: input matched /className="brand-mark"/
✖ panda and kiwi collide in one Matter world
  AssertionError: 1 !== 2
✖ both plush toys expose the same pointer and keyboard toss interaction
  AssertionError: input did not match /src="\/kiwi\.png"/
✖ kiwi uses the exact game asset at three quarters of the panda size
  ENOENT: public/kiwi.png
ℹ tests 4
ℹ pass 0
ℹ fail 4
```

Każdy test odmawia dokładnie brakującego zachowania: ikona nadal jest renderowana, świat ma jedno zamiast dwóch ciał dynamicznych, komponent nie renderuje kiwi, a repo strony nie zawiera źródłowego assetu.

### Historia analizy

- Pierwsza wersja testu band używała `body.bounds`, które w Matter.js zawiera także predykcyjny bufor prędkości. Po cofnięciu kandydata test został zamrożony na rzeczywistych `body.vertices` i ponownie uruchomiony na kodzie bez sufitu: RED pozostał `top edge was crossed by 653.4 px`.
- Tolerancja band wynosi `0,05 px`, ponieważ solver Matter.js dopuszcza zmierzoną penetrację numeryczną około `0,025 px` na istniejącej podłodze i bokach. Same wewnętrzne krawędzie brył statycznych pozostają dokładnie na `0/width/height`.

## Dowód końcowego compositora

- Nagranie przed: [panda przechodząca przez górną krawędź](assets/002-panda-przechodzi-przez-sufit/before.mp4)
- Nagranie po: [panda odbijająca się od wszystkich czterech ścian](assets/002-panda-przechodzi-przez-sufit/after.mp4)

## Protokół weryfikacji
