// Parser mínimo de formato GIFT (Moodle) para preguntas de selección única.
// Ejemplo soportado:
// ::Pregunta 1::
// ¿Enunciado?
// {~Incorrecta #Retro. ~Otra incorrecta #Retro. =Correcta #Retro.}
export interface OpcionImportada {
  texto: string;
  esCorrecta: boolean;
  retroalimentacion?: string;
}

export interface PreguntaImportada {
  enunciado: string;
  opciones: OpcionImportada[];
}

const REGEX_PREGUNTA = /::[^:]*::\s*([\s\S]*?)\{([\s\S]*?)\}/g;

export function parsearGift(texto: string): PreguntaImportada[] {
  const preguntas: PreguntaImportada[] = [];
  let match: RegExpExecArray | null;

  REGEX_PREGUNTA.lastIndex = 0;
  while ((match = REGEX_PREGUNTA.exec(texto)) !== null) {
    const enunciado = (match[1] ?? "").trim();
    const bloqueOpciones = match[2] ?? "";

    const opciones = bloqueOpciones
      .split(/(?=[~=])/g)
      .map((parte) => parte.trim())
      .filter(Boolean)
      .map((parte): OpcionImportada => {
        const esCorrecta = parte.startsWith("=");
        const resto = parte.slice(1);
        const [textoOpcion, ...restoFeedback] = resto.split("#");
        const feedback = restoFeedback.join("#").trim();
        return {
          texto: (textoOpcion ?? "").trim(),
          esCorrecta,
          retroalimentacion: feedback || undefined,
        };
      });

    if (enunciado && opciones.length > 0) {
      preguntas.push({ enunciado, opciones });
    }
  }

  return preguntas;
}
