# Bug 002 — Panda przechodzi przez sufit

> Start pracy: 2026-08-04 00:32
> Koniec pracy: 2026-08-04 01:26
> Status: zablokowany: brak dowodu końcowego compositora
> Zgłoszenie: „ale ma sie odbijac od wszystkich ścian i od y=0 i y =100vh i x= 0 i x=100vw”
> Uzupełnienie 1: „wywal te ikone appki z gornego lewego rogu i spraw zeby się obijał też o górną bandę i dodaj jeszcze kiwi trochę mniejsze niech się zderzają”
> Uzupełnienie 2: „dobra dodaj jeszcze pingwina i spusć je co 1s na środku”
> Uzupełnienie 3: „i zrób im inną wagę panda ma być cięższa, kiwi najlżejsze”
> Uzupełnienie 4: „zwiększ czas odstępu zrzucania do 3s”
> Uzupełnienie 5: „coś mi nienaturalnie wolno spada panda, wolniej niż pingwin, a miała być cięższa”
> Uzupełnienie 6: „wcześniej pingwin spadał fajniej, teraz wszystkie spadają bardzo wolno nienaturalnie”
> Uzupełnienie 7: „zmniejsz też z 3s do 2.2s”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: 8f753dd135365750240917a7b27dcb323b62b4c1
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: niedostępny — Browser nie ma dostępnej instancji przeglądarki

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
- **AC-10:** Na planszy pojawia się pingwin z dokładnego assetu gry, jako trzeci dynamiczny uczestnik tego samego świata.
- **AC-11:** Pierwszy automatyczny przebieg wpuszcza pandę, kiwi i pingwina kolejno co `2200 ms`, zawsze ze środka planszy.
- **AC-12:** Pingwina można chwycić i podrzucić tak samo jak pozostałe pluszaki; zderza się z nimi i ze wszystkimi bandami.
- **AC-13:** Masy wynikają z tierów gry i spełniają ścisłą kolejność `kiwi < pingwin < panda`, dzięki czemu panda najmniej zmienia ruch przy zderzeniach.
- **AC-14:** Na wspólnym playheadzie cięższa panda dociera do pierwszego odbicia wcześniej niż pingwin; przyspieszenie fazy osiadania nie może przyspieszać jeszcze lecącego zwierzaka na podstawie starego kontaktu innej bryły.
- **AC-15:** Pierwszy spadek każdego zwierzaka do odbicia trwa krócej niż `650 ms`, bez zmiany 2,2-sekundowych odstępów startu.

Dokładny cel: granice i wielociałowy świat w `app/_lib/panda-drop-physics.ts`, interakcja pluszaków w `app/_components/physics-panda.tsx`, usunięcie samej ikony z `app/_components/site-page.tsx`, assety kiwi i pingwina oraz testy behawioralne w `tests/site.test.mjs`. Poza zakresem pozostają pozostałe komponenty kontrolek, CTA, polityka prywatności, routing, DNS i poczta.

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

Po Uzupełnieniach 2 i 3, przed implementacją pingwina, uruchomiono:

```text
$ node --test --test-name-pattern='panda, kiwi, and penguin|three menimals enter|all three plush toys|penguin uses the exact' tests/site.test.mjs
✖ panda, kiwi, and penguin collide in one Matter world
  AssertionError: 2 !== 3
✖ three menimals enter from the center one second apart
  AssertionError: 620 !== 500
✖ all three plush toys expose the same pointer and keyboard toss interaction
  AssertionError: input did not match /src="\/pingwin\.png"/
✖ penguin uses the exact game asset and all three masses are distinct
  ENOENT: public/pingwin.png
ℹ tests 4
ℹ pass 0
ℹ fail 4
```

Testy były czerwone z czterech wymaganych powodów: świat zawierał tylko dwie bryły, start pandy nie leżał na osi środka, komponent nie renderował pingwina i brakowało dokładnego assetu, a więc nie istniał też eksport jego masy.

Po Uzupełnieniu 4 test interwału został jawnie zmieniony z `1000 ms` na `3000 ms` i uruchomiony przed zmianą konfiguracji:

```text
✖ three menimals enter from the center three seconds apart
AssertionError: oczekiwano aktywacji drugiej bryły przy 3000 ms
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Po Uzupełnieniu 5 pomiar wspólnego playheada wykazał `1016,67 ms` pierwszego spadku pandy oraz tylko `385,42 ms` pingwina. Następnie zamrożono test:

```text
✖ the heavier panda reaches its first rebound before the penguin
AssertionError: pandaFallDuration < penguinFallDuration
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Przyczyną nie była wartość masy: w Matter.js sama masa nie zmienia przyspieszenia grawitacyjnego. Sticky `hasBoundaryContact` po wcześniejszym kontakcie pandy przełączał jednak cały playhead na `2,4×` dokładnie po aktywacji pingwina, więc jego lot był sztucznie przyspieszany. Dodatkowo dotychczasowa prędkość startowa zależna od tieru była zbyt mała, by większa masa pandy była czytelna w czasie jej dłuższej drogi.

Po Uzupełnieniu 6 test maksymalnego czasu lotu był czerwony na pandzie (`725 ms ≥ 650 ms`), a pomiar pozostałych brył wynosił `900/1350 ms`. Po Uzupełnieniu 7 test oczekujący interwału `2200 ms` był czerwony na konfiguracji `3000 ms`. Oba testy zostały uruchomione przed zmianą parametrów i przeszły dopiero po rozdzieleniu grawitacji automatycznego wejścia od grawitacji gestu oraz ustawieniu nowego interwału.

### Historia analizy

- Pierwsza wersja testu band używała `body.bounds`, które w Matter.js zawiera także predykcyjny bufor prędkości. Po cofnięciu kandydata test został zamrożony na rzeczywistych `body.vertices` i ponownie uruchomiony na kodzie bez sufitu: RED pozostał `top edge was crossed by 653.4 px`.
- Tolerancja band wynosi `0,05 px`, ponieważ solver Matter.js dopuszcza zmierzoną penetrację numeryczną około `0,025 px` na istniejącej podłodze i bokach. Same wewnętrzne krawędzie brył statycznych pozostają dokładnie na `0/width/height`.

### Implementacja

- `PandaDropSimulation` ma sufit z wewnętrzną krawędzią `y = 0`; przy automatycznym wejściu dołącza go dopiero po wejściu wszystkich trzech brył do viewportu. Późniejsze interaktywne symulacje mają od razu cztery bandy.
- Panda, kiwi i pingwin powstają z jednego `menimalDropConfig`, należą do jednego `Engine` Matter.js i są próbkowane wspólnym `MenimalDropTrajectory` oraz jednym playheadem React Spring.
- Automatyczne wejście aktywuje pandę przy `0 ms`, kiwi przy `2200 ms` i pingwina przy `4400 ms`; każdy wizualny środek startuje na `x = 50%`. Interaktywny release zachowuje bieżące pozy wszystkich brył i nie powtarza sekwencji wejścia.
- Kiwi ma `75%` rozmiaru pandy, pingwin `82,5%`; oba mają dokładne 10-punktowe obrysy z gry. SHA-256 assetu kiwi: `2097bbf2bb7d25174297d4f6d9dfe0c1e3b8488c98982112e5f164d883ce5eea`; pingwina: `ef38987a629a73f1de2f927884bc4cb42e9a91100f7c0c47a92c4df03d8bdef1`.
- Masy z tierów gry i mnożnika `3×` wynoszą: kiwi `2,46`, pingwin `3,0012`, panda `14,7290`. Automatyczna prędkość startowa jest sprzężona z tą masą, dzięki czemu różnica ciężaru jest czytelna także w pierwszym spadku. Automatyczne wejście używa mocniejszej grawitacji `7,6 wysokości viewportu/s²`, a ręczne podrzucanie zachowuje poprzednie `1,9`, więc szybszy start nie skraca łuku gestu.
- Przyspieszenie końcowej fazy osiadania `2,4×` włącza się dopiero, gdy każda bryła miała własny kontakt z bandą. Stary kontakt pandy nie może już przyspieszyć później wpuszczanego pingwina.
- Ten sam stan interakcji obsługuje wskaźnik i klawiaturę dla wszystkich trzech pluszaków. Usunięto markup i style `.brand-mark`; Light/Dark oraz link do polityki pozostały w prawym górnym rogu.

### GREEN

```text
$ npm test
ℹ tests 22
ℹ pass 22
ℹ fail 0

$ npm run typecheck
> tsc --noEmit
exit 0

$ npm run build
✓ Compiled successfully
✓ Generating static pages using 5 workers (4/4)
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /privacy
```

Najważniejsze testy behawioralne wykonują prawdziwy Matter.js: cztery bandy, trzy ciała i ich kolizję, aktywację `1 → 2 → 3` przy `0/2200/4400 ms`, różne masy, kolejność czasu pierwszego odbicia i limit `650 ms` dla każdego automatycznego lotu. Osobny dotychczasowy test potwierdza zachowanie wysokości ręcznego podrzucenia.

Pomiar finalnej trajektorii prezentacji w `390 × 844`:

```text
panda:   pierwszy ruch    8,33 ms; pierwsze odbicie po 433,33 ms
kiwi:    pierwszy ruch 2208,33 ms; pierwsze odbicie po 458,33 ms
pingwin: pierwszy ruch 4400,00 ms; pierwsze odbicie po 466,67 ms
pełna trajektoria:     5688,89 ms
```

Odchylenie startu kiwi `8,33 ms` odpowiada jednej klatce solvera `120 Hz`.

Mapa AC:

- AC-1–AC-4: zielone — cztery przypadki rzeczywistej symulacji i dokładne wierzchołki bryły.
- AC-5: zielone w testach kodu; końcowa płynność compositora pozostaje bez nagrania.
- AC-6: zielone — produkcyjny HTML nie zawiera ikony, kontrolki pozostają.
- AC-7–AC-10: zielone — dokładne assety/obrysy, trzy ciała w jednym `Engine`, wspólne bandy i interakcje.
- AC-11: zielone — aktywacja `0/2200/4400 ms`, środki początkowe `x = 50%`.
- AC-12: zielone w kodzie i testach kolizji/interfejsu; faktyczny gest wymaga compositora.
- AC-13: zielone — `2,46 < 3,0012 < 14,7290`.
- AC-14: zielone — panda `433,33 ms` do pierwszego odbicia, pingwin `466,67 ms`; time-scale czeka na własny kontakt każdej bryły.
- AC-15: zielone — `433,33/458,33/466,67 ms`, wszystkie poniżej `650 ms`; test gestu pozostaje zielony.

### Dostarczenie

Dostarczenie: commit `e9b7382c438f3461260e7efd26f04d84f75cef36` na `main`.

```text
$ git ls-remote origin refs/heads/main
e9b7382c438f3461260e7efd26f04d84f75cef36 refs/heads/main

$ git rev-parse 'fix/002-panda-przechodzi-przez-sufit^{commit}'
e9b7382c438f3461260e7efd26f04d84f75cef36

deployment dpl_Awz2o7ZKKpikEAjXpa6ujwxLnrpA
target production
status Ready
alias https://menimals.online
home status=200 type=text/html; charset=utf-8
penguin status=200 bytes=336929
```

Próba finalnej kontroli `https://menimals.online/` przez Browser zakończyła się `No browser is available`. Nie zastępowano właściwego compositora osobnym serwerem automatyzacji. Bez końcowego filmu wynik pozostaje wdrożonym kandydatem na fix, a nie wizualnie zweryfikowanym fixem.

Visual Truth Gate:

```text
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan
```

### Pozostałe kroki dostarczenia

- Nagrać na `https://menimals.online` wejście pandy, kiwi i pingwina w odstępach `2,2 s`, ich szybkie spadki, zderzenia oraz interaktywne podrzucenie każdego pluszaka; zapisać `bugs/assets/002-panda-przechodzi-przez-sufit/after.mp4`.
- Potwierdzić cztery bandy, wyraźnie szybszy spadek cięższej pandy, skalę dwóch mniejszych zwierzaków, brak ikony i położenie CTA. Dopiero wtedy ustawić `zweryfikowany` i uruchomić `--claim-fixed`.

### Cleanup

- Nie utworzono worktree, brancha roboczego, taskowego DerivedData ani `~/tmp/codex/bug-002`; jedynym worktree tego repozytorium jest główny checkout `main`.
- Wszystkie procesy Vercela zakończyły się kodem `0`; nie działa taskowy `next dev`, `next start` ani `vercel deploy`.
- `~/tmp/codex/bug-001` i `~/tmp/codex/bug-000` nie istnieją.
- Sweep `~/tmp` zachował wyłącznie świeże `TemporaryDirectory.*` (najstarszy `00:57`, wszystkie poniżej 4 h) i dwa sockety SSH/VS Code używane przez `Code Helper` PID `24840`; `/tmp` nie zawiera taskowych `bug*.mp4/png/jpg` ani `codex-*`.
- Wcześniej wykryty obcy worktree `~/tmp/codex/bug-002-regresja-2` został usunięty przez jego właściciela przed końcowym audytem. Pozostałe obce katalogi bug/task nie mają dowodu bezpiecznego dostarczenia, więc nie były usuwane przez tę sesję.
- Wygasłe dowody (>5 dni): `0` katalogów, `0 B`; raporty 001 zamknięto 3 sierpnia, a raport 002 nie ma sztucznego katalogu bez pliku dowodowego.
- Stan audytu po ostatnim deployu: `~/tmp` `1,6 GB`, `~/.codex` `18 GB`, globalny Xcode DerivedData `184 MB`; wolne `32 GiB`.

## Dowód końcowego compositora

- Nagranie przed: [panda przechodząca przez górną krawędź](assets/002-panda-przechodzi-przez-sufit/before.mp4)
- Nagranie po: [panda odbijająca się od wszystkich czterech ścian](assets/002-panda-przechodzi-przez-sufit/after.mp4)

## Protokół weryfikacji

1. **Testy:** uruchomić `npm test && npm run typecheck && npm run build`; oczekiwane jest `22/22`, TypeScript exit `0` i trzy statyczne route'y.
2. **Bandy:** w teście `tossed panda rebounds off every viewport edge` każda składowa prędkości musi zmienić znak przed `2500 ms`, a odległość rzeczywistych `body.vertices` od bandy nie może spaść poniżej `-0,05 px`.
3. **Zderzenie:** `panda, kiwi, and penguin collide in one Matter world` musi znaleźć trzy dynamiczne ciała, `hasMenimalContact === true` i dodatnią prędkość pingwina po zderzeniu.
4. **Rytm i szybkość:** testy `three menimals enter from the center 2.2 seconds apart`, `the heavier panda reaches its first rebound before the penguin` i `all three menimals complete their first fall at a natural speed` muszą potwierdzić starty `0/2200/4400 ms`, pandę szybszą od pingwina oraz każdy lot `<650 ms`.
5. **Assety:** SHA-256 lokalnych i źródłowych plików musi wynosić odpowiednio `2097bbf…eea` dla kiwi i `ef38987a…ef1` dla pingwina.
6. **Produkcja:** `npx vercel inspect menimals-online-8obwji7ec-gmoskals-projects-1e7a5b2a.vercel.app` musi wskazać `dpl_Awz2o7ZKKpikEAjXpa6ujwxLnrpA`, `production`, `Ready` i alias `https://menimals.online`; domena i oba assety mają zwracać `200`.
7. **Delivery:** `git merge-base --is-ancestor e9b7382c438f3461260e7efd26f04d84f75cef36 main` musi zwrócić `0`, a `git rev-parse 'fix/002-panda-przechodzi-przez-sufit^{commit}'` ten sam SHA.
8. **Compositor:** viewport `390 × 844`; nagrać trzy wejścia co `2,2 s`, każdy szybki spadek, podrzucenie wszystkich brył pod sufit, kolizje i uspokojenie świata. Sprawdzić cztery bandy, brak ikony, skale, interakcje i CTA względem pandy.
9. **Visual Truth Gate:** po zapisaniu filmu ustawić jego commit builda i wynik obserwacji, następnie uruchomić walidator normalnie oraz z `--claim-fixed`. Do tego momentu raport pozostaje zablokowany.
