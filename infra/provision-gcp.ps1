# Aprovisiona la infraestructura de GCP para plataforma-formacion y deja
# lista la integracion con GitHub Actions vía Service Account (JSON key).
#
# Ejecutar una sola vez, autenticado con una cuenta que tenga rol Owner o
# Editor + Security Admin sobre el proyecto:
#
#   gcloud auth login
#   ./infra/provision-gcp.ps1
#
# Al final del script se imprimen los valores que debes cargar como
# Secrets/Variables del repo de GitHub (Settings > Secrets and variables > Actions).

# gcloud escribe mensajes de progreso en stderr; con "Stop", PowerShell los
# trata como NativeCommandError y aborta el script. Usamos Continue y
# validamos $LASTEXITCODE donde el fallo si importa.
$ErrorActionPreference = "Continue"

function Assert-GCloudOk {
  param([string]$Context)
  if ($LASTEXITCODE -ne 0) {
    throw "gcloud falló (exit $LASTEXITCODE): $Context"
  }
}

$PROJECT_ID    = "it-fab-contenido-edu-4"
$REGION        = "us-central1"
$INSTANCE      = "plataforma-formacion-db"
$DB_NAME       = "plataforma_formacion"
$ARTIFACT_REPO = "plataforma-formacion"
$SERVICE       = "plataforma-formacion"
$RUNTIME_SA_NAME = "plataforma-formacion-run"
$DEPLOY_SA_NAME   = "plataforma-formacion-deploy"
$GCS_BUCKET    = "$PROJECT_ID-plataforma-formacion"
$KEY_FILE      = Join-Path $PSScriptRoot "github-actions-sa-key.json"

$RUNTIME_SA = "$RUNTIME_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
$DEPLOY_SA  = "$DEPLOY_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud config set project $PROJECT_ID
Assert-GCloudOk "config set project"

Write-Output "== 1. Habilitando APIs =="
gcloud services enable `
  sqladmin.googleapis.com `
  run.googleapis.com `
  secretmanager.googleapis.com `
  artifactregistry.googleapis.com `
  storage.googleapis.com `
  iam.googleapis.com
Assert-GCloudOk "services enable"

Write-Output "== 2. Artifact Registry =="
gcloud artifacts repositories create $ARTIFACT_REPO `
  --repository-format=docker --location=$REGION `
  --description="Imagenes de plataforma-formacion"
# Ignore "already exists"

Write-Output "== 3. Cloud SQL (esto tarda varios minutos) =="
# ENTERPRISE (no ENTERPRISE_PLUS): db-f1-micro solo es válido en edición Enterprise.
gcloud sql instances create $INSTANCE `
  --database-version=POSTGRES_16 `
  --edition=ENTERPRISE `
  --region=$REGION `
  --tier=db-f1-micro `
  --storage-auto-increase
# Ignore "already exists"

gcloud sql databases create $DB_NAME --instance=$INSTANCE
# Ignore "already exists"

$PG_PASSWORD = [System.Convert]::ToBase64String([byte[]](1..24 | ForEach-Object { Get-Random -Maximum 256 }))
gcloud sql users set-password postgres --instance=$INSTANCE --password="$PG_PASSWORD"
Assert-GCloudOk "sql users set-password postgres"

# Password para el rol app_user (lo crea la migracion 005_app_role_and_grants.sql;
# el rol todavia no existe en este punto). Se guarda ya en Secret Manager para que
# el workflow de deploy funcione desde el primer push; falta solo asignarselo al
# rol una vez migrado (ver instrucciones al final del script).
$APP_USER_PASSWORD = [System.Convert]::ToBase64String([byte[]](1..24 | ForEach-Object { Get-Random -Maximum 256 }))

Write-Output "== 4. Bucket de Cloud Storage =="
gcloud storage buckets create "gs://$GCS_BUCKET" --location=$REGION --uniform-bucket-level-access
# Ignore "already exists"

Write-Output "== 5. Service account de runtime (Cloud Run) =="
gcloud iam service-accounts create $RUNTIME_SA_NAME --display-name="Plataforma Formacion (Cloud Run)"
# Ignore "already exists"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$RUNTIME_SA" --role="roles/cloudsql.client" --condition=None | Out-Null
Assert-GCloudOk "iam cloudsql.client"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$RUNTIME_SA" --role="roles/secretmanager.secretAccessor" --condition=None | Out-Null
Assert-GCloudOk "iam secretmanager.secretAccessor"
gcloud storage buckets add-iam-policy-binding "gs://$GCS_BUCKET" --member="serviceAccount:$RUNTIME_SA" --role="roles/storage.objectAdmin" | Out-Null
Assert-GCloudOk "iam storage.objectAdmin"

Write-Output "== 6. Secretos en Secret Manager =="
$JWT_SECRET = [System.Convert]::ToBase64String([byte[]](1..48 | ForEach-Object { Get-Random -Maximum 256 }))

$APP_USER_PASSWORD | gcloud secrets create db-password --data-file=-
if ($LASTEXITCODE -ne 0) {
  $APP_USER_PASSWORD | gcloud secrets versions add db-password --data-file=-
  Assert-GCloudOk "secrets versions add db-password"
}

$JWT_SECRET | gcloud secrets create jwt-secret --data-file=-
if ($LASTEXITCODE -ne 0) {
  $JWT_SECRET | gcloud secrets versions add jwt-secret --data-file=-
  Assert-GCloudOk "secrets versions add jwt-secret"
}

# Placeholder: reemplaza este valor con tu API key real de SendGrid.
"CAMBIAR_POR_TU_SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key --data-file=-
# Ignore "already exists"

Write-Output "== 7. Service account de deploy (GitHub Actions) =="
gcloud iam service-accounts create $DEPLOY_SA_NAME --display-name="GitHub Actions (deploy plataforma-formacion)"
# Ignore "already exists"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA" --role="roles/run.admin" --condition=None | Out-Null
Assert-GCloudOk "iam run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA" --role="roles/artifactregistry.writer" --condition=None | Out-Null
Assert-GCloudOk "iam artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA" --role="roles/secretmanager.secretAccessor" --condition=None | Out-Null
Assert-GCloudOk "iam secretmanager.secretAccessor (deploy)"
gcloud iam service-accounts add-iam-policy-binding $RUNTIME_SA --member="serviceAccount:$DEPLOY_SA" --role="roles/iam.serviceAccountUser" | Out-Null
Assert-GCloudOk "iam serviceAccountUser"

Write-Output "== 8. Generando JSON key de la SA de deploy =="
if (Test-Path $KEY_FILE) { Remove-Item $KEY_FILE -Force }
gcloud iam service-accounts keys create $KEY_FILE --iam-account=$DEPLOY_SA
Assert-GCloudOk "service-accounts keys create"

Write-Output ""
Write-Output "===================================================================="
Write-Output "Aprovisionamiento listo. Carga esto en GitHub (Settings > Secrets and"
Write-Output "variables > Actions):"
Write-Output ""
Write-Output "Secrets:"
Write-Output "  GCP_SA_KEY = (pega el contenido completo de $KEY_FILE)"
Write-Output ""
Write-Output "Variables:"
Write-Output "  RUNTIME_SERVICE_ACCOUNT = $RUNTIME_SA"
Write-Output "  INSTANCE_CONNECTION_NAME = ${PROJECT_ID}:${REGION}:${INSTANCE}"
Write-Output "  GCS_BUCKET = $GCS_BUCKET"
Write-Output "  DB_NAME = $DB_NAME"
Write-Output "  NEXT_PUBLIC_SITE_URL = (la URL de Cloud Run, se conoce tras el primer deploy)"
Write-Output ""
Write-Output "IMPORTANTE: tras cargar GCP_SA_KEY en GitHub, BORRA el archivo local:"
Write-Output "  Remove-Item '$KEY_FILE'"
Write-Output ""
Write-Output "Password del rol 'postgres' (guardalo en un gestor de secretos, lo necesitas"
Write-Output "para correr 'npm run db:migrate' contra Cloud SQL vía MIGRATIONS_DATABASE_URL):"
Write-Output "  $PG_PASSWORD"
Write-Output ""
Write-Output "Pendiente manual:"
Write-Output "  1. gcloud secrets versions add sendgrid-api-key --data-file=- (con tu API key real)"
Write-Output "  2. Aplicar migraciones (ver seccion 4 del README) para crear el rol app_user"
Write-Output "  3. Asignarle al rol app_user el password que ya quedo guardado en Secret Manager:"
Write-Output "     gcloud sql users set-password app_user --instance=$INSTANCE --password='$APP_USER_PASSWORD'"
Write-Output "===================================================================="
