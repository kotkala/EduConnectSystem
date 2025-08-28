# PowerShell Script to Fix Skeleton Usage Issues in EduConnect Project
Write-Host "🔧 Starting Skeleton Usage Fix..." -ForegroundColor Green

# Get all TypeScript/React files
$files = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" | Where-Object {
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*.d.ts" -and
    $_.FullName -notlike "*fix-skeleton-usage.ps1*"
}

$totalFiles = $files.Count
$modifiedFiles = 0

Write-Host "📁 Found $totalFiles files to process..." -ForegroundColor Yellow

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')

    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content

        # Check if file contains problematic skeleton usage
        if ($content -match 'Skeleton.*h-32 w-full rounded-lg') {

            # Add Loader2 import if not present
            if ($content -notmatch 'import.*Loader2.*from.*lucide-react') {
                # Find existing lucide-react import
                if ($content -match 'import\s*\{([^}]*)\}\s*from\s*[''"]lucide-react[''"]') {
                    $existingImports = $matches[1]
                    if ($existingImports -notmatch 'Loader2') {
                        $newImports = $existingImports.Trim() + ', Loader2'
                        $content = $content -replace 'import\s*\{([^}]*)\}\s*from\s*[''"]lucide-react[''"]', "import { $newImports } from 'lucide-react'"
                    }
                } else {
                    # Add new import at the top
                    $content = "import { Loader2 } from 'lucide-react'`n" + $content
                }
            }

            # Replace problematic patterns
            $content = $content -replace '<Skeleton className="h-32 w-full rounded-lg" />', '<Loader2 className="h-4 w-4 animate-spin" />'

            # Write back if modified
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
                $modifiedFiles++
                Write-Host "✅ Fixed: $relativePath" -ForegroundColor Green
            }
        }

    } catch {
        Write-Host "❌ Error processing $relativePath" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Fix Complete!" -ForegroundColor Green
Write-Host "📊 Files modified: $modifiedFiles" -ForegroundColor White
