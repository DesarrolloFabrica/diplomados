// Esquema Drizzle para queries tipadas. La fuente de verdad del DDL real
// (constraints, RLS, triggers, funciones) son los archivos en db/migrations/;
// este archivo solo describe la forma de las tablas para el query builder.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  bigint,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const rolUsuario = pgEnum("rol_usuario", [
  "superadmin",
  "admin_empresa",
  "instructor",
  "colaborador",
]);

export const estadoEmpresa = pgEnum("estado_empresa", ["activa", "inactiva"]);
export const estadoCurso = pgEnum("estado_curso", ["borrador", "publicado", "archivado"]);
export const nivelDificultad = pgEnum("nivel_dificultad", ["basico", "intermedio", "avanzado"]);
export const tipoNavegacion = pgEnum("tipo_navegacion", ["obligatoria", "libre"]);
export const escuelaVisual = pgEnum("escuela_visual", [
  "sociales",
  "diseno",
  "ingenieria",
  "salud",
  "empresarial",
  "neutral",
]);
export const tipoLeccion = pgEnum("tipo_leccion", ["texto", "video", "archivo", "mixto"]);
export const tipoMarcado = pgEnum("tipo_marcado", ["automatico", "manual"]);
export const tipoRecurso = pgEnum("tipo_recurso", [
  "pdf",
  "video",
  "audio",
  "imagen",
  "presentacion",
  "enlace",
  "archivo",
]);
export const tipoPregunta = pgEnum("tipo_pregunta", [
  "seleccion_unica",
  "seleccion_multiple",
  "verdadero_falso",
  "respuesta_corta",
]);
export const visibilidadResultados = pgEnum("visibilidad_resultados", [
  "inmediato",
  "al_cerrar",
  "nunca",
]);
export const estadoInscripcion = pgEnum("estado_inscripcion", [
  "no_iniciado",
  "en_progreso",
  "pendiente_evaluacion",
  "aprobado",
  "no_aprobado",
  "finalizado",
]);
export const estadoIntento = pgEnum("estado_intento", ["en_curso", "finalizado", "expirado"]);

export type TipoRecurso = (typeof tipoRecurso.enumValues)[number];

// ── Identidad y multiempresa ──────────────────────────────────

export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  nit: text("nit").unique(),
  logoUrl: text("logo_url"),
  estado: estadoEmpresa("estado").notNull().default("activa"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  rol: rolUsuario("rol").notNull().default("colaborador"),
  nombreCompleto: text("nombre_completo").notNull(),
  cargo: text("cargo"),
  area: text("area"),
  avatarUrl: text("avatar_url"),
  activo: boolean("activo").notNull().default(true),
  ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Catálogo de contenido ─────────────────────────────────────

export const categorias = pgTable("categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const cursos = pgTable("cursos", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: text("titulo").notNull(),
  slug: text("slug").notNull().unique(),
  descripcion: text("descripcion"),
  objetivo: text("objetivo"),
  imagenPortadaUrl: text("imagen_portada_url"),
  duracionEstimadaMin: integer("duracion_estimada_min"),
  nivelDificultad: nivelDificultad("nivel_dificultad").notNull().default("basico"),
  categoriaId: uuid("categoria_id").references(() => categorias.id),
  estado: estadoCurso("estado").notNull().default("borrador"),
  autorId: uuid("autor_id").references(() => profiles.id),
  porcentajeAprobacion: numeric("porcentaje_aprobacion", { precision: 5, scale: 2 })
    .notNull()
    .default("70"),
  maxIntentos: integer("max_intentos").notNull().default(3),
  navegacion: tipoNavegacion("navegacion").notNull().default("libre"),
  esDiplomado: boolean("es_diplomado").notNull().default(false),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  escuela: escuelaVisual("escuela").notNull().default("neutral"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const modulos = pgTable("modulos", {
  id: uuid("id").primaryKey().defaultRandom(),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => cursos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const unidades = pgTable("unidades", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduloId: uuid("modulo_id")
    .notNull()
    .references(() => modulos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const lecciones = pgTable("lecciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  unidadId: uuid("unidad_id")
    .notNull()
    .references(() => unidades.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  tipoContenido: tipoLeccion("tipo_contenido").notNull().default("texto"),
  contenido: jsonb("contenido").notNull().default({}),
  orden: integer("orden").notNull().default(0),
  esObligatoria: boolean("es_obligatoria").notNull().default(true),
  marcado: tipoMarcado("marcado").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const recursos = pgTable("recursos", {
  id: uuid("id").primaryKey().defaultRandom(),
  leccionId: uuid("leccion_id")
    .notNull()
    .references(() => lecciones.id, { onDelete: "cascade" }),
  tipo: tipoRecurso("tipo").notNull(),
  nombre: text("nombre").notNull(),
  storagePath: text("storage_path"),
  urlExterna: text("url_externa"),
  tamanoBytes: bigint("tamano_bytes", { mode: "number" }),
  obligatorio: boolean("obligatorio").notNull().default(false),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ── Evaluaciones ───────────────────────────────────────────────

export const evaluaciones = pgTable("evaluaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => cursos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  tiempoLimiteMin: integer("tiempo_limite_min"),
  maxIntentos: integer("max_intentos").notNull().default(3),
  puntajeMinimo: numeric("puntaje_minimo", { precision: 5, scale: 2 }).notNull().default("70"),
  preguntasAleatorias: boolean("preguntas_aleatorias").notNull().default(false),
  numPreguntasMostrar: integer("num_preguntas_mostrar"),
  mostrarResultados: visibilidadResultados("mostrar_resultados").notNull().default("al_cerrar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const preguntas = pgTable("preguntas", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluacionId: uuid("evaluacion_id")
    .notNull()
    .references(() => evaluaciones.id, { onDelete: "cascade" }),
  tipo: tipoPregunta("tipo").notNull(),
  enunciado: text("enunciado").notNull(),
  puntaje: numeric("puntaje", { precision: 6, scale: 2 }).notNull().default("1"),
  retroalimentacion: text("retroalimentacion"),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const opcionesRespuesta = pgTable("opciones_respuesta", {
  id: uuid("id").primaryKey().defaultRandom(),
  preguntaId: uuid("pregunta_id")
    .notNull()
    .references(() => preguntas.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  esCorrecta: boolean("es_correcta").notNull().default(false),
  retroalimentacion: text("retroalimentacion"),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Asignación, progreso y auditoría ───────────────────────────

export const inscripciones = pgTable(
  "inscripciones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    cursoId: uuid("curso_id")
      .notNull()
      .references(() => cursos.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    asignadoPor: uuid("asignado_por").references(() => profiles.id),
    fechaAsignacion: timestamp("fecha_asignacion", { withTimezone: true }).notNull().defaultNow(),
    fechaLimite: timestamp("fecha_limite", { withTimezone: true }),
    estado: estadoInscripcion("estado").notNull().default("no_iniciado"),
    porcentajeAvance: numeric("porcentaje_avance", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    ultimaLeccionId: uuid("ultima_leccion_id").references(() => lecciones.id),
    calificacionFinal: numeric("calificacion_final", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [unique("uq_inscripcion").on(t.cursoId, t.profileId)],
);

export const progresoLecciones = pgTable(
  "progreso_lecciones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inscripcionId: uuid("inscripcion_id")
      .notNull()
      .references(() => inscripciones.id, { onDelete: "cascade" }),
    leccionId: uuid("leccion_id")
      .notNull()
      .references(() => lecciones.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    completada: boolean("completada").notNull().default(false),
    fechaCompletado: timestamp("fecha_completado", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_progreso").on(t.inscripcionId, t.leccionId)],
);

export const intentosEvaluacion = pgTable(
  "intentos_evaluacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evaluacionId: uuid("evaluacion_id")
      .notNull()
      .references(() => evaluaciones.id, { onDelete: "cascade" }),
    inscripcionId: uuid("inscripcion_id")
      .notNull()
      .references(() => inscripciones.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    numeroIntento: integer("numero_intento").notNull().default(1),
    iniciadoEn: timestamp("iniciado_en", { withTimezone: true }).notNull().defaultNow(),
    finalizadoEn: timestamp("finalizado_en", { withTimezone: true }),
    puntaje: numeric("puntaje", { precision: 5, scale: 2 }),
    aprobado: boolean("aprobado"),
    estado: estadoIntento("estado").notNull().default("en_curso"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_intento").on(t.evaluacionId, t.profileId, t.numeroIntento)],
);

export const respuestasParticipante = pgTable("respuestas_participante", {
  id: uuid("id").primaryKey().defaultRandom(),
  intentoId: uuid("intento_id")
    .notNull()
    .references(() => intentosEvaluacion.id, { onDelete: "cascade" }),
  preguntaId: uuid("pregunta_id")
    .notNull()
    .references(() => preguntas.id, { onDelete: "cascade" }),
  opcionId: uuid("opcion_id").references(() => opcionesRespuesta.id),
  textoRespuesta: text("texto_respuesta"),
  esCorrecta: boolean("es_correcta"),
  puntajeObtenido: numeric("puntaje_obtenido", { precision: 6, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const historialActividad = pgTable("historial_actividad", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  accion: text("accion").notNull(),
  entidad: text("entidad"),
  entidadId: uuid("entidad_id"),
  detalle: jsonb("detalle").notNull().default({}),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
