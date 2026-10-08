import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlayerLayoutProps {
  header: ReactNode;
  visualizer: ReactNode;
  resourceSelector: ReactNode;
  panelClassName?: string;
  className?: string;
}

/** Creative + Business: visualizador protagonista y cards de recursos debajo. */
export function PlayerType1Layout({
  header,
  visualizer,
  resourceSelector,
  panelClassName,
  className,
}: PlayerLayoutProps) {
  return (
    <div data-player-layout="type-1" className={cn("space-y-4", className)}>
      <div className={cn("overflow-hidden", panelClassName)}>
        {header}
        {visualizer}
      </div>
      {resourceSelector}
    </div>
  );
}

/** Adventure + Educational: navegación de recursos integrada sobre el Player. */
export function PlayerType2Layout({
  header,
  visualizer,
  resourceSelector,
  panelClassName,
  className,
}: PlayerLayoutProps) {
  return (
    <div data-player-layout="type-2" className={cn("space-y-4", className)}>
      <div className={cn("overflow-hidden", panelClassName)}>
        {header}
        {resourceSelector}
        {visualizer}
      </div>
    </div>
  );
}

