import { FormularioLogin } from "./formulario-login";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Inicia sesión
        </h2>
        <p className="text-sm text-muted-foreground">
          Ingresa con el correo que te asignó tu empresa.
        </p>
      </div>
      <FormularioLogin />
    </div>
  );
}
