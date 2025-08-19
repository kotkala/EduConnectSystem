# Script kiem tra cuoi cung sau migration
Write-Host "=== KIEM TRA CUOI CUNG SAU MIGRATION ===" -ForegroundColor Green
Write-Host ""

# Kiem tra cac file quan trong
$criticalFiles = @(
    "package.json",
    "tsconfig.json", 
    "src\app\favicon.ico",
    "src\lib\actions\admin-grade-overwrite-actions.ts",
    "src\lib\actions\meeting-schedule-actions.ts"
)

Write-Host "Kiem tra cac file quan trong:" -ForegroundColor Yellow
$allPresent = $true

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $file" -ForegroundColor Red
        $allPresent = $false
    }
}

Write-Host ""
if ($allPresent) {
    Write-Host "TAT CA FILES QUAN TRONG DA CO MAT!" -ForegroundColor Green
} else {
    Write-Host "VAN CON FILES BI THIEU!" -ForegroundColor Red
    exit 1
}

# Kiem tra cau truc thu muc
Write-Host ""
Write-Host "Kiem tra cau truc thu muc:" -ForegroundColor Yellow

$requiredDirs = @(
    "src\app",
    "src\features", 
    "src\lib",
    "src\shared",
    "src\providers"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem -Path $dir -Recurse -File).Count
        Write-Host "  OK $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $dir" -ForegroundColor Red
    }
}

# Thong ke tong quan
Write-Host ""
Write-Host "=== THONG KE TONG QUAN ===" -ForegroundColor Magenta

$totalFiles = (Get-ChildItem -Path "src" -Recurse -File).Count
$totalDirs = (Get-ChildItem -Path "src" -Recurse -Directory).Count

Write-Host "Tong files trong src: $totalFiles"
Write-Host "Tong thu muc trong src: $totalDirs"

# Phan tich theo loai file
$extensions = Get-ChildItem -Path "src" -Recurse -File | Group-Object Extension | Sort-Object Count -Descending

Write-Host ""
Write-Host "Phan bo theo loai file:" -ForegroundColor Cyan
$extensions | Select-Object -First 10 | ForEach-Object {
    $ext = if ($_.Name) { $_.Name } else { "(no extension)" }
    Write-Host "  $ext : $($_.Count)"
}

Write-Host ""
Write-Host "=== BUOC TIEP THEO ===" -ForegroundColor Blue
Write-Host "1. Chay 'bun install' de cap nhat dependencies"
Write-Host "2. Chay 'bun run build' de kiem tra build"
Write-Host "3. Chay 'bun run dev' de test development server"
Write-Host "4. Test cac chuc nang chinh de dam bao functionality"

Write-Host ""
Write-Host "=== MIGRATION HOAN THANH ===" -ForegroundColor Green
Write-Host "Cau truc file da duoc migration thanh cong!"
Write-Host "Ty le thanh cong: 100% (tat ca files quan trong da co)"
