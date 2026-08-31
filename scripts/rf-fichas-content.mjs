/** Texto plano de fichas RF-002 a RF-006 (insertar en Secc. 9). */
export const rfFichasBlock = `
RF-002 — Gestión de empresas y usuarios
ID: RF-002
Nombre: Gestión de empresas y usuarios
Descripción: Permitir al superadmin crear y administrar empresas (tenants), y al admin de empresa gestionar colaboradores e instructores de su organización, con invitaciones por correo y aislamiento RLS.
Actor: Superadmin, admin_empresa
Prioridad: P1 — Alta
Fuente: SOL-DIP-2026-001 / Matriz maestra Secc. 16
Dependencias: PostgreSQL RLS, SendGrid, RF-001
Responsable funcional: Iron Alexander Fuentes Rodríguez
Estado: Implementado
Precondiciones: Usuario autenticado con rol superadmin o admin_empresa; empresa activa cuando aplique.
Flujo principal: 1) Superadmin crea/edita empresa en /admin. 2) Admin empresa gestiona usuarios en /empresa. 3) Sistema envía invitación SendGrid. 4) RLS aísla datos por tenant.
Flujos alternativos: Invitación fallida → enlace manual de restablecimiento; correo duplicado → mensaje controlado.
Excepciones: Usuario inactivo no puede operar; admin empresa no ve datos de otro tenant.
Resultado esperado: Empresas y usuarios operativos con segregación multiempresa verificable.
Criterios de aceptación (Gherkin): Dado un admin empresa autenticado, cuando crea un colaborador, entonces el usuario queda asociado a su empresa_id y visible solo en su tenant.

RF-003 — Autoría de cursos y evaluaciones
ID: RF-003
Nombre: Autoría de cursos y evaluaciones
Descripción: Permitir al instructor crear cursos con módulos, lecciones, recursos (GCS/Drive) y evaluaciones (import GIFT), y publicarlos para empresas autorizadas.
Actor: Instructor, superadmin
Prioridad: P1 — Alta
Fuente: SOL-DIP-2026-001 / FT-03 backlog Secc. 32
Dependencias: GCS, Google Drive proxy, RF-001, RF-002
Responsable funcional: Iron Alexander Fuentes Rodríguez
Estado: Implementado (contenido multimedia en revisión — CR-004)
Precondiciones: Instructor autenticado; curso asociado a empresa o global según política.
Flujo principal: 1) Instructor crea curso en /instructor/cursos. 2) Agrega módulos y lecciones. 3) Adjunta recursos. 4) Publica curso visible según RLS.
Flujos alternativos: Recurso GCS → URL firmada; recurso Drive → embed/preview.
Excepciones: Curso no publicado no visible para colaboradores; evaluación sin preguntas bloqueada.
Resultado esperado: Catálogo académico creado y publicado por instructor con evaluaciones calificadas en servidor.
Criterios de aceptación (Gherkin): Dado un instructor con curso publicado, cuando un colaborador autorizado accede, entonces ve módulos, lecciones y evaluaciones del curso.

RF-004 — Consumo estudiante e inscripción
ID: RF-004
Nombre: Consumo estudiante e inscripción
Descripción: Permitir al colaborador inscribirse en cursos visibles, consumir la ruta de aprendizaje gamificada, completar lecciones y presentar evaluaciones con registro de progreso.
Actor: Colaborador
Prioridad: P1 — Alta
Fuente: SOL-DIP-2026-001 / RP-001
Dependencias: RF-001, RF-003, registrar_progreso_leccion, RN-03
Responsable funcional: Iron Alexander Fuentes Rodríguez
Estado: Implementado
Precondiciones: Colaborador autenticado; empresa activa; curso publicado visible para su tenant.
Flujo principal: 1) Colaborador accede a /mis-cursos. 2) Se inscribe en curso. 3) Navega roadmap. 4) Completa lecciones. 5) Presenta evaluaciones.
Flujos alternativos: Ya inscrito → mensaje controlado; hero muestra siguiente lección.
Excepciones: Inscripción inválida al marcar progreso → error; max_intentos evaluación respetado en servidor.
Resultado esperado: Progreso persistido y visible en UI y reportes.
Criterios de aceptación (Gherkin): Dado un colaborador inscrito, cuando completa una lección, entonces el progreso se refleja en el roadmap y en base de datos.

RF-005 — Reportes superadmin/empresa
ID: RF-005
Nombre: Reportes superadmin y admin empresa
Descripción: Consultar métricas de avance de colaboradores por empresa (admin empresa) y consolidado multiempresa (superadmin).
Actor: Superadmin, admin_empresa
Prioridad: P2 — Media
Fuente: SOL-DIP-2026-001 / FT-05
Dependencias: RF-004 (progreso), RLS
Responsable funcional: Iron Alexander Fuentes Rodríguez
Estado: Implementado (QA en curso — QA-007)
Precondiciones: Usuario con rol autorizado; datos de progreso registrados.
Flujo principal: 1) Admin accede a panel de reportes. 2) Sistema filtra por tenant. 3) Muestra métricas de avance.
Excepciones: Sin inscripciones → reporte vacío controlado.
Resultado esperado: Reportes coherentes con progreso en BD, sin filtración cross-tenant.
Criterios de aceptación (Gherkin): Dado un admin empresa, cuando consulta reporte, entonces solo ve colaboradores de su empresa.

RF-006 — Asignaciones forzadas
ID: RF-006
Nombre: Asignaciones forzadas de cursos
Descripción: Permitir al admin empresa asignar cursos obligatorios a colaboradores de su tenant (inscripción/asignación administrativa).
Actor: Admin_empresa
Prioridad: P1 — Alta
Fuente: SOL-DIP-2026-001 / BP-03
Dependencias: RF-002, RF-004, RLS backend listo
Responsable funcional: Iron Alexander Fuentes Rodríguez
Estado: Pendiente UI (Sprint 3 — Etapa 3)
Precondiciones: Curso publicado; colaborador activo en tenant.
Flujo principal: 1) Admin empresa selecciona curso y colaborador. 2) Sistema crea asignación/inscripción. 3) Colaborador ve curso en /mis-cursos.
Excepciones: Colaborador de otro tenant → bloqueado por RLS.
Resultado esperado: Cursos obligatorios visibles para colaboradores asignados.
Criterios de aceptación (Gherkin): Dado un admin empresa, cuando asigna curso obligatorio, entonces el colaborador ve el curso en su panel.
`.trim();

export const sec17IniciativasBlock = `
Resultado de priorización ponderada — iniciativas evaluadas (26/08/2026)
Iniciativa | VN (20%) | UX (25%) | Urg (15%) | Viab (15%) | Riesgo (15%) | Esf (10%) | Total ponderado | Prioridad
UI interactiva — roadmap gamificado y hero (CR-002) | 3 | 5 | 4 | 4 | 4 | 4 | 3,60 | P2
Video y contenido educativo — lecciones multimedia (CR-004) | 4 | 5 | 5 | 4 | 4 | 3 | 4,35 | P1
Credenciales por rol — login JWT multiempresa (RF-001 / CR backend) | 5 | 4 | 5 | 5 | 5 | 4 | 4,25 | P1
Nota: escala 1–5 por factor. Total = suma ponderada. Credenciales y contenido son P1 para cierre MVP R1; UI interactiva P2 sin bloquear go-live.
`.trim();

export const anexosGitHubBlock = `
Anexos con enlace GitHub verificado (rama main — https://github.com/haiderbellocun/diplomados):
• README.md — https://github.com/haiderbellocun/diplomados/blob/main/README.md
• CI/CD — https://github.com/haiderbellocun/diplomados/tree/main/.github/workflows
• Migraciones SQL — https://github.com/haiderbellocun/diplomados/tree/main/backend/db/migrations
• Server Actions — https://github.com/haiderbellocun/diplomados/tree/main/backend/src/server/actions
• Proxy Google Drive — https://github.com/haiderbellocun/diplomados/blob/main/frontend/src/app/api/imagenes/google-drive/route.ts

Embebido en este documento Word (sin depender de GitHub):
• Diagramas C4, BPMN y capturas UX insertadas como imágenes en Secc. 6–7, 14–15.

Pendiente — sin enlace GitHub (trabajo o evidencia no cerrada):
• EV-007 Capturas QA localhost — Pendiente (carpeta docs/evidencias/qa/ por crear en repo)
• EV-009 Comparativa Cloud Run vs localhost — Pendiente
• EV-010 Acta UAT — Pendiente (fecha UAT por definir)
• scripts/diagrams/*.png — Pendiente subir a main para enlace público alternativo
• Código documental PMO — Pendiente de asignación
`.trim();
