export interface UnidadScout {
  id: string;
  numeral: string;
  nombre: string;
  grupoScout?: string;
  localidad?: string;
}

/**
 * Base de Datos de Unidades / Manadas Scout (Numeral y Nombre)
 * Puedes agregar, editar o reemplazar esta lista con tus datos.
 */
export const UNIDADES_SCOUT_DB: UnidadScout[] = [
  { id: 'u-01', numeral: '02', nombre: 'Seeonee', grupoScout: 'Lima 02', localidad: 'Lima' },
  { id: 'u-02', numeral: '14', nombre: 'San Francisco', grupoScout: 'Arequipa 14', localidad: 'Arequipa' },
  { id: 'u-03', numeral: '05', nombre: 'Baden Powell', grupoScout: 'Trujillo 05', localidad: 'Trujillo' },
  { id: 'u-04', numeral: '08', nombre: 'Kaa', grupoScout: 'Cusco 08', localidad: 'Cusco' },
  { id: 'u-05', numeral: '21', nombre: 'Akela', grupoScout: 'Callao 21', localidad: 'Callao' },
  { id: 'u-06', numeral: '12', nombre: 'Baloo', grupoScout: 'Chiclayo 12', localidad: 'Chiclayo' },
  { id: 'u-07', numeral: '03', nombre: 'Mowgli', grupoScout: 'Piura 03', localidad: 'Piura' },
  { id: 'u-08', numeral: '19', nombre: 'Waingunga', grupoScout: 'Lima 19', localidad: 'Lima' },
  { id: 'u-09', numeral: '33', nombre: 'Hermano Gris', grupoScout: 'Huancayo 33', localidad: 'Huancayo' },
  { id: 'u-10', numeral: '07', nombre: 'Bagheera', grupoScout: 'Tacna 07', localidad: 'Tacna' },
  { id: 'u-11', numeral: '25', nombre: 'Hathi', grupoScout: 'Ica 25', localidad: 'Ica' },
  { id: 'u-12', numeral: '41', nombre: 'Chill', grupoScout: 'Iquitos 41', localidad: 'Iquitos' },
  { id: 'u-13', numeral: '50', nombre: 'Raksha', grupoScout: 'Lima 50', localidad: 'Lima' },
  { id: 'u-14', numeral: '64', nombre: 'Mang', grupoScout: 'Arequipa 64', localidad: 'Arequipa' },
  { id: 'u-15', numeral: '72', nombre: 'Rama', grupoScout: 'Trujillo 72', localidad: 'Trujillo' },
  { id: 'u-16', numeral: '88', nombre: 'Won-tolla', grupoScout: 'Chimbote 88', localidad: 'Chimbote' },
  { id: 'u-17', numeral: '104', nombre: 'Chikai', grupoScout: 'Lima 104', localidad: 'Lima' },
  { id: 'u-18', numeral: '120', nombre: 'Keval', grupoScout: 'Puno 120', localidad: 'Puno' },
];

/**
 * Función auxiliar para formatear la unidad scout
 */

export const formatUnidadScout = (u: UnidadScout): string => {
  return `Manada N.º ${u.numeral} "${u.nombre}"`;
};
