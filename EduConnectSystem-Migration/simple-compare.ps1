# Script so sanh don gian cau truc file
Write-Host "=== SO SANH CAU TRUC FILE ===" -ForegroundColor Green
Write-Host ""

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Lay danh sach file tu backup
Write-Host "Dang quet cau truc cu (backup)..." -ForegroundColor Yellow
$oldFiles = Get-ChildItem -Path $backupPath -Recurse -File | ForEach-Object {
    $_.FullName.Replace((Get-Location).Path + "\$backupPath\", "")
} | Sort-Object

# Lay danh sach file tu src
Write-Host "Dang quet cau truc moi (src)..." -ForegroundColor Yellow
$newFiles = Get-ChildItem -Path $srcPath -Recurse -File | ForEach-Object {
    $_.FullName.Replace((Get-Location).Path + "\$srcPath\", "")
} | Sort-Object

Write-Host ""
Write-Host "=== KET QUA ===" -ForegroundColor Green
Write-Host "Files cu: $($oldFiles.Count)"
Write-Host "Files moi: $($newFiles.Count)"

# Tim file thieu
$missingFiles = @()
foreach ($oldFile in $oldFiles) {
    $fileName = Split-Path $oldFile -Leaf
    $found = $false
    
    foreach ($newFile in $newFiles) {
        $newFileName = Split-Path $newFile -Leaf
        if ($newFileName -eq $fileName) {
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        $missingFiles += $oldFile
    }
}

Write-Host ""
if ($missingFiles.Count -gt 0) {
    Write-Host "FILES CO THE BI THIEU ($($missingFiles.Count)):" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "Khong phat hien file nao bi thieu" -ForegroundColor Green
}

# Tim file moi
$newOnlyFiles = @()
foreach ($newFile in $newFiles) {
    $fileName = Split-Path $newFile -Leaf
    $found = $false
    
    foreach ($oldFile in $oldFiles) {
        $oldFileName = Split-Path $oldFile -Leaf
        if ($oldFileName -eq $fileName) {
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        $newOnlyFiles += $newFile
    }
}

Write-Host ""
if ($newOnlyFiles.Count -gt 0) {
    Write-Host "FILES MOI DUOC THEM ($($newOnlyFiles.Count)):" -ForegroundColor Green
    $newOnlyFiles | Select-Object -First 10 | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
    if ($newOnlyFiles.Count -gt 10) {
        Write-Host "  ... va $($newOnlyFiles.Count - 10) files khac" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== PHAN TICH QUAN TRONG ===" -ForegroundColor Magenta

# Kiem tra cac file quan trong
$importantMissing = $missingFiles | Where-Object { 
    $_ -like "*.ts" -or $_ -like "*.tsx" -or $_ -like "*.js" -or $_ -like "*.jsx" 
}

if ($importantMissing.Count -gt 0) {
    Write-Host "CAC FILE CODE BI THIEU:" -ForegroundColor Red
    $importantMissing | ForEach-Object { Write-Host "  ! $_" -ForegroundColor Red }
}

# Kiem tra package.json va tsconfig.json
$configMissing = $missingFiles | Where-Object { 
    $_ -like "*package.json" -or $_ -like "*tsconfig.json" 
}

if ($configMissing.Count -gt 0) {
    Write-Host ""
    Write-Host "CAC FILE CONFIG BI THIEU:" -ForegroundColor Yellow
    $configMissing | ForEach-Object { Write-Host "  ! $_" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "=== KET LUAN ===" -ForegroundColor Cyan
$successRate = [math]::Round((($oldFiles.Count - $missingFiles.Count) / $oldFiles.Count) * 100, 2)
Write-Host "Ty le migration thanh cong: $successRate%"

if ($missingFiles.Count -eq 0) {
    Write-Host "MIGRATION HOAN THANH - Khong co file nao bi thieu!" -ForegroundColor Green
} elseif ($missingFiles.Count -le 5) {
    Write-Host "MIGRATION GAN HOAN THANH - Chi thieu it file" -ForegroundColor Yellow
} else {
    Write-Host "CAN KIEM TRA LAI - Co nhieu file bi thieu" -ForegroundColor Red
}
