# Diligencia la plantilla de requerimientos del proyecto Diplomados.
param(
  [string]$Source = "c:\Users\juan_hermida\Downloads\Diplomados Plantilla_Maestra_Requerimientos.docx",
  [string]$Output = "c:\Users\juan_hermida\Downloads\Diplomados_Requerimientos_Diligenciado.docx",
  [string]$ContentFile = "$PSScriptRoot\requerimientos-content.json"
)

$ErrorActionPreference = "Stop"
$content = Get-Content -Raw -Encoding UTF8 $ContentFile | ConvertFrom-Json

function Replace-AllText {
  param($Document, [string]$FindText, [string]$ReplaceText)
  $find = $Document.Content.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $find.Text = $FindText
  $find.Replacement.Text = $ReplaceText
  $find.Forward = $true
  $find.Wrap = 1
  $find.Format = $false
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $null = $find.Execute(
    [ref]$FindText, [ref]$false, [ref]$false, [ref]$false, [ref]$false, [ref]$false,
    [ref]$true, [ref]1, [ref]$false, [ref]$ReplaceText, [ref]2
  )
}

function Replace-NextPlaceholder {
  param($Document, [string]$ReplaceText)
  Replace-AllText -Document $Document -FindText "[Diligenciar]" -ReplaceText $ReplaceText
}

function Set-TableValueAfterLabel {
  param($Document, [string]$Label, [string]$Value)
  foreach ($table in @($Document.Tables)) {
    for ($r = 1; $r -le $table.Rows.Count; $r++) {
      for ($c = 1; $c -le $table.Rows.Item($r).Cells.Count; $c++) {
        $cellText = $table.Cell($r, $c).Range.Text.Trim()
        if ($cellText -eq $Label -and $c -lt $table.Rows.Item($r).Cells.Count) {
          $table.Cell($r, ($c + 1)).Range.Text = $Value
          return $true
        }
      }
    }
  }
  return $false
}

function Fill-TableRows {
  param($Document, [string]$HeaderCell1, [string[][]]$Rows)
  foreach ($table in @($Document.Tables)) {
    if ($table.Cell(1, 1).Range.Text.Trim() -ne $HeaderCell1) { continue }
    for ($i = 0; $i -lt $Rows.Count; $i++) {
      $row = $i + 2
      if ($row -gt $table.Rows.Count) { break }
      for ($c = 0; $c -lt $Rows[$i].Count; $c++) {
        $table.Cell($row, ($c + 1)).Range.Text = $Rows[$i][$c]
      }
    }
    return
  }
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  $doc = $word.Documents.Open($Source)

  foreach ($prop in $content.labels.PSObject.Properties) {
    Set-TableValueAfterLabel -Document $doc -Label $prop.Name -Value ([string]$prop.Value) | Out-Null
  }

  foreach ($table in @($doc.Tables)) {
    if ($table.Rows.Count -ge 2 -and $table.Cell(2, 1).Range.Text.Trim() -eq "1.0") {
      $table.Cell(2, 3).Range.Text = "Documento completo"
      $table.Cell(2, 4).Range.Text = "Elaboracion inicial del documento de requerimientos con base en el repositorio del proyecto Diplomados."
      $table.Cell(2, 5).Range.Text = "Iron Alexander Fuentes Rodriguez"
      $table.Cell(2, 6).Range.Text = "Pendiente"
      break
    }
  }

  @(
    "Requerimientos funcionales", "Requerimientos no funcionales", "UX/UI", "Arquitectura",
    "Base de datos", "Integraciones", "Seguridad", "DevOps", "QA", "UAT",
    "Migración de datos", "Hypercare", "Roadmap", "RAID / Riesgos"
  ) | ForEach-Object {
    Replace-AllText -Document $doc -FindText "$($_)`r`t☐`r`t☐" -ReplaceText "$($_)`r`t☑`r`t☐"
  }

  foreach ($text in @($content.placeholders)) {
    Replace-NextPlaceholder -Document $doc -ReplaceText $text
  }

  Replace-AllText -Document $doc -FindText "RF-[XXX] — [Nombre del requerimiento]" -ReplaceText "RF-001 — Autenticacion y gestion de sesion por rol"
  Replace-AllText -Document $doc -FindText "RP-[XXX]" -ReplaceText "RP-001"
  Replace-AllText -Document $doc -FindText "CR-[XXX] Solicitud de cambio" -ReplaceText "CR-001 Solicitud de cambio"

  Fill-TableRows -Document $doc -HeaderCell1 "Stakeholder" -Rows @(
    @("Iron Alexander Fuentes Rodriguez", "Fabrica de Contenido", "Product Owner", "Alta", "Alta", "Definicion funcional y priorizacion"),
    @("Raul Valencia Cifuentes", "Fabrica de Contenido", "Product Owner", "Alta", "Media", "Validacion academica/contenido"),
    @("Alberto Mario Valencia Zableh", "Fabrica de Contenido", "Product Owner", "Alta", "Media", "Validacion academica/contenido"),
    @("Johan Sebastian Daza Sarmiento", "Operaciones", "Project Manager", "Alta", "Alta", "Gestion, cronograma y gobierno"),
    @("Haider Yessid Bello Melo", "Operaciones / TI", "Lider de desarrollo", "Alta", "Alta", "Arquitectura, desarrollo y despliegue"),
    @("Colaboradores de empresas clientes", "Empresas aliadas", "Usuario final", "Alta", "Baja", "Consumo de cursos"),
    @("Administradores de empresa", "Empresas aliadas", "Admin tenant", "Alta", "Media", "Gestion de colaboradores y reportes")
  )

  foreach ($table in @($doc.Tables)) {
    if ($table.Cell(1, 1).Range.Text.Trim() -eq "ID" -and $table.Cell(1, 2).Range.Text -like "*Regla*") {
      $reglas = @(
        @("RN-01", "Superadmin no tiene empresa_id; demas roles requieren empresa activa.", "Politica RLS", "Superadmin", "N/A", "Vigente"),
        @("RN-02", "Curso con empresa_id nulo es global; con valor es privado del tenant.", "Modelo catalogo", "Instructor", "N/A", "Vigente"),
        @("RN-03", "Colaborador puede auto-inscribirse en cursos publicados visibles.", "Inscripcion libre", "Colaborador", "Asignacion forzada", "Vigente"),
        @("RN-04", "Solo autor o superadmin puede editar un curso.", "Autorizacion curso", "Instructor", "N/A", "Vigente"),
        @("RN-05", "Progreso de inscripcion se recalcula al completar lecciones.", "Progreso SQL", "Sistema", "Marcado manual", "Vigente"),
        @("RN-06", "Evaluaciones respetan max_intentos y califican en servidor.", "Evaluaciones", "Colaborador", "N/A", "Vigente"),
        @("RN-07", "No hay auto-registro; usuarios se crean por administradores.", "Auth", "Admin", "N/A", "Vigente")
      )
      for ($i = 0; $i -lt $reglas.Count; $i++) {
        $row = $i + 2
        if ($row -gt $table.Rows.Count) { break }
        for ($c = 0; $c -lt 6; $c++) { $table.Cell($row, ($c + 1)).Range.Text = $reglas[$i][$c] }
      }
      break
    }
  }

  foreach ($table in @($doc.Tables)) {
    if ($table.Cell(1, 2).Range.Text.Trim() -eq "Categoría" -or $table.Cell(1, 2).Range.Text.Trim() -eq "Categoria") {
      $rnf = @(
        @("RNF-01", "Seguridad", "Aislamiento multiempresa con RLS y JWT httpOnly", "Acceso cruzado bloqueado en QA", "P1"),
        @("RNF-02", "Disponibilidad", "Servicio en Cloud Run con CI/CD", "Deploy exitoso post-merge a main", "P1"),
        @("RNF-03", "Rendimiento", "Middleware valida JWT sin consulta BD", "Navegacion fluida en paneles", "P2"),
        @("RNF-04", "Integridad de datos", "Mutaciones con validacion Zod", "Datos invalidos rechazados", "P1"),
        @("RNF-05", "Usabilidad", "UI responsive identidad CUN y modo oscuro", "Validacion UX pantallas principales", "P2"),
        @("RNF-06", "Auditoria", "Registro en historial_actividad", "Eventos criticos persistidos", "P2"),
        @("RNF-07", "Recuperacion", "Migraciones versionadas SQL", "Rollback documentado por release", "P2")
      )
      for ($i = 0; $i -lt $rnf.Count; $i++) {
        $row = $i + 2
        if ($row -gt $table.Rows.Count) { break }
        for ($c = 0; $c -lt 5; $c++) { $table.Cell($row, ($c + 1)).Range.Text = $rnf[$i][$c] }
      }
      break
    }
  }

  foreach ($table in @($doc.Tables)) {
    if ($table.Cell(1, 3).Range.Text.Trim() -eq "Tipo" -and $table.Cell(1, 1).Range.Text.Trim() -eq "ID") {
      $matriz = @(
        @("RF-001", "Autenticacion y sesion por rol", "Funcional", "P1", "Haider Y. Bello", "Implementado", "1.0", "Etapa 2", "R1"),
        @("RF-002", "Gestion de empresas y usuarios", "Funcional", "P1", "Haider Y. Bello", "Implementado", "1.0", "Etapa 2-3", "R1"),
        @("RF-003", "Autoria de cursos y evaluaciones", "Funcional", "P1", "Haider Y. Bello", "Implementado", "1.0", "Etapa 2-3", "R1"),
        @("RF-004", "Consumo estudiante e inscripcion", "Funcional", "P1", "Haider Y. Bello", "Implementado", "1.0", "Etapa 2-3", "R1"),
        @("RF-005", "Reportes superadmin/empresa", "Funcional", "P2", "Haider Y. Bello", "Implementado", "1.0", "Etapa 3", "R1"),
        @("RF-006", "Asignaciones forzadas", "Funcional", "P1", "Haider Y. Bello", "Pendiente UI", "1.0", "Etapa 3", "R2"),
        @("RF-007", "Certificados de diplomado", "Funcional", "P1", "Por definir", "No iniciado", "1.0", "Fase 2", "R2"),
        @("RNF-01", "Seguridad RLS/JWT", "No funcional", "P1", "Haider Y. Bello", "Implementado", "1.0", "Etapa 2", "R1")
      )
      for ($i = 0; $i -lt $matriz.Count; $i++) {
        $row = $i + 2
        if ($row -gt $table.Rows.Count) { break }
        for ($c = 0; $c -lt 9; $c++) { $table.Cell($row, ($c + 1)).Range.Text = $matriz[$i][$c] }
      }
      break
    }
  }

  foreach ($table in @($doc.Tables)) {
    if ($table.Cell(1, 1).Range.Text.Trim() -eq "Release ID") {
      $table.Cell(2, 1).Range.Text = "R1"
      $table.Cell(2, 2).Range.Text = "1.0"
      $table.Cell(2, 3).Range.Text = "Q4 2026"
      $table.Cell(2, 4).Range.Text = "Produccion Cloud Run"
      $table.Cell(2, 5).Range.Text = "Frontend + Backend monorepo"
      $table.Cell(2, 6).Range.Text = "RF-001 a RF-005, RNF-01"
      $table.Cell(2, 7).Range.Text = "Haider Y. Bello"
      $table.Cell(2, 8).Range.Text = "Medio"
      break
    }
  }

  foreach ($table in @($doc.Tables)) {
    if ($table.Cell(1, 2).Range.Text.Trim() -eq "Pendiente") {
      $items = @(
        @("BP-01", "Certificados PDF al completar diplomado", "Fuera de MVP actual", "P1", "Por definir", "Fase 2"),
        @("BP-02", "Pasarela de pagos", "No implementado", "P1", "Por definir", "Fase 2"),
        @("BP-03", "UI asignaciones forzadas", "RLS listo, UI placeholder", "P1", "Haider Y. Bello", "Etapa 3"),
        @("BP-04", "Integracion Moodle operativa", "Solo import GIFT", "P2", "Por definir", "Fase 3")
      )
      for ($i = 0; $i -lt $items.Count; $i++) {
        $row = $i + 2
        if ($row -gt $table.Rows.Count) { break }
        for ($c = 0; $c -lt 6; $c++) { $table.Cell($row, ($c + 1)).Range.Text = $items[$i][$c] }
      }
      break
    }
  }

  if (Test-Path $Output) { Remove-Item $Output -Force }
  $doc.SaveAs([ref]$Output)
  $doc.Close()
  Write-Output "Documento generado: $Output"
}
finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}
