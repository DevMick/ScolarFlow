# Script PowerShell pour tester l'API localement avec Vercel Dev
# Usage: .\test-local-vercel.ps1

Write-Host "🧪 Test Local avec Vercel Dev" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Vercel CLI est installé
Write-Host "📦 Vérification de Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel CLI non trouvé"
    }
    Write-Host "✅ Vercel CLI installé : $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI n'est pas installé" -ForegroundColor Red
    Write-Host "📥 Installation de Vercel CLI..." -ForegroundColor Yellow
    Write-Host "   Exécutez: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou installez-le maintenant ? (O/N)" -ForegroundColor Yellow
    $install = Read-Host
    if ($install -eq "O" -or $install -eq "o") {
        npm i -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Échec de l'installation" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Vercel CLI installé avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Vercel CLI requis pour continuer" -ForegroundColor Red
        exit 1
    }
}

# Vérifier que le build existe
Write-Host ""
Write-Host "🔨 Vérification du build..." -ForegroundColor Yellow
if (-not (Test-Path "apps/api/dist")) {
    Write-Host "⚠️  Le dossier dist/ n'existe pas. Build en cours..." -ForegroundColor Yellow
    Set-Location apps/api
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec du build" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
    Set-Location ../..
    Write-Host "✅ Build réussi" -ForegroundColor Green
} else {
    Write-Host "✅ Dossier dist/ trouvé" -ForegroundColor Green
}

# Vérifier que api/index.ts existe
Write-Host ""
Write-Host "📁 Vérification des fichiers..." -ForegroundColor Yellow
if (-not (Test-Path "api/index.ts")) {
    Write-Host "❌ api/index.ts n'existe pas" -ForegroundColor Red
    exit 1
}
Write-Host "✅ api/index.ts trouvé" -ForegroundColor Green

# Vérifier que vercel.json existe
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ vercel.json n'existe pas" -ForegroundColor Red
    exit 1
}
Write-Host "✅ vercel.json trouvé" -ForegroundColor Green

# Vérifier les variables d'environnement
Write-Host ""
Write-Host "🔐 Vérification des variables d'environnement..." -ForegroundColor Yellow
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    $envFile = ".env"
}

if (Test-Path $envFile) {
    Write-Host "✅ Fichier d'environnement trouvé : $envFile" -ForegroundColor Green
    $hasDatabaseUrl = Select-String -Path $envFile -Pattern "DATABASE_URL" -Quiet
    if (-not $hasDatabaseUrl) {
        Write-Host "⚠️  DATABASE_URL non trouvée dans $envFile" -ForegroundColor Yellow
        Write-Host "   L'API pourrait ne pas se connecter à la base de données" -ForegroundColor Yellow
    } else {
        Write-Host "✅ DATABASE_URL trouvée" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Aucun fichier .env.local ou .env trouvé" -ForegroundColor Yellow
    Write-Host "   Créez un fichier .env.local avec vos variables d'environnement" -ForegroundColor Yellow
}

# Afficher les instructions
Write-Host ""
Write-Host "🚀 Prêt à lancer vercel dev" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Le serveur va démarrer sur http://localhost:3000" -ForegroundColor White
Write-Host "2. Testez les endpoints suivants:" -ForegroundColor White
Write-Host "   - GET http://localhost:3000/" -ForegroundColor Gray
Write-Host "   - GET http://localhost:3000/api/health" -ForegroundColor Gray
Write-Host "   - GET http://localhost:3000/api/hello" -ForegroundColor Gray
Write-Host "3. Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor White
Write-Host ""
Write-Host "Lancement de vercel dev dans 3 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Lancer vercel dev
Write-Host ""
Write-Host "🚀 Lancement de vercel dev..." -ForegroundColor Cyan
Write-Host ""

vercel dev

