

$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Este script necesita ejecutarse como Administrador. Abri PowerShell como admin y volve a correrlo." -ForegroundColor Red
    exit 1
}


$PgPassword = "postgres"
$PgPort     = 5432
$DbName     = "cooperativa_polizas"


Write-Host "`n== Instalando PostgreSQL 16 ==" -ForegroundColor Cyan
winget install --id PostgreSQL.PostgreSQL.16 -e --silent `
  --accept-package-agreements --accept-source-agreements `
  --override "--mode unattended --unattendedmodeui minimal --superpassword $PgPassword --serverport $PgPort --enable-components server,commandlinetools"


$pgRoot = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
          Sort-Object Name -Descending | Select-Object -First 1
if (-not $pgRoot) { throw "No se encontro la carpeta de instalacion de PostgreSQL. Revisa que el paso anterior haya terminado bien." }
$pgBinPath = Join-Path $pgRoot.FullName "bin"
if ($env:Path -notlike "*$pgBinPath*") {
    [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "Machine") + ";$pgBinPath", "Machine")
    $env:Path += ";$pgBinPath"
}


Write-Host "`n== Creando base '$DbName' ==" -ForegroundColor Cyan
$env:PGPASSWORD = $PgPassword
$exists = & "$pgBinPath\psql.exe" -U postgres -h localhost -p $PgPort -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'"
if ($exists -ne "1") {
    & "$pgBinPath\psql.exe" -U postgres -h localhost -p $PgPort -c "CREATE DATABASE $DbName;"
    Write-Host "Base '$DbName' creada." -ForegroundColor Green
} else {
    Write-Host "La base '$DbName' ya existia, no se toca." -ForegroundColor Yellow
}


Write-Host "`n================ LISTO ================" -ForegroundColor Green
Write-Host "PostgreSQL -> localhost:$PgPort  (usuario: postgres / password: $PgPassword)  base: $DbName"
Write-Host "`nback/.env ya deberia apuntar a:"
Write-Host "  DB_HOST=localhost"
Write-Host "  DB_PORT=$PgPort"
Write-Host "  DB_NAME=$DbName"
Write-Host "  DB_USER=postgres"
Write-Host "  DB_PASSWORD=$PgPassword"
Write-Host "`nDespues corre 'npm run dev' dentro de back/ (Sequelize crea las tablas solo la primera vez)"
Write-Host "y 'npm run seed' para cargar clientes y polizas de prueba."
Write-Host "Verificar: psql -U postgres -h localhost -p $PgPort -d $DbName -c `"\dt`""
