# Script mapping hoan toan giua backup va src
Write-Host "=== MAPPING HOAN TOAN BACKUP -> SRC ===" -ForegroundColor Green
Write-Host ""

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Lay danh sach tat ca file tu backup
Write-Host "Dang quet toan bo files trong backup..." -ForegroundColor Yellow
$backupFiles = @()
Get-ChildItem -Path $backupPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$backupPath\", "")
    $backupFiles += [PSCustomObject]@{
        RelativePath = $relativePath
        FullPath = $_.FullName
        Name = $_.Name
        Directory = Split-Path $relativePath -Parent
        Extension = $_.Extension
    }
}

# Lay danh sach tat ca file tu src
Write-Host "Dang quet toan bo files trong src..." -ForegroundColor Yellow
$srcFiles = @()
Get-ChildItem -Path $srcPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$srcPath\", "")
    $srcFiles += [PSCustomObject]@{
        RelativePath = $relativePath
        FullPath = $_.FullName
        Name = $_.Name
        Directory = Split-Path $relativePath -Parent
        Extension = $_.Extension
    }
}

Write-Host "Files trong backup: $($backupFiles.Count)" -ForegroundColor Cyan
Write-Host "Files trong src: $($srcFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Tim tat ca files thieu
$missingFiles = @()
$foundFiles = @()

foreach ($backupFile in $backupFiles) {
    $found = $false
    
    # Tim exact match theo ten file
    $exactMatch = $srcFiles | Where-Object { $_.Name -eq $backupFile.Name }
    
    if ($exactMatch) {
        $found = $true
        $foundFiles += [PSCustomObject]@{
            BackupPath = $backupFile.RelativePath
            SrcPath = $exactMatch.RelativePath
            Status = "FOUND"
        }
    } else {
        $missingFiles += $backupFile
    }
}

Write-Host "=== KET QUA PHAN TICH ===" -ForegroundColor Magenta
Write-Host "Files da mapping: $($foundFiles.Count)" -ForegroundColor Green
Write-Host "Files bi thieu: $($missingFiles.Count)" -ForegroundColor Red

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "=== DANH SACH FILES BI THIEU ===" -ForegroundColor Red
    $missingFiles | Sort-Object RelativePath | ForEach-Object {
        Write-Host "  - $($_.RelativePath)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== BAT DAU COPY FILES BI THIEU ===" -ForegroundColor Yellow
    
    $copiedCount = 0
    $errorCount = 0
    
    foreach ($missingFile in $missingFiles) {
        Write-Host "Dang copy: $($missingFile.RelativePath)" -ForegroundColor Cyan
        
        # Xac dinh duong dan dich
        $destPath = ""
        
        if ($missingFile.RelativePath -eq "package.json" -or $missingFile.RelativePath -eq "tsconfig.json") {
            # Files config o root
            $destPath = $missingFile.RelativePath
        } elseif ($missingFile.RelativePath -like "app\*") {
            # Files trong app -> src/app
            $relativePath = $missingFile.RelativePath.Replace("app\", "")
            $destPath = Join-Path "src\app" $relativePath
        } else {
            # Tat ca files khac -> src
            $destPath = Join-Path $srcPath $missingFile.RelativePath
        }
        
        # Tao thu muc neu chua ton tai
        $destDir = Split-Path $destPath -Parent
        if ($destDir -and -not (Test-Path $destDir)) {
            Write-Host "  Tao thu muc: $destDir" -ForegroundColor Gray
            try {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            } catch {
                Write-Host "  Loi tao thu muc: $($_.Exception.Message)" -ForegroundColor Red
                $errorCount++
                continue
            }
        }
        
        # Copy file
        try {
            Copy-Item -Path $missingFile.FullPath -Destination $destPath -Force
            Write-Host "  OK: $($missingFile.RelativePath) -> $destPath" -ForegroundColor Green
            $copiedCount++
        } catch {
            Write-Host "  LOI: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Write-Host ""
    Write-Host "=== KET QUA COPY ===" -ForegroundColor Magenta
    Write-Host "Da copy thanh cong: $copiedCount files" -ForegroundColor Green
    Write-Host "Loi: $errorCount files" -ForegroundColor Red
    
} else {
    Write-Host ""
    Write-Host "TAT CA FILES DA DUOC MAPPING!" -ForegroundColor Green
}

# Kiem tra lai sau khi copy
Write-Host ""
Write-Host "=== KIEM TRA LAI SAU KHI COPY ===" -ForegroundColor Blue

$newSrcFiles = (Get-ChildItem -Path $srcPath -Recurse -File).Count
$finalMappingRate = [math]::Round(($newSrcFiles / $backupFiles.Count) * 100, 2)

Write-Host "Files trong backup: $($backupFiles.Count)"
Write-Host "Files trong src (sau copy): $newSrcFiles"
Write-Host "Ty le mapping: $finalMappingRate%"

if ($finalMappingRate -ge 99) {
    Write-Host ""
    Write-Host "HOAN THANH! MAPPING 100% THANH CONG!" -ForegroundColor Green
} elseif ($finalMappingRate -ge 95) {
    Write-Host ""
    Write-Host "GAN HOAN THANH! Mapping rat tot." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "CAN KIEM TRA LAI! Van con files bi thieu." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== BUOC TIEP THEO ===" -ForegroundColor Cyan
Write-Host "1. Chay 'bun run build' de kiem tra build"
Write-Host "2. Sua cac loi import neu co"
Write-Host "3. Test cac chuc nang"
