import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
}

export function StatTile({ titulo, valor, icono: Icono }: StatTileProps) {
  return (
    <Card>
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
