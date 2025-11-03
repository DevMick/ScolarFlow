# Script de test pour simuler le build Vercel
# Usage: ./test-vercel-build.ps1 [api|web]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("api", "web", "all")]
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Test de Build Vercel" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier la version de pnpm
Write-Host "1. Vérification de la version pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ pnpm n'est pas installé" -ForegroundColor Red
    exit 1
}

Write-Host "   Version pnpm: $pnpmVersion" -ForegroundColor Green

# Vérifier que pnpm >= 8.0.0
$versionParts = $pnpmVersion -split '\.'
$majorVersion = [int]$versionParts[0]
if ($majorVersion -lt 8) {
    Write-Host "   ⚠️  Version pnpm < 8.0.0 (requis: >=8.0.0)" -ForegroundColor Yellow
    Write-Host "   Installation de pnpm 8.12.0..." -ForegroundColor Yellow
    npm install -g pnpm@8.12.0
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Impossible d'installer pnpm 8.12.0" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ pnpm 8.12.0 installé" -ForegroundColor Green
}

# Test API
if ($Target -eq "api" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "2. Test de build API..." -ForegroundColor Yellow
    Write-Host "   Simulation: cd ../.. && pnpm install && cd apps/api && pnpm build" -ForegroundColor Gray
    
    Push-Location $PSScriptRoot
    try {
        # Installer les dépendances
        Write-Host "   Installation des dépendances..." -ForegroundColor Gray
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Échec de l'installation des dépendances" -ForegroundColor Red
            exit 1
        }
        
        # Build API
        Write-Host "   Build de l'API..." -ForegroundColor Gray
        Push-Location apps/api
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Échec du build API" -ForegroundColor Red
            Pop-Location
            Pop-Location
            exit 1
        }
        Write-Host "   ✅ Build API réussi" -ForegroundColor Green
        Pop-Location
    }
    catch {
        Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Test Web
if ($Target -eq "web" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "3. Test de build Web..." -ForegroundColor Yellow
    Write-Host "   Simulation: cd ../.. && pnpm install && cd apps/web && pnpm build" -ForegroundColor Gray
    
    Push-Location $PSScriptRoot
    try {
        # Installer les dépendances
        Write-Host "   Installation des dépendances..." -ForegroundColor Gray
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Échec de l'installation des dépendances" -ForegroundColor Red
            exit 1
        }
        
        # Build Web
        Write-Host "   Build du Web..." -ForegroundColor Gray
        Push-Location apps/web
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Échec du build Web" -ForegroundColor Red
            Pop-Location
            Pop-Location
            exit 1
        }
        Write-Host "   ✅ Build Web réussi" -ForegroundColor Green
        Pop-Location
    }
    catch {
        Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Tous les tests sont passés !" -ForegroundColor Green
Write-Host "Vous pouvez maintenant push sur GitHub" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

