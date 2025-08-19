# ===================================================================
# APP ROUTER MIGRATION - CONTEXT7 COMPLIANT
# ===================================================================
# Migrates Next.js App Router files to new src/app structure
# Implements Context7 systematic organization and route preservation
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$ValidateAfter = $true,
    [switch]$PreserveRoutes = $true
)

# Context7 Pattern: Explicit Contracts
$AppMigrationConfig = @{
    Intent = "Migrate Next.js App Router files while preserving routing structure"
    SourcePath = "app"
    TargetPath = "src/app"
    
    # Special files that need careful handling
    SpecialFiles = @{
        "layout.tsx" = "Root layout file"
        "page.tsx" = "Page component"
        "loading.tsx" = "Loading UI"
        "error.tsx" = "Error UI"
        "not-found.tsx" = "404 page"
        "global-error.tsx" = "Global error boundary"
        "route.ts" = "API route handler"
        "middleware.ts" = "Middleware"
        "template.tsx" = "Template component"
        "default.tsx" = "Default component"
    }
    
    # Files to preserve structure exactly
    PreserveStructure = @(
        "layout.tsx", "page.tsx", "loading.tsx", "error.tsx", 
        "not-found.tsx", "global-error.tsx", "route.ts", 
        "middleware.ts", "template.tsx", "default.tsx"
    )
    
    # Route groups and special directories
    RoutePatterns = @{
        "(auth)" = "Authentication routes"
        "(dashboard)" = "Dashboard routes"
        "(admin)" = "Admin routes"
        "(teacher)" = "Teacher routes"
        "(parent)" = "Parent routes"
        "(student)" = "Student routes"
        "api" = "API routes"
        "_components" = "Route-specific components"
        "_lib" = "Route-specific utilities"
    }
}

function Write-AppLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [APP-MIGRATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

function Get-RouteStructure {
    param([string]$AppPath)
    
    if (-not (Test-Path $AppPath)) {
        Write-AppLog "App directory not found: $AppPath" "WARN"
        return @()
    }
    
    $routes = @()
    $appFiles = Get-ChildItem -Path $AppPath -Recurse -File | Where-Object { 
        $_.Extension -match '\.(tsx?|jsx?|js|ts)$' 
    }
    
    foreach ($file in $appFiles) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\' + $AppPath + '\', '')
        $routePath = Split-Path $relativePath -Parent
        $fileName = $file.Name
        
        # Determine route type
        $routeType = "Unknown"
        if ($fileName -in $AppMigrationConfig.SpecialFiles.Keys) {
            $routeType = $AppMigrationConfig.SpecialFiles[$fileName]
        } elseif ($relativePath -like "api/*") {
            $routeType = "API Route"
        } elseif ($relativePath -like "*/_components/*") {
            $routeType = "Route Component"
        } elseif ($relativePath -like "*/_lib/*") {
            $routeType = "Route Utility"
        } else {
            $routeType = "Route File"
        }
        
        $routes += @{
            SourcePath = Join-Path $AppPath $relativePath
            RelativePath = $relativePath
            TargetPath = Join-Path $AppMigrationConfig.TargetPath $relativePath
            FileName = $fileName
            RouteType = $routeType
            RoutePath = $routePath
            IsSpecialFile = $fileName -in $AppMigrationConfig.PreserveStructure
            Size = $file.Length
        }
    }
    
    return $routes
}

function Test-RouteIntegrity {
    param([array]$Routes)
    
    $integrityIssues = @()
    
    # Check for essential files
    $hasRootLayout = $Routes | Where-Object { $_.RelativePath -eq "layout.tsx" }
    if (-not $hasRootLayout) {
        $integrityIssues += "Missing root layout.tsx file"
    }
    
    # Check for route groups consistency
    $routeGroups = $Routes | Where-Object { $_.RoutePath -match '\([^)]+\)' } | 
                   ForEach-Object { ($_.RoutePath -split '\\')[0] } | 
                   Sort-Object -Unique
    
    foreach ($group in $routeGroups) {
        $groupRoutes = $Routes | Where-Object { $_.RoutePath -like "$group*" }
        $hasGroupLayout = $groupRoutes | Where-Object { $_.FileName -eq "layout.tsx" -and $_.RoutePath -eq $group }
        
        if (-not $hasGroupLayout) {
            $integrityIssues += "Route group '$group' missing layout.tsx"
        }
    }
    
    # Check for orphaned API routes
    $apiRoutes = $Routes | Where-Object { $_.RoutePath -like "api*" -and $_.FileName -ne "route.ts" }
    foreach ($apiRoute in $apiRoutes) {
        $integrityIssues += "Potential orphaned API file: $($apiRoute.RelativePath)"
    }
    
    return $integrityIssues
}

function Copy-AppFile {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [switch]$DryRun
    )
    
    if ($DryRun) {
        Write-AppLog "Would copy: $SourcePath -> $TargetPath"
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
        
        Write-AppLog "✅ Copied: $SourcePath -> $TargetPath" "SUCCESS"
        return $true
        
    } catch {
        Write-AppLog "❌ Failed to copy $SourcePath`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Update-AppImports {
    param(
        [string]$FilePath,
        [switch]$DryRun
    )
    
    if ($DryRun) {
        return $true
    }
    
    try {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        $updated = $false
        
        # Update relative imports that might be broken by the move
        $importPatterns = @{
            "from\s+['""]\.\.\/components\/" = "from '@/shared/components/"
            "from\s+['""]\.\.\/lib\/" = "from '@/lib/"
            "from\s+['""]\.\.\/utils\/" = "from '@/shared/utils/"
            "from\s+['""]\.\.\/hooks\/" = "from '@/shared/hooks/"
            "from\s+['""]\.\.\/contexts\/" = "from '@/providers/"
        }
        
        foreach ($pattern in $importPatterns.Keys) {
            $replacement = $importPatterns[$pattern]
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacement
                $updated = $true
            }
        }
        
        if ($updated) {
            $content | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
            Write-AppLog "✅ Updated imports in: $FilePath" "SUCCESS"
        }
        
        return $true
        
    } catch {
        Write-AppLog "❌ Failed to update imports in $FilePath`: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    APP ROUTER MIGRATION" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-AppLog "Starting App Router migration..."

if ($DryRun) {
    Write-AppLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Check if app directory exists
if (-not (Test-Path $AppMigrationConfig.SourcePath)) {
    Write-AppLog "App directory not found: $($AppMigrationConfig.SourcePath)" "ERROR"
    Write-AppLog "This might be a Pages Router project or app directory is elsewhere" "WARN"
    exit 1
}

# Analyze current app structure
Write-AppLog "Analyzing current App Router structure..."
$routes = Get-RouteStructure -AppPath $AppMigrationConfig.SourcePath

Write-AppLog "Found $($routes.Count) app files to migrate"

# Check route integrity
if ($PreserveRoutes) {
    Write-AppLog "Checking route integrity..."
    $integrityIssues = Test-RouteIntegrity -Routes $routes
    
    if ($integrityIssues.Count -gt 0) {
        Write-AppLog "Route integrity issues found:" "WARN"
        foreach ($issue in $integrityIssues) {
            Write-AppLog "  • $issue" "WARN"
        }
        
        if (-not $Force) {
            $response = Read-Host "Continue despite integrity issues? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-AppLog "Migration cancelled due to integrity issues" "ERROR"
                exit 1
            }
        }
    } else {
        Write-AppLog "✅ Route integrity check passed" "SUCCESS"
    }
}

# Display migration plan
Write-Host ""
Write-Host "📋 APP ROUTER MIGRATION PLAN:" -ForegroundColor Yellow
Write-Host ""

$routesByType = $routes | Group-Object RouteType
foreach ($routeType in $routesByType) {
    Write-Host "📁 $($routeType.Name): $($routeType.Count) files" -ForegroundColor Cyan
    foreach ($route in $routeType.Group | Select-Object -First 3) {
        Write-Host "  • $($route.RelativePath)" -ForegroundColor Gray
    }
    if ($routeType.Count -gt 3) {
        Write-Host "  ... and $($routeType.Count - 3) more files" -ForegroundColor Gray
    }
    Write-Host ""
}

# Confirm migration
if (-not $DryRun -and $routes.Count -gt 0) {
    $response = Read-Host "Proceed with App Router migration? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-AppLog "Migration cancelled by user" "WARN"
        exit 1
    }
}

# Execute migration
Write-AppLog "Executing App Router migration..."

$successCount = 0
$failureCount = 0
$migrationResults = @()

# Sort routes to ensure directories are created in correct order
$sortedRoutes = $routes | Sort-Object { $_.RelativePath.Split('\').Count }, RelativePath

foreach ($route in $sortedRoutes) {
    $result = Copy-AppFile -SourcePath $route.SourcePath -TargetPath $route.TargetPath -DryRun:$DryRun
    
    # Update imports in the copied file
    if ($result -and -not $DryRun) {
        Update-AppImports -FilePath $route.TargetPath -DryRun:$DryRun | Out-Null
    }
    
    $migrationResults += @{
        SourcePath = $route.SourcePath
        TargetPath = $route.TargetPath
        Success = $result
        Timestamp = Get-Date
        RouteType = $route.RouteType
        IsSpecialFile = $route.IsSpecialFile
    }
    
    if ($result) {
        $successCount++
    } else {
        $failureCount++
    }
}

# Validation
if ($ValidateAfter -and -not $DryRun -and $successCount -gt 0) {
    Write-AppLog "Validating App Router migration..."
    
    $validationErrors = @()
    
    # Check if essential files exist
    $essentialFiles = @("layout.tsx", "page.tsx")
    foreach ($essential in $essentialFiles) {
        $targetPath = Join-Path $AppMigrationConfig.TargetPath $essential
        if (-not (Test-Path $targetPath)) {
            $validationErrors += "Missing essential file: $targetPath"
        }
    }
    
    # Verify file integrity
    foreach ($result in $migrationResults) {
        if ($result.Success -and (Test-Path $result.TargetPath) -and (Test-Path $result.SourcePath)) {
            $sourceHash = Get-FileHash $result.SourcePath -Algorithm SHA256
            $targetHash = Get-FileHash $result.TargetPath -Algorithm SHA256
            
            if ($sourceHash.Hash -ne $targetHash.Hash) {
                $validationErrors += "Hash mismatch: $($result.TargetPath)"
            }
        }
    }
    
    if ($validationErrors.Count -eq 0) {
        Write-AppLog "✅ All app files validated successfully" "SUCCESS"
    } else {
        Write-AppLog "❌ Validation errors found:" "ERROR"
        foreach ($error in $validationErrors) {
            Write-AppLog "  $error" "ERROR"
        }
    }
}

# Export results
$migrationSummary = @{
    Timestamp = Get-Date
    SourcePath = $AppMigrationConfig.SourcePath
    TargetPath = $AppMigrationConfig.TargetPath
    TotalRoutes = $routes.Count
    SuccessCount = $successCount
    FailureCount = $failureCount
    Results = $migrationResults
    RouteStructure = $routes
    IntegrityIssues = if ($PreserveRoutes) { $integrityIssues } else { @() }
}

$migrationSummary | ConvertTo-Json -Depth 10 | Out-File -FilePath "app-migration-results.json" -Encoding UTF8

# Summary
Write-Host ""
Write-Host "📊 APP ROUTER MIGRATION SUMMARY:" -ForegroundColor Yellow
Write-Host "  Total app files: $($routes.Count)" -ForegroundColor White
Write-Host "  Successfully migrated: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host "  Source: $($AppMigrationConfig.SourcePath)" -ForegroundColor Cyan
Write-Host "  Target: $($AppMigrationConfig.TargetPath)" -ForegroundColor Cyan
Write-Host ""

if ($failureCount -eq 0) {
    Write-AppLog "🎉 App Router migration completed successfully!" "SUCCESS"
    Write-Host "🚀 Next: Run 08-import-path-updater.ps1" -ForegroundColor Cyan
} else {
    Write-AppLog "⚠️ App Router migration completed with $failureCount failures" "WARN"
    Write-Host "🔧 Check migration-log.txt for details" -ForegroundColor Yellow
}

Write-Host ""
