import { Lobato } from '../types';

export const MAX_SEISENA_LOBATOS = 6;
export const MAX_LOBATOS_PER_SEISENA = MAX_SEISENA_LOBATOS;

export interface SeisenaInfo {
  numero: number;
  emoji: string;
  animal: string;
  titulo: string;
  nombreCompleto: string; // ej. "🦊 Seisena 2: Zorro Garra Veloz"
  etiquetaCorta: string; // ej. "🦊 Zorro Garra Veloz"
  etiquetaBadge: string; // ej. "Seisena 2 (🦊 Garra Veloz)"
}

/**
 * Catálogo secuencial de las 10 seisenas oficiales con animales scouts
 * Se asignan en orden fijo para todos los dirigentes:
 * 1ra seisena = Lobo, 2da seisena = Zorro, 3ra = Oso, etc.
 */
export const SEISENAS_CATALOGO: { emoji: string; animal: string; titulo: string }[] = [
  { emoji: '🐺', animal: 'Lobo', titulo: 'Colmillo Ágil' },
  { emoji: '🦊', animal: 'Zorro', titulo: 'Garra Veloz' },
  { emoji: '🐻', animal: 'Oso', titulo: 'Fuerza Parda' },
  { emoji: '🦅', animal: 'Águila', titulo: 'Ojo Vigilante' },
  { emoji: '🐆', animal: 'Leopardo', titulo: 'Salto Ágil' },
  { emoji: '🦉', animal: 'Búho', titulo: 'Mirada Sabia' },
  { emoji: '🦫', animal: 'Castor', titulo: 'Diente Fiel' },
  { emoji: '🦌', animal: 'Ciervo', titulo: 'Paso Ligero' },
  { emoji: '🐯', animal: 'Tigre', titulo: 'Rugido Bravo' },
  { emoji: '🦡', animal: 'Tejón', titulo: 'Garra Tenaz' },
];

/**
 * Obtiene la información oficial de la seisena según su número ordinal (1 a 10)
 */
export function getSeisenaInfo(numero: number): SeisenaInfo {
  const safeNum = Math.max(1, numero);
  const index = safeNum - 1;
  if (index < SEISENAS_CATALOGO.length) {
    const item = SEISENAS_CATALOGO[index];
    return {
      numero: safeNum,
      emoji: item.emoji,
      animal: item.animal,
      titulo: item.titulo,
      nombreCompleto: `${item.emoji} Seisena ${safeNum}: ${item.animal} ${item.titulo}`,
      etiquetaCorta: `${item.emoji} ${item.animal} ${item.titulo}`,
      etiquetaBadge: `Seisena ${safeNum} (${item.emoji} ${item.titulo})`,
    };
  }

  return {
    numero: safeNum,
    emoji: '🐾',
    animal: 'Scout',
    titulo: 'Huella Exploradora',
    nombreCompleto: `🐾 Seisena ${safeNum}: Huella Exploradora`,
    etiquetaCorta: `🐾 Huella Exploradora`,
    etiquetaBadge: `Seisena ${safeNum} (🐾 Huella Exploradora)`,
  };
}

export interface SeisenaGroup {
  numero: number;
  nombre: string;
  info: SeisenaInfo;
  lobatos: Lobato[];
}

/**
 * Agrupa los lobatos en seisenas (grupos de hasta 6 lobatos por registro)
 * Asigna a cada seisena su identidad de animal scout fija (1ra = Lobo, 2da = Zorro, etc.)
 */
export function groupLobatosBySeisena(lobatosList: Lobato[]): SeisenaGroup[] {
  if (!lobatosList || lobatosList.length === 0) return [];

  // Si los lobatos tienen asignada una seisena explícita con número (ej. 'Seisena 1', '🦊 Seisena 2: Zorro Garra Veloz')
  const mapByNumber = new Map<number, Lobato[]>();
  let hasExplicitGroups = false;

  lobatosList.forEach((lob) => {
    if (lob.seisena && lob.seisena.trim()) {
      const match = lob.seisena.match(/(?:seisena\s*)?(\d+)/i);
      if (match) {
        hasExplicitGroups = true;
        const num = parseInt(match[1], 10);
        const existing = mapByNumber.get(num) || [];
        existing.push(lob);
        mapByNumber.set(num, existing);
        return;
      }
    }
  });

  // Si hay agrupaciones explícitas por número, ordenar y estructurar
  if (hasExplicitGroups && mapByNumber.size > 0) {
    const sortedNums = Array.from(mapByNumber.keys()).sort((a, b) => a - b);
    return sortedNums.map((num) => {
      const info = getSeisenaInfo(num);
      return {
        numero: num,
        nombre: info.nombreCompleto,
        info,
        lobatos: mapByNumber.get(num) || [],
      };
    });
  }

  // Agrupación natural secuencial de seisenas: paquetes de hasta 6 lobatos
  const chunks: SeisenaGroup[] = [];
  for (let i = 0; i < lobatosList.length; i += MAX_LOBATOS_PER_SEISENA) {
    const chunk = lobatosList.slice(i, i + MAX_LOBATOS_PER_SEISENA);
    const num = Math.floor(i / MAX_LOBATOS_PER_SEISENA) + 1;
    const info = getSeisenaInfo(num);
    chunks.push({
      numero: num,
      nombre: info.nombreCompleto,
      info,
      lobatos: chunk,
    });
  }

  return chunks;
}

/**
 * Función para calcular edad o formatear fecha de nacimiento
 */
export function formatFechaNacimiento(fechaStr: string): string {
  if (!fechaStr) return '—';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
}

export function calcularEdad(fechaStr: string): number | null {
  if (!fechaStr) return null;
  const birth = new Date(fechaStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
