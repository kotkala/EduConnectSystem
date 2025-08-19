# Bao cao tong ket migration
Write-Host "=== BAO CAO TONG KET MIGRATION EDUCONNECT ===" -ForegroundColor Green
Write-Host "Thoi gian: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Kiem tra cau truc file
Write-Host "=== KIEM TRA CAU TRUC FILE ===" -ForegroundColor Yellow

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

if (Test-Path $backupPath) {
    $oldFiles = (Get-ChildItem -Path $backupPath -Recurse -File).Count
    Write-Host "Files trong backup (cu): $oldFiles" -ForegroundColor Cyan
} else {
    Write-Host "Khong tim thay backup folder" -ForegroundColor Red
}

if (Test-Path $srcPath) {
    $newFiles = (Get-ChildItem -Path $srcPath -Recurse -File).Count
    Write-Host "Files trong src (moi): $newFiles" -ForegroundColor Cyan
} else {
    Write-Host "Khong tim thay src folder" -ForegroundColor Red
}

# Kiem tra cac file quan trong
Write-Host ""
Write-Host "=== KIEM TRA FILES QUAN TRONG ===" -ForegroundColor Yellow

$criticalFiles = @(
    @{ Path = "package.json"; Description = "Package configuration" },
    @{ Path = "tsconfig.json"; Description = "TypeScript configuration" },
    @{ Path = "src\app\favicon.ico"; Description = "App favicon" },
    @{ Path = "src\lib\actions\admin-grade-overwrite-actions.ts"; Description = "Admin grade overwrite actions" },
    @{ Path = "src\lib\actions\meeting-schedule-actions.ts"; Description = "Meeting schedule actions" }
)

$allPresent = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  OK $($file.Path) - $($file.Description)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $($file.Path) - $($file.Description)" -ForegroundColor Red
        $allPresent = $false
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

# Kiem tra build status
Write-Host ""
Write-Host "=== KIEM TRA BUILD STATUS ===" -ForegroundColor Yellow

if (Test-Path ".next") {
    Write-Host "  OK Build folder exists (.next)" -ForegroundColor Green
    $buildSize = [math]::Round((Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "  Build size: $buildSize MB" -ForegroundColor Cyan
} else {
    Write-Host "  WARNING Build folder not found (.next)" -ForegroundColor Yellow
    Write-Host "  Run 'bun run build' to create build" -ForegroundColor Gray
}

# Kiem tra dependencies
Write-Host ""
Write-Host "=== KIEM TRA DEPENDENCIES ===" -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "  OK Dependencies installed (node_modules)" -ForegroundColor Green
    $depSize = [math]::Round((Get-ChildItem -Path "node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "  Dependencies size: $depSize MB" -ForegroundColor Cyan
} else {
    Write-Host "  WARNING Dependencies not installed" -ForegroundColor Yellow
    Write-Host "  Run 'bun install' to install dependencies" -ForegroundColor Gray
}

if (Test-Path "bun.lock") {
    Write-Host "  OK Lock file exists (bun.lock)" -ForegroundColor Green
} else {
    Write-Host "  WARNING Lock file not found" -ForegroundColor Yellow
}

# Tinh ty le migration
Write-Host ""
Write-Host "=== TY LE MIGRATION ===" -ForegroundColor Magenta

if ($oldFiles -and $newFiles) {
    $migrationRate = [math]::Round(($newFiles / $oldFiles) * 100, 2)
    Write-Host "Ty le migration: $migrationRate%" -ForegroundColor Cyan
    
    if ($migrationRate -ge 95) {
        Write-Host "XUAT SAC - Migration gan nhu hoan hao!" -ForegroundColor Green
    } elseif ($migrationRate -ge 90) {
        Write-Host "TOT - Migration thanh cong!" -ForegroundColor Green
    } elseif ($migrationRate -ge 80) {
        Write-Host "KHA - Can kiem tra them" -ForegroundColor Yellow
    } else {
        Write-Host "CAN CAI THIEN - Co the thieu nhieu files" -ForegroundColor Red
    }
}

# Ket luan
Write-Host ""
Write-Host "=== KET LUAN ===" -ForegroundColor Green

if ($allPresent) {
    Write-Host "MIGRATION THANH CONG!" -ForegroundColor Green
    Write-Host "Tat ca files quan trong da duoc migration." -ForegroundColor Green
} else {
    Write-Host "MIGRATION CHUA HOAN THANH" -ForegroundColor Yellow
    Write-Host "Van con mot so files quan trong bi thieu." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== BUOC TIEP THEO ===" -ForegroundColor Blue
Write-Host "1. Tao file .env.local voi Supabase credentials"
Write-Host "2. Chay 'bun run dev' de test development server"
Write-Host "3. Test cac chuc nang chinh:"
Write-Host "   - Authentication"
Write-Host "   - Dashboard navigation"
Write-Host "   - Grade management"
Write-Host "   - User management"
Write-Host "4. Deploy len production environment"

Write-Host ""
Write-Host "=== LIEN HE ===" -ForegroundColor Cyan
Write-Host "Neu gap van de, hay kiem tra:"
Write-Host "- Migration logs trong migration-log.txt"
Write-Host "- Build errors trong terminal"
Write-Host "- Console errors trong browser"
