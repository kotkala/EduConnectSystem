# ===================================================================
# SHARED COMPONENTS MIGRATION - CONTEXT7 COMPLIANT
# ===================================================================
# Migrates shared UI components, hooks, utils, and contexts
# Implements Context7 progressive enhancement and systematic organization
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$ValidateAfter = $true
)

# Context7 Pattern: Explicit Contracts
$SharedMigrationConfig = @{
    Intent = "Migrate shared components, hooks, utils, and contexts to shared structure"
    MigrationMappings = @{
        # UI Components (shared across features)
        "components/ui/" = "src/shared/components/ui/"
        "components/shared/" = "src/shared/components/common/"
        "components/layout/" = "src/shared/components/layout/"
        "components/forms/" = "src/shared/components/forms/"
        
        # Hooks
        "hooks/" = "src/shared/hooks/"
        
        # Utils
        "utils/" = "src/shared/utils/"
        
        # Contexts -> Providers
        "contexts/" = "src/providers/"
        
        # Generic components (fallback)
        "components/" = "src/shared/components/common/"
    }
    
    SharedPatterns = @(
        "**/ui/**",           # UI components
        "**/shared/**",       # Explicitly shared
        "**/layout/**",       # Layout components
        "**/forms/**",        # Form components
        "**/common/**",       # Common components
        "hooks/**",           # All hooks
        "utils/**",           # All utils
        "contexts/**"         # All contexts
    )
}

function Write-SharedLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [SHARED-MIGRATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Test-IsSharedComponent {
    param(
        [string]$FilePath,
        [string]$FileContent
    )
    
    # Check if file path matches shared patterns
    foreach ($pattern in $SharedMigrationConfig.SharedPatterns) {
        if ($FilePath -like $pattern) {
            return $true
        }
    }
    
    # Check file content for shared indicators
    $sharedIndicators = @(
        "export.*Button",
        "export.*Input", 
        "export.*Modal",
        "export.*Card",
        "export.*Table",
        "export.*Form",
        "export.*Layout",
        "export.*Header",
        "export.*Sidebar",
        "export.*Footer",
        "use[A-Z].*Hook",
        "createContext",
        "useContext"
    )
    
    foreach ($indicator in $sharedIndicators) {
        if ($FileContent -match $indicator) {
            return $true
        }
    }
    
    return $false
}

function Get-SharedTargetPath {
    param(
        [string]$SourcePath,
        [string]$FileContent
    )
    
    # Check specific mappings first
    foreach ($sourcePattern in $SharedMigrationConfig.MigrationMappings.Keys) {
        if ($SourcePath -like "$sourcePattern*") {
            $targetDir = $SharedMigrationConfig.MigrationMappings[$sourcePattern]
            $fileName = Split-Path $SourcePath -Leaf
            return Join-Path $targetDir $fileName
        }
    }
    
    # Analyze content to determine best location
    if ($FileContent -match "(Button|Input|Modal|Card|Table|Select|Checkbox|Radio)") {
        return "src/shared/components/ui/" + (Split-Path $SourcePath -Leaf)
    } elseif ($FileContent -match "(Header|Sidebar|Footer|Layout|Navigation)") {
        return "src/shared/components/layout/" + (Split-Path $SourcePath -Leaf)
    } elseif ($FileContent -match "(Form|Field|Validation)") {
        return "src/shared/components/forms/" + (Split-Path $SourcePath -Leaf)
    } elseif ($SourcePath -like "hooks/*") {
        return "src/shared/hooks/" + (Split-Path $SourcePath -Leaf)
    } elseif ($SourcePath -like "utils/*") {
        return "src/shared/utils/" + (Split-Path $SourcePath -Leaf)
    } elseif ($SourcePath -like "contexts/*") {
        return "src/providers/" + (Split-Path $SourcePath -Leaf)
    } else {
        return "src/shared/components/common/" + (Split-Path $SourcePath -Leaf)
    }
}

function Copy-SharedFile {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [switch]$DryRun
    )
    
    if ($DryRun) {
        Write-SharedLog "Would copy: $SourcePath -> $TargetPath"
        return $true
    }
    
    try {
        # Ensure target directory exists
        $targetDir = Split-Path $TargetPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        # Copy file
        Copy-Item -Path $SourcePath -Destination $TargetPath -Force
        
        # Preserve timestamps
        $sourceFile = Get-Item $SourcePath
        $targetFile = Get-Item $TargetPath
        $targetFile.LastWriteTime = $sourceFile.LastWriteTime
        $targetFile.CreationTime = $sourceFile.CreationTime
        
        Write-SharedLog "✅ Copied: $SourcePath -> $TargetPath" "SUCCESS"
        return $true
        
    } catch {
        Write-SharedLog "❌ Failed to copy $SourcePath`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    SHARED COMPONENTS MIGRATION" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-SharedLog "Starting shared components migration..."

if ($DryRun) {
    Write-SharedLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Get all potential shared files
$excludePattern = 'node_modules|\.next|\.git|\.augment|\.cursor|build|dist|coverage|src/'
$candidateFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch $excludePattern -and 
    $_.Extension -match '\.(tsx?|jsx?)$' 
}

Write-SharedLog "Found $($candidateFiles.Count) candidate files to analyze"

# Analyze files to determine which are shared
$sharedFiles = @()
$analysisResults = @()

foreach ($file in $candidateFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $isShared = Test-IsSharedComponent -FilePath $relativePath -FileContent $content
        
        if ($isShared) {
            $targetPath = Get-SharedTargetPath -SourcePath $relativePath -FileContent $content
            
            $sharedFiles += @{
                SourcePath = $relativePath
                TargetPath = $targetPath
                FileName = $file.Name
                Category = Split-Path (Split-Path $targetPath -Parent) -Leaf
                Size = $file.Length
            }
        }
        
        $analysisResults += @{
            SourcePath = $relativePath
            IsShared = $isShared
            TargetPath = if ($isShared) { $targetPath } else { $null }
        }
        
    } catch {
        Write-SharedLog "Error analyzing file $relativePath`: $($_.Exception.Message)" "ERROR"
    }
}

Write-SharedLog "Identified $($sharedFiles.Count) shared files for migration"

# Display migration plan
Write-Host ""
Write-Host "📋 SHARED MIGRATION PLAN:" -ForegroundColor Yellow
Write-Host ""

$planByCategory = $sharedFiles | Group-Object Category
foreach ($category in $planByCategory) {
    Write-Host "📁 $($category.Name): $($category.Count) files" -ForegroundColor Cyan
    foreach ($item in $category.Group | Select-Object -First 3) {
        Write-Host "  • $($item.FileName)" -ForegroundColor Gray
    }
    if ($category.Count -gt 3) {
        Write-Host "  ... and $($category.Count - 3) more files" -ForegroundColor Gray
    }
    Write-Host ""
}

# Confirm migration
if (-not $DryRun -and $sharedFiles.Count -gt 0) {
    $response = Read-Host "Proceed with shared components migration? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-SharedLog "Migration cancelled by user" "WARN"
        exit 1
    }
}

# Execute migration
Write-SharedLog "Executing shared components migration..."

$successCount = 0
$failureCount = 0
$migrationResults = @()

foreach ($item in $sharedFiles) {
    $result = Copy-SharedFile -SourcePath $item.SourcePath -TargetPath $item.TargetPath -DryRun:$DryRun
    
    $migrationResults += @{
        SourcePath = $item.SourcePath
        TargetPath = $item.TargetPath
        Success = $result
        Timestamp = Get-Date
        Category = $item.Category
    }
    
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
}

# Create index files for migrated directories
Write-SharedLog "Creating index files for shared directories..."

$targetDirectories = $sharedFiles | ForEach-Object { Split-Path $_.TargetPath -Parent } | Sort-Object -Unique

foreach ($dir in $targetDirectories) {
    if (-not $DryRun -and (Test-Path $dir)) {
        $indexPath = Join-Path $dir "index.ts"
        
        if (-not (Test-Path $indexPath)) {
            $dirName = Split-Path $dir -Leaf
            
            # Get all TypeScript files in directory for export
            $tsFiles = Get-ChildItem -Path $dir -Filter "*.ts*" | Where-Object { $_.Name -ne "index.ts" }
            
            $exports = @()
            foreach ($tsFile in $tsFiles) {
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($tsFile.Name)
                $exports += "export * from './$baseName'"
            }
            
            $indexContent = @"
// Auto-generated index for shared $dirName
// Export all components/utilities from this directory

$($exports -join "`n")
"@
            
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-SharedLog "✅ Created index: $indexPath" "SUCCESS"
        }
    }
}

# Validation
if ($ValidateAfter -and -not $DryRun -and $successCount -gt 0) {
    Write-SharedLog "Validating shared components migration..."
    
    $validationErrors = @()
    
    foreach ($result in $migrationResults) {
        if ($result.Success -and (Test-Path $result.TargetPath)) {
            # Verify file integrity
            $sourceHash = Get-FileHash $result.SourcePath -Algorithm SHA256
            $targetHash = Get-FileHash $result.TargetPath -Algorithm SHA256
            
            if ($sourceHash.Hash -ne $targetHash.Hash) {
                $validationErrors += "Hash mismatch: $($result.TargetPath)"
            }
        }
    }
    
    if ($validationErrors.Count -eq 0) {
        Write-SharedLog "✅ All shared files validated successfully" "SUCCESS"
    } else {
        Write-SharedLog "❌ Validation errors found:" "ERROR"
        foreach ($error in $validationErrors) {
            Write-SharedLog "  $error" "ERROR"
        }
    }
}

# Export results
$migrationSummary = @{
    Timestamp = Get-Date
    TotalCandidates = $candidateFiles.Count
    IdentifiedShared = $sharedFiles.Count
    SuccessCount = $successCount
    FailureCount = $failureCount
    Results = $migrationResults
    AnalysisResults = $analysisResults
}

$migrationSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "shared-migration-results.json" -Encoding UTF8

# Summary
Write-Host ""
Write-Host "📊 SHARED MIGRATION SUMMARY:" -ForegroundColor Yellow
Write-Host "  Candidates analyzed: $($candidateFiles.Count)" -ForegroundColor White
Write-Host "  Shared files identified: $($sharedFiles.Count)" -ForegroundColor Cyan
Write-Host "  Successfully migrated: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host ""

if ($failureCount -eq 0) {
    Write-SharedLog "🎉 Shared components migration completed successfully!" "SUCCESS"
    Write-Host "🚀 Next: Run 06-feature-components-migration.ps1" -ForegroundColor Cyan
} else {
    Write-SharedLog "⚠️ Shared migration completed with $failureCount failures" "WARN"
    Write-Host "🔧 Check migration-log.txt for details" -ForegroundColor Yellow
}

Write-Host ""
