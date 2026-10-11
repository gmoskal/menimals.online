# Halloween i natychmiastowy przycisk pobierania

Przycisk App Store jest montowany wraz ze stroną i uruchamia istniejącą animację markera, niezależnie od zakończenia spadania postaci. Zachowane gesty, fizyka, języki i geometria przycisku. Trzy postacie używają dokładnych Halloweenowych grafik pluszowych z aplikacji Menimals (panda, kiwi, pingwin), na przezroczystym tle.

Weryfikacja: typecheck,27 testów Node, produkcyjny build Next PASS. Rzeczywista przeglądarka: mobile390×844, desktop dark1440×1000, CTA widoczne przez pierwsze900ms, gdy panda nadal spada, oraz podczas ponownego podrzutu klawiaturą. Brak poziomego overflow. Dane w browser-results.json. Obejrzane zrzuty w ignored media; to kontrola wyglądu, bez twierdzenia o pomiarze FPS.

Jedyny własny output: .build/task-web-menimals; nie usuwać zastanego .next. Publikacja i cleanup mają osobne receipts.
