import Link from "next/link";
import { FormularioRecuperar } from "./formulario-recuperar";

export default function RecuperarClavePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Recupera tu contraseña
        </h2>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para crear una nueva.
        </p>
      </div>
      <FormularioRecuperar />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Volver a inicio de sesión
        </Link>
      </p>
    </div>
  );
}
