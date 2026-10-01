import { FormularioLogin } from "./formulario-login";

export default function LoginPage() {
  return (
    <div className="space-y-7 text-white">
      <div>
        <img
          src="/images/logo-cun.svg"
          alt="CUN - Corporación Unificada Nacional de Educación Superior"
          width={145}
          height={44}
          className="h-11 w-auto max-w-[145px] brightness-110"
        />
      </div>

      <div className="login-header space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cun-green">
          Bienvenido
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.35rem] sm:leading-tight">
          Inicia sesión
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[#aab6c5] sm:text-[15px]">
          Ingresa con el correo que te asignó tu empresa.
        </p>
      </div>

      <FormularioLogin />
    </div>
  );
}
