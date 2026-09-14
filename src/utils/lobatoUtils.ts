import { Lobato } from '../types';

export const MAX_SEISENA_LOBATOS = 6;
export const MAX_LOBATOS_PER_SEISENA = MAX_SEISENA_LOBATOS;

export interface SeisenaGroup {
  numero: number;
  nombre: string;
  lobatos: Lobato[];
}

/**
 * Agrupa los lobatos en seisenas (grupos de hasta 6 lobatos por registro)
 */
export function groupLobatosBySeisena(lobatosList: Lobato[]): SeisenaGroup[] {
  if (!lobatosList || lobatosList.length === 0) return [];

  // Si los lobatos tienen asignada una seisena con nombre o número explícito (ej. 'Seisena 1', 'Seisena 2')
  const mapByExplicitSeisena = new Map<string, Lobato[]>();
  let hasExplicitGroups = false;

  lobatosList.forEach((lob) => {
    if (lob.seisena && lob.seisena.trim() && lob.seisena.toLowerCase().startsWith('seisena')) {
      hasExplicitGroups = true;
      const key = lob.seisena.trim();
      const existing = mapByExplicitSeisena.get(key) || [];
      existing.push(lob);
      mapByExplicitSeisena.set(key, existing);
    }
  });

  // Si todos o la mayoría tienen seisenas explícitas, respetar esa agrupación
  if (hasExplicitGroups && mapByExplicitSeisena.size > 0) {
    const groups: SeisenaGroup[] = [];
    let idx = 1;
    mapByExplicitSeisena.forEach((groupLobatos, key) => {
      groups.push({
        numero: idx,
        nombre: key,
        lobatos: groupLobatos,
      });
      idx++;
    });
    return groups;
  }

  // Agrupación natural de seisenas: paquetes de hasta 6 lobatos
  const chunks: SeisenaGroup[] = [];
  for (let i = 0; i < lobatosList.length; i += MAX_LOBATOS_PER_SEISENA) {
    const chunk = lobatosList.slice(i, i + MAX_LOBATOS_PER_SEISENA);
    const num = Math.floor(i / MAX_LOBATOS_PER_SEISENA) + 1;
    chunks.push({
      numero: num,
      nombre: `Seisena ${num}`,
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
