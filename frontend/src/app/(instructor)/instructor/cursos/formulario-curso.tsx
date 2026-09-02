"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ESCUELA_VISUAL_DEFAULT,
  ESCUELAS_VISUALES,
  ETIQUETAS_ESCUELA_VISUAL,
} from "@backend/config/escuelas";
import { cursoSchema, type CursoInput } from "@backend/lib/validators/cursos";
import { crearCurso, actualizarCurso } from "@backend/server/actions/cursos";
import type { CursoDetalle } from "@backend/server/queries/cursos";
import type { EmpresaOpcion } from "@backend/server/queries/empresas";

interface FormularioCursoProps {
  curso?: CursoDetalle;
  empresas: EmpresaOpcion[];
  onExito: (cursoId: string) => void;
}

export function FormularioCurso({ curso, empresas, onExito }: FormularioCursoProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CursoInput>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      titulo: curso?.titulo ?? "",
      descripcion: curso?.descripcion ?? "",
      objetivo: curso?.objetivo ?? "",
      imagenPortadaUrl: curso?.imagenPortadaUrl ?? "",
      duracionEstimadaMin: curso?.duracionEstimadaMin ?? undefined,
      nivelDificultad: curso?.nivelDificultad ?? "basico",
      porcentajeAprobacion: curso ? Number(curso.porcentajeAprobacion) : 70,
      maxIntentos: curso?.maxIntentos ?? 3,
      navegacion: curso?.navegacion ?? "libre",
      esDiplomado: curso?.esDiplomado ?? false,
      escuela: curso?.escuela ?? ESCUELA_VISUAL_DEFAULT,
      empresaId: curso?.empresaId ?? "",
    },
  });

  const onSubmit = (values: CursoInput) => {
    const datos = new FormData();
    datos.set("titulo", values.titulo);
    if (values.descripcion) datos.set("descripcion", values.descripcion);
    if (values.objetivo) datos.set("objetivo", values.objetivo);
    if (values.imagenPortadaUrl) datos.set("imagenPortadaUrl", values.imagenPortadaUrl);
    if (values.duracionEstimadaMin !== undefined) {
      datos.set("duracionEstimadaMin", String(values.duracionEstimadaMin));
    }
    datos.set("nivelDificultad", values.nivelDificultad);
    datos.set("porcentajeAprobacion", String(values.porcentajeAprobacion));
    datos.set("maxIntentos", String(values.maxIntentos));
    datos.set("navegacion", values.navegacion);
    datos.set("esDiplomado", values.esDiplomado ? "true" : "false");
    datos.set("escuela", values.escuela);
    if (values.empresaId) datos.set("empresaId", values.empresaId);

    iniciar(async () => {
      const res = curso
        ? await actualizarCurso(curso.id, null, datos)
        : await crearCurso(null, datos);

      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo guardar");
        return;
      }
      toast.success(curso ? "Curso actualizado" : "Curso creado");
      router.refresh();
      onExito(curso ? curso.id : (res as { cursoId?: string }).cursoId!);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" {...register("titulo")} />
        {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" rows={3} {...register("descripcion")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Textarea id="objetivo" rows={2} {...register("objetivo")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imagenPortadaUrl">URL de la portada (opcional)</Label>
        <Input id="imagenPortadaUrl" placeholder="https://..." {...register("imagenPortadaUrl")} />
        {errors.imagenPortadaUrl && (
          <p className="text-sm text-destructive">{errors.imagenPortadaUrl.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nivel</Label>
          <Controller
            control={control}
            name="nivelDificultad"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Navegación</Label>
          <Controller
            control={control}
            name="navegacion"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="obligatoria">Obligatoria (en orden)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duracionEstimadaMin">Duración estimada (min)</Label>
          <Input
            id="duracionEstimadaMin"
            type="number"
            min={0}
            {...register("duracionEstimadaMin")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxIntentos">Máx. intentos evaluación</Label>
          <Input id="maxIntentos" type="number" min={1} {...register("maxIntentos")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="porcentajeAprobacion">Porcentaje de aprobación (%)</Label>
        <Input
          id="porcentajeAprobacion"
          type="number"
          min={0}
          max={100}
          step="0.01"
          {...register("porcentajeAprobacion")}
        />
      </div>

      <div className="space-y-2">
        <Label>Escuela</Label>
        <Controller
          control={control}
          name="escuela"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESCUELAS_VISUALES.map((escuela) => (
                  <SelectItem key={escuela} value={escuela}>
                    {ETIQUETAS_ESCUELA_VISUAL[escuela]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Empresa (vacío = catálogo global)</Label>
        <Controller
          control={control}
          name="empresaId"
          render={({ field }) => (
            <Select
              value={field.value || "GLOBAL"}
              onValueChange={(v) => field.onChange(v === "GLOBAL" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Catálogo global (todas las empresas)</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <Label htmlFor="esDiplomado">Es diplomado</Label>
          <p className="text-xs text-muted-foreground">
            Otorga certificado al aprobar todos los módulos.
          </p>
        </div>
        <Controller
          control={control}
          name="esDiplomado"
          render={({ field }) => (
            <Switch id="esDiplomado" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        {curso ? "Guardar cambios" : "Crear curso"}
      </Button>
    </form>
  );
}
