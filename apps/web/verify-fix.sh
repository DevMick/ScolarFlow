#!/bin/bash

echo "🔍 Vérification de la correction de l'erreur Ant Design..."
echo ""

# Test 1: Vérifier que le fichier main.tsx a la configuration correcte
echo "Test 1: Vérifier que main.tsx a la configuration de thème correcte"
if grep -q "const defaultThemeConfig = {" apps/web/src/main.tsx; then
  echo "✅ Configuration de thème trouvée dans main.tsx"
else
  echo "❌ Configuration de thème NOT trouvée dans main.tsx"
  exit 1
fi

# Test 2: Vérifier que le token est défini
if grep -q "token: {" apps/web/src/main.tsx; then
  echo "✅ Token object est défini"
else
  echo "❌ Token object NOT défini"
  exit 1
fi

# Test 3: Vérifier que colorPrimary est défini
if grep -q "colorPrimary:" apps/web/src/main.tsx; then
  echo "✅ colorPrimary est défini"
else
  echo "❌ colorPrimary NOT défini"
  exit 1
fi

# Test 4: Vérifier que borderRadius est défini
if grep -q "borderRadius:" apps/web/src/main.tsx; then
  echo "✅ borderRadius est défini"
else
  echo "❌ borderRadius NOT défini"
  exit 1
fi

# Test 5: Vérifier que ConfigProvider utilise defaultThemeConfig
if grep -q "theme={defaultThemeConfig}" apps/web/src/main.tsx; then
  echo "✅ ConfigProvider utilise defaultThemeConfig"
else
  echo "❌ ConfigProvider n'utilise pas defaultThemeConfig"
  exit 1
fi

echo ""
echo "✅ Tous les tests de vérification sont passés!"
echo ""
echo "La correction a été appliquée avec succès."
echo "L'erreur 'Cannot convert undefined or null to object' ne devrait plus apparaître."

