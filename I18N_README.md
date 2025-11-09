# Internationalization (i18n) - Dokumentacja

Aplikacja obsługuje wielojęzyczność (i18n) używając biblioteki `react-i18next`.

## Aktualnie wspierane języki

- 🇵🇱 Polski (pl)
- 🇬🇧 Angielski (en)

## Automatyczne wykrywanie języka

Aplikacja automatycznie wykrywa język przeglądarki użytkownika i wyświetla się w odpowiednim języku.

Jeśli język przeglądarki nie jest wspierany, aplikacja domyślnie używa języka polskiego.

## Jak dodać nowy język

### 1. Utwórz folder dla nowego języka

Utwórz nowy folder w `src/locales/` z kodem języka (np. `de` dla niemieckiego):

```bash
mkdir src/locales/de
```

### 2. Utwórz plik tłumaczeń

Skopiuj plik `src/locales/en/translation.json` jako szablon i przetłumacz wszystkie teksty:

```bash
cp src/locales/en/translation.json src/locales/de/translation.json
```

Przykładowa struktura pliku:

```json
{
  "app": {
    "title": "Persönliches Budget"
  },
  "tabs": {
    "expenses": "Ausgaben",
    "income": "Einkommen"
  },
  ...
}
```

### 3. Zaimportuj tłumaczenia w konfiguracji i18n

Edytuj plik `src/i18n.ts` i dodaj import oraz zasób dla nowego języka:

```typescript
import translationDE from './locales/de/translation.json';

const resources = {
  pl: {
    translation: translationPL,
  },
  en: {
    translation: translationEN,
  },
  de: {
    translation: translationDE,  // Dodaj nowy język
  },
};
```

### 4. Gotowe!

Aplikacja automatycznie wykryje i użyje nowego języka, jeśli użytkownik ma odpowiednie ustawienia przeglądarki.

## Zmiana języka domyślnego

Aby zmienić domyślny język (fallback), edytuj plik `src/i18n.ts`:

```typescript
.init({
  resources,
  fallbackLng: 'pl', // Zmień na inny język
  ...
});
```

## Testowanie różnych języków

### Sposób 1: Zmiana języka przeglądarki

1. Zmień ustawienia języka w swojej przeglądarce
2. Odśwież aplikację

### Sposób 2: Użycie konsoli deweloperskiej

Otwórz konsolę przeglądarki i wpisz:

```javascript
// Zmiana na angielski
localStorage.setItem('i18nextLng', 'en');
location.reload();

// Zmiana na polski
localStorage.setItem('i18nextLng', 'pl');
location.reload();
```

## Struktura tłumaczeń

```
src/
├── locales/
│   ├── pl/
│   │   └── translation.json  # Polskie tłumaczenia
│   ├── en/
│   │   └── translation.json  # Angielskie tłumaczenia
│   └── [nowy-język]/
│       └── translation.json  # Nowe tłumaczenia
├── i18n.ts                   # Konfiguracja i18n
└── ...
```

## Dodawanie nowych tłumaczeń do istniejących plików

Jeśli dodajesz nową funkcjonalność, pamiętaj aby:

1. Dodać nowe klucze tłumaczeń do **wszystkich** plików językowych
2. Użyć funkcji `t()` w komponencie:

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Użycie w JSX
<p>{t('klucz.do.tlumaczenia')}</p>
```

## Formatowanie

### Waluty

Aplikacja automatycznie formatuje waluty według języka:
- Polski (pl): PLN (złote)
- Angielski (en): USD (dolary)

Aby zmienić walutę dla konkretnego języka, edytuj funkcję `formatCurrency` w `src/components/BudgetApp.tsx`.

### Daty

Daty są automatycznie formatowane według ustawień lokalnych języka użytkownika.

## Wsparcie

Jeśli masz pytania lub problemy z tłumaczeniami, sprawdź:
- [Dokumentacja react-i18next](https://react.i18next.com/)
- [Dokumentacja i18next](https://www.i18next.com/)
