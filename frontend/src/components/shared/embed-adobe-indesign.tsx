interface EmbedAdobeIndesignProps {
  src: string;
  titulo?: string;
}

export function EmbedAdobeIndesign({ src, titulo }: EmbedAdobeIndesignProps) {
  return (
    <div className="space-y-2">
      {titulo ? <p className="text-sm font-medium text-foreground">{titulo}</p> : null}
      <div className="flex justify-center">
        <div className="lesson-media h-[58dvh] min-h-[360px] max-h-[720px] w-full overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_8px_30px_rgba(6,17,32,0.06)] ring-1 ring-emerald-500/10 sm:h-[64dvh] sm:min-h-[460px] lg:h-[70dvh]">
          <iframe
            src={src}
            title={titulo ?? "Contenido interactivo Adobe InDesign"}
            className="block h-full w-full bg-white"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
