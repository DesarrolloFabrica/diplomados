import { FormularioLogin } from "./formulario-login";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      {/*
        Logo institucional CUN.
        Colocar el archivo real en: public/images/logo-cun.svg
        Ruta pública esperada: /images/logo-cun.svg
      */}
      <div className="pt-1">
        <img
          src="/images/logo-cun.svg"
          alt="CUN - Corporación Unificada Nacional de Educación Superior"
          width={160}
          height={48}
          className="h-12 w-auto max-w-[160px] dark:brightness-110"
        />
      </div>

      <div className="login-header space-y-1.5">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-cun-blue dark:text-[#f5f7fa]">
          Inicia sesión
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#aab6c5]">
          Ingresa con el correo que te asignó tu empresa.
        </p>
      </div>

      <FormularioLogin />
    </div>
  );
}
