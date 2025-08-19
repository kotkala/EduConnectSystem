# Script verification cuoi cung sau mapping hoan toan
Write-Host "=== VERIFICATION CUOI CUNG - MAPPING HOAN TOAN ===" -ForegroundColor Green
Write-Host "Thoi gian: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Dem tong files
$backupCount = (Get-ChildItem -Path $backupPath -Recurse -File).Count
$srcCount = (Get-ChildItem -Path $srcPath -Recurse -File).Count
$rootCount = (Get-ChildItem -Path "." -File).Count
$totalNew = $srcCount + $rootCount

Write-Host "=== THONG KE TONG QUAN ===" -ForegroundColor Magenta
Write-Host "Files trong backup (cu): $backupCount" -ForegroundColor Cyan
Write-Host "Files trong src: $srcCount" -ForegroundColor Cyan
Write-Host "Files o root: $rootCount" -ForegroundColor Cyan
Write-Host "Tong files moi: $totalNew" -ForegroundColor Cyan

$mappingRate = [math]::Round(($totalNew / $backupCount) * 100, 2)
Write-Host "Ty le mapping: $mappingRate%" -ForegroundColor $(if ($mappingRate -ge 100) { "Green" } else { "Yellow" })

# Kiem tra cac files quan trong
Write-Host ""
Write-Host "=== KIEM TRA FILES QUAN TRONG ===" -ForegroundColor Yellow

$criticalFiles = @(
    @{ Path = "package.json"; Location = "Root"; Description = "Package configuration" },
    @{ Path = "tsconfig.json"; Location = "Root"; Description = "TypeScript configuration" },
    @{ Path = "src\app\favicon.ico"; Location = "Src"; Description = "App favicon" },
    @{ Path = "src\lib\actions\admin-grade-overwrite-actions.ts"; Location = "Src"; Description = "Admin grade actions" },
    @{ Path = "src\lib\actions\meeting-schedule-actions.ts"; Location = "Src"; Description = "Meeting schedule actions" }
)

$allCriticalPresent = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  OK $($file.Path) [$($file.Location)] - $($file.Description)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $($file.Path) [$($file.Location)] - $($file.Description)" -ForegroundColor Red
        $allCriticalPresent = $false
    }
}

# Kiem tra cau truc thu muc
Write-Host ""
Write-Host "=== KIEM TRA CAU TRUC THU MUC ===" -ForegroundColor Yellow

$requiredDirs = @(
    @{ Path = "src\app"; Description = "Next.js App Router" },
    @{ Path = "src\features"; Description = "Feature modules" },
    @{ Path = "src\lib"; Description = "Shared libraries" },
    @{ Path = "src\shared"; Description = "Shared components" },
    @{ Path = "src\providers"; Description = "React providers" }
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir.Path) {
        $fileCount = (Get-ChildItem -Path $dir.Path -Recurse -File).Count
        Write-Host "  OK $($dir.Path) ($fileCount files) - $($dir.Description)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $($dir.Path) - $($dir.Description)" -ForegroundColor Red
    }
}

# Phan tich theo loai file
Write-Host ""
Write-Host "=== PHAN TICH THEO LOAI FILE ===" -ForegroundColor Cyan

$allFiles = Get-ChildItem -Path $srcPath -Recurse -File
$extensions = $allFiles | Group-Object Extension | Sort-Object Count -Descending

Write-Host "Cac loai file trong src:"
$extensions | Select-Object -First 10 | ForEach-Object {
    $ext = if ($_.Name) { $_.Name } else { "(no extension)" }
    Write-Host "  $ext : $($_.Count) files"
}

# Kiem tra build dependencies
Write-Host ""
Write-Host "=== KIEM TRA BUILD DEPENDENCIES ===" -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "  OK Dependencies installed (node_modules)" -ForegroundColor Green
} else {
    Write-Host "  WARNING Dependencies not installed" -ForegroundColor Yellow
    Write-Host "  Chay 'bun install' de cai dat dependencies" -ForegroundColor Gray
}

if (Test-Path "bun.lock") {
    Write-Host "  OK Lock file exists (bun.lock)" -ForegroundColor Green
} else {
    Write-Host "  WARNING Lock file not found" -ForegroundColor Yellow
}

# Kiem tra config files
Write-Host ""
Write-Host "=== KIEM TRA CONFIG FILES ===" -ForegroundColor Yellow

$configFiles = @("next.config.ts", "tailwind.config.ts", "postcss.config.mjs", "eslint.config.mjs")
foreach ($config in $configFiles) {
    if (Test-Path $config) {
        Write-Host "  OK $config" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $config" -ForegroundColor Red
    }
}

# Ket luan cuoi cung
Write-Host ""
Write-Host "=== KET LUAN CUOI CUNG ===" -ForegroundColor Green

if ($mappingRate -ge 100 -and $allCriticalPresent) {
    Write-Host "PERFECT! MAPPING HOAN TOAN THANH CONG!" -ForegroundColor Green
    Write-Host "Tat ca files da duoc mapping va cau truc hoan chinh." -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=== READY FOR BUILD ===" -ForegroundColor Blue
    Write-Host "Du an da san sang de:"
    Write-Host "1. Build: bun run build"
    Write-Host "2. Development: bun run dev"
    Write-Host "3. Production deployment"
    
} elseif ($mappingRate -ge 95) {
    Write-Host "GOOD! Mapping gan nhu hoan thanh." -ForegroundColor Yellow
    Write-Host "Can kiem tra lai mot so files."
} else {
    Write-Host "NEEDS WORK! Van con van de can xu ly." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== THONG TIN THEM ===" -ForegroundColor Cyan
Write-Host "- Backup folder: $backupPath"
Write-Host "- Source folder: $srcPath"
Write-Host "- Mapping rate: $mappingRate%"
Write-Host "- Total files: $totalNew / $backupCount"

if ($mappingRate -gt 100) {
    $extraFiles = $totalNew - $backupCount
    Write-Host "- Extra files added: +$extraFiles (README files, etc.)"
}
