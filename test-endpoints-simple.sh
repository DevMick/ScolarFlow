#!/bin/bash

# Script simple pour tester les endpoints

API_URL="http://localhost:3001/api"
EMAIL="mickael.andjui.12@gmail.com"
PASSWORD="password123"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TEST SIMPLE DES ENDPOINTS DE L'API                ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Test 1: Health Check
echo ""
echo "📋 Test 1: Health Check"
curl -s "$API_URL/health" | jq '.' || echo "❌ Erreur"

# Test 2: Login
echo ""
echo "📋 Test 2: Authentification"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur d'authentification"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."

# Test 3: GET /api/compte-gratuit/info
echo ""
echo "📋 Test 3: GET /api/compte-gratuit/info"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/compte-gratuit/info" | jq '.' || echo "❌ Erreur"

# Test 4: GET /api/school-years
echo ""
echo "📋 Test 4: GET /api/school-years"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/school-years" | jq '.' || echo "❌ Erreur"

echo ""
echo "✅ Tests terminés"

