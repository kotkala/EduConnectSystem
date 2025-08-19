# Script so sánh chi tiết cấu trúc file giữa backup và src
param(
    [switch]$Detailed,
    [switch]$ShowMissing,
    [switch]$ShowAll
)

Write-Host "=== SO SÁNH CẤU TRÚC FILE EDUCONNECT ===" -ForegroundColor Green
Write-Host "Thời gian: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Đường dẫn
$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Kiểm tra thư mục tồn tại
if (-not (Test-Path $backupPath)) {
    Write-Host "❌ Không tìm thấy thư mục backup: $backupPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $srcPath)) {
    Write-Host "❌ Không tìm thấy thư mục src: $srcPath" -ForegroundColor Red
    exit 1
}

# Lấy danh sách file từ backup (cấu trúc cũ)
Write-Host "🔍 Đang quét cấu trúc cũ (backup)..." -ForegroundColor Yellow
$oldFiles = @()
Get-ChildItem -Path $backupPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$backupPath\", "")
    $oldFiles += [PSCustomObject]@{
        Path = $relativePath
        Name = $_.Name
        Extension = $_.Extension
        Directory = Split-Path $relativePath -Parent
        Size = $_.Length
    }
}

# Lấy danh sách file từ src (cấu trúc mới)
Write-Host "🔍 Đang quét cấu trúc mới (src)..." -ForegroundColor Yellow
$newFiles = @()
Get-ChildItem -Path $srcPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$srcPath\", "")
    $newFiles += [PSCustomObject]@{
        Path = $relativePath
        Name = $_.Name
        Extension = $_.Extension
        Directory = Split-Path $relativePath -Parent
        Size = $_.Length
    }
}

Write-Host ""
Write-Host "=== THỐNG KÊ TỔNG QUAN ===" -ForegroundColor Magenta
Write-Host "📁 Files trong cấu trúc CŨ: $($oldFiles.Count)" -ForegroundColor Cyan
Write-Host "📁 Files trong cấu trúc MỚI: $($newFiles.Count)" -ForegroundColor Cyan

# Phân tích theo extension
$oldExtensions = $oldFiles | Group-Object Extension | Sort-Object Count -Descending
$newExtensions = $newFiles | Group-Object Extension | Sort-Object Count -Descending

Write-Host ""
Write-Host "📊 Phân bố theo loại file:" -ForegroundColor Yellow
Write-Host "CŨ:" -ForegroundColor Cyan
$oldExtensions | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }
Write-Host "MỚI:" -ForegroundColor Cyan  
$newExtensions | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }

# Tìm file thiếu (có trong cũ nhưng không có trong mới)
Write-Host ""
Write-Host "=== PHÂN TÍCH FILES THIẾU ===" -ForegroundColor Red

$missingFiles = @()
$foundFiles = @()

foreach ($oldFile in $oldFiles) {
    $found = $false
    $matchType = ""
    
    # Kiểm tra exact match
    $exactMatch = $newFiles | Where-Object { $_.Path -eq $oldFile.Path }
    if ($exactMatch) {
        $found = $true
        $matchType = "EXACT"
    }
    
    # Kiểm tra name match
    if (-not $found) {
        $nameMatch = $newFiles | Where-Object { $_.Name -eq $oldFile.Name }
        if ($nameMatch) {
            $found = $true
            $matchType = "NAME_MATCH"
        }
    }
    
    # Kiểm tra similar path
    if (-not $found) {
        $similarMatch = $newFiles | Where-Object { 
            $_.Name -eq $oldFile.Name -and 
            ($_.Directory -like "*$($oldFile.Directory.Split('\')[-1])*" -or 
             $oldFile.Directory -like "*$($_.Directory.Split('\')[-1])*")
        }
        if ($similarMatch) {
            $found = $true
            $matchType = "SIMILAR_PATH"
        }
    }
    
    if ($found) {
        $foundFiles += [PSCustomObject]@{
            OldPath = $oldFile.Path
            NewPath = if ($exactMatch) { $exactMatch.Path } elseif ($nameMatch) { $nameMatch.Path } else { $similarMatch.Path }
            MatchType = $matchType
        }
    } else {
        $missingFiles += $oldFile
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  FILES CÓ THỂ BỊ THIẾU ($($missingFiles.Count)):" -ForegroundColor Red
    $missingFiles | Sort-Object Path | ForEach-Object { 
        Write-Host "  ❌ $($_.Path)" -ForegroundColor Red 
        if ($_.Extension -eq ".ts" -or $_.Extension -eq ".tsx") {
            Write-Host "     📝 TypeScript/React component" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ Không phát hiện file nào bị thiếu rõ ràng" -ForegroundColor Green
}

# Files mới (có trong mới nhưng không có trong cũ)
$newOnlyFiles = @()
foreach ($newFile in $newFiles) {
    $found = $oldFiles | Where-Object { $_.Name -eq $newFile.Name }
    if (-not $found) {
        $newOnlyFiles += $newFile
    }
}

if ($newOnlyFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "✨ FILES MỚI ĐƯỢC THÊM ($($newOnlyFiles.Count)):" -ForegroundColor Green
    $newOnlyFiles | Sort-Object Path | Select-Object -First 10 | ForEach-Object { 
        Write-Host "  ➕ $($_.Path)" -ForegroundColor Green 
    }
    if ($newOnlyFiles.Count -gt 10) {
        Write-Host "  ... và $($newOnlyFiles.Count - 10) files khác" -ForegroundColor Gray
    }
}

# Hiển thị chi tiết nếu được yêu cầu
if ($ShowAll -or $Detailed) {
    Write-Host ""
    Write-Host "=== CHI TIẾT MAPPING FILES ===" -ForegroundColor Blue
    $foundFiles | Sort-Object OldPath | ForEach-Object {
        $color = switch ($_.MatchType) {
            "EXACT" { "Green" }
            "NAME_MATCH" { "Yellow" }
            "SIMILAR_PATH" { "Cyan" }
            default { "White" }
        }
        Write-Host "  $($_.MatchType): $($_.OldPath) → $($_.NewPath)" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "=== KẾT LUẬN ===" -ForegroundColor Magenta
Write-Host "📊 Tổng files cũ: $($oldFiles.Count)"
Write-Host "📊 Tổng files mới: $($newFiles.Count)"
Write-Host "✅ Files được map: $($foundFiles.Count)"
Write-Host "❌ Files có thể thiếu: $($missingFiles.Count)"
Write-Host "✨ Files mới: $($newOnlyFiles.Count)"

$migrationSuccess = [math]::Round(($foundFiles.Count / $oldFiles.Count) * 100, 2)
Write-Host "📈 Tỷ lệ migration thành công: $migrationSuccess%" -ForegroundColor $(if ($migrationSuccess -gt 90) { "Green" } elseif ($migrationSuccess -gt 80) { "Yellow" } else { "Red" })

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "KHUYEN NGHI:" -ForegroundColor Red
    Write-Host "- Kiem tra lai cac files bi thieu"
    Write-Host "- Dam bao khong co chuc nang nao bi mat"
    Write-Host "- Chay test de verify functionality"
}
