"use client";

import { useCallback, useEffect, useRef } from "react";
import { StateMachineInputType, type Rive } from "@rive-app/react-webgl2";
import {
  esEstadoTutorialHelperd,
  HELPERD_STATE_MACHINE,
} from "@/components/shared/helperd-animacion";
import { usePathname } from "next/navigation";
import { TutorialAvatar } from "./tutorial-avatar";
import { useTutorial } from "./tutorial-provider";

const DASHBOARD_PATH = "/mis-cursos";
const INITIAL_RIVE_TEXT =
  "¡Hola! ¿Quieres conocer esta sección?\nHaz clic de nuevo y te mostraré lo principal.";

function setTutorialActivo(rive: Rive | null, value: boolean) {
  if (!rive) return;
  const property = rive.viewModelInstance?.boolean("tutorialActivo");
  if (property) {
    property.value = value;
    return;
  }

  const input = rive.stateMachineInputs(HELPERD_STATE_MACHINE)?.find(
    (item) => item.name === "tutorialActivo" && item.type === StateMachineInputType.Boolean,
  );
  if (input) input.value = value;
}

/** Punto de entrada de la beta, disponible solo en el Dashboard del colaborador. */
export function TutorialAssistant() {
  const pathname = usePathname();
  const { isOpen, startTutorial } = useTutorial();
  const riveRef = useRef<Rive | null>(null);
  const startedFromIdle = useRef(false);
  const idleHandled = useRef(false);
  const handleReady = useCallback((rive: Rive) => {
    riveRef.current = rive;
  }, []);

  useEffect(() => {
    if (!isOpen && startedFromIdle.current) {
      // Todos los cierres existentes (Finalizar, Omitir, Escape y X) pasan aqui.
      startedFromIdle.current = false;
      setTutorialActivo(riveRef.current, false);
    }
  }, [isOpen]);

  useEffect(() => {
    idleHandled.current = false;
  }, [pathname]);

  if (pathname !== DASHBOARD_PATH) return null;

  const handleStateChange = (states: string[]) => {
    const names = states.map((state) => state.trim().toLowerCase());
    if (names.some(esEstadoTutorialHelperd)) {
      if (isOpen || idleHandled.current) return;
      idleHandled.current = true;
      startedFromIdle.current = true;
      setTutorialActivo(riveRef.current, true);
      startTutorial("dashboard");
    } else if (names.some((name) => name.includes("entrada") || name === "hablar")) {
      idleHandled.current = false;
    }
  };

  return (
    <TutorialAvatar
      position="bottom-right"
      screenScale
      riveText={INITIAL_RIVE_TEXT}
      ariaLabel="Abrir ayuda"
      interactive={!isOpen}
      onStateChange={handleStateChange}
      onReady={handleReady}
    />
  );
}
