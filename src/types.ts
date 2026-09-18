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
  cargo: 'DIRIGENTE A CARGO' | 'EQUIPO DE APOYO' | 'STAFF' | string;
  comisionStaff?: 'PROGRAMAS' | 'SERVICIOS' | 'SEGURIDAD Y SFH' | 'COMUNICACION' | 'ADMINISTRACION Y FINANZAS' | string;
  email?: string;
  celular?: string;
  dirigenteReferenteId?: string;
  dirigenteReferenteNombre?: string;
  dirigenteReferenteAsp?: string;
  archivoAnexo3?: string;
  archivoAnexo3Name?: string;
  archivoAnexo3Size?: string;
  archivoAnexo3DocId?: string;
  voucherPago?: string;
  voucherPagoName?: string;
  voucherPagoSize?: string;
  voucherPagoDocId?: string;
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
  permisoPadreAnexo4?: string; // URL en GCS o dataUrl del Anexo 4
  permisoPadreAnexo4Name?: string; // Nombre original del archivo Anexo 4
  permisoPadreAnexo4Size?: string; // Tamaño formateado
  permisoPadreAnexo4DocId?: string; // ID en colección documentos_anexos
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
  cargo: 'DIRIGENTE A CARGO' | 'EQUIPO DE APOYO' | 'STAFF' | string;
  comisionStaff?: 'PROGRAMAS' | 'SERVICIOS' | 'SEGURIDAD Y SFH' | 'COMUNICACION' | 'ADMINISTRACION Y FINANZAS' | string;
  ciudad: string;
  email: string;
  celular: string;
  nicknameRoblox: string;
  dirigenteReferenteId?: string;
  dirigenteReferenteNombre?: string;
  dirigenteReferenteAsp?: string;
  archivoAnexo3?: string;
  archivoAnexo3Name?: string;
  archivoAnexo3Size?: string;
  archivoAnexo3DocId?: string;
  voucherPago?: string;
  voucherPagoName?: string;
  voucherPagoSize?: string;
  voucherPagoDocId?: string;
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
