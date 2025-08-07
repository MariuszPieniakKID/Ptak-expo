# 🎨 Design System PTAK EXPO

## 🔥 Źródło designu
Design system bazuje na grafice z `grafika/dodajw` - projekt został wygenerowany z Locofy i zawiera oficjalne kolory, czcionki i wymiary.

## 🎨 Kolory
```scss
:root {
  --color-dodgerblue: #6f87f6;      // Primary blue
  --color-mediumslateblue: #5041d0;  // Dark blue (hover states)
  --color-darkslategray: #2e2e38;   // Dark text
  --color-darkgray: #a7a7a7;        // Light gray text
  --color-gainsboro-200: #d7d9dd;   // Border gray
  --color-gainsboro-100: #e5e9eb;   // Light border
  --color-whitesmoke: #f5f6f7;      // Background gray
  --color-firebrick: #c7353c;       // Error red
  --color-white: #fff;              // White
}
```

## 🔤 Typografia
```scss
// Fonts
--font-roc-grotesk: 'Roc Grotesk', sans-serif;  // Headers, labels
--font-open-sans: 'Open Sans', sans-serif;      // Body text, inputs

// Font sizes
--font-size-11: 11px;   // Small text, errors
--font-size-12: 12px;   // Labels
--font-size-16: 16px;   // Body text, inputs
--font-size-18: 18px;   // Headers
```

## 📐 Spacing & Borders
```scss
// Border radius
--br-5: 5px;    // Small elements
--br-10: 10px;  // Buttons, inputs
--br-20: 20px;  // Modals, cards
```

## 🧩 Komponenty

### Modal Structure
- **Dialog**: border-radius: var(--br-20), subtle shadow
- **DialogTitle**: white background, bottom border
- **DialogContent**: whitesmoke background (#f5f6f7)
- **DialogActions**: white background, top border

### Form Fields
- **Label**: Roc Grotesk, 12px, medium weight
- **Input**: Open Sans, 16px, white background, rounded corners
- **Error**: Open Sans, 11px, firebrick color

### Buttons
- **Primary**: dodgerblue background, white text, subtle shadow
- **Secondary**: transparent background, gray text, border
- **Hover**: mediumslateblue background for primary

## 📱 Responsive Design
- Grid: 2 columns desktop, 1 column mobile
- Gaps: 20px desktop, 16px mobile
- Padding: 32px desktop, 24px mobile

## 🎯 Użycie
Wszystkie komponenty używają tego design system:
- AddExhibitorModal
- CustomField
- CustomButton
- CustomTypography

## 🔧 Implementacja
Design system jest implementowany przez:
1. CSS Variables w .module.scss
2. Google Fonts imports
3. Consistent spacing i colors
4. TypeScript + SCSS + Custom Components pattern 