export interface UnidadScout {
  id: string;
  numeral: string;
  nombre: string;
  grupoScout?: string;
  localidad?: string;
}

export interface AdultoVoluntario {
  id: string;
  nombre: string;
  registroAsp: string;
  grupoScout: string;
  unidad?: string; // backwards compatibility
  ciudad: string;
  localidad?: string; // backwards compatibility
  cargo: 'DIRIGENTE A CARGO' | 'STAFF' | 'ORGANIZADORES' | string;
  email?: string;
  celular?: string;
  archivoAnexo3?: string;
  archivoAnexo3Size?: string;
  voucherPago?: string;
  voucherPagoName?: string;
  voucherPagoSize?: string;
  avatarSeed?: string;
}

export interface Lobato {
  id: string;
  orden: number;
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  nicknameRoblox: string;
  grupoScout: string;
  ciudad?: string;
  unidad?: string; // backwards compatibility
  permisoPadreAnexo4?: string; // Nombre del archivo del Anexo 4
  adultoId: string;
  adultoNombre: string;
  adultoAsp?: string; // Código ASP del dirigente responsable
  createdAt: number;
  seisena?: string; // Seisena Blanca, Gris, Parda, Negra, Roja, Amarilla
}

export interface DirigenteRegistro {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  registroAsp: string;
  grupoScout: string;
  cargo: 'DIRIGENTE A CARGO' | 'STAFF' | 'ORGANIZADORES' | string;
  ciudad: string;
  email: string;
  celular: string;
  nicknameRoblox: string;
  archivoAnexo3?: string;
  archivoAnexo3Size?: string;
  voucherPago?: string;
  voucherPagoName?: string;
  voucherPagoSize?: string;
}

export type ScreenType = 'home' | 'dirigente' | 'lobatos' | 'nicknames';

export type ViewMode = 'grid' | 'list';

export type ModalState =
  | { type: 'none' }
  | { type: 'edit'; lobato: Lobato }
  | { type: 'delete'; lobato: Lobato }
  | { type: 'summary' }
  | { type: 'success'; count: number; adulto: AdultoVoluntario }
  | { type: 'unsaved_exit'; targetScreen: ScreenType }
  | { type: 'dirigente_success'; dirigente: DirigenteRegistro };
