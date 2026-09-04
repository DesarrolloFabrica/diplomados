# Seeds de datos maestros (no dumps de la base local)

Este directorio **no** sirve para copiar usuarios, cursos, progreso ni
contraseñas de desarrollo a Cloud SQL.

Úsalo solo para datos configurables que deban existir igual en todos los
entornos (catálogos, tipos, filas semilla). Cada archivo debe ser:

- idempotente (`INSERT ... ON CONFLICT ... DO UPDATE` o equivalente),
- revisable en un PR,
- ejecutado a propósito.

Numeración sugerida: `001_descripcion.sql`, `002_...`.

Registro: tabla `public._seeds` (independiente de `public._migrations`).

```bash
# Local (MIGRATIONS_DATABASE_URL → localhost:5433)
npm run db:seed

# Producción (PRODUCTION_MIGRATIONS_DATABASE_URL → 127.0.0.1:5434 + proxy)
npm run db:seed:production
```

Hoy las escuelas visuales no van aquí: son el enum `escuela_visual` de la
migración `012_escuela_visual.sql`.
