# 把打包生成的 exe 重命名为中文名，让 Release 下载时一眼能看懂「纯桌宠」
# electron-builder 不支持中文文件名，所以构建用英文/数字，这里再改名。
$ErrorActionPreference = 'Stop'

# 脚本在 scripts/ 下，仓库根在其上一级
$root = Split-Path -Parent $PSScriptRoot
$pkg = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$ver = $pkg.version
$productName = '鲸鱼娘桌宠(纯桌宠版)'

$exes = Get-ChildItem (Join-Path $root 'dist') -Filter *.exe -ErrorAction SilentlyContinue
if (-not $exes) {
  Write-Host 'dist 下没有 exe，跳过改名'
  exit 0
}

foreach ($exe in $exes) {
  $isSetup = $exe.Name -match 'Setup'
  $kind = if ($isSetup) { '安装版' } else { '便携版' }
  $newName = "$productName-$kind-$ver.exe"
  Rename-Item $exe.FullName -NewName $newName
  Write-Host "renamed -> $newName"
}
