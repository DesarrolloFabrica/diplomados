interface AnilloProgresoProps {
  porcentaje: number;
  tamano: number;
  grosor?: number;
  className?: string;
}

// Anillo de progreso circular (como los de actividad de un reloj), para
// mostrar avance sin recurrir a una barra rectangular tipo lista/tabla.
export function AnilloProgreso({ porcentaje, tamano, grosor = 5, className }: AnilloProgresoProps) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - Math.min(100, Math.max(0, porcentaje)) / 100);

  return (
    <svg width={tamano} height={tamano} className={className}>
      <circle
        cx={tamano / 2}
        cy={tamano / 2}
        r={radio}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={grosor}
      />
      <circle
        cx={tamano / 2}
        cy={tamano / 2}
        r={radio}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={grosor}
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
      />
    </svg>
  );
}
