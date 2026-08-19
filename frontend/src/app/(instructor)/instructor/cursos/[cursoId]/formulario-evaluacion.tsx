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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { evaluacionSchema, type EvaluacionInput } from "@backend/lib/validators/evaluaciones";
import { crearEvaluacion } from "@backend/server/actions/evaluaciones";

interface FormularioEvaluacionProps {
  cursoId: string;
  onExito: (evaluacionId: string) => void;
}

export function FormularioEvaluacion({ cursoId, onExito }: FormularioEvaluacionProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EvaluacionInput>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      maxIntentos: 3,
      puntajeMinimo: 70,
      preguntasAleatorias: false,
      mostrarResultados: "al_cerrar",
    },
  });

  const onSubmit = (values: EvaluacionInput) => {
    const datos = new FormData();
    datos.set("titulo", values.titulo);
    if (values.descripcion) datos.set("descripcion", values.descripcion);
    if (values.tiempoLimiteMin !== undefined) {
      datos.set("tiempoLimiteMin", String(values.tiempoLimiteMin));
    }
    datos.set("maxIntentos", String(values.maxIntentos));
    datos.set("puntajeMinimo", String(values.puntajeMinimo));
    datos.set("preguntasAleatorias", values.preguntasAleatorias ? "true" : "false");
    if (values.numPreguntasMostrar !== undefined) {
      datos.set("numPreguntasMostrar", String(values.numPreguntasMostrar));
    }
    datos.set("mostrarResultados", values.mostrarResultados);

    iniciar(async () => {
      const res = await crearEvaluacion(cursoId, null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo crear");
        return;
      }
      toast.success("Evaluación creada");
      router.refresh();
      onExito(res.evaluacionId!);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" placeholder="Quiz 1" {...register("titulo")} />
        {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea id="descripcion" rows={2} {...register("descripcion")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tiempoLimiteMin">Tiempo límite (min, opcional)</Label>
          <Input id="tiempoLimiteMin" type="number" min={1} {...register("tiempoLimiteMin")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxIntentos">Máx. intentos</Label>
          <Input id="maxIntentos" type="number" min={1} {...register("maxIntentos")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="puntajeMinimo">Puntaje mínimo para aprobar (%)</Label>
        <Input
          id="puntajeMinimo"
          type="number"
          min={0}
          max={100}
          step="0.01"
          {...register("puntajeMinimo")}
        />
      </div>
      <div className="space-y-2">
        <Label>Mostrar resultados</Label>
        <Controller
          control={control}
          name="mostrarResultados"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inmediato">Inmediato</SelectItem>
                <SelectItem value="al_cerrar">Al cerrar el intento</SelectItem>
                <SelectItem value="nunca">Nunca</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Crear evaluación
      </Button>
    </form>
  );
}
