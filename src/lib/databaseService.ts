import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, GCS_STORAGE_BUCKET, GCS_STORAGE_FOLDER } from './firebase';
import { Lobato, AdultoVoluntario, DirigenteRegistro } from '../types';
import { REGIONES_LOCALIDADES_SCOUT } from '../data/regionesScout';

const LOBATOS_COLLECTION = 'lobatos';
const ADULTOS_COLLECTION = 'adultos';
const ANEXOS_COLLECTION = 'documentos_anexos';
const AUDITORIA_COLLECTION = 'auditoria_nicknames';

export interface DocumentoAnexoMeta {
  id: string;
  nombreArchivo: string;
  tipoDocumento: 'ANEXO_3_DIRIGENTE' | 'ANEXO_4_LOBATO' | 'VOUCHER_PAGO_DIRIGENTE';
  tamanoBytes?: number;
  tipoMime?: string;
  subidoPor?: string;
  asociadoAId?: string; // lobatoId o dirigenteId
  dataUrl?: string; // Storage local/base64 de archivo para preview
  storageBucket: string;
  storagePath: string;
  downloadUrl?: string;
  url?: string;
  storageStatus: 'subido_exitosamente' | 'error_permisos_o_cors';
  errorMensaje?: string;
  fechaSubida: string;
}

export interface UploadAnexoResult {
  success: boolean;
  meta: DocumentoAnexoMeta;
  error?: string;
}

/**
 * Limpia recursivamente un objeto para asegurar que ningún campo con valor `undefined`
 * sea enviado a Firestore (lo cual causa rechazo de escritura fatal).
 */
export function cleanObjectForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObjectForFirestore(item)).filter((item) => item !== undefined);
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        (value as any)?.constructor?.name !== 'FieldValue'
      ) {
        cleaned[key] = cleanObjectForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Sube un documento anexo (Anexo 3, Anexo 4 o Voucher de Pago) usando directamente
 * el endpoint REST estándar de Google Cloud Storage mediante fetch():
 * https://storage.googleapis.com/upload/storage/v1/b/ai-studio-bucket-692554933038-us-east1/o?uploadType=media&name=documentos_anexos/[NOMBRE_DEL_ARCHIVO]
 *
 * No utiliza el SDK de Firebase Storage, permitiendo la interacción nativa
 * con el bucket de GCP y respetando la política de CORS y permisos allUsers/objectCreator.
 */
export async function uploadDocumentoAnexo(
  tipoDocumento: 'ANEXO_3_DIRIGENTE' | 'ANEXO_4_LOBATO' | 'VOUCHER_PAGO_DIRIGENTE',
  file: File,
  asociadoAId?: string
): Promise<UploadAnexoResult> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${Date.now()}_${safeName}`;
  // Carpeta específica dentro del bucket: documentos_anexos/
  const storagePath = `${GCS_STORAGE_FOLDER}/${uniqueFileName}`;

  // Endpoint REST de subida directa de Google Cloud Storage JSON API (uploadType=media)
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${GCS_STORAGE_BUCKET}/o?uploadType=media&name=${encodeURIComponent(
    storagePath
  )}`;

  console.log(`%c[Storage GCS REST] 📤 Iniciando subida directa por fetch()`, 'color: #2563eb; font-weight: bold;', {
    bucket: GCS_STORAGE_BUCKET,
    carpeta: GCS_STORAGE_FOLDER,
    archivo: file.name,
    nombreEnBucket: uniqueFileName,
    endpointGCS: uploadUrl,
    tamaño: `${(file.size / 1024).toFixed(1)} KB`,
    tipoMime: file.type || 'application/octet-stream',
    tipoDocumento,
  });

  let downloadUrl: string | undefined = undefined;
  let storageStatus: 'subido_exitosamente' | 'error_permisos_o_cors' = 'subido_exitosamente';
  let errorDiagnostico: string | undefined = undefined;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (response.ok) {
      const gcsResult = await response.json().catch(() => ({}));
      downloadUrl =
        gcsResult.mediaLink ||
        `https://storage.googleapis.com/${GCS_STORAGE_BUCKET}/${encodeURI(storagePath)}`;

      console.log(
        `%c[Storage GCS REST] ✅ ¡Archivo subido exitosamente a Google Cloud Storage!`,
        'color: #16a34a; font-weight: bold;',
        {
          bucket: GCS_STORAGE_BUCKET,
          ruta: storagePath,
          statusHttp: response.status,
          urlDescarga: downloadUrl,
          gcsRespuesta: gcsResult,
        }
      );
    } else {
      storageStatus = 'error_permisos_o_cors';
      const status = response.status;
      const errorText = await response.text().catch(() => '');

      if (status === 403) {
        errorDiagnostico = `[Error 403 Forbidden en GCS]: El bucket "${GCS_STORAGE_BUCKET}" rechazó la subida. Verifica que "allUsers" tenga asignado el rol "roles/storage.objectCreator".`;
      } else if (status === 401) {
        errorDiagnostico = `[Error 401 Unauthorized]: Petición no autorizada en el bucket "${GCS_STORAGE_BUCKET}".`;
      } else if (status === 400) {
        errorDiagnostico = `[Error 400 Bad Request]: Parámetros o formato inválido al subir a GCS: ${errorText}`;
      } else {
        errorDiagnostico = `[Error HTTP ${status} en GCS]: ${errorText || response.statusText}`;
      }

      console.error(
        `%c[Storage GCS REST] ❌ Falló la subida (HTTP ${status}):`,
        'color: #dc2626; font-weight: bold;',
        {
          status,
          statusText: response.statusText,
          detalle: errorText,
          diagnostico: errorDiagnostico,
        }
      );
    }
  } catch (fetchErr: any) {
    storageStatus = 'error_permisos_o_cors';
    const msg = fetchErr?.message || String(fetchErr);

    if (msg.includes('Failed to fetch') || msg.includes('CORS') || msg.includes('NetworkError')) {
      errorDiagnostico = `[Error CORS / Preflight en GCS]: El navegador bloqueó la petición a storage.googleapis.com. Verifica que el archivo de configuración CORS del bucket incluya method POST, headers Content-Type y origin *.`;
    } else {
      errorDiagnostico = `[Error de conexión GCS]: ${msg}`;
    }

    console.error(
      `%c[Storage GCS REST] ❌ Error de red / preflight CORS al conectar con storage.googleapis.com:`,
      'color: #dc2626; font-weight: bold;',
      {
        endpoint: uploadUrl,
        error: msg,
        diagnostico: errorDiagnostico,
      }
    );
  }

  // Convertir a DataURL como respaldo local/preview si es menor a 600KB
  let dataUrl: string | undefined = undefined;
  if (file.size < 600000) {
    try {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    } catch (_) {}
  }

  const finalUrl = downloadUrl || dataUrl || '';

  const anexoMeta: DocumentoAnexoMeta = {
    id: docId,
    nombreArchivo: file.name,
    tipoDocumento,
    tamanoBytes: file.size,
    tipoMime: file.type || 'application/pdf',
    asociadoAId: asociadoAId || '',
    dataUrl,
    storageBucket: GCS_STORAGE_BUCKET,
    storagePath,
    downloadUrl,
    url: finalUrl,
    storageStatus,
    errorMensaje: errorDiagnostico,
    fechaSubida: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, ANEXOS_COLLECTION, docId);
    const cleanedMeta = cleanObjectForFirestore({
      ...anexoMeta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, cleanedMeta);
    console.log(`[Firestore] Metadatos del documento anexo guardados en colección "${ANEXOS_COLLECTION}":`, docId);
  } catch (error) {
    console.warn('[Firestore] Advertencia al guardar metadatos de anexo en Firestore:', error);
  }

  return {
    success: storageStatus === 'subido_exitosamente',
    meta: anexoMeta,
    error: errorDiagnostico,
  };
}

/**
 * Obtener todos los lobatos de Firestore
 */
export async function getLobatosFromFirestore(): Promise<Lobato[]> {
  try {
    const q = query(collection(db, LOBATOS_COLLECTION), orderBy('orden', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    const list: Lobato[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as Lobato;
      list.push({
        ...data,
        id: d.id,
      });
    });
    return list;
  } catch (err) {
    console.error('Error fetching lobatos from Firestore:', err);
    return [];
  }
}

/**
 * Obtener ÚNICAMENTE los lobatos que pertenecen a un dirigente específico por su ID o código ASP.
 * Protege la privacidad de datos: ningún dirigente puede acceder a lobatos ajenos.
 */
export async function getLobatosByAdulto(adultoId: string, registroAsp?: string): Promise<Lobato[]> {
  try {
    const listMap = new Map<string, Lobato>();
    const cleanAsp = (registroAsp || '').trim().toUpperCase();
    const digitsOnly = cleanAsp.replace(/[^0-9]/g, '');
    const cleanAlphaNum = cleanAsp.replace(/[^A-Z0-9]/g, '');

    const aspSearchTokens = new Set<string>();
    if (cleanAsp) {
      aspSearchTokens.add(cleanAsp);
      aspSearchTokens.add(cleanAlphaNum);
      if (digitsOnly) {
        aspSearchTokens.add(`ASP-${digitsOnly}`);
        aspSearchTokens.add(digitsOnly);
      }
    }

    // 1. Buscar por adultoId
    if (adultoId) {
      try {
        const q1 = query(collection(db, LOBATOS_COLLECTION), where('adultoId', '==', adultoId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => {
          listMap.set(d.id, { ...d.data() as Lobato, id: d.id });
        });
      } catch (err1) {
        console.warn('Error querying lobatos by adultoId:', err1);
      }
    }

    // 2. Buscar por cada variante de adultoAsp
    for (const token of aspSearchTokens) {
      try {
        const q2 = query(collection(db, LOBATOS_COLLECTION), where('adultoAsp', '==', token));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          listMap.set(d.id, { ...d.data() as Lobato, id: d.id });
        });
      } catch (err2) {
        console.warn('Error querying lobatos by token:', token, err2);
      }
    }

    // 3. Fallback exhaustivo para asegurar consistencia si Firestore index no coincide
    // o si el lobato fue guardado con variaciones o antes de la normalización
    if (listMap.size === 0) {
      const allSnap = await getDocs(collection(db, LOBATOS_COLLECTION));
      allSnap.forEach((d) => {
        const data = d.data() as any;
        const lobAsp = (data.adultoAsp || '').trim().toUpperCase();
        const lobCleanAsp = lobAsp.replace(/[^A-Z0-9]/g, '');
        const lobAdultId = data.adultoId || '';

        const matchesId = Boolean(adultoId && lobAdultId === adultoId);
        const matchesAsp = Boolean(
          cleanAlphaNum && (
            lobCleanAsp === cleanAlphaNum ||
            (digitsOnly && (lobCleanAsp === `ASP${digitsOnly}` || lobAsp === `ASP-${digitsOnly}` || lobCleanAsp === digitsOnly))
          )
        );

        if (matchesId || matchesAsp) {
          listMap.set(d.id, { ...data, id: d.id } as Lobato);
        }
      });
    }

    const result = Array.from(listMap.values());
    result.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    return result;
  } catch (err) {
    console.error('Error fetching lobatos by adulto from Firestore:', err);
    return [];
  }
}

/**
 * Guardar o actualizar un lobato en Firestore
 */
export async function saveLobatoToFirestore(lobato: Lobato): Promise<void> {
  const rawAsp = (lobato.adultoAsp || '').trim().toUpperCase();
  const digits = rawAsp.replace(/[^0-9]/g, '');
  const standardAsp = digits ? `ASP-${digits}` : rawAsp;

  const normalizedLobato: Lobato = {
    ...lobato,
    adultoAsp: standardAsp || lobato.adultoAsp || '',
  };

  const docRef = doc(db, LOBATOS_COLLECTION, normalizedLobato.id);
  const dataToSave = cleanObjectForFirestore({
    ...normalizedLobato,
    updatedAt: serverTimestamp(),
    fechaRegistro: (lobato as any).fechaRegistro || new Date().toISOString(),
  });

  await setDoc(docRef, dataToSave, { merge: true });

  // Si existe un anexo 4 asociado por ID en la colección documentos_anexos, vincularlo
  if (normalizedLobato.permisoPadreAnexo4DocId) {
    try {
      const anexoDocRef = doc(db, ANEXOS_COLLECTION, normalizedLobato.permisoPadreAnexo4DocId);
      await updateDoc(anexoDocRef, cleanObjectForFirestore({
        asociadoAId: normalizedLobato.id,
        lobatoNombre: `${normalizedLobato.nombres} ${normalizedLobato.apellidos}`.trim(),
        adultoId: normalizedLobato.adultoId,
        adultoAsp: normalizedLobato.adultoAsp,
        updatedAt: serverTimestamp(),
      }));
    } catch (anexoErr) {
      console.warn('[Firestore] Advertencia al vincular documento anexo 4 con el lobato:', anexoErr);
    }
  }

  if (normalizedLobato.grupoScout) {
    saveDynamicScoutSuggestion('grupoScout', normalizedLobato.grupoScout);
  }
  if (normalizedLobato.ciudad) {
    saveDynamicScoutSuggestion('region', normalizedLobato.ciudad);
  }
}

/**
 * Guardar un lote de lobatos (por ejemplo, al finalizar la lista)
 */
export async function saveMultipleLobatosToFirestore(lobatos: Lobato[]): Promise<void> {
  const promises = lobatos.map((lob) => saveLobatoToFirestore(lob));
  await Promise.all(promises);
}

/**
 * Eliminar un lobato de Firestore
 */
export async function deleteLobatoFromFirestore(lobatoId: string): Promise<void> {
  const docRef = doc(db, LOBATOS_COLLECTION, lobatoId);
  await deleteDoc(docRef);
}

/**
 * Actualizar el Nickname de un lobato en Firestore y registrar auditoría
 */
export async function updateLobatoNicknameInFirestore(
  lobatoId: string,
  newNickname: string,
  auditoria?: Record<string, any>
): Promise<void> {
  const docRef = doc(db, LOBATOS_COLLECTION, lobatoId);
  await updateDoc(docRef, {
    nicknameRoblox: newNickname,
    updatedAt: serverTimestamp(),
  });

  if (auditoria) {
    try {
      const auditRef = doc(collection(db, AUDITORIA_COLLECTION));
      await setDoc(auditRef, {
        ...auditoria,
        lobatoId,
        newNickname,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('No se pudo guardar log de auditoría:', e);
    }
  }
}

/**
 * Obtener todos los dirigentes de Firestore (entorno productivo real)
 */
export async function getAdultosFromFirestore(): Promise<AdultoVoluntario[]> {
  try {
    const snapshot = await getDocs(collection(db, ADULTOS_COLLECTION));
    if (snapshot.empty) {
      return [];
    }
    const list: AdultoVoluntario[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as any;
      const computedCombined = `${data.nombres || ''} ${data.apellidos || ''}`.trim();
      const fullName = (
        (typeof data.nombre === 'string' && data.nombre.trim() && data.nombre.toLowerCase() !== 'dirigente' && data.nombre.toLowerCase() !== 'dirigente scout' && data.nombre.trim()) ||
        computedCombined ||
        (typeof data.nombreCompleto === 'string' && data.nombreCompleto.trim()) ||
        (typeof data.fullName === 'string' && data.fullName.trim()) ||
        (typeof data.adultoNombre === 'string' && data.adultoNombre.trim()) ||
        (typeof data.name === 'string' && data.name.trim()) ||
        (typeof data.nombre === 'string' && data.nombre.trim()) ||
        'Dirigente Scout'
      );
      const cleanAsp = (data.registroAsp || '').trim().toUpperCase();
      list.push({
        ...data,
        id: d.id,
        nombre: fullName,
        nombres: data.nombres || '',
        apellidos: data.apellidos || '',
        registroAsp: cleanAsp,
      } as AdultoVoluntario);
    });
    return list;
  } catch (err) {
    console.error('Error fetching adultos from Firestore:', err);
    return [];
  }
}

/**
 * Registra o guarda un nuevo dirigente en Firestore
 */
export async function saveAdultoToFirestore(adulto: AdultoVoluntario | DirigenteRegistro): Promise<string> {
  const id = adulto.id || `dir-${Date.now()}`;
  const docRef = doc(db, ADULTOS_COLLECTION, id);
  const fullName = ('nombre' in adulto && adulto.nombre)
    ? adulto.nombre
    : `${(adulto as any).nombres || ''} ${(adulto as any).apellidos || ''}`.trim();
  const cleanAsp = (adulto.registroAsp || '').trim().toUpperCase();
  const digits = cleanAsp.replace(/[^0-9]/g, '');
  const standardAsp = digits ? `ASP-${digits}` : cleanAsp;

  const dataToSave = cleanObjectForFirestore({
    ...adulto,
    id,
    nombre: fullName,
    registroAsp: standardAsp,
    createdAt: (adulto as any).createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    fechaRegistro: (adulto as any).fechaRegistro || new Date().toISOString(),
  });

  console.log('[Firestore] Guardando dirigente en base de datos:', id, {
    nombre: fullName,
    registroAsp: standardAsp,
    cargo: (adulto as any).cargo,
  });

  await setDoc(docRef, dataToSave, { merge: true });

  // Si tiene archivoAnexo3DocId o voucherPagoDocId, vincularlos en documentos_anexos
  if ((adulto as any).archivoAnexo3DocId) {
    try {
      const anexoRef = doc(db, ANEXOS_COLLECTION, (adulto as any).archivoAnexo3DocId);
      await updateDoc(anexoRef, {
        adultoId: id,
        dirigenteNombre: fullName,
        dirigenteAsp: standardAsp,
        updatedAt: serverTimestamp(),
      });
    } catch (anexoErr) {
      console.warn('[Firestore] No se pudo vincular archivoAnexo3DocId:', (adulto as any).archivoAnexo3DocId, anexoErr);
    }
  }

  if ((adulto as any).voucherPagoDocId) {
    try {
      const voucherRef = doc(db, ANEXOS_COLLECTION, (adulto as any).voucherPagoDocId);
      await updateDoc(voucherRef, {
        adultoId: id,
        dirigenteNombre: fullName,
        dirigenteAsp: standardAsp,
        updatedAt: serverTimestamp(),
      });
    } catch (voucherErr) {
      console.warn('[Firestore] No se pudo vincular voucherPagoDocId:', (adulto as any).voucherPagoDocId, voucherErr);
    }
  }

  console.log('[Firestore] ✓ Dirigente guardado exitosamente en colección "adultos":', id);

  const gs = (adulto.grupoScout || (adulto as any).unidad || '').trim();
  const reg = (adulto.ciudad || (adulto as any).localidad || (adulto as any).region || '').trim();
  if (gs) saveDynamicScoutSuggestion('grupoScout', gs);
  if (reg) saveDynamicScoutSuggestion('region', reg);

  return id;
}

// Catálogos base de respaldo para grupos scout
const GRUPOS_SCOUT_BASE = [
  'Lima 02',
  'Arequipa 14',
  'Trujillo 05',
  'Cusco 08',
  'Callao 21',
  'Chiclayo 12',
  'Piura 03',
  'Lima 19',
  'Huancayo 33',
  'Tacna 07',
  'Ica 25',
  'Iquitos 41',
  'Lima 50',
  'Arequipa 64',
  'Trujillo 72',
  'Chimbote 88',
  'Lima 104',
  'Puno 120',
  'Miraflores 51',
  'San Borja 114',
  'Santiago de Surco 80',
  'San Isidro 15',
  'Barranco 13',
  'Surco 184',
  'La Molina 130',
  'Pueblo Libre 105',
  'San Miguel 36',
  'Chorrillos 291',
];

export interface ScoutFieldSuggestions {
  gruposScout: string[];
  regiones: string[];
  fromDatabaseGrupos: string[];
  fromDatabaseRegiones: string[];
}

let cachedSuggestions: ScoutFieldSuggestions | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto

/**
 * Obtiene las sugerencias unificadas de Grupo Scout y Región - Localidad
 * a partir de los registros previos reales en Firestore (adultos y lobatos),
 * el almacenamiento dinámico local y los catálogos base.
 */
export async function getScoutFieldSuggestions(forceRefresh = false): Promise<ScoutFieldSuggestions> {
  const now = Date.now();
  if (!forceRefresh && cachedSuggestions && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSuggestions;
  }

  const gruposSet = new Set<string>();
  const regionesSet = new Set<string>();
  const dbGrupos = new Set<string>();
  const dbRegiones = new Set<string>();

  // 1. Cargar desde base de datos Firestore (adultos)
  try {
    const adultosSnap = await getDocs(collection(db, ADULTOS_COLLECTION));
    adultosSnap.forEach((d) => {
      const data = d.data() as any;
      const gs = (data.grupoScout || data.unidad || '').trim();
      const reg = (data.ciudad || data.localidad || data.region || '').trim();
      if (gs && gs.length >= 2) {
        gruposSet.add(gs);
        dbGrupos.add(gs);
      }
      if (reg && reg.length >= 2) {
        regionesSet.add(reg);
        dbRegiones.add(reg);
      }
    });
  } catch (err) {
    console.warn('Error fetching grupos/regiones from adultos in Firestore:', err);
  }

  // 2. Cargar desde base de datos Firestore (lobatos)
  try {
    const lobatosSnap = await getDocs(collection(db, LOBATOS_COLLECTION));
    lobatosSnap.forEach((d) => {
      const data = d.data() as any;
      const gs = (data.grupoScout || data.unidad || '').trim();
      const reg = (data.ciudad || data.localidad || '').trim();
      if (gs && gs.length >= 2) {
        gruposSet.add(gs);
        dbGrupos.add(gs);
      }
      if (reg && reg.length >= 2) {
        regionesSet.add(reg);
        dbRegiones.add(reg);
      }
    });
  } catch (err) {
    console.warn('Error fetching grupos/regiones from lobatos in Firestore:', err);
  }

  // 3. Cargar registros dinámicos previos guardados en localStorage
  try {
    const localGrupos = JSON.parse(localStorage.getItem('scout_custom_grupos') || '[]');
    if (Array.isArray(localGrupos)) {
      localGrupos.forEach((g: string) => {
        if (typeof g === 'string' && g.trim()) {
          gruposSet.add(g.trim());
          dbGrupos.add(g.trim());
        }
      });
    }
    const localRegiones = JSON.parse(localStorage.getItem('scout_custom_regiones') || '[]');
    if (Array.isArray(localRegiones)) {
      localRegiones.forEach((r: string) => {
        if (typeof r === 'string' && r.trim()) {
          regionesSet.add(r.trim());
          dbRegiones.add(r.trim());
        }
      });
    }
  } catch {}

  // 4. Agregar grupos scout base de respaldo
  GRUPOS_SCOUT_BASE.forEach((g) => gruposSet.add(g));

  // 5. Agregar regiones oficiales
  REGIONES_LOCALIDADES_SCOUT.forEach((r) => regionesSet.add(r.nombre));

  // Ordenar priorizando los que vienen de registros previos reales
  const sortedGrupos = Array.from(gruposSet).sort((a, b) => {
    const aInDb = dbGrupos.has(a);
    const bInDb = dbGrupos.has(b);
    if (aInDb && !bInDb) return -1;
    if (!aInDb && bInDb) return 1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  const sortedRegiones = Array.from(regionesSet).sort((a, b) => {
    const aInDb = dbRegiones.has(a);
    const bInDb = dbRegiones.has(b);
    if (aInDb && !bInDb) return -1;
    if (!aInDb && bInDb) return 1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  cachedSuggestions = {
    gruposScout: sortedGrupos,
    regiones: sortedRegiones,
    fromDatabaseGrupos: Array.from(dbGrupos),
    fromDatabaseRegiones: Array.from(dbRegiones),
  };
  lastFetchTime = now;

  return cachedSuggestions;
}

/**
 * Guarda inmediatamente un nuevo valor en el catálogo de sugerencias del usuario
 */
export function saveDynamicScoutSuggestion(type: 'grupoScout' | 'region', value: string): void {
  const clean = value.trim();
  if (!clean || clean.length < 2) return;

  const storageKey = type === 'grupoScout' ? 'scout_custom_grupos' : 'scout_custom_regiones';
  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const list = Array.isArray(existing) ? existing : [];
    if (!list.some((item: string) => item.toLowerCase() === clean.toLowerCase())) {
      list.push(clean);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch {}

  if (cachedSuggestions) {
    if (type === 'grupoScout') {
      if (!cachedSuggestions.gruposScout.some((g) => g.toLowerCase() === clean.toLowerCase())) {
        cachedSuggestions.gruposScout.unshift(clean);
      }
      if (!cachedSuggestions.fromDatabaseGrupos.includes(clean)) {
        cachedSuggestions.fromDatabaseGrupos.unshift(clean);
      }
    } else {
      if (!cachedSuggestions.regiones.some((r) => r.toLowerCase() === clean.toLowerCase())) {
        cachedSuggestions.regiones.unshift(clean);
      }
      if (!cachedSuggestions.fromDatabaseRegiones.includes(clean)) {
        cachedSuggestions.fromDatabaseRegiones.unshift(clean);
      }
    }
  }
}


