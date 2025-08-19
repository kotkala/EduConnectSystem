# ===================================================================
# IMPORT PATH UPDATER - CONTEXT7 COMPLIANT
# ===================================================================
# Updates all import statements across 368 files to new features-based paths
# Implements Context7 systematic transformation and validation principles
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$BackupFirst = $true,
    [string]$ValidationLevel = "FULL"
)

# Context7 Pattern: Explicit Contracts
$ImportUpdateConfig = @{
    Intent = "Systematically update all import paths to features-based architecture"
    PathMappings = @{
        # Components mappings
        "@/components/ui/" = "@/shared/components/ui/"
        "@/components/admin/" = "@/features/admin-management/components/"
        "@/components/teacher/" = "@/features/teacher-management/components/"
        "@/components/parent/" = "@/features/parent-dashboard/components/"
        "@/components/student/" = "@/features/student-management/components/"
        "@/components/" = "@/shared/components/common/"
        
        # Lib mappings
        "@/lib/actions/admin" = "@/features/admin-management/actions"
        "@/lib/actions/teacher" = "@/features/teacher-management/actions"
        "@/lib/actions/parent" = "@/features/parent-dashboard/actions"
        "@/lib/actions/student" = "@/features/student-management/actions"
        "@/lib/actions/grade" = "@/features/grade-management/actions"
        "@/lib/actions/" = "@/shared/actions/"
        "@/lib/utils/" = "@/shared/utils/"
        "@/lib/types/" = "@/shared/types/"
        "@/lib/validations/" = "@/lib/validations/"
        "@/lib/constants/" = "@/lib/constants/"
        "@/lib/supabase/" = "@/lib/supabase/"
        "@/lib/auth/" = "@/lib/auth/"
        "@/lib/" = "@/lib/"
        
        # Hooks mappings
        "@/hooks/" = "@/shared/hooks/"
        
        # Utils mappings  
        "@/utils/" = "@/shared/utils/"
        
        # Contexts mappings
        "@/contexts/" = "@/providers/"
        
        # App mappings (mostly stay the same)
        "@/app/" = "@/app/"
    }
    
    # Relative import patterns to update
    RelativePatterns = @{
        "../../components/" = "../../shared/components/"
        "../components/" = "../shared/components/"
        "./components/" = "./shared/components/"
        "../../lib/" = "../../lib/"
        "../lib/" = "../lib/"
    }
}

function Write-ImportLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [IMPORT-UPDATE] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Update-ImportPaths {
    param(
        [string]$FilePath,
        [hashtable]$PathMappings,
        [switch]$DryRun
    )
    
    try {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        $updatesCount = 0
        
        # Update absolute imports (with @/ prefix)
        foreach ($oldPath in $PathMappings.Keys) {
            $newPath = $PathMappings[$oldPath]
            
            # Create regex pattern for import statements
            $pattern = "import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['""]" + [regex]::Escape($oldPath) + "([^'""]*)['""]"
            
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $fullOldPath = $oldPath + $match.Groups[1].Value
                $fullNewPath = $newPath + $match.Groups[1].Value
                
                $oldImportStatement = $match.Value
                $newImportStatement = $oldImportStatement -replace [regex]::Escape($fullOldPath), $fullNewPath
                
                $content = $content -replace [regex]::Escape($oldImportStatement), $newImportStatement
                $updatesCount++
                
                Write-ImportLog "  Updated: $fullOldPath -> $fullNewPath"
            }
        }
        
        # Update relative imports if file is in src/
        if ($FilePath -like "src/*") {
            foreach ($oldPattern in $ImportUpdateConfig.RelativePatterns.Keys) {
                $newPattern = $ImportUpdateConfig.RelativePatterns[$oldPattern]
                
                $pattern = "import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+)?from\s+['""]" + [regex]::Escape($oldPattern) + "([^'""]*)['""]"
                
                if ($content -match $pattern) {
                    $content = $content -replace [regex]::Escape($oldPattern), $newPattern
                    $updatesCount++
                    Write-ImportLog "  Updated relative: $oldPattern -> $newPattern"
                }
            }
        }
        
        # Write updated content if changes were made
        if ($updatesCount -gt 0 -and -not $DryRun) {
            $content | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
            Write-ImportLog "✅ Updated $updatesCount imports in: $FilePath" "SUCCESS"
        } elseif ($updatesCount -gt 0 -and $DryRun) {
            Write-ImportLog "Would update $updatesCount imports in: $FilePath"
        }
        
        return @{
            Success = $true
            UpdatesCount = $updatesCount
            FilePath = $FilePath
        }
        
    } catch {
        Write-ImportLog "❌ Failed to update imports in $FilePath`: $($_.Exception.Message)" "ERROR"
        return @{
            Success = $false
            UpdatesCount = 0
            FilePath = $FilePath
            Error = $_.Exception.Message
        }
    }
}

function Test-TypeScriptCompilation {
    Write-ImportLog "Testing TypeScript compilation..."
    
    try {
        $result = & bun x tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ImportLog "✅ TypeScript compilation successful" "SUCCESS"
            return $true
        } else {
            Write-ImportLog "❌ TypeScript compilation failed:" "ERROR"
            Write-ImportLog $result "ERROR"
            return $false
        }
    } catch {
        Write-ImportLog "❌ Error running TypeScript check: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Backup-SourceFiles {
    param([array]$Files)
    
    $backupDir = "backup-imports-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-ImportLog "Creating backup: $backupDir"
    
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    foreach ($file in $Files) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
        $backupPath = Join-Path $backupDir $relativePath
        $backupParent = Split-Path $backupPath -Parent
        
        if (-not (Test-Path $backupParent)) {
            New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
        }
        
        Copy-Item -Path $file.FullName -Destination $backupPath -Force
    }
    
    Write-ImportLog "✅ Backup created: $backupDir" "SUCCESS"
    return $backupDir
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    IMPORT PATH UPDATER - SYSTEMATIC TRANSFORMATION" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-ImportLog "Starting import path updates across all files..."

if ($DryRun) {
    Write-ImportLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Get all TypeScript/JavaScript files
$excludePattern = 'node_modules|\.next|\.git|\.augment|\.cursor|build|dist|coverage'
$allFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch $excludePattern -and 
    $_.Extension -match '\.(tsx?|jsx?)$' 
}

Write-ImportLog "Found $($allFiles.Count) files to process"

# Context7 Pattern: Fault Tolerance - Backup
if ($BackupFirst -and -not $DryRun) {
    $backupDir = Backup-SourceFiles -Files $allFiles
}

# Context7 Pattern: Progressive Enhancement - Process Files
Write-ImportLog "Processing import updates..."

$updateResults = @()
$totalUpdates = 0
$processedFiles = 0
$errorFiles = 0

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
    Write-ImportLog "Processing: $relativePath"
    
    $result = Update-ImportPaths -FilePath $file.FullName -PathMappings $ImportUpdateConfig.PathMappings -DryRun:$DryRun
    $updateResults += $result
    
    $totalUpdates += $result.UpdatesCount
    
    if ($result.Success) {
        $processedFiles++
    } else {
        $errorFiles++
    }
    
    # Progress indicator
    if ($processedFiles % 50 -eq 0) {
        Write-ImportLog "Progress: $processedFiles/$($allFiles.Count) files processed"
    }
}

# Context7 Pattern: Comprehensive Validation
if ($ValidationLevel -eq "FULL" -and -not $DryRun) {
    Write-ImportLog "Running comprehensive validation..."
    
    # Test TypeScript compilation
    $tsValid = Test-TypeScriptCompilation
    
    if (-not $tsValid) {
        Write-ImportLog "TypeScript validation failed. Consider rolling back changes." "ERROR"
    }
    
    # Test build
    Write-ImportLog "Testing build process..."
    try {
        $buildResult = & bun run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ImportLog "✅ Build test successful" "SUCCESS"
        } else {
            Write-ImportLog "❌ Build test failed" "ERROR"
            Write-ImportLog $buildResult "ERROR"
        }
    } catch {
        Write-ImportLog "❌ Error running build test: $($_.Exception.Message)" "ERROR"
    }
}

# Export results
$updateSummary = @{
    Timestamp = Get-Date
    TotalFiles = $allFiles.Count
    ProcessedFiles = $processedFiles
    ErrorFiles = $errorFiles
    TotalUpdates = $totalUpdates
    Results = $updateResults
    BackupLocation = if ($BackupFirst -and -not $DryRun) { $backupDir } else { $null }
}

$updateSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "import-update-results.json" -Encoding UTF8

# Summary
Write-Host ""
Write-Host "📊 IMPORT UPDATE SUMMARY:" -ForegroundColor Yellow
Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor White
Write-Host "  Processed: $processedFiles" -ForegroundColor Green
Write-Host "  Errors: $errorFiles" -ForegroundColor Red
Write-Host "  Total updates: $totalUpdates" -ForegroundColor Cyan
Write-Host ""

if ($errorFiles -eq 0) {
    Write-ImportLog "🎉 Import path updates completed successfully!" "SUCCESS"
    Write-Host "🚀 Next: Run 09-validation-cleanup.ps1" -ForegroundColor Cyan
} else {
    Write-ImportLog "⚠️ Import updates completed with $errorFiles errors" "WARN"
    Write-Host "🔧 Check migration-log.txt for details" -ForegroundColor Yellow
}

Write-Host ""
