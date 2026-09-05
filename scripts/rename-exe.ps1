# 把打包生成的 exe 重命名，让 Release 下载时一眼能看懂是「纯桌宠」版。
# 注意：GitHub 上传不支持中文文件名（会 404），所以 exe 用英文名；
# 中文说明放在 Release 描述（scripts/release-notes.md）里。
$ErrorActionPreference = 'Stop'

# 脚本在 scripts/ 下，仓库根在其上一级
$root = Split-Path -Parent $PSScriptRoot
$pkg = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$ver = $pkg.version

$exes = Get-ChildItem (Join-Path $root 'dist') -Filter *.exe -ErrorAction SilentlyContinue
if (-not $exes) {
  Write-Host 'dist 下没有 exe，跳过改名'
  exit 0
}

foreach ($exe in $exes) {
  $isSetup = $exe.Name -match 'Setup'
  $kind = if ($isSetup) { 'Setup' } else { 'Portable' }
  $newName = "WhalePet-PetOnly-$kind-$ver.exe"
  Rename-Item $exe.FullName -NewName $newName
  Write-Host "renamed -> $newName"
}
