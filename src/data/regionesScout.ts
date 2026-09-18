/**
 * Lista referencial de Regiones y Localidades Scout del Perú
 * Formato solicitado: [Localidad - Región] [Número Romano]
 * Ejemplo: "Arequipa Sur XI", "Lima Metropolitana XVIII"
 */

export interface RegionLocalidadScout {
  codigo: string;
  nombre: string;
  region: string;
  localidad: string;
}

export const REGIONES_LOCALIDADES_SCOUT: RegionLocalidadScout[] = [
  { codigo: 'I', nombre: 'Tumbes I', region: 'I', localidad: 'Tumbes' },
  { codigo: 'II', nombre: 'Piura II', region: 'II', localidad: 'Piura' },
  { codigo: 'III', nombre: 'Lambayeque / Chiclayo III', region: 'III', localidad: 'Lambayeque / Chiclayo' },
  { codigo: 'IV', nombre: 'La Libertad / Trujillo IV', region: 'IV', localidad: 'La Libertad / Trujillo' },
  { codigo: 'V', nombre: 'Áncash / Chimbote V', region: 'V', localidad: 'Áncash / Chimbote' },
  { codigo: 'VI', nombre: 'Cajamarca VI', region: 'VI', localidad: 'Cajamarca' },
  { codigo: 'VII', nombre: 'San Martín VII', region: 'VII', localidad: 'San Martín' },
  { codigo: 'VIII', nombre: 'Loreto / Iquitos VIII', region: 'VIII', localidad: 'Loreto / Iquitos' },
  { codigo: 'IX', nombre: 'Ucayali / Pucallpa IX', region: 'IX', localidad: 'Ucayali / Pucallpa' },
  { codigo: 'X', nombre: 'Huánuco / Pasco X', region: 'X', localidad: 'Huánuco / Pasco' },
  { codigo: 'XI', nombre: 'Arequipa Sur XI', region: 'XI', localidad: 'Arequipa Sur' },
  { codigo: 'XI', nombre: 'Arequipa Norte XI', region: 'XI', localidad: 'Arequipa Norte' },
  { codigo: 'XII', nombre: 'Cusco XII', region: 'XII', localidad: 'Cusco' },
  { codigo: 'XIII', nombre: 'Puno XIII', region: 'XIII', localidad: 'Puno' },
  { codigo: 'XIV', nombre: 'Tacna XIV', region: 'XIV', localidad: 'Tacna' },
  { codigo: 'XV', nombre: 'Moquegua XV', region: 'XV', localidad: 'Moquegua' },
  { codigo: 'XVI', nombre: 'Ica / Chincha XVI', region: 'XVI', localidad: 'Ica / Chincha' },
  { codigo: 'XVII', nombre: 'Junín / Huancayo XVII', region: 'XVII', localidad: 'Junín / Huancayo' },
  { codigo: 'XVIII', nombre: 'Lima Metropolitana XVIII', region: 'XVIII', localidad: 'Lima Metropolitana' },
  { codigo: 'XIX', nombre: 'Callao XIX', region: 'XIX', localidad: 'Callao' },
  { codigo: 'XX', nombre: 'Lima Provincias XX', region: 'XX', localidad: 'Lima Provincias' },
  { codigo: 'XXI', nombre: 'Ayacucho XXI', region: 'XXI', localidad: 'Ayacucho' },
  { codigo: 'XXII', nombre: 'Apurímac XXII', region: 'XXII', localidad: 'Apurímac' },
  { codigo: 'XXIII', nombre: 'Madre de Dios XXIII', region: 'XXIII', localidad: 'Madre de Dios' },
  { codigo: 'XXIV', nombre: 'Amazonas XXIV', region: 'XXIV', localidad: 'Amazonas' },
  { codigo: 'XXV', nombre: 'Huancavelica XXV', region: 'XXV', localidad: 'Huancavelica' },
];
