# 🔲 Generowanie Kodu QR dla Testerów

## 🎯 Adres Aplikacji do Zakodowania

**URL**: `https://ptak-mobile-production.up.railway.app`

## 📲 Sposoby Generowania Kodu QR

### 1. **Darmowy Generator Online** (Zalecany)
Użyj jednego z poniższych darmowych generatorów:

- **QR Code Generator**: https://www.qr-code-generator.com/
- **GoQR.me**: https://goqr.me/
- **QRCodeGenerator.com**: https://qrcodegenerator.com/
- **GenQRCode.com**: https://genqrcode.com/

### 2. **Szybki Sposób** (Recommended)
1. Idź na: https://goqr.me/
2. Wybierz **"Website address"**
3. Wklej: `https://ptak-mobile-production.up.railway.app`
4. Kliknij **"Generate QR Code"**
5. Pobierz jako **PNG** lub **SVG**

### 3. **Komenda Terminal** (Dla deweloperów)
```bash
# Zainstaluj qrencode
brew install qrencode  # macOS
sudo apt-get install qrencode  # Ubuntu/Debian

# Generuj kod QR
qrencode -t PNG -o ptak_mobile_qr.png 'https://ptak-mobile-production.up.railway.app'
```

## 🔧 Ustawienia Generatora

### Zalecane ustawienia:
- **Format**: PNG lub SVG
- **Rozmiar**: 512x512 pikseli (minimum)
- **Error Correction**: Medium (M)
- **Kolor**: Czarny na białym tle
- **Margin**: 4 moduły (standardowy)

### Opcjonalne ulepszenia:
- **Logo**: Dodaj logo Ptak w środku
- **Kolory**: Użyj kolorów firmowych
- **Ramka**: Dodaj ramkę z napisem "SKANUJ MNIE"

## 📋 Instrukcja Krok Po Kroku

1. **Otwórz generator QR**: https://goqr.me/
2. **Wybierz typ**: "Website address"
3. **Wklej URL**: `https://ptak-mobile-production.up.railway.app`
4. **Sprawdź podgląd**: Czy kod QR się wygenerował?
5. **Pobierz**: Kliknij "Download" → wybierz PNG
6. **Testuj**: Zeskanuj kodem QR na telefonie
7. **Udostępnij**: Wyślij testerom

## 📱 Testowanie Kodu QR

### Przed udostępnieniem sprawdź:
- [ ] Czy kod QR skanuje się na iPhone
- [ ] Czy kod QR skanuje się na Android
- [ ] Czy otwiera prawidłowy adres URL
- [ ] Czy aplikacja się ładuje poprawnie

### Testuj na urządzeniach:
- **iPhone**: Aplikacja Kamera
- **Android**: Google Lens lub aplikacja Kamera
- **Alternatywnie**: QR Scanner z App Store/Play Store

## 🎨 Przykład Użycia

### Kod QR do wklejenia w dokumenty:
```
Testuj aplikację Ptak Expo Mobile:

[QR CODE HERE]

Lub wejdź na: https://ptak-mobile-production.up.railway.app
```

### Kod QR do wysłania na Slack/Email:
```
🚀 Gotowe do testowania!

Aplikacja Ptak Expo Mobile jest dostępna na Railway.
Zeskanuj kod QR lub wejdź na link:

https://ptak-mobile-production.up.railway.app

Dane testowe:
📧 Email: test@test.com
🔒 Hasło: test123
```

## 🔗 Przydatne Linki

- **Aplikacja**: https://ptak-mobile-production.up.railway.app
- **Health Check**: https://ptak-mobile-production.up.railway.app/api/health
- **Backend**: https://backend-production-df8c.up.railway.app
- **Repository**: https://github.com/MariuszPieniakKID/Ptak-expo

---

**Gotowe! Kod QR można udostępnić testerom.** 🎉 