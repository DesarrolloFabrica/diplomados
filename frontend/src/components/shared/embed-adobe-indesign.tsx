interface EmbedAdobeIndesignProps {
  src: string;
  titulo?: string;
}

/** Proporción del embed oficial Publish Online (525×371 px). */
const VIEWER_ASPECT = 625 / 471;
const VIEWER_MAX_HEIGHT = "min(88vh, 900px)";

export function EmbedAdobeIndesign({ src, titulo }: EmbedAdobeIndesignProps) {
  return (
    <div className="space-y-2">
      {titulo ? <p className="text-sm font-medium text-foreground">{titulo}</p> : null}
      <div className="flex justify-center">
        <div
          className="lesson-media overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_8px_30px_rgba(6,17,32,0.06)] ring-1 ring-emerald-500/10"
          style={{
            height: VIEWER_MAX_HEIGHT,
            width: `min(100%, calc(${VIEWER_MAX_HEIGHT} * ${VIEWER_ASPECT}))`,
          }}
        >
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
