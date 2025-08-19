# ===================================================================
# MASTER MIGRATION ORCHESTRATOR - CONTEXT7 COMPLIANT
# ===================================================================
# Orchestrates the complete migration of 368 files to features-based architecture
# Following Context7 progressive enhancement and systematic validation principles
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [string]$StartFromPhase = "1",
    [switch]$SkipBackup = $false,
    [string]$LogLevel = "INFO"
)

# Context7 Pattern: Explicit Contracts
$MigrationConfig = @{
    Intent = "Systematic migration of 368 files to features-based architecture"
    TotalFiles = 368
    FileBreakdown = @{
        Components = 157
        App = 115  
        Lib = 79
        Hooks = 8
        Utils = 4
        Contexts = 2
        Other = 3
    }
    TargetStructure = @{
        Root = "src"
        Features = "src/features"
        Shared = "src/shared"
        Lib = "src/lib"
        App = "src/app"
        Providers = "src/providers"
    }
}

# Context7 Pattern: Comprehensive Logging
function Write-MigrationLog {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Phase = "GENERAL"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] [$Phase] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "INFO"  { Write-Host $logEntry -ForegroundColor Cyan }
        default { Write-Host $logEntry }
    }
    
    # Log to file
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

# Context7 Pattern: Progressive Enhancement
$MigrationPhases = @(
    @{
        Number = "1"
        Name = "Foundation Setup"
        Script = "02-foundation-setup.ps1"
        Description = "Create src/ structure, backup system, and validation framework"
        Critical = $true
        EstimatedDuration = "1-2 days"
        Dependencies = @()
    },
    @{
        Number = "2" 
        Name = "File Inventory & Analysis"
        Script = "03-file-inventory-analyzer.ps1"
        Description = "Comprehensive analysis of 368 files and dependency mapping"
        Critical = $true
        EstimatedDuration = "0.5 days"
        Dependencies = @("1")
    },
    @{
        Number = "3"
        Name = "Lib Migration"
        Script = "04-lib-migration.ps1"
        Description = "Migrate 79 lib files (lowest dependency complexity)"
        Critical = $true
        EstimatedDuration = "2-3 days"
        Dependencies = @("1", "2")
    },
    @{
        Number = "4"
        Name = "Shared Components Migration"
        Script = "05-shared-components-migration.ps1"
        Description = "Migrate UI components and shared utilities"
        Critical = $true
        EstimatedDuration = "3-4 days"
        Dependencies = @("1", "2", "3")
    },
    @{
        Number = "5"
        Name = "Feature Components Migration"
        Script = "06-feature-components-migration.ps1"
        Description = "Migrate 157 feature-specific components"
        Critical = $true
        EstimatedDuration = "4-5 days"
        Dependencies = @("1", "2", "3", "4")
    },
    @{
        Number = "6"
        Name = "App Router Migration"
        Script = "07-app-router-migration.ps1"
        Description = "Migrate 115 app files with routing logic"
        Critical = $true
        EstimatedDuration = "2-3 days"
        Dependencies = @("1", "2", "3", "4", "5")
    },
    @{
        Number = "7"
        Name = "Import Path Updates"
        Script = "08-import-path-updater.ps1"
        Description = "Update all import statements across 368 files"
        Critical = $true
        EstimatedDuration = "2-3 days"
        Dependencies = @("1", "2", "3", "4", "5", "6")
    },
    @{
        Number = "8"
        Name = "Validation & Cleanup"
        Script = "09-validation-cleanup.ps1"
        Description = "Comprehensive validation and cleanup"
        Critical = $true
        EstimatedDuration = "1-2 days"
        Dependencies = @("1", "2", "3", "4", "5", "6", "7")
    }
)

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host "    EDUCONNECT FEATURES MIGRATION - CONTEXT7 ORCHESTRATOR" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ""

Write-MigrationLog "Starting migration orchestration for $($MigrationConfig.TotalFiles) files" "INFO" "ORCHESTRATOR"

if ($DryRun) {
    Write-MigrationLog "DRY RUN MODE - No actual changes will be made" "WARN" "ORCHESTRATOR"
}

# Context7 Pattern: Fault Tolerance - Backup Creation
if (-not $SkipBackup -and -not $DryRun) {
    Write-MigrationLog "Creating comprehensive backup..." "INFO" "BACKUP"
    
    $backupDir = "backup-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $importantPaths = @("components", "lib", "app", "hooks", "utils", "contexts", "tsconfig.json", "package.json")
    
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    foreach ($path in $importantPaths) {
        if (Test-Path $path) {
            $targetPath = Join-Path $backupDir $path
            $targetDir = Split-Path $targetPath -Parent
            
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            Copy-Item -Path $path -Destination $targetPath -Recurse -Force
            Write-MigrationLog "Backed up: $path -> $targetPath" "SUCCESS" "BACKUP"
        }
    }
    
    Write-MigrationLog "Backup completed: $backupDir" "SUCCESS" "BACKUP"
}

# Display Migration Plan
Write-Host ""
Write-Host "📋 MIGRATION EXECUTION PLAN:" -ForegroundColor Magenta
Write-Host ""

foreach ($phase in $MigrationPhases) {
    $status = if ($phase.Critical) { "[CRITICAL]" } else { "[OPTIONAL]" }
    $color = if ($phase.Critical) { "Red" } else { "Yellow" }
    
    Write-Host "  Phase $($phase.Number): $($phase.Name) $status" -ForegroundColor $color
    Write-Host "    📝 $($phase.Description)" -ForegroundColor Gray
    Write-Host "    ⏱️  Duration: $($phase.EstimatedDuration)" -ForegroundColor Gray
    Write-Host "    🔗 Dependencies: $($phase.Dependencies -join ', ')" -ForegroundColor Gray
    Write-Host ""
}

# Execution confirmation
if (-not $DryRun) {
    $response = Read-Host "Proceed with migration execution? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-MigrationLog "Migration cancelled by user" "WARN" "ORCHESTRATOR"
        exit 1
    }
}

# Context7 Pattern: Progressive Enhancement - Execute Phases
$startIndex = [int]$StartFromPhase - 1
$completedPhases = 0
$failedPhases = 0

for ($i = $startIndex; $i -lt $MigrationPhases.Count; $i++) {
    $phase = $MigrationPhases[$i]
    $scriptPath = Join-Path "migration-scripts/features-migration" $phase.Script
    
    Write-Host "=================================================================" -ForegroundColor Blue
    Write-Host "PHASE $($phase.Number): $($phase.Name)" -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Blue
    
    Write-MigrationLog "Starting Phase $($phase.Number): $($phase.Name)" "INFO" "PHASE-$($phase.Number)"
    
    if (-not (Test-Path $scriptPath)) {
        Write-MigrationLog "Script not found: $scriptPath" "ERROR" "PHASE-$($phase.Number)"
        $failedPhases++
        continue
    }
    
    # Execute phase script
    try {
        $params = @()
        if ($DryRun) { $params += "-DryRun" }
        if ($Force) { $params += "-Force" }
        
        if ($params.Count -gt 0) {
            & $scriptPath @params
        } else {
            & $scriptPath
        }
        
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-MigrationLog "Phase $($phase.Number) completed successfully" "SUCCESS" "PHASE-$($phase.Number)"
            $completedPhases++
        } else {
            Write-MigrationLog "Phase $($phase.Number) failed with exit code $LASTEXITCODE" "ERROR" "PHASE-$($phase.Number)"
            $failedPhases++
            
            if ($phase.Critical) {
                Write-MigrationLog "Critical phase failed, stopping migration" "ERROR" "ORCHESTRATOR"
                break
            }
        }
    } catch {
        Write-MigrationLog "Phase $($phase.Number) exception: $($_.Exception.Message)" "ERROR" "PHASE-$($phase.Number)"
        $failedPhases++
        
        if ($phase.Critical) {
            Write-MigrationLog "Critical phase failed, stopping migration" "ERROR" "ORCHESTRATOR"
            break
        }
    }
    
    Write-Host ""
}

# Migration Summary
Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host "                    MIGRATION SUMMARY" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "📊 EXECUTION RESULTS:" -ForegroundColor Yellow
Write-Host "  - Total Phases: $($MigrationPhases.Count)" -ForegroundColor White
Write-Host "  - Completed: $completedPhases" -ForegroundColor Green
Write-Host "  - Failed: $failedPhases" -ForegroundColor Red
Write-Host "  - Skipped: $($MigrationPhases.Count - $completedPhases - $failedPhases)" -ForegroundColor Yellow

if ($failedPhases -eq 0 -and $completedPhases -gt 0) {
    Write-MigrationLog "🎉 MIGRATION COMPLETED SUCCESSFULLY!" "SUCCESS" "ORCHESTRATOR"
    Write-Host ""
    Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Run TypeScript check: bun x tsc --noEmit" -ForegroundColor White
    Write-Host "2. Run build: bun run build" -ForegroundColor White
    Write-Host "3. Test development: bun run dev" -ForegroundColor White
    Write-Host "4. Update any remaining imports manually" -ForegroundColor White
} else {
    Write-MigrationLog "⚠️ MIGRATION COMPLETED WITH ISSUES" "WARN" "ORCHESTRATOR"
    Write-Host ""
    Write-Host "🔧 RECOVERY OPTIONS:" -ForegroundColor Cyan
    Write-Host "1. Check migration-log.txt for detailed error information" -ForegroundColor White
    Write-Host "2. Re-run from failed phase: -StartFromPhase <phase_number>" -ForegroundColor White
    Write-Host "3. Run individual scripts manually for debugging" -ForegroundColor White
}

Write-MigrationLog "Migration orchestration completed" "INFO" "ORCHESTRATOR"
