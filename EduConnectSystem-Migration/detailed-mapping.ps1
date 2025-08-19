# Script mapping chi tiet va copy tat ca files
Write-Host "=== MAPPING CHI TIET VA COPY TAT CA FILES ===" -ForegroundColor Green
Write-Host ""

$backupPath = "backup-migration-20250819-172623"
$srcPath = "src"

# Lay danh sach tat ca file tu backup
$backupFiles = @()
Get-ChildItem -Path $backupPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$backupPath\", "")
    $backupFiles += [PSCustomObject]@{
        RelativePath = $relativePath
        FullPath = $_.FullName
        Name = $_.Name
    }
}

# Lay danh sach tat ca file tu src
$srcFiles = @()
Get-ChildItem -Path $srcPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$srcPath\", "")
    $srcFiles += [PSCustomObject]@{
        RelativePath = $relativePath
        FullPath = $_.FullName
        Name = $_.Name
    }
}

# Lay danh sach files o root (ngoai src)
$rootFiles = @()
Get-ChildItem -Path "." -File | ForEach-Object {
    $rootFiles += [PSCustomObject]@{
        Name = $_.Name
        FullPath = $_.FullName
    }
}

Write-Host "Files trong backup: $($backupFiles.Count)" -ForegroundColor Cyan
Write-Host "Files trong src: $($srcFiles.Count)" -ForegroundColor Cyan
Write-Host "Files o root: $($rootFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Phan tich chi tiet files thieu
$missingInSrc = @()
$missingInRoot = @()

foreach ($backupFile in $backupFiles) {
    $foundInSrc = $srcFiles | Where-Object { $_.Name -eq $backupFile.Name }
    $foundInRoot = $rootFiles | Where-Object { $_.Name -eq $backupFile.Name }
    
    if (-not $foundInSrc -and -not $foundInRoot) {
        # Xac dinh file nay thuoc src hay root
        if ($backupFile.RelativePath -eq "package.json" -or 
            $backupFile.RelativePath -eq "tsconfig.json" -or
            $backupFile.RelativePath -like "*.md" -and $backupFile.RelativePath -notlike "*\*") {
            $missingInRoot += $backupFile
        } else {
            $missingInSrc += $backupFile
        }
    }
}

Write-Host "=== FILES THIEU TRONG SRC: $($missingInSrc.Count) ===" -ForegroundColor Red
$missingInSrc | Sort-Object RelativePath | ForEach-Object {
    Write-Host "  - $($_.RelativePath)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FILES THIEU O ROOT: $($missingInRoot.Count) ===" -ForegroundColor Yellow
$missingInRoot | Sort-Object RelativePath | ForEach-Object {
    Write-Host "  - $($_.RelativePath)" -ForegroundColor Yellow
}

# Copy files thieu vao src
if ($missingInSrc.Count -gt 0) {
    Write-Host ""
    Write-Host "=== COPY FILES VAO SRC ===" -ForegroundColor Blue
    
    foreach ($file in $missingInSrc) {
        Write-Host "Copy: $($file.RelativePath)" -ForegroundColor Cyan
        
        # Xac dinh duong dan dich
        $destPath = ""
        if ($file.RelativePath -like "app\*") {
            # Files trong app -> src/app
            $relativePath = $file.RelativePath.Replace("app\", "")
            $destPath = Join-Path "src\app" $relativePath
        } else {
            # Files khac -> src
            $destPath = Join-Path $srcPath $file.RelativePath
        }
        
        # Tao thu muc
        $destDir = Split-Path $destPath -Parent
        if ($destDir -and -not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Copy file
        try {
            Copy-Item -Path $file.FullPath -Destination $destPath -Force
            Write-Host "  OK: -> $destPath" -ForegroundColor Green
        } catch {
            Write-Host "  LOI: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Copy files thieu vao root
if ($missingInRoot.Count -gt 0) {
    Write-Host ""
    Write-Host "=== COPY FILES VAO ROOT ===" -ForegroundColor Blue
    
    foreach ($file in $missingInRoot) {
        Write-Host "Copy: $($file.RelativePath)" -ForegroundColor Cyan
        
        try {
            Copy-Item -Path $file.FullPath -Destination $file.Name -Force
            Write-Host "  OK: -> $($file.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  LOI: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Kiem tra lai toan bo
Write-Host ""
Write-Host "=== KIEM TRA CUOI CUNG ===" -ForegroundColor Magenta

$newSrcCount = (Get-ChildItem -Path $srcPath -Recurse -File).Count
$newRootCount = (Get-ChildItem -Path "." -File).Count

Write-Host "Files trong backup: $($backupFiles.Count)"
Write-Host "Files trong src (moi): $newSrcCount"
Write-Host "Files o root (moi): $newRootCount"

$totalNew = $newSrcCount + $newRootCount
$mappingRate = [math]::Round(($totalNew / $backupFiles.Count) * 100, 2)

Write-Host "Tong files moi: $totalNew"
Write-Host "Ty le mapping: $mappingRate%"

if ($mappingRate -ge 100) {
    Write-Host ""
    Write-Host "PERFECT! 100% MAPPING THANH CONG!" -ForegroundColor Green
} elseif ($mappingRate -ge 99) {
    Write-Host ""
    Write-Host "XUAT SAC! Gan nhu hoan hao!" -ForegroundColor Green
} elseif ($mappingRate -ge 95) {
    Write-Host ""
    Write-Host "TOT! Mapping thanh cong!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "CAN KIEM TRA LAI!" -ForegroundColor Red
}

# Liet ke cac files van con thieu (neu co)
$stillMissing = @()
foreach ($backupFile in $backupFiles) {
    $foundInNewSrc = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object { $_.Name -eq $backupFile.Name }
    $foundInNewRoot = Get-ChildItem -Path "." -File | Where-Object { $_.Name -eq $backupFile.Name }
    
    if (-not $foundInNewSrc -and -not $foundInNewRoot) {
        $stillMissing += $backupFile
    }
}

if ($stillMissing.Count -gt 0) {
    Write-Host ""
    Write-Host "FILES VAN CON THIEU ($($stillMissing.Count)):" -ForegroundColor Red
    $stillMissing | ForEach-Object {
        Write-Host "  ! $($_.RelativePath)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== HOAN THANH ===" -ForegroundColor Green
