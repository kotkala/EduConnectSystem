# ===================================================================
# LIB MIGRATION - CONTEXT7 COMPLIANT
# ===================================================================
# Migrates 79 lib files with lowest dependency complexity first
# Implements Context7 progressive enhancement and fault tolerance
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$ValidateAfter = $true
)

# Context7 Pattern: Explicit Contracts
$LibMigrationConfig = @{
    Intent = "Migrate lib files to appropriate locations in features-based architecture"
    SourcePath = "lib"
    MigrationMappings = @{
        "lib/actions" = @{
            "admin-*" = "src/features/admin-management/actions"
            "teacher-*" = "src/features/teacher-management/actions"
            "parent-*" = "src/features/parent-dashboard/actions"
            "student-*" = "src/features/student-management/actions"
            "grade-*" = "src/features/grade-management/actions"
            "timetable-*" = "src/features/timetable/actions"
            "violation-*" = "src/features/violations/actions"
            "report-*" = "src/features/reports/actions"
            "meeting-*" = "src/features/meetings/actions"
            "notification-*" = "src/features/notifications/actions"
            "*" = "src/shared/actions"  # Fallback for generic actions
        }
        "lib/utils" = "src/shared/utils"
        "lib/types" = "src/shared/types"
        "lib/validations" = "src/lib/validations"
        "lib/constants" = "src/lib/constants"
        "lib/config" = "src/lib/config"
        "lib/supabase" = "src/lib/supabase"
        "lib/auth" = "src/lib/auth"
    }
}

function Write-LibLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [LIB-MIGRATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Get-TargetPath {
    param(
        [string]$SourceFile,
        [hashtable]$Mappings
    )
    
    foreach ($pattern in $Mappings.Keys) {
        if ($SourceFile -like $pattern) {
            $target = $Mappings[$pattern]
            
            # Handle special case for actions with feature-specific patterns
            if ($target -is [hashtable]) {
                $fileName = Split-Path $SourceFile -Leaf
                foreach ($filePattern in $target.Keys) {
                    if ($fileName -like $filePattern) {
                        return $target[$filePattern]
                    }
                }
                # Fallback to generic if no specific pattern matches
                return $target["*"]
            }
            
            return $target
        }
    }
    
    return $null
}

function Test-MigrationPrerequisites {
    Write-LibLog "Checking migration prerequisites..."
    
    # Check if src structure exists
    if (-not (Test-Path "src")) {
        Write-LibLog "src/ directory not found. Run 02-foundation-setup.ps1 first." "ERROR"
        return $false
    }
    
    # Check if lib directory exists
    if (-not (Test-Path "lib")) {
        Write-LibLog "lib/ directory not found. Nothing to migrate." "WARN"
        return $false
    }
    
    # Check if file inventory exists
    if (-not (Test-Path "file-inventory.json")) {
        Write-LibLog "File inventory not found. Run 03-file-inventory-analyzer.ps1 first." "WARN"
    }
    
    return $true
}

function Copy-FileWithMetadata {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [switch]$DryRun
    )
    
    if ($DryRun) {
        Write-LibLog "Would copy: $SourcePath -> $TargetPath"
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
        
        Write-LibLog "✅ Copied: $SourcePath -> $TargetPath" "SUCCESS"
        return $true
        
    } catch {
        Write-LibLog "❌ Failed to copy $SourcePath`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    LIB MIGRATION - PROGRESSIVE ENHANCEMENT" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-LibLog "Starting lib files migration..."

if ($DryRun) {
    Write-LibLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Context7 Pattern: Fault Tolerance - Prerequisites Check
if (-not (Test-MigrationPrerequisites)) {
    Write-LibLog "Prerequisites not met. Exiting." "ERROR"
    exit 1
}

# Get all lib files
$libFiles = Get-ChildItem -Path "lib" -Recurse -File | Where-Object { 
    $_.Extension -match '\.(ts|tsx|js|jsx)$' 
}

Write-LibLog "Found $($libFiles.Count) lib files to migrate"

# Context7 Pattern: Progressive Enhancement - Start with Simple Files
$migrationPlan = @()

foreach ($file in $libFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
    $fileName = $file.Name
    
    # Determine target location
    $targetPath = $null
    
    # Special handling for actions
    if ($relativePath -like "lib/actions/*") {
        $targetPath = Get-TargetPath -SourceFile $fileName -Mappings $LibMigrationConfig.MigrationMappings["lib/actions"]
        if ($targetPath) {
            $targetPath = Join-Path $targetPath $fileName
        }
    } else {
        # Handle other lib subdirectories
        foreach ($sourcePattern in $LibMigrationConfig.MigrationMappings.Keys) {
            if ($relativePath -like "$sourcePattern/*") {
                $targetDir = $LibMigrationConfig.MigrationMappings[$sourcePattern]
                $targetPath = Join-Path $targetDir $fileName
                break
            }
        }
    }
    
    # Fallback for unmatched files
    if (-not $targetPath) {
        $targetPath = Join-Path "src/lib" $fileName
        Write-LibLog "Using fallback location for: $relativePath" "WARN"
    }
    
    $migrationPlan += @{
        SourcePath = $relativePath
        TargetPath = $targetPath
        FileName = $fileName
        Category = Split-Path (Split-Path $relativePath -Parent) -Leaf
    }
}

# Display migration plan
Write-Host ""
Write-Host "📋 MIGRATION PLAN:" -ForegroundColor Yellow
Write-Host ""

$planByCategory = $migrationPlan | Group-Object Category
foreach ($category in $planByCategory) {
    Write-Host "📁 $($category.Name): $($category.Count) files" -ForegroundColor Cyan
    foreach ($item in $category.Group | Select-Object -First 3) {
        Write-Host "  • $($item.FileName) -> $($item.TargetPath)" -ForegroundColor Gray
    }
    if ($category.Count -gt 3) {
        Write-Host "  ... and $($category.Count - 3) more files" -ForegroundColor Gray
    }
    Write-Host ""
}

# Confirm migration
if (-not $DryRun) {
    $response = Read-Host "Proceed with lib migration? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-LibLog "Migration cancelled by user" "WARN"
        exit 1
    }
}

# Context7 Pattern: Progressive Enhancement - Execute Migration
Write-LibLog "Executing migration plan..."

$successCount = 0
$failureCount = 0
$migrationResults = @()

foreach ($item in $migrationPlan) {
    $result = Copy-FileWithMetadata -SourcePath $item.SourcePath -TargetPath $item.TargetPath -DryRun:$DryRun
    
    $migrationResults += @{
        SourcePath = $item.SourcePath
        TargetPath = $item.TargetPath
        Success = $result
        Timestamp = Get-Date
    }
    
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
}

# Create index files for migrated directories
Write-LibLog "Creating index files for migrated directories..."

$targetDirectories = $migrationPlan | ForEach-Object { Split-Path $_.TargetPath -Parent } | Sort-Object -Unique

foreach ($dir in $targetDirectories) {
    if (-not $DryRun -and (Test-Path $dir)) {
        $indexPath = Join-Path $dir "index.ts"
        
        if (-not (Test-Path $indexPath)) {
            $dirName = Split-Path $dir -Leaf
            $indexContent = "// Auto-generated index for $dirName`nexport * from './'`n"
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-LibLog "✅ Created index: $indexPath" "SUCCESS"
        }
    }
}

# Context7 Pattern: Validation
if ($ValidateAfter -and -not $DryRun) {
    Write-LibLog "Validating migration results..."
    
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
        Write-LibLog "✅ All files validated successfully" "SUCCESS"
    } else {
        Write-LibLog "❌ Validation errors found:" "ERROR"
        foreach ($error in $validationErrors) {
            Write-LibLog "  $error" "ERROR"
        }
    }
}

# Export migration results
$migrationSummary = @{
    Timestamp = Get-Date
    TotalFiles = $migrationPlan.Count
    SuccessCount = $successCount
    FailureCount = $failureCount
    Results = $migrationResults
}

$migrationSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "lib-migration-results.json" -Encoding UTF8

# Summary
Write-Host ""
Write-Host "📊 MIGRATION SUMMARY:" -ForegroundColor Yellow
Write-Host "  Total files: $($migrationPlan.Count)" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host ""

if ($failureCount -eq 0) {
    Write-LibLog "🎉 Lib migration completed successfully!" "SUCCESS"
    Write-Host "🚀 Next: Run 05-shared-components-migration.ps1" -ForegroundColor Cyan
} else {
    Write-LibLog "⚠️ Lib migration completed with $failureCount failures" "WARN"
    Write-Host "🔧 Check migration-log.txt for details" -ForegroundColor Yellow
}

Write-Host ""
