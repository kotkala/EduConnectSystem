# ===================================================================
# VALIDATION & CLEANUP - CONTEXT7 COMPLIANT
# ===================================================================
# Comprehensive validation and cleanup of features-based migration
# Implements Context7 quality assurance and systematic verification
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$CleanupOldStructure = $false,
    [string]$ValidationLevel = "COMPREHENSIVE"
)

# Context7 Pattern: Explicit Contracts
$ValidationConfig = @{
    Intent = "Comprehensive validation and cleanup of features-based migration"
    ValidationSuites = @(
        "StructureValidation",
        "FileIntegrityCheck", 
        "DependencyValidation",
        "TypeScriptValidation",
        "BuildValidation",
        "RuntimeValidation"
    )
    CleanupTargets = @(
        "components",  # Old components directory
        "lib",         # Old lib directory (if fully migrated)
        "hooks",       # Old hooks directory
        "utils",       # Old utils directory
        "contexts"     # Old contexts directory
    )
    RequiredStructure = @{
        "src/features" = @("authentication", "grade-management", "admin-management")
        "src/shared" = @("components", "hooks", "utils", "types")
        "src/lib" = @("supabase", "validations", "config")
        "src/app" = @()
        "src/providers" = @()
    }
}

function Write-ValidationLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [VALIDATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Test-DirectoryStructure {
    Write-ValidationLog "Validating directory structure..."
    
    $structureValid = $true
    $missingDirectories = @()
    
    foreach ($requiredDir in $ValidationConfig.RequiredStructure.Keys) {
        if (-not (Test-Path $requiredDir)) {
            $missingDirectories += $requiredDir
            $structureValid = $false
            Write-ValidationLog "❌ Missing required directory: $requiredDir" "ERROR"
        } else {
            Write-ValidationLog "✅ Found: $requiredDir" "SUCCESS"
            
            # Check subdirectories
            $requiredSubDirs = $ValidationConfig.RequiredStructure[$requiredDir]
            foreach ($subDir in $requiredSubDirs) {
                $fullPath = Join-Path $requiredDir $subDir
                if (-not (Test-Path $fullPath)) {
                    $missingDirectories += $fullPath
                    $structureValid = $false
                    Write-ValidationLog "❌ Missing subdirectory: $fullPath" "ERROR"
                } else {
                    Write-ValidationLog "✅ Found: $fullPath" "SUCCESS"
                }
            }
        }
    }
    
    return @{
        Valid = $structureValid
        MissingDirectories = $missingDirectories
    }
}

function Test-FileIntegrity {
    Write-ValidationLog "Checking file integrity..."
    
    $integrityIssues = @()
    
    # Check if file inventory exists
    if (Test-Path "file-inventory.json") {
        $inventory = Get-Content "file-inventory.json" | ConvertFrom-Json
        
        foreach ($filePath in $inventory.PSObject.Properties.Name) {
            $fileInfo = $inventory.$filePath
            
            # Check if file exists in new location
            if ($fileInfo.MigrationTarget -and (Test-Path $fileInfo.MigrationTarget)) {
                # Verify file hash if possible
                try {
                    $currentHash = Get-FileHash $fileInfo.MigrationTarget -Algorithm SHA256
                    if ($currentHash.Hash -ne $fileInfo.Hash) {
                        $integrityIssues += "Hash mismatch: $($fileInfo.MigrationTarget)"
                    }
                } catch {
                    $integrityIssues += "Cannot verify hash: $($fileInfo.MigrationTarget)"
                }
            }
        }
    }
    
    return @{
        Valid = $integrityIssues.Count -eq 0
        Issues = $integrityIssues
    }
}

function Test-Dependencies {
    Write-ValidationLog "Validating dependencies and imports..."
    
    $dependencyIssues = @()
    
    # Get all TypeScript/JavaScript files in src/
    $srcFiles = Get-ChildItem -Path "src" -Recurse -File | Where-Object { 
        $_.Extension -match '\.(tsx?|jsx?)$' 
    }
    
    foreach ($file in $srcFiles) {
        try {
            $content = Get-Content -Path $file.FullName -Raw
            
            # Check for old import patterns that should have been updated
            $oldPatterns = @(
                "@/components/(?!.*src/)",
                "@/lib/(?!.*src/)",
                "@/hooks/(?!.*src/)",
                "@/utils/(?!.*src/)",
                "@/contexts/(?!.*src/)"
            )
            
            foreach ($pattern in $oldPatterns) {
                if ($content -match $pattern) {
                    $dependencyIssues += "Old import pattern found in: $($file.FullName)"
                }
            }
            
        } catch {
            $dependencyIssues += "Cannot analyze dependencies in: $($file.FullName)"
        }
    }
    
    return @{
        Valid = $dependencyIssues.Count -eq 0
        Issues = $dependencyIssues
    }
}

function Test-TypeScriptCompilation {
    Write-ValidationLog "Testing TypeScript compilation..."
    
    try {
        $result = & bun x tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ValidationLog "✅ TypeScript compilation successful" "SUCCESS"
            return @{ Valid = $true; Output = $result }
        } else {
            Write-ValidationLog "❌ TypeScript compilation failed" "ERROR"
            return @{ Valid = $false; Output = $result }
        }
    } catch {
        Write-ValidationLog "❌ Error running TypeScript check: $($_.Exception.Message)" "ERROR"
        return @{ Valid = $false; Output = $_.Exception.Message }
    }
}

function Test-BuildProcess {
    Write-ValidationLog "Testing build process..."
    
    try {
        $result = & bun run build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ValidationLog "✅ Build successful" "SUCCESS"
            return @{ Valid = $true; Output = $result }
        } else {
            Write-ValidationLog "❌ Build failed" "ERROR"
            return @{ Valid = $false; Output = $result }
        }
    } catch {
        Write-ValidationLog "❌ Error running build: $($_.Exception.Message)" "ERROR"
        return @{ Valid = $false; Output = $_.Exception.Message }
    }
}

function Test-RuntimeValidation {
    Write-ValidationLog "Testing runtime validation..."
    
    # Check if development server can start
    try {
        Write-ValidationLog "Starting development server for validation..."
        
        # Start dev server in background
        $devProcess = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
        
        # Wait a bit for server to start
        Start-Sleep -Seconds 10
        
        # Try to make a request to localhost:3000
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
            $runtimeValid = $response.StatusCode -eq 200
        } catch {
            $runtimeValid = $false
        }
        
        # Stop dev server
        Stop-Process -Id $devProcess.Id -Force
        
        if ($runtimeValid) {
            Write-ValidationLog "✅ Runtime validation successful" "SUCCESS"
        } else {
            Write-ValidationLog "❌ Runtime validation failed" "ERROR"
        }
        
        return @{ Valid = $runtimeValid }
        
    } catch {
        Write-ValidationLog "❌ Error during runtime validation: $($_.Exception.Message)" "ERROR"
        return @{ Valid = $false; Error = $_.Exception.Message }
    }
}

function Remove-OldStructure {
    param([array]$Targets, [switch]$DryRun)
    
    Write-ValidationLog "Cleaning up old directory structure..."
    
    $cleanupResults = @()
    
    foreach ($target in $Targets) {
        if (Test-Path $target) {
            $itemCount = (Get-ChildItem -Path $target -Recurse -File).Count
            
            if ($DryRun) {
                Write-ValidationLog "Would remove: $target ($itemCount files)"
                $cleanupResults += @{ Target = $target; Action = "Would Remove"; FileCount = $itemCount }
            } else {
                try {
                    Remove-Item -Path $target -Recurse -Force
                    Write-ValidationLog "✅ Removed: $target ($itemCount files)" "SUCCESS"
                    $cleanupResults += @{ Target = $target; Action = "Removed"; FileCount = $itemCount }
                } catch {
                    Write-ValidationLog "❌ Failed to remove $target`: $($_.Exception.Message)" "ERROR"
                    $cleanupResults += @{ Target = $target; Action = "Failed"; Error = $_.Exception.Message }
                }
            }
        } else {
            Write-ValidationLog "Target not found: $target" "WARN"
            $cleanupResults += @{ Target = $target; Action = "Not Found"; FileCount = 0 }
        }
    }
    
    return $cleanupResults
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    VALIDATION & CLEANUP - QUALITY ASSURANCE" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-ValidationLog "Starting comprehensive validation and cleanup..."

if ($DryRun) {
    Write-ValidationLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Context7 Pattern: Systematic Validation
$validationResults = @{}

# 1. Structure Validation
Write-Host "🏗️  STRUCTURE VALIDATION" -ForegroundColor Cyan
$structureResult = Test-DirectoryStructure
$validationResults["Structure"] = $structureResult

# 2. File Integrity Check
Write-Host "🔍 FILE INTEGRITY CHECK" -ForegroundColor Cyan
$integrityResult = Test-FileIntegrity
$validationResults["Integrity"] = $integrityResult

# 3. Dependency Validation
Write-Host "🔗 DEPENDENCY VALIDATION" -ForegroundColor Cyan
$dependencyResult = Test-Dependencies
$validationResults["Dependencies"] = $dependencyResult

# 4. TypeScript Validation
Write-Host "📝 TYPESCRIPT VALIDATION" -ForegroundColor Cyan
$typescriptResult = Test-TypeScriptCompilation
$validationResults["TypeScript"] = $typescriptResult

# 5. Build Validation
Write-Host "🔨 BUILD VALIDATION" -ForegroundColor Cyan
$buildResult = Test-BuildProcess
$validationResults["Build"] = $buildResult

# 6. Runtime Validation (if requested)
if ($ValidationLevel -eq "COMPREHENSIVE") {
    Write-Host "🚀 RUNTIME VALIDATION" -ForegroundColor Cyan
    $runtimeResult = Test-RuntimeValidation
    $validationResults["Runtime"] = $runtimeResult
}

# Context7 Pattern: Quality Assurance Summary
Write-Host ""
Write-Host "📊 VALIDATION SUMMARY:" -ForegroundColor Yellow
Write-Host ""

$overallValid = $true
foreach ($suite in $validationResults.Keys) {
    $result = $validationResults[$suite]
    $status = if ($result.Valid) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Valid) { "Green" } else { "Red" }
    
    Write-Host "  $suite`: $status" -ForegroundColor $color
    
    if (-not $result.Valid) {
        $overallValid = $false
        
        # Show issues
        if ($result.Issues) {
            foreach ($issue in $result.Issues) {
                Write-Host "    • $issue" -ForegroundColor Red
            }
        }
        if ($result.MissingDirectories) {
            foreach ($missing in $result.MissingDirectories) {
                Write-Host "    • Missing: $missing" -ForegroundColor Red
            }
        }
    }
}

# Cleanup old structure if requested and validation passed
if ($CleanupOldStructure -and $overallValid) {
    Write-Host ""
    Write-Host "🧹 CLEANUP OLD STRUCTURE" -ForegroundColor Cyan
    
    if (-not $DryRun) {
        $response = Read-Host "Remove old directory structure? This cannot be undone. (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-ValidationLog "Cleanup cancelled by user" "WARN"
        } else {
            $cleanupResults = Remove-OldStructure -Targets $ValidationConfig.CleanupTargets -DryRun:$DryRun
        }
    } else {
        $cleanupResults = Remove-OldStructure -Targets $ValidationConfig.CleanupTargets -DryRun:$DryRun
    }
}

# Export validation results
$validationSummary = @{
    Timestamp = Get-Date
    OverallValid = $overallValid
    ValidationResults = $validationResults
    CleanupResults = if ($cleanupResults) { $cleanupResults } else { @() }
}

$validationSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "validation-results.json" -Encoding UTF8

# Final summary
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host "                    MIGRATION COMPLETE" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ""

if ($overallValid) {
    Write-ValidationLog "🎉 MIGRATION VALIDATION SUCCESSFUL!" "SUCCESS"
    Write-Host ""
    Write-Host "✅ Features-based architecture migration completed successfully!" -ForegroundColor Green
    Write-Host "✅ All validation suites passed" -ForegroundColor Green
    Write-Host "✅ Project is ready for development" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Update your IDE/editor settings for new paths" -ForegroundColor White
    Write-Host "2. Update documentation and README files" -ForegroundColor White
    Write-Host "3. Train team members on new structure" -ForegroundColor White
    Write-Host "4. Consider updating CI/CD pipelines" -ForegroundColor White
} else {
    Write-ValidationLog "⚠️ MIGRATION VALIDATION FAILED" "ERROR"
    Write-Host ""
    Write-Host "❌ Migration validation failed" -ForegroundColor Red
    Write-Host "🔧 Review validation results and fix issues" -ForegroundColor Yellow
    Write-Host "📋 Check validation-results.json for detailed information" -ForegroundColor Yellow
}

Write-Host ""
