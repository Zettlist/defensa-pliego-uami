# Publica un data.json nuevo.
# Uso:  .\actualizar.ps1 "C:\Users\laura\Downloads\data.json"
param([Parameter(Mandatory = $true)][string]$Ruta)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path $Ruta)) { throw "No encuentro $Ruta" }
Copy-Item $Ruta "public\data.json" -Force

npm run check
if ($LASTEXITCODE -ne 0) { throw "data.json tiene errores; no se publicó nada." }

$fecha = (Get-Content "public\data.json" -Raw -Encoding UTF8 | ConvertFrom-Json).fecha
git add public/data.json
git commit -m "Actualiza data.json ($fecha)"
git push
Write-Host "Listo. GitHub publica la nueva versión en 1-2 minutos en la misma liga."
