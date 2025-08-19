# Script migration cac file bi thieu
Write-Host "=== MIGRATION FILES BI THIEU ===" -ForegroundColor Green
Write-Host ""

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Danh sach cac file bi thieu da xac dinh
$missingFiles = @(
    "app\favicon.ico",
    "lib\actions\admin-grade-overwrite-actions.ts", 
    "lib\actions\meeting-schedule-actions.ts",
    "package.json",
    "tsconfig.json"
)

Write-Host "Cac file can migration:" -ForegroundColor Yellow
$missingFiles | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

foreach ($missingFile in $missingFiles) {
    $sourcePath = Join-Path $backupPath $missingFile
    
    Write-Host "Dang xu ly: $missingFile" -ForegroundColor Cyan
    
    if (Test-Path $sourcePath) {
        # Xac dinh thu muc dich
        if ($missingFile -eq "package.json" -or $missingFile -eq "tsconfig.json") {
            # Cac file config o root
            $destPath = $missingFile
        } elseif ($missingFile -like "app\*") {
            # Files trong app folder -> src/app
            $relativePath = $missingFile.Replace("app\", "")
            $destPath = Join-Path "src\app" $relativePath
        } else {
            # Cac file khac -> src
            $destPath = Join-Path $srcPath $missingFile
        }
        
        # Tao thu muc neu chua ton tai
        $destDir = Split-Path $destPath -Parent
        if ($destDir -and -not (Test-Path $destDir)) {
            Write-Host "  Tao thu muc: $destDir" -ForegroundColor Gray
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Copy file
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "  Da copy: $sourcePath -> $destPath" -ForegroundColor Green
        } catch {
            Write-Host "  Loi copy: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  Khong tim thay file trong backup: $sourcePath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== KIEM TRA SAU MIGRATION ===" -ForegroundColor Magenta

# Kiem tra lai cac file da duoc copy
$copiedCount = 0
foreach ($missingFile in $missingFiles) {
    if ($missingFile -eq "package.json" -or $missingFile -eq "tsconfig.json") {
        $checkPath = $missingFile
    } elseif ($missingFile -like "app\*") {
        $relativePath = $missingFile.Replace("app\", "")
        $checkPath = Join-Path "src\app" $relativePath
    } else {
        $checkPath = Join-Path $srcPath $missingFile
    }
    
    if (Test-Path $checkPath) {
        Write-Host "OK $missingFile" -ForegroundColor Green
        $copiedCount++
    } else {
        Write-Host "FAIL $missingFile" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== KET QUA MIGRATION ===" -ForegroundColor Cyan
Write-Host "Da migration: $copiedCount/$($missingFiles.Count) files"

if ($copiedCount -eq $missingFiles.Count) {
    Write-Host "MIGRATION HOAN THANH!" -ForegroundColor Green
    Write-Host "Tat ca files bi thieu da duoc khoi phuc thanh cong." -ForegroundColor Green
} else {
    Write-Host "MIGRATION CHUA HOAN THANH" -ForegroundColor Yellow
    Write-Host "Van con $($missingFiles.Count - $copiedCount) files chua duoc migration." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== BUOC TIEP THEO ===" -ForegroundColor Blue
Write-Host "1. Kiem tra cac file da migration co hoat dong dung khong"
Write-Host "2. Chay 'bun install' de cap nhat dependencies"
Write-Host "3. Chay 'bun run build' de kiem tra build"
Write-Host "4. Test cac chuc nang de dam bao khong bi mat functionality"
