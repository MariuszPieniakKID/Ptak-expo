# API Weryfikacji i Pobierania Kodów QR - Dokumentacja Integracji

## Przegląd

API umożliwia:
1. **Weryfikację** kodów QR przez urządzenia zewnętrzne
2. **Pobieranie** pojedynczych kodów QR jako obraz PNG lub dane JSON
3. **Pobieranie** wszystkich kodów QR z wydarzenia (JSON lub ZIP)

---

## Endpointy

### 1. Weryfikacja kodu QR

**URL:** `GET /api/v1/qr-verify/:code`

**Metoda:** `GET`

**Autoryzacja:** Brak (endpoint publiczny)

**Opis:** Sprawdza czy podany kod QR istnieje w systemie i zwraca informacje o osobie, wystawcy oraz wydarzeniu.

---

### 2. Pobranie pojedynczego kodu QR

**URL:** `GET /api/v1/qr-codes/person/:personId`

**Metoda:** `GET`

**Autoryzacja:** Brak (endpoint publiczny)

**Query Parameters:**
- `format` - Format odpowiedzi: `json` lub `image` (domyślnie: `json`)

**Opis:** Pobiera kod QR dla konkretnej osoby. W trybie `image` zwraca obraz PNG, w trybie `json` zwraca dane wraz z URL do obrazu.

---

### 3. Pobranie wszystkich kodów QR z wydarzenia

**URL:** `GET /api/v1/qr-codes/exhibition/:exhibitionId`

**Metoda:** `GET`

**Autoryzacja:** Brak (endpoint publiczny)

**Query Parameters:**
- `format` - Format odpowiedzi: `json` lub `zip` (domyślnie: `json`)
- `exhibitorId` - Opcjonalny filtr po ID wystawcy

**Opis:** Pobiera wszystkie kody QR dla wydarzenia. W trybie `zip` zwraca archiwum ZIP ze wszystkimi kodami QR jako obrazy PNG.

---

### 4. Pobranie moich kodów QR (wystawca)

**URL:** `GET /api/v1/qr-codes/my-codes`

**Metoda:** `GET`

**Autoryzacja:** Wymagana (Bearer token)

**Query Parameters:**
- `exhibitionId` - Opcjonalny filtr po ID wydarzenia

**Opis:** Pobiera kody QR dla zalogowanego wystawcy.

---

## Parametry

### Parametry ścieżki (Path Parameters)

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `code` | string | Tak | Kod QR do weryfikacji (access_code) |

---

## Struktura kodu QR

Kod QR składa się z następujących elementów:

```
[Nazwa Wystawy][ID Wystawy][ID Wystawcy][EntryID][RndSuffix][EntryID]
```

### Przykład rzeczywistego kodu:
```
WARSAW INDUSTRY WEEK0017w123456789123rnd654321456789123
```

Gdzie:
- `WARSAW INDUSTRY WEEK` - pełna nazwa wystawy
- `0017` - ID wystawy (4 cyfry z dopełnieniem zerami)
- `w123` - ID wystawcy z prefiksem "w" (3 cyfry z dopełnieniem zerami)
- `456789123` - unikalny identyfikator wpisu (9 cyfr)
- `rnd654321` - losowy sufiks bezpieczeństwa (prefix "rnd" + 6 cyfr)
- `456789123` - powtórzony identyfikator wpisu (weryfikacja)

---

## Odpowiedzi API

### Sukces (200 OK)

Kod QR jest poprawny i został znaleziony w systemie.

```json
{
  "success": true,
  "valid": true,
  "message": "Kod QR jest poprawny",
  "data": {
    "person": {
      "id": 123,
      "fullName": "Jan Kowalski",
      "position": "Wystawca",
      "email": "jan.kowalski@firma.pl",
      "registeredAt": "2025-10-30T10:30:00.000Z"
    },
    "exhibitor": {
      "id": 456,
      "companyName": "ABC Electronics Sp. z o.o.",
      "nip": "1234567890"
    },
    "exhibition": {
      "id": 17,
      "name": "WARSAW INDUSTRY WEEK",
      "startDate": "04.11.2025",
      "endDate": "07.11.2025",
      "location": "Warszawa",
      "status": "active"
    },
    "accessCode": "WARSAW INDUSTRY WEEK0017w456789123rnd654321789123",
    "verifiedAt": "2025-10-30T12:15:30.000Z"
  }
}
```

### Kod nie znaleziony (404 Not Found)

Kod QR nie istnieje w systemie.

```json
{
  "success": false,
  "valid": false,
  "message": "Kod QR nie został znaleziony w systemie"
}
```

### Błąd walidacji (400 Bad Request)

Kod nie został podany lub jest pusty.

```json
{
  "success": false,
  "valid": false,
  "message": "Kod QR jest wymagany"
}
```

### Błąd serwera (500 Internal Server Error)

Wystąpił błąd podczas weryfikacji.

```json
{
  "success": false,
  "valid": false,
  "message": "Wystąpił błąd podczas weryfikacji kodu QR",
  "error": "Szczegóły błędu (tylko w trybie development)"
}
```

---

## Przykłady użycia

### Przykład 1: Weryfikacja kodu QR

#### cURL

```bash
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-verify/WARSAW%20INDUSTRY%20WEEK0017w456789123rnd654321789123"
```

#### JavaScript (Fetch API)

```javascript
const code = "WARSAW INDUSTRY WEEK0017w456789123rnd654321789123";
const encodedCode = encodeURIComponent(code);

fetch(`https://ptak-expo-backend-production.up.railway.app/api/v1/qr-verify/${encodedCode}`)
  .then(response => response.json())
  .then(data => {
    if (data.valid) {
      console.log('✅ Kod poprawny:', data.data.person.fullName);
      console.log('Firma:', data.data.exhibitor.companyName);
      console.log('Wydarzenie:', data.data.exhibition.name);
    } else {
      console.error('❌ Kod niepoprawny:', data.message);
    }
  })
  .catch(error => {
    console.error('Błąd połączenia:', error);
  });
```

### Python (Requests)

```python
import requests
from urllib.parse import quote

code = "WARSAW INDUSTRY WEEK0017w456789123rnd654321789123"
encoded_code = quote(code)

response = requests.get(f"https://ptak-expo-backend-production.up.railway.app/api/v1/qr-verify/{encoded_code}")
data = response.json()

if data.get("valid"):
    print("✅ Kod poprawny:")
    print(f"Osoba: {data['data']['person']['fullName']}")
    print(f"Firma: {data['data']['exhibitor']['companyName']}")
    print(f"Wydarzenie: {data['data']['exhibition']['name']}")
else:
    print(f"❌ Kod niepoprawny: {data.get('message')}")
```

### C# (.NET)

```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;

public class QRVerifier
{
    private static readonly HttpClient client = new HttpClient();

    public static async Task<bool> VerifyQRCode(string code)
    {
        var encodedCode = HttpUtility.UrlEncode(code);
        var url = $"https://ptak-expo-backend-production.up.railway.app/api/v1/qr-verify/{encodedCode}";

        try
        {
            var response = await client.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<QRVerifyResponse>(content);

            if (result.Valid)
            {
                Console.WriteLine($"✅ Kod poprawny: {result.Data.Person.FullName}");
                Console.WriteLine($"Firma: {result.Data.Exhibitor.CompanyName}");
                return true;
            }
            else
            {
                Console.WriteLine($"❌ Kod niepoprawny: {result.Message}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Błąd: {ex.Message}");
            return false;
        }
    }
}
```

### Java (Spring)

```java
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class QRVerifier {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiUrl = "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-verify";

    public boolean verifyQRCode(String code) {
        try {
            String encodedCode = URLEncoder.encode(code, StandardCharsets.UTF_8);
            String url = apiUrl + "/" + encodedCode;

            QRVerifyResponse response = restTemplate.getForObject(url, QRVerifyResponse.class);

            if (response != null && response.isValid()) {
                System.out.println("✅ Kod poprawny: " + response.getData().getPerson().getFullName());
                System.out.println("Firma: " + response.getData().getExhibitor().getCompanyName());
                return true;
            } else {
                System.out.println("❌ Kod niepoprawny: " + (response != null ? response.getMessage() : "Brak odpowiedzi"));
                return false;
            }
        } catch (Exception e) {
            System.err.println("Błąd: " + e.getMessage());
            return false;
        }
    }
}
```

---

### Przykład 2: Pobranie pojedynczego kodu QR (JSON)

#### cURL
```bash
# Pobranie danych o kodzie QR w formacie JSON
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/person/123"
```

#### JavaScript
```javascript
// Pobranie kodu QR dla osoby o ID 123
fetch('https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/person/123')
  .then(res => res.json())
  .then(data => {
    console.log('Kod QR:', data.data.accessCode);
    console.log('URL do obrazu:', data.data.qrCodeUrl);
    console.log('Osoba:', data.data.fullName);
  });
```

#### Odpowiedź JSON:
```json
{
  "success": true,
  "data": {
    "personId": 123,
    "fullName": "Jan Kowalski",
    "position": "Wystawca",
    "email": "jan.kowalski@firma.pl",
    "accessCode": "WARSAW INDUSTRY WEEK0017w456789123rnd654321789123",
    "exhibitor": {
      "id": 456,
      "companyName": "ABC Electronics Sp. z o.o."
    },
    "exhibition": {
      "id": 17,
      "name": "WARSAW INDUSTRY WEEK"
    },
    "qrCodeUrl": "/api/v1/qr-codes/person/123?format=image",
    "createdAt": "2025-10-30T10:30:00.000Z"
  }
}
```

---

### Przykład 3: Pobranie kodu QR jako obraz PNG

#### cURL
```bash
# Pobranie obrazu PNG z kodem QR
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/person/123?format=image" -o qr-code.png
```

#### JavaScript (wyświetlenie obrazu)
```javascript
// Wyświetlenie kodu QR jako obrazu
const personId = 123;
const imgElement = document.createElement('img');
imgElement.src = `https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/person/${personId}?format=image`;
imgElement.alt = 'QR Code';
document.body.appendChild(imgElement);
```

#### HTML (bezpośrednie wyświetlenie)
```html
<img src="https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/person/123?format=image" alt="QR Code" width="256" height="256">
```

---

### Przykład 4: Pobranie wszystkich kodów QR z wydarzenia (JSON)

#### cURL
```bash
# Wszystkie kody QR dla wydarzenia o ID 17
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/17"
```

#### JavaScript
```javascript
// Pobranie wszystkich kodów QR z wydarzenia
fetch('https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/17')
  .then(res => res.json())
  .then(data => {
    console.log(`Znaleziono ${data.data.count} kodów QR`);
    data.data.qrCodes.forEach(qr => {
      console.log(`- ${qr.fullName} (${qr.exhibitor.companyName}): ${qr.accessCode}`);
    });
  });
```

#### Odpowiedź JSON:
```json
{
  "success": true,
  "data": {
    "exhibition": {
      "id": 17,
      "name": "WARSAW INDUSTRY WEEK",
      "startDate": "2025-11-04",
      "endDate": "2025-11-07"
    },
    "qrCodes": [
      {
        "personId": 123,
        "fullName": "Jan Kowalski",
        "position": "Wystawca",
        "email": "jan.kowalski@firma.pl",
        "accessCode": "WARSAW INDUSTRY WEEK0017w456789123rnd654321789123",
        "exhibitor": {
          "id": 456,
          "companyName": "ABC Electronics Sp. z o.o.",
          "nip": "1234567890"
        },
        "qrCodeUrl": "/api/v1/qr-codes/person/123?format=image",
        "createdAt": "2025-10-30T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### Przykład 5: Pobranie wszystkich kodów QR jako archiwum ZIP

#### cURL
```bash
# Pobranie wszystkich kodów QR jako ZIP
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/17?format=zip" -o qr-codes.zip
```

#### JavaScript (download w przeglądarce)
```javascript
// Automatyczne pobranie pliku ZIP
const exhibitionId = 17;
const link = document.createElement('a');
link.href = `https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/${exhibitionId}?format=zip`;
link.download = `qr-codes-exhibition-${exhibitionId}.zip`;
link.click();
```

#### Python
```python
import requests

exhibition_id = 17
url = f"https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/{exhibition_id}?format=zip"

response = requests.get(url)
with open(f'qr-codes-{exhibition_id}.zip', 'wb') as f:
    f.write(response.content)

print(f"Pobrano archiwum ZIP z kodami QR")
```

---

### Przykład 6: Filtrowanie kodów QR po wystawcy

#### cURL
```bash
# Pobranie kodów QR tylko dla wystawcy o ID 456
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/17?exhibitorId=456"
```

#### JavaScript
```javascript
// Filtrowanie po wystawcy
const exhibitionId = 17;
const exhibitorId = 456;

fetch(`https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/exhibition/${exhibitionId}?exhibitorId=${exhibitorId}`)
  .then(res => res.json())
  .then(data => {
    console.log(`Znaleziono ${data.data.count} kodów dla wystawcy`);
  });
```

---

### Przykład 7: Pobranie moich kodów QR (jako zalogowany wystawca)

#### JavaScript
```javascript
// Wymagane: token autoryzacji
const token = 'your-auth-token-here';

fetch('https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/my-codes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log(`Moja firma: ${data.data.exhibitor.companyName}`);
    console.log(`Liczba kodów: ${data.data.count}`);
    data.data.qrCodes.forEach(qr => {
      console.log(`- ${qr.fullName}: ${qr.accessCode}`);
    });
  });
```

#### cURL
```bash
# Z tokenem autoryzacji
curl -X GET "https://ptak-expo-backend-production.up.railway.app/api/v1/qr-codes/my-codes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Podsumowanie endpointów

| Endpoint | Metoda | Autoryzacja | Opis |
|----------|--------|-------------|------|
| `/api/v1/qr-verify/:code` | GET | Nie | Weryfikuje czy kod QR istnieje w systemie |
| `/api/v1/qr-codes/person/:personId` | GET | Nie | Pobiera kod QR dla osoby (JSON lub PNG) |
| `/api/v1/qr-codes/exhibition/:exhibitionId` | GET | Nie | Pobiera wszystkie kody z wydarzenia (JSON lub ZIP) |
| `/api/v1/qr-codes/my-codes` | GET | Tak | Pobiera kody QR zalogowanego wystawcy |

---

## URL API

### Produkcja
```
https://ptak-expo-backend-production.up.railway.app/api/v1/
```

### Development (lokalne)
```
http://localhost:3001/api/v1/
```

---

## Ważne informacje

### ⚠️ API tylko POBIERA istniejące kody
- API **nie tworzy** nowych kodów QR
- Kody QR są generowane w aplikacji webowej przez wystawców (checklisty)
- API służy tylko do **odczytu** i weryfikacji kodów, które już istnieją w bazie danych

### 📋 Gdzie powstają kody QR
Kody QR są generowane automatycznie gdy wystawca:
1. Loguje się do panelu wystawcy
2. Otwiera checklistę dla wydarzenia
3. Dodaje e-identyfikator (osobę) przez formularz
4. System automatycznie generuje unikalny kod QR i zapisuje w bazie

### 🔍 Przypadki użycia API
1. **Weryfikacja** - urządzenia przy wejściu sprawdzają czy kod jest poprawny
2. **Pobieranie obrazów** - wyświetlanie kodów QR w aplikacjach mobilnych
3. **Export masowy** - pobieranie wszystkich kodów z wydarzenia jako ZIP
4. **Integracja** - zewnętrzne systemy mogą pobierać dane o kodach QR

---

## Historia zmian

### v1.1 (2025-11-03)
- Dodano endpointy do pobierania kodów QR
- GET `/api/v1/qr-codes/person/:personId` - pojedynczy kod (JSON/PNG)
- GET `/api/v1/qr-codes/exhibition/:exhibitionId` - wszystkie kody z wydarzenia (JSON/ZIP)
- GET `/api/v1/qr-codes/my-codes` - kody dla zalogowanego wystawcy
- Dodano biblioteki `qrcode` i `archiver` do backend

### v1.0 (2025-10-30)
- Pierwsza wersja API weryfikacji kodów QR
- Endpoint: `GET /api/v1/qr-verify/:code`
- Obsługa podstawowej weryfikacji i zwracania danych uczestnika
- Dodano kolumnę `access_code` do tabeli `exhibitor_people`

---

**Uwaga:** Zastąp `{code}`, `{personId}`, `{exhibitionId}` faktycznymi wartościami.
