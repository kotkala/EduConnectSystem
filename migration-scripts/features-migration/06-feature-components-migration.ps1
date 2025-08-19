# ===================================================================
# FEATURE COMPONENTS MIGRATION - CONTEXT7 COMPLIANT
# ===================================================================
# Migrates feature-specific components to appropriate feature directories
# Implements Context7 systematic organization and intelligent classification
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$ValidateAfter = $true
)

# Context7 Pattern: Explicit Contracts
$FeatureMigrationConfig = @{
    Intent = "Migrate feature-specific components to appropriate feature directories"
    FeatureMappings = @{
        # Admin Management
        "admin" = @{
            Patterns = @("*admin*", "*violation*", "*discipline*", "*management*")
            TargetDir = "src/features/admin-management/components"
            Keywords = @("admin", "violation", "discipline", "management", "dashboard")
        }
        
        # Teacher Management  
        "teacher" = @{
            Patterns = @("*teacher*", "*instructor*", "*faculty*", "*staff*")
            TargetDir = "src/features/teacher-management/components"
            Keywords = @("teacher", "instructor", "faculty", "staff", "timetable")
        }
        
        # Student Management
        "student" = @{
            Patterns = @("*student*", "*pupil*", "*learner*")
            TargetDir = "src/features/student-management/components"
            Keywords = @("student", "pupil", "learner", "enrollment")
        }
        
        # Grade Management
        "grade" = @{
            Patterns = @("*grade*", "*score*", "*mark*", "*assessment*", "*exam*")
            TargetDir = "src/features/grade-management/components"
            Keywords = @("grade", "score", "mark", "assessment", "exam", "result")
        }
        
        # Parent Dashboard
        "parent" = @{
            Patterns = @("*parent*", "*guardian*", "*family*")
            TargetDir = "src/features/parent-dashboard/components"
            Keywords = @("parent", "guardian", "family", "chatbot")
        }
        
        # Timetable
        "timetable" = @{
            Patterns = @("*timetable*", "*schedule*", "*calendar*", "*time*")
            TargetDir = "src/features/timetable/components"
            Keywords = @("timetable", "schedule", "calendar", "time", "period")
        }
        
        # Violations
        "violations" = @{
            Patterns = @("*violation*", "*discipline*", "*behavior*", "*conduct*")
            TargetDir = "src/features/violations/components"
            Keywords = @("violation", "discipline", "behavior", "conduct", "rule")
        }
        
        # Reports
        "reports" = @{
            Patterns = @("*report*", "*analytics*", "*statistics*", "*chart*")
            TargetDir = "src/features/reports/components"
            Keywords = @("report", "analytics", "statistics", "chart", "data")
        }
        
        # Notifications
        "notifications" = @{
            Patterns = @("*notification*", "*alert*", "*message*", "*notice*")
            TargetDir = "src/features/notifications/components"
            Keywords = @("notification", "alert", "message", "notice", "announcement")
        }
        
        # Meetings
        "meetings" = @{
            Patterns = @("*meeting*", "*conference*", "*appointment*")
            TargetDir = "src/features/meetings/components"
            Keywords = @("meeting", "conference", "appointment", "session")
        }
        
        # Authentication
        "auth" = @{
            Patterns = @("*auth*", "*login*", "*signin*", "*signup*", "*register*")
            TargetDir = "src/features/authentication/components"
            Keywords = @("auth", "login", "signin", "signup", "register", "password")
        }
    }
}

function Write-FeatureLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [FEATURE-MIGRATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Get-FeatureFromPath {
    param(
        [string]$FilePath,
        [string]$FileContent
    )
    
    $filePath = $FilePath.ToLower()
    $fileContent = $FileContent.ToLower()
    
    # Score each feature based on path and content matches
    $featureScores = @{}
    
    foreach ($featureName in $FeatureMigrationConfig.FeatureMappings.Keys) {
        $feature = $FeatureMigrationConfig.FeatureMappings[$featureName]
        $score = 0
        
        # Check path patterns
        foreach ($pattern in $feature.Patterns) {
            if ($filePath -like $pattern) {
                $score += 10
            }
        }
        
        # Check keywords in content
        foreach ($keyword in $feature.Keywords) {
            $keywordCount = ([regex]::Matches($fileContent, $keyword)).Count
            $score += $keywordCount * 2
        }
        
        # Check keywords in path
        foreach ($keyword in $feature.Keywords) {
            if ($filePath -contains $keyword) {
                $score += 5
            }
        }
        
        $featureScores[$featureName] = $score
    }
    
    # Return feature with highest score (minimum score of 3 required)
    $bestFeature = $featureScores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
    
    if ($bestFeature.Value -ge 3) {
        return $bestFeature.Name
    }
    
    return $null
}

function Test-IsFeatureComponent {
    param(
        [string]$FilePath,
        [string]$FileContent
    )
    
    # Skip if already in src/ directory
    if ($FilePath -like "src/*") {
        return $false
    }
    
    # Skip if it's a shared component (already migrated)
    $sharedPatterns = @("**/ui/**", "**/shared/**", "**/layout/**", "**/forms/**", "hooks/**", "utils/**", "contexts/**")
    foreach ($pattern in $sharedPatterns) {
        if ($FilePath -like $pattern) {
            return $false
        }
    }
    
    # Check if it's a React component
    if ($FileContent -match "(export\s+(default\s+)?function|export\s+(default\s+)?const.*=|React\.FC|React\.Component)") {
        return $true
    }
    
    # Check if it's a TypeScript/JavaScript file in components directory
    if ($FilePath -like "components/**" -and $FilePath -match '\.(tsx?|jsx?)$') {
        return $true
    }
    
    return $false
}

function Copy-FeatureFile {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [switch]$DryRun
    )
    
    if ($DryRun) {
        Write-FeatureLog "Would copy: $SourcePath -> $TargetPath"
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
        
        Write-FeatureLog "✅ Copied: $SourcePath -> $TargetPath" "SUCCESS"
        return $true
        
    } catch {
        Write-FeatureLog "❌ Failed to copy $SourcePath`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    FEATURE COMPONENTS MIGRATION" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-FeatureLog "Starting feature components migration..."

if ($DryRun) {
    Write-FeatureLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Get all potential feature component files
$excludePattern = 'node_modules|\.next|\.git|\.augment|\.cursor|build|dist|coverage|src/'
$candidateFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch $excludePattern -and 
    $_.Extension -match '\.(tsx?|jsx?)$' 
}

Write-FeatureLog "Found $($candidateFiles.Count) candidate files to analyze"

# Analyze files to determine feature assignment
$featureFiles = @()
$unassignedFiles = @()
$analysisResults = @()

foreach ($file in $candidateFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $isFeatureComponent = Test-IsFeatureComponent -FilePath $relativePath -FileContent $content
        
        if ($isFeatureComponent) {
            $assignedFeature = Get-FeatureFromPath -FilePath $relativePath -FileContent $content
            
            if ($assignedFeature) {
                $targetDir = $FeatureMigrationConfig.FeatureMappings[$assignedFeature].TargetDir
                $targetPath = Join-Path $targetDir (Split-Path $relativePath -Leaf)
                
                $featureFiles += @{
                    SourcePath = $relativePath
                    TargetPath = $targetPath
                    FileName = $file.Name
                    Feature = $assignedFeature
                    Size = $file.Length
                }
            } else {
                $unassignedFiles += @{
                    SourcePath = $relativePath
                    FileName = $file.Name
                    Reason = "Could not determine feature assignment"
                }
            }
        }
        
        $analysisResults += @{
            SourcePath = $relativePath
            IsFeatureComponent = $isFeatureComponent
            AssignedFeature = $assignedFeature
            TargetPath = if ($assignedFeature) { $targetPath } else { $null }
        }
        
    } catch {
        Write-FeatureLog "Error analyzing file $relativePath`: $($_.Exception.Message)" "ERROR"
        $unassignedFiles += @{
            SourcePath = $relativePath
            FileName = $file.Name
            Reason = "Analysis error: $($_.Exception.Message)"
        }
    }
}

Write-FeatureLog "Identified $($featureFiles.Count) feature components for migration"
Write-FeatureLog "Found $($unassignedFiles.Count) unassigned files"

# Display migration plan
Write-Host ""
Write-Host "📋 FEATURE MIGRATION PLAN:" -ForegroundColor Yellow
Write-Host ""

$planByFeature = $featureFiles | Group-Object Feature
foreach ($feature in $planByFeature) {
    Write-Host "🎯 $($feature.Name): $($feature.Count) files" -ForegroundColor Cyan
    foreach ($item in $feature.Group | Select-Object -First 3) {
        Write-Host "  • $($item.FileName)" -ForegroundColor Gray
    }
    if ($feature.Count -gt 3) {
        Write-Host "  ... and $($feature.Count - 3) more files" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($unassignedFiles.Count -gt 0) {
    Write-Host "⚠️  UNASSIGNED FILES:" -ForegroundColor Yellow
    foreach ($unassigned in $unassignedFiles | Select-Object -First 5) {
        Write-Host "  • $($unassigned.FileName) - $($unassigned.Reason)" -ForegroundColor Red
    }
    if ($unassignedFiles.Count -gt 5) {
        Write-Host "  ... and $($unassignedFiles.Count - 5) more unassigned files" -ForegroundColor Red
    }
    Write-Host ""
}

# Confirm migration
if (-not $DryRun -and $featureFiles.Count -gt 0) {
    $response = Read-Host "Proceed with feature components migration? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-FeatureLog "Migration cancelled by user" "WARN"
        exit 1
    }
}

# Execute migration
Write-FeatureLog "Executing feature components migration..."

$successCount = 0
$failureCount = 0
$migrationResults = @()

foreach ($item in $featureFiles) {
    $result = Copy-FeatureFile -SourcePath $item.SourcePath -TargetPath $item.TargetPath -DryRun:$DryRun
    
    $migrationResults += @{
        SourcePath = $item.SourcePath
        TargetPath = $item.TargetPath
        Success = $result
        Timestamp = Get-Date
        Feature = $item.Feature
    }
    
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
}

# Create index files for feature directories
Write-FeatureLog "Creating index files for feature directories..."

$featureDirectories = $featureFiles | ForEach-Object { Split-Path $_.TargetPath -Parent } | Sort-Object -Unique

foreach ($dir in $featureDirectories) {
    if (-not $DryRun -and (Test-Path $dir)) {
        $indexPath = Join-Path $dir "index.ts"
        
        if (-not (Test-Path $indexPath)) {
            $featureName = ($dir -split '/')[-2]  # Extract feature name from path
            
            # Get all TypeScript files in directory for export
            $tsFiles = Get-ChildItem -Path $dir -Filter "*.ts*" | Where-Object { $_.Name -ne "index.ts" }
            
            $exports = @()
            foreach ($tsFile in $tsFiles) {
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($tsFile.Name)
                $exports += "export * from './$baseName'"
            }
            
            $indexContent = @"
// Auto-generated index for $featureName components
// Export all components from this feature

$($exports -join "`n")
"@
            
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-FeatureLog "✅ Created index: $indexPath" "SUCCESS"
        }
    }
}

# Export results
$migrationSummary = @{
    Timestamp = Get-Date
    TotalCandidates = $candidateFiles.Count
    IdentifiedFeatureComponents = $featureFiles.Count
    UnassignedFiles = $unassignedFiles.Count
    SuccessCount = $successCount
    FailureCount = $failureCount
    Results = $migrationResults
    UnassignedDetails = $unassignedFiles
    AnalysisResults = $analysisResults
}

$migrationSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "feature-migration-results.json" -Encoding UTF8

# Summary
Write-Host ""
Write-Host "📊 FEATURE MIGRATION SUMMARY:" -ForegroundColor Yellow
Write-Host "  Candidates analyzed: $($candidateFiles.Count)" -ForegroundColor White
Write-Host "  Feature components identified: $($featureFiles.Count)" -ForegroundColor Cyan
Write-Host "  Successfully migrated: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host "  Unassigned: $($unassignedFiles.Count)" -ForegroundColor Yellow
Write-Host ""

if ($failureCount -eq 0) {
    Write-FeatureLog "🎉 Feature components migration completed successfully!" "SUCCESS"
    Write-Host "🚀 Next: Run 07-app-router-migration.ps1" -ForegroundColor Cyan
} else {
    Write-FeatureLog "⚠️ Feature migration completed with $failureCount failures" "WARN"
    Write-Host "🔧 Check migration-log.txt for details" -ForegroundColor Yellow
}

if ($unassignedFiles.Count -gt 0) {
    Write-Host "📋 Review unassigned files in feature-migration-results.json" -ForegroundColor Yellow
}

Write-Host ""
