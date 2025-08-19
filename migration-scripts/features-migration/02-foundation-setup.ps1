# ===================================================================
# FOUNDATION SETUP - CONTEXT7 COMPLIANT
# ===================================================================
# Creates the src/ directory structure following Context7 features-based architecture
# Implements progressive enhancement and explicit contracts principles
# ===================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Context7 Pattern: Explicit Contracts
$FoundationConfig = @{
    Intent = "Create robust foundation for features-based architecture"
    TargetStructure = @{
        Root = "src"
        Features = @(
            "authentication",
            "grade-management", 
            "student-management",
            "teacher-management",
            "parent-dashboard",
            "admin-management",
            "timetable",
            "violations",
            "reports",
            "notifications",
            "meetings"
        )
        SharedComponents = @(
            "ui",           # Base UI components (Button, Input, etc.)
            "layout",       # Layout components (Header, Sidebar, etc.)
            "forms",        # Form components
            "data-display", # Tables, Charts, etc.
            "common"        # Common reusable components
        )
        LibModules = @(
            "supabase",     # Database client
            "validations",  # Zod schemas
            "auth",         # Auth configuration
            "config",       # App configuration
            "constants"     # Global constants
        )
    }
}

function Write-FoundationLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [FOUNDATION] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    $logEntry | Out-File -FilePath "migration-log.txt" -Append
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "    FOUNDATION SETUP - FEATURES-BASED ARCHITECTURE" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

Write-FoundationLog "Starting foundation setup for features-based architecture"

if ($DryRun) {
    Write-FoundationLog "DRY RUN MODE - No actual changes will be made" "WARN"
}

# Context7 Pattern: Progressive Enhancement - Start Simple
Write-FoundationLog "Creating root src/ directory structure..."

$rootStructure = @{
    "src" = @{
        "features" = @{}
        "shared" = @{
            "components" = @{}
            "hooks" = @{}
            "utils" = @{}
            "types" = @{}
            "constants" = @{}
        }
        "lib" = @{}
        "app" = @{}
        "providers" = @{}
    }
}

function New-DirectoryStructure {
    param(
        [hashtable]$Structure,
        [string]$BasePath = ""
    )
    
    foreach ($key in $Structure.Keys) {
        $currentPath = if ($BasePath) { Join-Path $BasePath $key } else { $key }
        $value = $Structure[$key]
        
        Write-FoundationLog "Creating directory: $currentPath"
        
        if (-not $DryRun) {
            if (-not (Test-Path $currentPath)) {
                New-Item -ItemType Directory -Path $currentPath -Force | Out-Null
                Write-FoundationLog "✅ Created: $currentPath" "SUCCESS"
            } else {
                Write-FoundationLog "Directory already exists: $currentPath" "WARN"
            }
        }
        
        if ($value -is [hashtable] -and $value.Count -gt 0) {
            New-DirectoryStructure -Structure $value -BasePath $currentPath
        }
    }
}

# Create root structure
New-DirectoryStructure -Structure $rootStructure

# Context7 Pattern: Explicit Contracts - Create Feature Modules
Write-FoundationLog "Creating feature module directories..."

foreach ($feature in $FoundationConfig.TargetStructure.Features) {
    $featurePath = "src/features/$feature"
    
    $featureStructure = @{
        "components" = @{}
        "hooks" = @{}
        "actions" = @{}
        "types" = @{}
        "utils" = @{}
        "constants" = @{}
    }
    
    Write-FoundationLog "Setting up feature: $feature"
    
    if (-not $DryRun) {
        if (-not (Test-Path $featurePath)) {
            New-Item -ItemType Directory -Path $featurePath -Force | Out-Null
        }
        
        foreach ($subDir in $featureStructure.Keys) {
            $subPath = Join-Path $featurePath $subDir
            if (-not (Test-Path $subPath)) {
                New-Item -ItemType Directory -Path $subPath -Force | Out-Null
                Write-FoundationLog "✅ Created feature subdirectory: $subPath" "SUCCESS"
            }
        }
        
        # Create index.ts for feature
        $indexPath = Join-Path $featurePath "index.ts"
        if (-not (Test-Path $indexPath)) {
            $indexContent = @"
// Feature: $feature
// Single entry point for all $feature related exports

// Components
export * from './components'

// Hooks  
export * from './hooks'

// Actions
export * from './actions'

// Types
export * from './types'

// Utils
export * from './utils'

// Constants
export * from './constants'
"@
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-FoundationLog "✅ Created feature index: $indexPath" "SUCCESS"
        }
    }
}

# Create shared component directories
Write-FoundationLog "Creating shared component structure..."

foreach ($componentType in $FoundationConfig.TargetStructure.SharedComponents) {
    $componentPath = "src/shared/components/$componentType"
    
    Write-FoundationLog "Creating shared component type: $componentType"
    
    if (-not $DryRun) {
        if (-not (Test-Path $componentPath)) {
            New-Item -ItemType Directory -Path $componentPath -Force | Out-Null
            Write-FoundationLog "✅ Created: $componentPath" "SUCCESS"
        }
        
        # Create index.ts for component type
        $indexPath = Join-Path $componentPath "index.ts"
        if (-not (Test-Path $indexPath)) {
            $indexContent = "// Shared $componentType components`nexport * from './'`n"
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-FoundationLog "✅ Created component index: $indexPath" "SUCCESS"
        }
    }
}

# Create lib module directories
Write-FoundationLog "Creating lib module structure..."

foreach ($libModule in $FoundationConfig.TargetStructure.LibModules) {
    $libPath = "src/lib/$libModule"
    
    Write-FoundationLog "Creating lib module: $libModule"
    
    if (-not $DryRun) {
        if (-not (Test-Path $libPath)) {
            New-Item -ItemType Directory -Path $libPath -Force | Out-Null
            Write-FoundationLog "✅ Created: $libPath" "SUCCESS"
        }
        
        # Create index.ts for lib module
        $indexPath = Join-Path $libPath "index.ts"
        if (-not (Test-Path $indexPath)) {
            $indexContent = "// Lib module: $libModule`nexport * from './'`n"
            $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
            Write-FoundationLog "✅ Created lib index: $indexPath" "SUCCESS"
        }
    }
}

# Create main index files
Write-FoundationLog "Creating main index files..."

$mainIndexes = @{
    "src/features/index.ts" = @"
// Features barrel export
// Import features as needed to avoid circular dependencies

// Authentication
export * from './authentication'

// Management Features
export * from './grade-management'
export * from './student-management'
export * from './teacher-management'
export * from './admin-management'

// Dashboard Features
export * from './parent-dashboard'

// Operational Features
export * from './timetable'
export * from './violations'
export * from './reports'
export * from './notifications'
export * from './meetings'
"@

    "src/shared/index.ts" = @"
// Shared resources barrel export

// Components
export * from './components'

// Hooks
export * from './hooks'

// Utils
export * from './utils'

// Types
export * from './types'

// Constants
export * from './constants'
"@

    "src/lib/index.ts" = @"
// Core libraries barrel export

// Database
export * from './supabase'

// Validation
export * from './validations'

// Authentication
export * from './auth'

// Configuration
export * from './config'

// Constants
export * from './constants'
"@

    "src/providers/index.ts" = @"
// React providers barrel export

// Export all providers here when they are created
export * from './'
"@
}

foreach ($indexFile in $mainIndexes.Keys) {
    if (-not $DryRun) {
        $content = $mainIndexes[$indexFile]
        $content | Out-File -FilePath $indexFile -Encoding UTF8
        Write-FoundationLog "✅ Created main index: $indexFile" "SUCCESS"
    } else {
        Write-FoundationLog "Would create: $indexFile"
    }
}

# Create README files for documentation
Write-FoundationLog "Creating documentation files..."

$readmeContent = @"
# Features-Based Architecture

This project follows Context7 best practices for features-based organization.

## Structure Overview

\`\`\`
src/
├── features/              # Feature modules
├── shared/                # Shared resources
├── lib/                   # Core libraries
├── app/                   # Next.js App Router
└── providers/             # React providers
\`\`\`

## Feature Module Structure

Each feature module follows this structure:

\`\`\`
features/[feature-name]/
├── components/            # Feature-specific components
├── hooks/                 # Feature-specific hooks
├── actions/               # Server actions
├── types/                 # TypeScript types
├── utils/                 # Utility functions
├── constants/             # Feature constants
└── index.ts               # Feature exports
\`\`\`

## Import Patterns

- Features: \`@/features/[feature-name]\`
- Shared: \`@/shared/[resource-type]\`
- Lib: \`@/lib/[library-name]\`
- App: \`@/app/[route]\`

## Development Guidelines

1. Keep feature modules independent
2. Use shared components for cross-cutting concerns
3. Export everything through index.ts files
4. Follow TypeScript strict mode
5. Use Zod for validation schemas
"@

if (-not $DryRun) {
    $readmeContent | Out-File -FilePath "src/README.md" -Encoding UTF8
    Write-FoundationLog "✅ Created documentation: src/README.md" "SUCCESS"
}

Write-Host ""
Write-FoundationLog "Foundation setup completed successfully!" "SUCCESS"
Write-Host ""
Write-Host "📋 CREATED STRUCTURE:" -ForegroundColor Yellow
Write-Host "✅ src/ root directory" -ForegroundColor Green
Write-Host "✅ $($FoundationConfig.TargetStructure.Features.Count) feature modules" -ForegroundColor Green
Write-Host "✅ $($FoundationConfig.TargetStructure.SharedComponents.Count) shared component types" -ForegroundColor Green
Write-Host "✅ $($FoundationConfig.TargetStructure.LibModules.Count) lib modules" -ForegroundColor Green
Write-Host "✅ Index files and documentation" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next: Run 03-file-inventory-analyzer.ps1" -ForegroundColor Cyan
