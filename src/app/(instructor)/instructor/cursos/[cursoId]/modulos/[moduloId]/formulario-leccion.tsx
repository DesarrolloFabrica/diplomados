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
import { leccionSchema, type LeccionInput } from "@/lib/validators/lecciones";
import { crearLeccion, actualizarLeccion } from "@/server/actions/lecciones";
import type { LeccionFila } from "@/server/queries/modulos";

interface ContenidoLeccion {
  texto?: string;
}

interface FormularioLeccionProps {
  cursoId: string;
  moduloId: string;
  leccion?: LeccionFila;
  onExito: (leccionId: string) => void;
}

export function FormularioLeccion({
  cursoId,
  moduloId,
  leccion,
  onExito,
}: FormularioLeccionProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const contenidoInicial = (leccion?.contenido as ContenidoLeccion | undefined)?.texto ?? "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LeccionInput>({
    resolver: zodResolver(leccionSchema),
    defaultValues: {
      titulo: leccion?.titulo ?? "",
      tipoContenido: leccion?.tipoContenido ?? "texto",
      contenido: contenidoInicial,
      esObligatoria: leccion?.esObligatoria ?? true,
      marcado: leccion?.marcado ?? "manual",
    },
  });

  const onSubmit = (values: LeccionInput) => {
    const datos = new FormData();
    datos.set("titulo", values.titulo);
    datos.set("tipoContenido", values.tipoContenido);
    if (values.contenido) datos.set("contenido", values.contenido);
    datos.set("esObligatoria", values.esObligatoria ? "true" : "false");
    datos.set("marcado", values.marcado);

    iniciar(async () => {
      const res = leccion
        ? await actualizarLeccion(cursoId, moduloId, leccion.id, null, datos)
        : await crearLeccion(cursoId, moduloId, null, datos);

      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo guardar");
        return;
      }
      toast.success(leccion ? "Lección actualizada" : "Lección creada");
      router.refresh();
      onExito(leccion ? leccion.id : (res as { leccionId?: string }).leccionId!);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" {...register("titulo")} />
        {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de contenido</Label>
          <Controller
            control={control}
            name="tipoContenido"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="archivo">Archivo</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Marcado como completada</Label>
          <Controller
            control={control}
            name="marcado"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (botón)</SelectItem>
                  <SelectItem value="automatico">Automático</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contenido">Contenido de texto (opcional)</Label>
        <Textarea id="contenido" rows={6} {...register("contenido")} />
        <p className="text-xs text-muted-foreground">
          Para video/audio/PDF/infografía, agrégalos como recursos después de crear la lección.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label htmlFor="esObligatoria">Lección obligatoria</Label>
        <Controller
          control={control}
          name="esObligatoria"
          render={({ field }) => (
            <Switch
              id="esObligatoria"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        {leccion ? "Guardar cambios" : "Crear lección"}
      </Button>
    </form>
  );
}
