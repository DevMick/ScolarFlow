# Script PowerShell pour tester les endpoints localement
# Usage: .\test-endpoints-local.ps1 [port]
# Par défaut, teste sur http://localhost:3000

param(
    [int]$Port = 3000
)

$baseUrl = "http://localhost:$Port"

Write-Host "Test des Endpoints Locaux" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [object]$Body = $null
    )
    
    Write-Host "Test: $Description" -ForegroundColor Yellow
    Write-Host "   $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            Write-Host "   OK: Status $statusCode" -ForegroundColor Green
            
            try {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "   Response:" -ForegroundColor Cyan
                ($json | ConvertTo-Json -Depth 5) | Write-Host -ForegroundColor Gray
            } catch {
                Write-Host "   Response (texte): $($response.Content)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ATTENTION: Status $statusCode" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ERREUR: $statusCode" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "   Response: $responseBody" -ForegroundColor Gray
            } catch {
                Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   📄 Message: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
}

# Test 1: Route racine
Test-Endpoint -Method "GET" -Url "$baseUrl/" -Description "Route racine (/)"

# Test 2: Health check
Test-Endpoint -Method "GET" -Url "$baseUrl/api/health" -Description "Health check (/api/health)"

# Test 3: Hello endpoint
Test-Endpoint -Method "GET" -Url "$baseUrl/api/hello" -Description "Hello endpoint (/api/hello)"

# Résumé
Write-Host "Tests termines" -ForegroundColor Green
Write-Host ""
Write-Host "Si tous les tests passent, votre API est prete pour Vercel !" -ForegroundColor Cyan

