# ===================================================================
# FILE INVENTORY & DEPENDENCY ANALYZER - CONTEXT7 COMPLIANT
# ===================================================================
# Comprehensive analysis of 368 files with dependency mapping
# Implements Context7 systematic analysis and explicit contracts
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$ExportJson = $true
)

# Context7 Pattern: Explicit Contracts
$AnalysisConfig = @{
    Intent = "Comprehensive analysis and dependency mapping of 368 TypeScript/JavaScript files"
    TargetFiles = @(
        "*.ts", "*.tsx", "*.js", "*.jsx"
    )
    ExcludePaths = @(
        "node_modules", ".next", ".git", ".augment", ".cursor", "build", "dist", "coverage"
    )
    AnalysisTypes = @(
        "FileInventory",
        "DependencyMapping", 
        "ImportAnalysis",
        "ComponentClassification",
        "MigrationPlanning"
    )
}

function Write-AnalysisLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [ANALYSIS] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    FILE INVENTORY & DEPENDENCY ANALYZER" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-AnalysisLog "Starting comprehensive file analysis..."

# Context7 Pattern: Comprehensive Logging - File Inventory
Write-AnalysisLog "Phase 1: Creating file inventory with checksums..."

$fileInventory = @{}
$dependencyMap = @{}
$importAnalysis = @{}

# Get all TypeScript/JavaScript files
$excludePattern = ($AnalysisConfig.ExcludePaths -join '|')
$allFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch $excludePattern -and 
    $_.Extension -match '\.(tsx?|jsx?)$' 
}

Write-AnalysisLog "Found $($allFiles.Count) files for analysis"

# Context7 Pattern: Systematic Analysis
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
    $fileHash = Get-FileHash $file.FullName -Algorithm SHA256
    
    $fileInfo = @{
        Path = $relativePath
        FullPath = $file.FullName
        Size = $file.Length
        LastModified = $file.LastWriteTime
        Hash = $fileHash.Hash
        Extension = $file.Extension
        Directory = $file.Directory.Name
        Category = ""
        Imports = @()
        Exports = @()
        Dependencies = @()
        MigrationTarget = ""
    }
    
    # Categorize file based on path
    if ($relativePath -match '^components/') {
        $fileInfo.Category = "Component"
    } elseif ($relativePath -match '^app/') {
        $fileInfo.Category = "App"
    } elseif ($relativePath -match '^lib/') {
        $fileInfo.Category = "Lib"
    } elseif ($relativePath -match '^hooks/') {
        $fileInfo.Category = "Hook"
    } elseif ($relativePath -match '^utils/') {
        $fileInfo.Category = "Util"
    } elseif ($relativePath -match '^contexts/') {
        $fileInfo.Category = "Context"
    } else {
        $fileInfo.Category = "Other"
    }
    
    $fileInventory[$relativePath] = $fileInfo
}

Write-AnalysisLog "Phase 2: Analyzing imports and dependencies..."

# Context7 Pattern: Dependency Analysis
foreach ($filePath in $fileInventory.Keys) {
    $fileInfo = $fileInventory[$filePath]
    
    try {
        $content = Get-Content -Path $fileInfo.FullPath -Raw
        
        # Extract import statements using regex
        $importPattern = 'import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?[''"]([^''"]+)[''"]'
        $imports = [regex]::Matches($content, $importPattern)
        
        foreach ($import in $imports) {
            $importPath = $import.Groups[1].Value
            $fileInfo.Imports += $importPath
            
            # Resolve relative imports to actual files
            if ($importPath.StartsWith('./') -or $importPath.StartsWith('../')) {
                $resolvedPath = Resolve-ImportPath -CurrentFile $filePath -ImportPath $importPath
                if ($resolvedPath -and $fileInventory.ContainsKey($resolvedPath)) {
                    $fileInfo.Dependencies += $resolvedPath
                }
            }
        }
        
        # Extract export statements
        $exportPattern = 'export\s+(?:default\s+)?(?:(?:const|let|var|function|class|interface|type|enum)\s+)?(\w+)'
        $exports = [regex]::Matches($content, $exportPattern)
        
        foreach ($export in $exports) {
            $exportName = $export.Groups[1].Value
            $fileInfo.Exports += $exportName
        }
        
    } catch {
        Write-AnalysisLog "Error analyzing file $filePath`: $($_.Exception.Message)" "ERROR"
    }
}

function Resolve-ImportPath {
    param(
        [string]$CurrentFile,
        [string]$ImportPath
    )
    
    $currentDir = Split-Path $CurrentFile -Parent
    $resolvedPath = Join-Path $currentDir $ImportPath
    
    # Normalize path
    $resolvedPath = [System.IO.Path]::GetFullPath($resolvedPath)
    $relativePath = $resolvedPath.Replace((Get-Location).Path + '\', '')
    
    # Try different extensions
    $extensions = @('.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx')
    foreach ($ext in $extensions) {
        $testPath = $relativePath + $ext
        if (Test-Path $testPath) {
            return $testPath
        }
    }
    
    return $null
}

Write-AnalysisLog "Phase 3: Component classification and migration planning..."

# Context7 Pattern: Migration Planning
foreach ($filePath in $fileInventory.Keys) {
    $fileInfo = $fileInventory[$filePath]
    
    # Determine migration target based on file analysis
    switch ($fileInfo.Category) {
        "Component" {
            if ($filePath -match 'components/ui/') {
                $fileInfo.MigrationTarget = "src/shared/components/ui/"
            } elseif ($filePath -match 'components/admin/') {
                $fileInfo.MigrationTarget = "src/features/admin-management/components/"
            } elseif ($filePath -match 'components/teacher/') {
                $fileInfo.MigrationTarget = "src/features/teacher-management/components/"
            } elseif ($filePath -match 'components/parent/') {
                $fileInfo.MigrationTarget = "src/features/parent-dashboard/components/"
            } elseif ($filePath -match 'components/student/') {
                $fileInfo.MigrationTarget = "src/features/student-management/components/"
            } else {
                $fileInfo.MigrationTarget = "src/shared/components/common/"
            }
        }
        "App" {
            $fileInfo.MigrationTarget = "src/app/" + ($filePath -replace '^app/', '')
        }
        "Lib" {
            if ($filePath -match 'lib/actions/') {
                # Distribute actions to appropriate features
                $fileInfo.MigrationTarget = "src/features/[feature]/actions/"
            } elseif ($filePath -match 'lib/utils/') {
                $fileInfo.MigrationTarget = "src/shared/utils/"
            } elseif ($filePath -match 'lib/types/') {
                $fileInfo.MigrationTarget = "src/shared/types/"
            } else {
                $fileInfo.MigrationTarget = "src/lib/"
            }
        }
        "Hook" {
            $fileInfo.MigrationTarget = "src/shared/hooks/"
        }
        "Util" {
            $fileInfo.MigrationTarget = "src/shared/utils/"
        }
        "Context" {
            $fileInfo.MigrationTarget = "src/providers/"
        }
        default {
            $fileInfo.MigrationTarget = "src/shared/"
        }
    }
}

# Generate analysis report
Write-AnalysisLog "Phase 4: Generating analysis report..."

$analysisReport = @{
    Timestamp = Get-Date
    TotalFiles = $allFiles.Count
    FileBreakdown = @{}
    DependencyComplexity = @{}
    MigrationPlan = @{}
    HighRiskFiles = @()
    Recommendations = @()
}

# File breakdown by category
$categories = $fileInventory.Values | Group-Object Category
foreach ($category in $categories) {
    $analysisReport.FileBreakdown[$category.Name] = $category.Count
}

# Dependency complexity analysis
foreach ($filePath in $fileInventory.Keys) {
    $fileInfo = $fileInventory[$filePath]
    $complexityScore = $fileInfo.Dependencies.Count + $fileInfo.Imports.Count
    
    if ($complexityScore -gt 10) {
        $analysisReport.HighRiskFiles += @{
            Path = $filePath
            ComplexityScore = $complexityScore
            Dependencies = $fileInfo.Dependencies.Count
            Imports = $fileInfo.Imports.Count
        }
    }
}

# Migration plan summary
$migrationTargets = $fileInventory.Values | Group-Object { $_.MigrationTarget -replace '\[feature\]', 'feature-specific' }
foreach ($target in $migrationTargets) {
    $analysisReport.MigrationPlan[$target.Name] = $target.Count
}

# Generate recommendations
$analysisReport.Recommendations = @(
    "Start migration with files having lowest dependency complexity",
    "Migrate shared utilities before feature-specific components",
    "Update import paths incrementally to avoid breaking changes",
    "Test each migration phase before proceeding to next",
    "Pay special attention to high-risk files with complexity score > 10"
)

# Export analysis results
if ($ExportJson) {
    $analysisReport | ConvertTo-Json -Depth 10 | Out-File -FilePath "migration-analysis-report.json" -Encoding UTF8
    $fileInventory | ConvertTo-Json -Depth 10 | Out-File -FilePath "file-inventory.json" -Encoding UTF8
    
    Write-AnalysisLog "Analysis results exported to JSON files" "SUCCESS"
}

# Display summary
Write-Host ""
Write-Host "📊 ANALYSIS SUMMARY:" -ForegroundColor Yellow
Write-Host ""

Write-Host "📁 FILE BREAKDOWN:" -ForegroundColor Cyan
foreach ($category in $analysisReport.FileBreakdown.Keys) {
    Write-Host "  $category`: $($analysisReport.FileBreakdown[$category]) files" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 MIGRATION TARGETS:" -ForegroundColor Cyan
foreach ($target in $analysisReport.MigrationPlan.Keys) {
    Write-Host "  $target`: $($analysisReport.MigrationPlan[$target]) files" -ForegroundColor White
}

Write-Host ""
Write-Host "⚠️  HIGH RISK FILES:" -ForegroundColor Yellow
foreach ($riskFile in $analysisReport.HighRiskFiles | Sort-Object ComplexityScore -Descending | Select-Object -First 5) {
    Write-Host "  $($riskFile.Path) (Score: $($riskFile.ComplexityScore))" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Green
foreach ($recommendation in $analysisReport.Recommendations) {
    Write-Host "  • $recommendation" -ForegroundColor White
}

Write-Host ""
Write-AnalysisLog "File inventory and analysis completed successfully!" "SUCCESS"
Write-Host ""
Write-Host "🚀 Next: Run 04-lib-migration.ps1" -ForegroundColor Cyan
