# Budżet Osobisty

Profesjonalna aplikacja do zarządzania budżetem osobistym stworzona w React + TypeScript + Vite.

## Funkcjonalności

### 🎯 Główne funkcje
- **Zarządzanie transakcjami** - dodawanie przychodów i wydatków
- **Kategorie** - predefiniowane kategorie dla wydatków (Jedzenie, Transport, Rozrywka, Mieszkanie, Inne) i przychodów (Wynagrodzenie, Freelance, Inwestycje, Prezent, Inne)
- **Transakcje cykliczne** - możliwość oznaczenia transakcji jako cykliczne (dziennie, tygodniowo, miesięcznie, rocznie)
- **Podsumowanie budżetu** - widoki dla różnych okresów: dziennie, tygodniowo, miesięcznie, rocznie
- **Wskaźnik zdrowia finansowego** - automatyczna ocena kondycji finansowej (0-100 punktów)
- **Persystencja danych** - automatyczne zapisywanie do localStorage
- **Lista transakcji** - przeglądaj i usuwaj transakcje

### 📊 Kalkulacje budżetu

Aplikacja automatycznie przelicza transakcje cykliczne na wybrany okres:
- Transakcje miesięczne są mnożone odpowiednio dla widoku rocznego
- Transakcje jednorazowe są liczone bez mnożenia
- Wszystkie kalkulacje są normalizowane do wybranego okresu

### 💯 Wskaźnik zdrowia finansowego

System ocenia kondycję finansową na podstawie:
- **Stopy oszczędności** (0-50 punktów) - procent dochodów, który udaje się zaoszczędzić
- **Wskaźnika wydatków** (0-30 punktów) - jaki procent dochodów stanowią wydatki
- **Bilansu** (0-20 punktów) - czy bilans jest dodatni

Oceny:
- 80-100: Doskonały 🎉
- 60-79: Bardzo dobry ✨
- 40-59: Dobry ✓
- 20-39: Słaby ⚠️
- 0-19: Krytyczny ❌

## Instalacja i uruchomienie

### Wymagania
- Node.js 16+
- npm lub yarn

### Instalacja zależności

```bash
npm install
```

### Uruchomienie aplikacji (tryb deweloperski)

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

### Budowanie wersji produkcyjnej

```bash
npm run build
```

### Podgląd wersji produkcyjnej

```bash
npm run preview
```

## Technologie

- **React 18** - biblioteka UI
- **TypeScript** - typowanie statyczne
- **Vite** - szybkie narzędzie do budowania
- **Tailwind CSS** - stylowanie
- **Lucide React** - ikony
- **localStorage** - persystencja danych

## Struktura projektu

```
src/
├── components/
│   ├── ui/           # Komponenty UI (Card, Button, Input, Tabs, Badge)
│   └── BudgetApp.tsx # Główny komponent aplikacji
├── lib/
│   └── utils.ts      # Funkcje pomocnicze
├── types/
│   └── index.ts      # Definicje typów TypeScript
├── App.tsx           # Główny komponent
├── main.tsx          # Entry point
└── index.css         # Style globalne
```

## Użytkowanie

1. **Wybierz typ transakcji** - Wydatek lub Przychód
2. **Wybierz kategorię** - kliknij jeden z przycisków kategorii
3. **Wpisz kwotę** - wprowadź wartość transakcji
4. **Opcjonalnie zaznacz jako cykliczne** - jeśli transakcja się powtarza
5. **Wybierz okres cykliczności** - dziennie, tygodniowo, miesięcznie, rocznie
6. **Kliknij "Dodaj"** - transakcja zostanie dodana do listy

### Przeglądanie podsumowania

- Zmień zakładkę okresu (Dziennie/Tygodniowo/Miesięcznie/Rocznie)
- Zobaczysz przeliczone przychody, wydatki i bilans dla wybranego okresu

### Zarządzanie transakcjami

- Przewiń listę transakcji, aby zobaczyć wszystkie wpisy
- Kliknij ikonę kosza, aby usunąć transakcję
- Transakcje są automatycznie zapisywane w przeglądarce

## Licencja

MIT
