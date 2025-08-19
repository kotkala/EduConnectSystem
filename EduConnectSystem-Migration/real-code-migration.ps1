# Script thuc su copy code tu backup va replace hoan toan
Write-Host "=== REAL CODE MIGRATION - COPY THUC SU TU BACKUP ===" -ForegroundColor Red
Write-Host ""

$backupPath = "_backup-migration-20250819-172623"
$srcPath = "src"

if (-not (Test-Path $backupPath)) {
    Write-Host "Khong tim thay backup folder: $backupPath" -ForegroundColor Red
    exit 1
}

# Lay tat ca files tu backup
Write-Host "Dang quet tat ca files trong backup..." -ForegroundColor Yellow
$backupFiles = Get-ChildItem -Path $backupPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\$backupPath\", "")
    [PSCustomObject]@{
        RelativePath = $relativePath
        FullPath = $_.FullName
        Name = $_.Name
        Size = $_.Length
    }
}

Write-Host "Tim thay $($backupFiles.Count) files trong backup" -ForegroundColor Cyan
Write-Host ""

# Phan loai files
$appFiles = $backupFiles | Where-Object { $_.RelativePath -like "app\*" }
$otherFiles = $backupFiles | Where-Object { $_.RelativePath -notlike "app\*" -and $_.RelativePath -ne "package.json" -and $_.RelativePath -ne "tsconfig.json" }
$configFiles = $backupFiles | Where-Object { $_.RelativePath -eq "package.json" -or $_.RelativePath -eq "tsconfig.json" }

Write-Host "=== PHAN LOAI FILES ===" -ForegroundColor Magenta
Write-Host "App files (app\*): $($appFiles.Count)" -ForegroundColor Cyan
Write-Host "Other files: $($otherFiles.Count)" -ForegroundColor Cyan  
Write-Host "Config files: $($configFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Function de copy va replace file
function Copy-AndReplaceFile {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [string]$Description
    )
    
    try {
        # Tao thu muc neu chua ton tai
        $destDir = Split-Path $DestPath -Parent
        if ($destDir -and -not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # So sanh kich thuoc file
        $sourceSize = (Get-Item $SourcePath).Length
        $destExists = Test-Path $DestPath
        $destSize = if ($destExists) { (Get-Item $DestPath).Length } else { 0 }
        
        # Copy file
        Copy-Item -Path $SourcePath -Destination $DestPath -Force
        
        $status = if (-not $destExists) { "NEW" } elseif ($sourceSize -ne $destSize) { "REPLACED" } else { "SAME" }
        $color = switch ($status) {
            "NEW" { "Green" }
            "REPLACED" { "Yellow" }
            "SAME" { "Gray" }
        }
        
        Write-Host "  [$status] $Description ($sourceSize bytes)" -ForegroundColor $color
        return $true
    } catch {
        Write-Host "  [ERROR] $Description - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Copy app files -> src/app
Write-Host "=== COPY APP FILES -> SRC/APP ===" -ForegroundColor Blue
$appCopied = 0
foreach ($file in $appFiles) {
    $relativePath = $file.RelativePath.Replace("app\", "")
    $destPath = Join-Path "src\app" $relativePath
    
    if (Copy-AndReplaceFile -SourcePath $file.FullPath -DestPath $destPath -Description $file.RelativePath) {
        $appCopied++
    }
}
Write-Host "Da copy $appCopied/$($appFiles.Count) app files" -ForegroundColor Green
Write-Host ""

# Copy other files -> src
Write-Host "=== COPY OTHER FILES -> SRC ===" -ForegroundColor Blue
$otherCopied = 0
foreach ($file in $otherFiles) {
    $destPath = Join-Path $srcPath $file.RelativePath
    
    if (Copy-AndReplaceFile -SourcePath $file.FullPath -DestPath $destPath -Description $file.RelativePath) {
        $otherCopied++
    }
}
Write-Host "Da copy $otherCopied/$($otherFiles.Count) other files" -ForegroundColor Green
Write-Host ""

# Copy config files -> root
Write-Host "=== COPY CONFIG FILES -> ROOT ===" -ForegroundColor Blue
$configCopied = 0
foreach ($file in $configFiles) {
    if (Copy-AndReplaceFile -SourcePath $file.FullPath -DestPath $file.Name -Description $file.RelativePath) {
        $configCopied++
    }
}
Write-Host "Da copy $configCopied/$($configFiles.Count) config files" -ForegroundColor Green
Write-Host ""

# Sua import paths trong tat ca files
Write-Host "=== SUA IMPORT PATHS ===" -ForegroundColor Yellow
$fixedFiles = 0

Get-ChildItem -Path $srcPath -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $originalContent = $content
    
    # Sua cac import paths
    $content = $content -replace '@/components/ui/', '@/shared/components/ui/'
    $content = $content -replace '@/components/', '@/shared/components/'
    $content = $content -replace '@/utils/supabase/', '@/shared/utils/supabase/'
    $content = $content -replace '@/lib/utils', '@/lib/utils'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "  Fixed imports: $($_.Name)" -ForegroundColor Green
        $fixedFiles++
    }
}

Write-Host "Da sua import paths trong $fixedFiles files" -ForegroundColor Green
Write-Host ""

# Kiem tra lai
Write-Host "=== KIEM TRA LAI ===" -ForegroundColor Magenta
$newSrcCount = (Get-ChildItem -Path $srcPath -Recurse -File).Count
$totalCopied = $appCopied + $otherCopied + $configCopied

Write-Host "Files da copy: $totalCopied"
Write-Host "Files trong src: $newSrcCount"
Write-Host "Import paths da sua: $fixedFiles"

Write-Host ""
Write-Host "=== HOAN THANH REAL CODE MIGRATION ===" -ForegroundColor Green
Write-Host "Tat ca code da duoc copy thuc su tu backup!"
Write-Host "Chay 'bun run build' de kiem tra!"
