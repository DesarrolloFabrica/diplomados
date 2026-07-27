"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { cerrarSesion } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function CerrarSesion() {
  const [saliendo, iniciar] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground"
      disabled={saliendo}
      onClick={() => iniciar(async () => void (await cerrarSesion()))}
    >
      {saliendo ? <Loader2 className="animate-spin" /> : <LogOut />}
      Cerrar sesión
    </Button>
  );
}
