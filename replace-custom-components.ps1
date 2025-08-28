# PowerShell Script to Replace Custom Components with Shadcn/UI
Write-Host "🎨 Starting Custom Components Replacement..." -ForegroundColor Green

# Define replacement patterns
$replacements = @(
    # Custom Cards -> Shadcn Card
    @{
        Pattern = 'div className="rounded-lg border bg-card text-card-foreground shadow-sm"'
        Replacement = 'Card'
        Import = 'Card'
    },
    @{
        Pattern = 'div className="bg-white rounded-2xl shadow-sm border border-gray-200[^"]*"'
        Replacement = 'Card'
        Import = 'Card'
    },
    @{
        Pattern = 'div className="card-modern[^"]*"'
        Replacement = 'Card'
        Import = 'Card'
    },
    
    # Custom Loading Spinners -> Loader2
    @{
        Pattern = 'div className="animate-spin rounded-full h-4 w-4 border-b-2[^"]*"'
        Replacement = 'Loader2 className="h-4 w-4 animate-spin"'
        Import = 'Loader2'
    },
    
    # Custom Gradients -> Orange Theme
    @{
        Pattern = 'bg-gradient-to-br from-blue-50 to-indigo-100'
        Replacement = 'bg-orange-gradient-soft'
        Import = ''
    },
    @{
        Pattern = 'bg-gradient-to-br from-emerald-50 to-green-100'
        Replacement = 'bg-orange-gradient-soft'
        Import = ''
    },
    @{
        Pattern = 'bg-gradient-to-br from-purple-50 to-violet-100'
        Replacement = 'bg-orange-gradient-soft'
        Import = ''
    },
    
    # Custom Backdrop -> Card
    @{
        Pattern = 'bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20'
        Replacement = 'bg-orange-gradient-soft/90 backdrop-blur-sm rounded-2xl border border-orange-200'
        Import = ''
    }
)

# Get all React files
$files = Get-ChildItem -Recurse -Path "src" -Include "*.tsx", "*.ts" | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*.d.ts"
}

$totalFiles = $files.Count
$modifiedFiles = 0
$totalReplacements = 0

Write-Host "📁 Found $totalFiles files to process..." -ForegroundColor Yellow

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        $fileModified = $false
        $fileReplacements = 0
        
        # Apply each replacement pattern
        foreach ($replacement in $replacements) {
            $pattern = $replacement.Pattern
            $newValue = $replacement.Replacement
            $import = $replacement.Import
            
            # Count matches before replacement
            $matches = [regex]::Matches($content, $pattern)
            if ($matches.Count -gt 0) {
                # Replace the pattern
                $content = $content -replace $pattern, $newValue
                $fileReplacements += $matches.Count
                $fileModified = $true
                
                # Add import if needed
                if ($import -and $import -ne '' -and $content -notmatch "import.*$import") {
                    if ($import -eq 'Card') {
                        if ($content -notmatch 'import.*Card.*from.*@/shared/components/ui/card') {
                            $content = "import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'`n" + $content
                        }
                    } elseif ($import -eq 'Loader2') {
                        if ($content -match 'import\s*\{([^}]*)\}\s*from\s*[''"]lucide-react[''"]') {
                            $existingImports = $matches[1]
                            if ($existingImports -notmatch 'Loader2') {
                                $newImports = $existingImports.Trim() + ', Loader2'
                                $content = $content -replace 'import\s*\{([^}]*)\}\s*from\s*[''"]lucide-react[''"]', "import { $newImports } from 'lucide-react'"
                            }
                        } else {
                            $content = "import { Loader2 } from 'lucide-react'`n" + $content
                        }
                    }
                }
            }
        }
        
        # Write back if modified
        if ($fileModified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $modifiedFiles++
            $totalReplacements += $fileReplacements
            Write-Host "✅ Fixed $fileReplacements issues in: $relativePath" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Error processing $relativePath" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Custom Components Replacement Complete!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   • Files processed: $totalFiles" -ForegroundColor White
Write-Host "   • Files modified: $modifiedFiles" -ForegroundColor White
Write-Host "   • Total replacements: $totalReplacements" -ForegroundColor White

# Suggest missing shadcn components to install
Write-Host "`n🚀 Recommended Shadcn/UI Components to Install:" -ForegroundColor Cyan
$recommendedComponents = @(
    "area-chart-01", "bar-chart-01", "line-chart-01", "pie-chart-01",
    "combobox", "date-picker", "file-upload", "pagination",
    "breadcrumb", "timeline", "stats", "rating"
)

foreach ($component in $recommendedComponents) {
    Write-Host "   npx shadcn@latest add $component" -ForegroundColor White
}

Write-Host "`n✨ Your UI is now more consistent and beautiful!" -ForegroundColor Green
