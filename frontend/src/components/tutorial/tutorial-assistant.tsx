"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialAvatar } from "./tutorial-avatar";
import { useTutorial } from "./tutorial-provider";

const DASHBOARD_PATH = "/mis-cursos";
const INITIAL_RIVE_TEXT =
  "¡Hola! ¿Quieres conocer esta sección?\nHaz clic de nuevo y te mostraré lo principal.";

/** Punto de entrada de la beta, disponible solo en el Dashboard del colaborador. */
export function TutorialAssistant() {
  const pathname = usePathname();
  const { isOpen, startTutorial } = useTutorial();
  const [isPrimed, setIsPrimed] = useState(false);

  useEffect(() => {
    setIsPrimed(false);
  }, [pathname]);

  if (pathname !== DASHBOARD_PATH) return null;

  const handleAvatarClick = () => {
    if (isOpen) return;

    if (!isPrimed) {
      // El mismo click llega al canvas y deja actuar a los listeners internos
      // de Rive; React solo recuerda que el siguiente click inicia la beta.
      setIsPrimed(true);
      return;
    }

    setIsPrimed(false);
    startTutorial("dashboard");
  };

  return (
    <TutorialAvatar
      position="bottom-right"
      screenScale
      riveText={INITIAL_RIVE_TEXT}
      ariaLabel={isPrimed ? "Iniciar tutorial del Dashboard" : "Abrir ayuda"}
      interactive={!isOpen}
      onActivate={handleAvatarClick}
    />
  );
}
