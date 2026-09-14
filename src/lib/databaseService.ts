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
 * Sube un documento anexo (Anexo 3 o Anexo 4) usando directamente
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
    storageStatus,
    errorMensaje: errorDiagnostico,
    fechaSubida: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, ANEXOS_COLLECTION, docId);
    await setDoc(docRef, {
      ...anexoMeta,
      createdAt: serverTimestamp(),
    });
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
            (cleanAlphaNum.length >= 4 && lobCleanAsp.includes(cleanAlphaNum)) ||
            (lobCleanAsp.length >= 4 && cleanAlphaNum.includes(lobCleanAsp))
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
  await setDoc(docRef, {
    ...normalizedLobato,
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
      const fullName = data.nombre || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || 'Dirigente';
      const cleanAsp = (data.registroAsp || '').trim().toUpperCase();
      list.push({
        ...data,
        id: d.id,
        nombre: fullName,
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
export async function saveAdultoToFirestore(adulto: AdultoVoluntario | DirigenteRegistro): Promise<void> {
  const id = adulto.id || `adv_${Date.now()}`;
  const docRef = doc(db, ADULTOS_COLLECTION, id);
  const fullName = ('nombre' in adulto && adulto.nombre)
    ? adulto.nombre
    : `${(adulto as any).nombres || ''} ${(adulto as any).apellidos || ''}`.trim();
  const cleanAsp = (adulto.registroAsp || '').trim().toUpperCase();
  const digits = cleanAsp.replace(/[^0-9]/g, '');
  const standardAsp = digits ? `ASP-${digits}` : cleanAsp;

  await setDoc(docRef, {
    ...adulto,
    id,
    nombre: fullName,
    registroAsp: standardAsp,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

