import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
}

export function StatTile({ titulo, valor, icono: Icono }: StatTileProps) {
  return (
    <Card
      className={cn(
        "border border-cun-blue/20",
        "shadow-[0_0_16px_rgba(6,17,32,0.10)]",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5",
        "hover:border-cun-blue/35",
        "hover:shadow-[0_0_20px_rgba(6,17,32,0.16)]",
        "dark:border-cun-green/35",
        "dark:shadow-[0_0_16px_rgba(145,220,0,0.14)]",
        "dark:hover:border-cun-green/55",
        "dark:hover:shadow-[0_0_20px_rgba(145,220,0,0.22)]",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <Icono className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl font-semibold tracking-tight">{valor}</p>
      </CardContent>
    </Card>
  );
}
