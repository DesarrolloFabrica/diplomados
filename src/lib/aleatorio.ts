// PRNG determinista (mulberry32) sembrada con un string. Se usa para que
// la selección/orden de preguntas de un intento de evaluación sea estable
// mientras el intento sigue "en_curso" (recargar la página no cambia las
// preguntas) pero distinta entre intentos (cada uno tiene su propio id,
// que es la semilla).
function hashSemilla(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(semilla: number) {
  let a = semilla;
  return function siguiente(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function barajarConSemilla<T>(lista: T[], semilla: string): T[] {
  const siguiente = mulberry32(hashSemilla(semilla));
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(siguiente() * (i + 1));
    const tmp = copia[i]!;
    copia[i] = copia[j]!;
    copia[j] = tmp;
  }
  return copia;
}
