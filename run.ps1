Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Header Scanner - Test, Lint, Build & Start  " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

function Run-Step {
    param (
        [string]$StepName,
        [string]$Command
    )
    
    Write-Host "`n[*] Starting: $StepName..." -ForegroundColor Yellow
    Write-Host "Executing: $Command`n" -ForegroundColor Cyan
    
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[FAIL] Error: $StepName failed with exit code $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    } else {
        Write-Host "[PASS] Success: $StepName completed successfully!" -ForegroundColor Green
    }
}

# 1. Run Tests
Run-Step "Unit Tests" "npm run test"

# 2. Run Secret Scan
Run-Step "Secret Scan" "node scripts/scan-secrets.js"

# 3. Run Linting
Run-Step "Linter Check" "npm run lint"

# 4. Run Build
Run-Step "Production Build" "npm run build"

# 4. Start Application
Write-Host "`n[PASS] All checks passed! Starting the application..." -ForegroundColor Green
Write-Host "Executing: npm run start`n" -ForegroundColor Cyan
npm run start

