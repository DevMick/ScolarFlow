# Script PowerShell pour valider la configuration avant de tester avec vercel dev
# Usage: .\test-setup-vercel-simple.ps1

Write-Host "Validation de la Configuration Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# Test 1: Vercel CLI
Write-Host "1. Verification de Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Vercel CLI installe - $vercelVersion" -ForegroundColor Green
        $success += "Vercel CLI installe"
    } else {
        throw "Vercel CLI non fonctionnel"
    }
} catch {
    Write-Host "   ERREUR: Vercel CLI non trouve" -ForegroundColor Red
    $errors += "Vercel CLI nest pas installe. Executez: npm i -g vercel"
}

# Test 2: Build
Write-Host ""
Write-Host "2. Verification du build..." -ForegroundColor Yellow
if (Test-Path "apps/api/dist") {
    Write-Host "   OK: Dossier dist/ trouve" -ForegroundColor Green
    $success += "Build dist/ existe"
    
    if (Test-Path "apps/api/dist/server.js") {
        Write-Host "   OK: dist/server.js trouve" -ForegroundColor Green
        $success += "dist/server.js existe"
    } else {
        Write-Host "   ERREUR: dist/server.js manquant" -ForegroundColor Red
        $errors += "dist/server.js nexiste pas. Lancez: cd apps/api; pnpm build"
    }
} else {
    Write-Host "   ERREUR: Dossier dist/ manquant" -ForegroundColor Red
    $errors += "Le dossier dist/ nexiste pas. Lancez: cd apps/api; pnpm build"
}

# Test 3: api/index.ts
Write-Host ""
Write-Host "3. Verification de api/index.ts..." -ForegroundColor Yellow
if (Test-Path "api/index.ts") {
    Write-Host "   OK: api/index.ts trouve" -ForegroundColor Green
    $success += "api/index.ts existe"
} else {
    Write-Host "   ERREUR: api/index.ts manquant" -ForegroundColor Red
    $errors += "api/index.ts nexiste pas a la racine du projet"
}

# Test 4: vercel.json
Write-Host ""
Write-Host "4. Verification de vercel.json..." -ForegroundColor Yellow
if (Test-Path "vercel.json") {
    Write-Host "   OK: vercel.json trouve" -ForegroundColor Green
    $success += "vercel.json existe"
} else {
    Write-Host "   ERREUR: vercel.json manquant" -ForegroundColor Red
    $errors += "vercel.json nexiste pas a la racine du projet"
}

# Test 5: Variables d'environnement
Write-Host ""
Write-Host "5. Verification des variables d'environnement..." -ForegroundColor Yellow
$envFile = $null
if (Test-Path ".env.local") {
    $envFile = ".env.local"
    Write-Host "   OK: .env.local trouve" -ForegroundColor Green
} elseif (Test-Path ".env") {
    $envFile = ".env"
    Write-Host "   OK: .env trouve" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Aucun fichier .env.local ou .env trouve" -ForegroundColor Yellow
    $warnings += "Aucun fichier denvironnement trouve. Creez .env.local avec DATABASE_URL"
}

if ($envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match "DATABASE_URL") {
        Write-Host "   OK: DATABASE_URL trouvee dans $envFile" -ForegroundColor Green
        $success += "DATABASE_URL configuree"
    } else {
        Write-Host "   ATTENTION: DATABASE_URL manquante dans $envFile" -ForegroundColor Yellow
        $warnings += "DATABASE_URL nest pas definie dans $envFile"
    }
}

# Resume
Write-Host ""
Write-Host "Resume" -ForegroundColor Cyan
Write-Host "======" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "Succes ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "Avertissements ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "Erreurs ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   - $item" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Corrigez ces erreurs avant de continuer." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Configuration valide !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant lancer:" -ForegroundColor Cyan
    Write-Host "   vercel dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou utiliser le script:" -ForegroundColor Cyan
    Write-Host "   .\test-local-vercel.ps1" -ForegroundColor White
    exit 0
}

