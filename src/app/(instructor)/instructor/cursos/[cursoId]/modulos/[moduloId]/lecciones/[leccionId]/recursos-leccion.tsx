"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Link2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recursoEnlaceSchema, type RecursoEnlaceInput } from "@/lib/validators/recursos";
import {
  agregarRecursoEnlace,
  solicitarUrlSubidaRecurso,
  agregarRecursoArchivo,
  eliminarRecurso,
} from "@/server/actions/recursos";
import type { RecursoFila } from "@/server/queries/modulos";
import type { TipoRecurso } from "@/lib/db/schema";

const ETIQUETA_TIPO: Record<TipoRecurso, string> = {
  pdf: "PDF",
  video: "Video",
  audio: "Audio",
  imagen: "Imagen / infografía",
  presentacion: "Presentación",
  enlace: "Enlace",
  archivo: "Archivo",
};

const OPCIONES_TIPO: TipoRecurso[] = [
  "pdf",
  "video",
  "audio",
  "imagen",
  "presentacion",
  "archivo",
  "enlace",
];

interface RecursosLeccionProps {
  cursoId: string;
  moduloId: string;
  leccionId: string;
  recursos: RecursoFila[];
}

export function RecursosLeccion({
  cursoId,
  moduloId,
  leccionId,
  recursos,
}: RecursosLeccionProps) {
  const router = useRouter();
  const [dialogoEnlace, setDialogoEnlace] = useState(false);
  const [dialogoArchivo, setDialogoArchivo] = useState(false);
  const [, iniciar] = useTransition();

  function eliminar(recurso: RecursoFila) {
    if (!confirm(`¿Eliminar el recurso "${recurso.nombre}"?`)) return;
    iniciar(async () => {
      const res = await eliminarRecurso(cursoId, moduloId, leccionId, recurso.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo eliminar");
        return;
      }
      toast.success("Recurso eliminado");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setDialogoEnlace(true)}>
          <Link2 className="h-4 w-4" />
          Agregar enlace
        </Button>
        <Button size="sm" onClick={() => setDialogoArchivo(true)}>
          <Upload className="h-4 w-4" />
          Subir archivo
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recursos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Todavía no hay recursos en esta lección.
                </TableCell>
              </TableRow>
            )}
            {recursos.map((recurso) => (
              <TableRow key={recurso.id}>
                <TableCell className="font-medium">{recurso.nombre}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETIQUETA_TIPO[recurso.tipo]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {recurso.urlExterna ? "Enlace externo" : "Archivo (Storage)"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => eliminar(recurso)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoEnlace} onOpenChange={setDialogoEnlace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar enlace externo</DialogTitle>
          </DialogHeader>
          <FormularioEnlace
            cursoId={cursoId}
            moduloId={moduloId}
            leccionId={leccionId}
            onExito={() => setDialogoEnlace(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoArchivo} onOpenChange={setDialogoArchivo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir archivo</DialogTitle>
          </DialogHeader>
          <FormularioArchivo
            cursoId={cursoId}
            moduloId={moduloId}
            leccionId={leccionId}
            onExito={() => setDialogoArchivo(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormularioEnlace({
  cursoId,
  moduloId,
  leccionId,
  onExito,
}: {
  cursoId: string;
  moduloId: string;
  leccionId: string;
  onExito: () => void;
}) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecursoEnlaceInput>({
    resolver: zodResolver(recursoEnlaceSchema),
    defaultValues: { nombre: "", tipo: "enlace", urlExterna: "" },
  });

  const onSubmit = (values: RecursoEnlaceInput) => {
    const datos = new FormData();
    datos.set("nombre", values.nombre);
    datos.set("tipo", values.tipo);
    datos.set("urlExterna", values.urlExterna);

    iniciar(async () => {
      const res = await agregarRecursoEnlace(cursoId, moduloId, leccionId, null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo agregar");
        return;
      }
      toast.success("Enlace agregado");
      router.refresh();
      onExito();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...register("nombre")} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPCIONES_TIPO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ETIQUETA_TIPO[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="urlExterna">URL</Label>
        <Input id="urlExterna" placeholder="https://..." {...register("urlExterna")} />
        {errors.urlExterna && (
          <p className="text-sm text-destructive">{errors.urlExterna.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Agregar
      </Button>
    </form>
  );
}

function FormularioArchivo({
  cursoId,
  moduloId,
  leccionId,
  onExito,
}: {
  cursoId: string;
  moduloId: string;
  leccionId: string;
  onExito: () => void;
}) {
  const router = useRouter();
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoRecurso>("pdf");
  const [subiendo, setSubiendo] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const archivo = inputArchivoRef.current?.files?.[0];
    if (!archivo) {
      toast.error("Selecciona un archivo");
      return;
    }

    setSubiendo(true);
    const contentType = archivo.type || "application/octet-stream";
    const solicitud = await solicitarUrlSubidaRecurso(tipo, archivo.name, contentType);
    if (!solicitud.ok || !solicitud.url || !solicitud.storagePath) {
      toast.error(solicitud.mensaje ?? "No se pudo iniciar la subida");
      setSubiendo(false);
      return;
    }

    try {
      const respuestaSubida = await fetch(solicitud.url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: archivo,
      });
      if (!respuestaSubida.ok) throw new Error("Falló la subida");
    } catch {
      toast.error("No se pudo subir el archivo al almacenamiento.");
      setSubiendo(false);
      return;
    }

    const datos = new FormData();
    datos.set("nombre", nombre || archivo.name);
    datos.set("tipo", tipo);
    datos.set("storagePath", solicitud.storagePath);
    datos.set("tamanoBytes", String(archivo.size));

    const resultado = await agregarRecursoArchivo(cursoId, moduloId, leccionId, null, datos);
    setSubiendo(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje ?? "No se pudo registrar el recurso");
      return;
    }
    toast.success("Recurso subido");
    router.refresh();
    onExito();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="archivo">Archivo</Label>
        <Input
          id="archivo"
          type="file"
          ref={inputArchivoRef}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo && !nombre) setNombre(archivo.name);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombreArchivo">Nombre</Label>
        <Input id="nombreArchivo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRecurso)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCIONES_TIPO.filter((t) => t !== "enlace").map((t) => (
              <SelectItem key={t} value={t}>
                {ETIQUETA_TIPO[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={subiendo}>
        {subiendo && <Loader2 className="animate-spin" />}
        Subir
      </Button>
    </form>
  );
}
