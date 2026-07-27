import { FormularioRestablecer } from "./formulario-restablecer";

interface RestablecerClavePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function RestablecerClavePage({
  searchParams,
}: RestablecerClavePageProps) {
  const { token } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Nueva contraseña
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea una contraseña segura para tu cuenta.
        </p>
      </div>
      {token ? (
        <FormularioRestablecer token={token} />
      ) : (
        <p className="text-sm text-destructive">
          Este enlace no es válido. Solicita uno nuevo desde{" "}
          <a href="/recuperar-clave" className="underline">
            recuperar contraseña
          </a>
          .
        </p>
      )}
    </div>
  );
}
