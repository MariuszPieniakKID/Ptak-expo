#!/bin/bash

# Przejdź do katalogu
cd /Users/kid/Ptak-expo

# Usuń pliki merge bezpośrednio
rm -f .git/MERGE_HEAD 2>/dev/null
rm -f .git/MERGE_MODE 2>/dev/null  
rm -f .git/MERGE_MSG 2>/dev/null
rm -f .git/AUTO_MERGE 2>/dev/null

# Sprawdź czy pliki zostały usunięte
echo "=== Sprawdzanie plików merge ==="
ls -la .git/MERGE* 2>/dev/null || echo "Pliki merge zostały usunięte"

# Sprawdź current branch
echo "=== Current HEAD ==="
cat .git/HEAD

echo "=== Git reset complete ==="

