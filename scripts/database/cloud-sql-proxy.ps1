# Cloud SQL Auth Proxy para migraciones manuales (Windows).
# Instancia: gen-lang-client-0049269139:us-central1:diplomados
# Puerto local dedicado (no choca con Docker en 5433): 5434
#
# No descarga el binario. Si no está en PATH, muestra cómo instalarlo.

$ErrorActionPreference = "Stop"

$InstanceConnectionName = "gen-lang-client-0049269139:us-central1:diplomados"
$Port = 5434

function Find-CloudSqlProxy {
    $v2 = Get-Command "cloud-sql-proxy" -ErrorAction SilentlyContinue
    if ($v2) {
        return [pscustomobject]@{ Path = $v2.Source; Flavor = "v2" }
    }

    $v1 = Get-Command "cloud_sql_proxy" -ErrorAction SilentlyContinue
    if ($v1) {
        return [pscustomobject]@{ Path = $v1.Source; Flavor = "v1" }
    }

    $candidates = @(
        (Join-Path $env:USERPROFILE "cloud-sql-proxy.exe"),
        (Join-Path $env:USERPROFILE "cloud_sql_proxy.exe"),
        (Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\cloud-sql-proxy.exe"),
        "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\cloud-sql-proxy.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            $flavor = if ([System.IO.Path]::GetFileNameWithoutExtension($candidate) -eq "cloud_sql_proxy") {
                "v1"
            } else {
                "v2"
            }
            return [pscustomobject]@{ Path = $candidate; Flavor = $flavor }
        }
    }

    return $null
}

$found = Find-CloudSqlProxy
if (-not $found) {
    Write-Host "No se encontró Cloud SQL Auth Proxy en PATH ni en ubicaciones habituales."
    Write-Host "Este script no descarga ni instala herramientas."
    Write-Host ""
    Write-Host "Instálalo y vuelve a ejecutar este archivo:"
    Write-Host "  https://cloud.google.com/sql/docs/postgres/connect-auth-proxy"
    Write-Host ""
    Write-Host "Con Google Cloud SDK (si ya tienes gcloud):"
    Write-Host "  gcloud components install cloud-sql-proxy"
    Write-Host ""
    Write-Host "Después autentica ADC si hace falta:"
    Write-Host "  gcloud auth application-default login"
    Write-Host ""
    Write-Host "El comando esperado (v2) es:"
    Write-Host "  cloud-sql-proxy $InstanceConnectionName --port $Port"
    exit 1
}

Write-Host "Usando: $($found.Path) ($($found.Flavor))"
Write-Host "Instancia: $InstanceConnectionName"
Write-Host "Escuchando en 127.0.0.1:$Port"
Write-Host "Deja esta ventana abierta. En otra terminal: npm run db:check:production"
Write-Host ""

if ($found.Flavor -eq "v1") {
    & $found.Path "-instances=${InstanceConnectionName}=tcp:${Port}"
} else {
    & $found.Path $InstanceConnectionName --port $Port
}
