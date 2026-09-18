import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  User,
  Shield,
  Plus,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  Users,
  Gamepad2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Compass,
  FileCheck,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { AdultoVoluntario, Lobato, ViewMode } from '../types';
import { formatFechaNacimiento, calcularEdad, groupLobatosBySeisena, getSeisenaInfo } from '../utils/lobatoUtils';
import { uploadDocumentoAnexo, saveLobatoToFirestore, getAdultosFromFirestore, getLobatosByAdulto } from '../lib/databaseService';
import { REGIONES_LOCALIDADES_SCOUT } from '../data/regionesScout';
import { FieldInfoTooltip } from './FieldInfoTooltip';
import { ScoutSuggestInput } from './ScoutSuggestInput';
import { useScoutSuggestions } from '../hooks/useScoutSuggestions';

interface LobatosRegistrationScreenProps {
  onBack: () => void;
  onGoToNicknames?: () => void;
  onOpenSummary: (adulto: AdultoVoluntario, lobatos: Lobato[]) => void;
  onEditLobato: (lobato: Lobato) => void;
  onDeleteLobato: (lobato: Lobato) => void;
  lobatos: Lobato[];
  setLobatos: React.Dispatch<React.SetStateAction<Lobato[]>>;
  selectedAdulto: AdultoVoluntario | null;
  setSelectedAdulto: (adulto: AdultoVoluntario | null) => void;
}

export const LobatosRegistrationScreen: React.FC<LobatosRegistrationScreenProps> = ({
  onBack,
  onGoToNicknames,
  onOpenSummary,
  onEditLobato,
  onDeleteLobato,
  lobatos,
  setLobatos,
  selectedAdulto,
  setSelectedAdulto,
}) => {
  // ASP Search & Validation State
  const [aspSearchType, setAspSearchType] = useState<'ASP' | 'OTRO'>('ASP');
  const [aspSearchQuery, setAspSearchQuery] = useState('');
  const [aspSearchError, setAspSearchError] = useState<string | null>(null);
  const [aspSuccessBanner, setAspSuccessBanner] = useState<string | null>(null);
  const anexo4FileInputRef = useRef<HTMLInputElement>(null);

  // Sugerencias inteligentes unificadas de Grupo Scout y Región / Localidad
  const {
    gruposScout,
    regiones,
    dbGruposSet,
    dbRegionesSet,
    addCustomSuggestion,
  } = useScoutSuggestions();

  // Limite estricto de seisena
  const MAX_SEISENA_LOBATOS = 6;
  const isSeisenaFull = lobatos.length >= MAX_SEISENA_LOBATOS;

  // Lobatos ya guardados en Firestore para este dirigente (NO se muestran en el formulario de registro)
  const [dbRegisteredLobatos, setDbRegisteredLobatos] = useState<Lobato[]>([]);
  const [isLoadingDbLobatos, setIsLoadingDbLobatos] = useState(false);

  // Cargar lobatos guardados en BD cuando cambia o existe el dirigente seleccionado
  useEffect(() => {
    if (selectedAdulto?.id) {
      setIsLoadingDbLobatos(true);
      getLobatosByAdulto(selectedAdulto.id, selectedAdulto.registroAsp)
        .then((saved) => {
          setDbRegisteredLobatos(saved || []);
        })
        .catch(() => setDbRegisteredLobatos([]))
        .finally(() => setIsLoadingDbLobatos(false));
    } else {
      setDbRegisteredLobatos([]);
    }
  }, [selectedAdulto?.id, selectedAdulto?.registroAsp]);

  const registeredSeisenas = useMemo(() => {
    return groupLobatosBySeisena(dbRegisteredLobatos);
  }, [dbRegisteredLobatos]);

  const registeredSeisenasCount = registeredSeisenas.length;
  const nextSeisenaNum = registeredSeisenasCount + 1;
  const currentSeisenaInfo = useMemo(() => getSeisenaInfo(nextSeisenaNum), [nextSeisenaNum]);
  const currentSeisenaLabel = currentSeisenaInfo.nombreCompleto;

  const selectedAdultFullName = useMemo(() => {
    if (!selectedAdulto) return '';
    const raw = selectedAdulto as any;
    const computedCombined = `${raw.nombres || ''} ${raw.apellidos || ''}`.trim();
    const candidates = [
      typeof selectedAdulto.nombre === 'string' && selectedAdulto.nombre.trim(),
      computedCombined,
      typeof raw.nombreCompleto === 'string' && raw.nombreCompleto.trim(),
      typeof raw.fullName === 'string' && raw.fullName.trim(),
      typeof raw.adultoNombre === 'string' && raw.adultoNombre.trim(),
      typeof raw.dirigenteNombre === 'string' && raw.dirigenteNombre.trim(),
      typeof raw.name === 'string' && raw.name.trim(),
      typeof raw.displayName === 'string' && raw.displayName.trim(),
    ].filter(Boolean) as string[];

    const validCandidate = candidates.find(
      (c) => c && c.toLowerCase() !== 'dirigente' && c.toLowerCase() !== 'dirigente scout'
    );
    if (validCandidate) return validCandidate;

    // Si los lobatos guardados de este dirigente tienen su nombre
    if (dbRegisteredLobatos.length > 0) {
      const fromLob = dbRegisteredLobatos.find(
        (l) => l.adultoNombre && l.adultoNombre.toLowerCase() !== 'dirigente' && l.adultoNombre.toLowerCase() !== 'dirigente scout'
      );
      if (fromLob?.adultoNombre) return fromLob.adultoNombre;
    }

    return candidates[0] || 'Dirigente Scout';
  }, [selectedAdulto, dbRegisteredLobatos]);

  const existingDnis = useMemo(() => {
    const set = new Set<string>();
    dbRegisteredLobatos.forEach((l) => {
      if (l.dni) set.add(l.dni.trim());
    });
    return set;
  }, [dbRegisteredLobatos]);

  // New Lobato Form State (strictly empty initially)
  const [formNombres, setFormNombres] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formFechaNac, setFormFechaNac] = useState('');
  const [formGrupoScout, setFormGrupoScout] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formRoblox, setFormRoblox] = useState('');
  const [formAnexo4, setFormAnexo4] = useState('');
  const [formAnexo4FileName, setFormAnexo4FileName] = useState('');
  const [formAnexo4FileSize, setFormAnexo4FileSize] = useState('');
  const [formAnexo4DocId, setFormAnexo4DocId] = useState('');
  const [isUploadingAnexo4, setIsUploadingAnexo4] = useState(false);
  const [isDraggingAnexo4, setIsDraggingAnexo4] = useState(false);
  const [anexo4StatusNotice, setAnexo4StatusNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // View Mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Unsaved Exit Warning
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [adultosList, setAdultosList] = useState<AdultoVoluntario[]>([]);

  // Load registered adultos from Firestore
  useEffect(() => {
    async function fetchAdults() {
      try {
        const remote = await getAdultosFromFirestore();
        if (remote) {
          // Evitar duplicados por registroAsp
          const map = new Map<string, AdultoVoluntario>();
          remote.forEach((ad) => {
            if (ad.registroAsp) {
              map.set(ad.registroAsp.toUpperCase(), ad);
            }
          });
          setAdultosList(Array.from(map.values()));
        }
      } catch (e) {
        console.warn('Error cargando lista de dirigentes:', e);
      }
    }
    fetchAdults();
  }, []);

  // Form validity check for strict validation
  const isFormComplete = Boolean(
    selectedAdulto &&
    formNombres.trim() &&
    formApellidos.trim() &&
    formDni.trim() &&
    formFechaNac.trim() &&
    formGrupoScout.trim() &&
    formCiudad.trim() &&
    formAnexo4.trim() &&
    !isUploadingAnexo4
  );

  // Validate ASP Code or International Scout Code
  const handleValidateAsp = (aspToTest?: string) => {
    const rawVal = (aspToTest !== undefined ? aspToTest : aspSearchQuery).trim();
    setAspSearchError(null);
    setAspSuccessBanner(null);

    if (!rawVal) {
      setAspSearchError(
        aspSearchType === 'ASP'
          ? 'Por favor ingresa los números de tu Registro ASP (ej. 202021).'
          : 'Por favor ingresa tu código scout registrado.'
      );
      return;
    }

    const inputDigits = rawVal.replace(/[^0-9]/g, '');
    const cleanRawUpper = rawVal.toUpperCase();
    const expectedStandard = inputDigits ? `ASP-${inputDigits}` : cleanRawUpper;

    // Búsqueda por coincidencia ESTRICTA y EXACTA (sin includes ni coincidencias parciales)
    const found = adultosList.find((adult: AdultoVoluntario) => {
      const adultRaw = (adult.registroAsp || '').trim().toUpperCase();
      const adultDigits = adultRaw.replace(/[^0-9]/g, '');
      return (
        (adultDigits !== '' && adultDigits === inputDigits) ||
        adultRaw === expectedStandard ||
        adultRaw === `ASP${inputDigits}` ||
        adultRaw === cleanRawUpper
      );
    });

    if (found) {
      setSelectedAdulto(found);
      // El formulario y la lista de seisena siempre inician VACÍOS para registrar la nueva seisena
      setLobatos([]);

      // Consultar lobatos que ya están guardados en la base de datos para este dirigente (NO se muestran en el formulario)
      setIsLoadingDbLobatos(true);
      getLobatosByAdulto(found.id, found.registroAsp)
        .then((saved) => {
          setDbRegisteredLobatos(saved || []);
        })
        .catch(() => setDbRegisteredLobatos([]))
        .finally(() => setIsLoadingDbLobatos(false));

      // Los campos de grupo y ciudad del nuevo lobato DEBEN iniciar estrictamente en blanco
      setFormGrupoScout('');
      setFormCiudad('');
      setFormNombres('');
      setFormApellidos('');
      setFormDni('');
      setFormFechaNac('');
      setFormRoblox('');
      setFormAnexo4('');
      setFormAnexo4FileName('');
      setIsUploadingAnexo4(false);
      setAnexo4StatusNotice(null);
      setFormErrors({});
      setAspSearchQuery('');
      setAspSearchError(null);
      const foundFullName = found.nombre?.trim() || `${(found as any).nombres || ''} ${(found as any).apellidos || ''}`.trim() || 'Dirigente';
      setAspSuccessBanner(`✓ ¡Dirigente ${foundFullName} verificado exitosamente (${found.registroAsp})!`);
      setTimeout(() => {
        setAspSuccessBanner(null);
      }, 4500);
    } else {
      setAspSearchError(`❌ El código ASP-${inputDigits} no coincide con ningún dirigente registrado. Verifica el número exacto e intenta nuevamente.`);
    }
  };

  const handleClearAdult = () => {
    setSelectedAdulto(null);
    setLobatos([]);
    setDbRegisteredLobatos([]);
    setFormNombres('');
    setFormApellidos('');
    setFormDni('');
    setFormFechaNac('');
    setFormGrupoScout('');
    setFormCiudad('');
    setFormRoblox('');
    setFormAnexo4('');
    setFormAnexo4FileName('');
    setFormAnexo4FileSize('');
    setFormAnexo4DocId('');
    setIsUploadingAnexo4(false);
    setIsDraggingAnexo4(false);
    setAnexo4StatusNotice(null);
    setFormErrors({});
    setAspSearchQuery('');
    setAspSearchError(null);
    setAspSuccessBanner(null);
    if (anexo4FileInputRef.current) {
      anexo4FileInputRef.current.value = '';
    }
  };

  const processAnexo4File = async (file: File) => {
    if (!file) return;
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
    setFormAnexo4FileName(file.name);
    setFormAnexo4FileSize(formattedSize);
    setIsUploadingAnexo4(true);
    setAnexo4StatusNotice(null);
    if (formErrors.anexo4) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.anexo4;
        return next;
      });
    }

    try {
      const uploadResult = await uploadDocumentoAnexo('ANEXO_4_LOBATO', file, selectedAdulto?.id);
      const uploadedUrl = uploadResult.meta?.downloadUrl || uploadResult.meta?.dataUrl || '';
      if (uploadResult.success && uploadedUrl) {
        setFormAnexo4(uploadedUrl);
        setFormAnexo4DocId(uploadResult.meta.id);
        setAnexo4StatusNotice({
          type: 'success',
          message: `✓ Permiso Anexo 4 guardado en Google Cloud Storage (${file.name} • ${formattedSize})`,
        });
      } else if (uploadedUrl) {
        setFormAnexo4(uploadedUrl);
        setFormAnexo4DocId(uploadResult.meta.id);
        setAnexo4StatusNotice({
          type: 'success',
          message: `✓ Documento procesado y respaldado (${file.name} • ${formattedSize})`,
        });
      } else {
        setFormAnexo4('');
        setFormAnexo4FileName('');
        setFormAnexo4FileSize('');
        setFormAnexo4DocId('');
        setAnexo4StatusNotice({
          type: 'error',
          message: `❌ Falló la subida: ${uploadResult.error || 'No se pudo obtener la URL de descarga'}`,
        });
      }
    } catch (err: any) {
      console.error('[LobatosRegistration] Error al subir anexo 4:', err);
      setFormAnexo4('');
      setFormAnexo4FileName('');
      setFormAnexo4FileSize('');
      setFormAnexo4DocId('');
      setAnexo4StatusNotice({
        type: 'error',
        message: `❌ Error al subir: ${err?.message || String(err)}`,
      });
    } finally {
      setIsUploadingAnexo4(false);
    }
  };

  const handleAnexo4File = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAnexo4File(file);
    }
  };

  // Add Lobato action
  const handleAddLobato = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdulto) return;

    if (lobatos.length >= MAX_SEISENA_LOBATOS) {
      setFormErrors({ general: '¡Tope de seisena alcanzado! Una seisena tiene un máximo de 6 lobatos por registro.' });
      return;
    }

    const errors: Record<string, string> = {};
    if (!formNombres.trim()) errors.nombres = 'Ingresa el nombre del lobato';
    if (!formApellidos.trim()) errors.apellidos = 'Ingresa los apellidos';
    if (!formDni.trim()) errors.dni = 'Ingresa el DNI / Identificación';
    if (!formFechaNac.trim()) errors.fechaNacimiento = 'Selecciona la fecha de nacimiento';
    if (!formGrupoScout.trim()) errors.grupoScout = 'Ingresa el Grupo Scout y numeral (ej. Lima 02)';
    if (!formCiudad.trim()) errors.ciudad = 'Ingresa la Región - Localidad (ej. Arequipa Sur XI)';
    if (!formAnexo4.trim()) {
      errors.anexo4 = 'Obligatorio: debes subir el archivo del Anexo 4 (Permiso del Padre/Tutor)';
    } else if (isUploadingAnexo4) {
      errors.anexo4 = 'Por favor espera a que termine de subirse el archivo Anexo 4';
    }

    if (formDni.trim()) {
      if (existingDnis.has(formDni.trim())) {
        errors.dni = `Este lobato (DNI: ${formDni.trim()}) ya fue registrado en una seisena previa en la base de datos.`;
      } else if (lobatos.some((l) => l.dni.trim() === formDni.trim())) {
        errors.dni = `Este DNI (${formDni.trim()}) ya está agregado en la seisena actual.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const rawAsp = (selectedAdulto.registroAsp || '').trim().toUpperCase();
    const digits = rawAsp.replace(/[^0-9]/g, '');
    const standardAsp = digits ? `ASP-${digits}` : rawAsp;

    const adultFullName = selectedAdulto.nombre 
      || `${(selectedAdulto as any).nombres || ''} ${(selectedAdulto as any).apellidos || ''}`.trim() || 'Dirigente';

    const cleanNick = formRoblox.replace(/^@+/, '').trim();
    const finalRobloxNick = cleanNick 
      ? (cleanNick.startsWith('@') ? cleanNick : `@${cleanNick}`)
      : `@Scout_${formNombres.split(' ')[0].toLowerCase()}26`;

    const newLobato: Lobato = {
      id: 'lob-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      orden: lobatos.length + 1,
      nombres: formNombres.trim(),
      apellidos: formApellidos.trim(),
      dni: formDni.trim(),
      fechaNacimiento: formFechaNac.trim(),
      nicknameRoblox: finalRobloxNick,
      grupoScout: formGrupoScout.trim(),
      ciudad: formCiudad.trim(),
      unidad: formGrupoScout.trim(),
      permisoPadreAnexo4: formAnexo4.trim(), // URL estricta y real del documento
      permisoPadreAnexo4Name: formAnexo4FileName.trim(),
      permisoPadreAnexo4Size: formAnexo4FileSize.trim(),
      permisoPadreAnexo4DocId: formAnexo4DocId.trim(),
      adultoId: selectedAdulto.id,
      adultoNombre: adultFullName,
      adultoAsp: standardAsp,
      createdAt: Date.now(),
      seisena: currentSeisenaLabel,
    };

    if (formGrupoScout.trim()) {
      addCustomSuggestion('grupoScout', formGrupoScout.trim());
    }
    if (formCiudad.trim()) {
      addCustomSuggestion('region', formCiudad.trim());
    }

    setLobatos((prev) => {
      const next = [...prev, newLobato];
      const cleanAspKey = standardAsp.replace(/[^A-Z0-9]/g, '');
      if (cleanAspKey) {
        sessionStorage.setItem(`draft_seisena_${cleanAspKey}`, JSON.stringify(next));
      }
      return next;
    });

    // LIMPIAR INMEDIATAMENTE TODOS LOS ESTADOS (Formulario completamente en blanco y avisos reseteados)
    setFormNombres('');
    setFormApellidos('');
    setFormDni('');
    setFormFechaNac('');
    setFormGrupoScout('');
    setFormCiudad('');
    setFormRoblox('');
    setFormAnexo4('');
    setFormAnexo4FileName('');
    setFormAnexo4FileSize('');
    setFormAnexo4DocId('');
    setIsUploadingAnexo4(false);
    setIsDraggingAnexo4(false);
    setAnexo4StatusNotice(null);
    setFormErrors({});
    if (anexo4FileInputRef.current) {
      anexo4FileInputRef.current.value = '';
    }

    // Mostrar mensaje de éxito temporal
    setSuccessBanner(`✓ Lobato #${String(newLobato.orden).padStart(2, '0')} agregado a la ${currentSeisenaLabel} (${lobatos.length + 1}/6).`);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  const handleBackAttempt = () => {
    if (lobatos.length > 0 || formNombres || formApellidos || formDni) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 space-y-6"
    >
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handleBackAttempt}
          className="btn-3d btn-red py-2 px-4 text-sm"
        >
          ← VOLVER
        </button>

        <div className="text-center flex-1 mx-2 sm:mx-8 flex items-center justify-center gap-3">
          <img
            src="/assets/images/lobatos.png"
            alt="Lobatos"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-black object-cover shadow-[2px_2px_0_#000] shrink-0"
          />
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase text-white font-game"
            style={{
              WebkitTextStroke: '1.5px #000000',
              textShadow: '2px 2px 0 #000000',
            }}
          >
            Registro de Lobatos • Seisena
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl border-3 border-black text-xs font-bold font-game shadow-[2px_2px_0_#000] ${
            isSeisenaFull ? 'bg-amber-300 text-black' : 'bg-white text-black'
          }`}>
            🐾 Seisena: <span className="text-blue-600 font-extrabold">{lobatos.length}</span>/6
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PASO 1: VALIDACIÓN OBLIGATORIA DEL DIRIGENTE POR CÓDIGO ASP */}
      {/* ============================================================ */}
      <div className="space-y-3">
        {/* If NO adult is selected: Show ASP code search and validation */}
        {!selectedAdulto ? (
          <div className="win-3d p-5 sm:p-6 bg-white">
            <div className="border-b-4 border-black pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-black font-game flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span>Paso 1: Validación del Dirigente Responsable</span>
              </h3>
              <span className="text-xs font-bold text-red-600 bg-red-100 border-2 border-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-[1px_1px_0_#000]">
                <Lock className="w-3.5 h-3.5" /> Requerido antes de registrar
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 font-semibold mb-4 leading-relaxed">
              Para habilitar el ingreso de lobatos, debes identificar y autenticar al adulto voluntario o dirigente a cargo ingresando su <strong>Código ASP</strong> (Scouts del Perú) o <strong>Código Scout</strong> internacional.
            </p>

            {/* Search by ASP form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateAsp();
              }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center">
                  <label className="block text-xs font-bold uppercase text-slate-900 font-game">
                    Código ASP / Scout del Dirigente <span className="text-red-500">*</span>
                  </label>
                  <FieldInfoTooltip
                    title="Código ASP o Scout"
                    content="Si perteneces a Scouts del Perú, ingresa los números de tu Registro ASP. Si eres de otro país, selecciona 'Otro País' e ingresa el código scout registrado por tu asociación."
                  />
                </div>

                {/* Selector tipo toggle */}
                <div className="inline-flex p-1 rounded-xl bg-slate-200 border-2 border-black text-xs font-bold shadow-[1px_1px_0_#000]">
                  <button
                    type="button"
                    onClick={() => {
                      setAspSearchType('ASP');
                      setAspSearchQuery('');
                      setAspSearchError(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      aspSearchType === 'ASP'
                        ? 'bg-yellow-400 text-black shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <span>🇵🇪</span>
                    <span>ASP (Perú)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAspSearchType('OTRO');
                      setAspSearchQuery('');
                      setAspSearchError(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      aspSearchType === 'OTRO'
                        ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <span>🌐</span>
                    <span>Otro País (Scout)</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {aspSearchType === 'ASP' ? (
                  <div className="flex rounded-xl overflow-hidden border-3 border-black shadow-[3px_3px_0_#000] bg-white flex-1 focus-within:ring-3 focus-within:ring-yellow-400">
                    <div className="bg-yellow-400 text-black font-game font-extrabold px-3.5 py-3 border-r-3 border-black flex items-center justify-center select-none text-base sm:text-lg tracking-wider shrink-0">
                      ASP-
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={aspSearchQuery}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                        setAspSearchQuery(onlyDigits);
                        setAspSearchError(null);
                      }}
                      placeholder="Solo números (ej. 202021)"
                      className="flex-1 px-4 py-3 text-base sm:text-lg font-bold font-mono text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={aspSearchQuery}
                    onChange={(e) => {
                      setAspSearchQuery(e.target.value);
                      setAspSearchError(null);
                    }}
                    placeholder="Ingresa el código o número scout de tu país"
                    className="input-3d flex-1 text-base sm:text-lg font-bold font-mono py-3"
                    autoFocus
                  />
                )}

                <button
                  type="submit"
                  className="btn-3d btn-blue py-3 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 shadow-[2px_2px_0_#000]"
                >
                  <Check className="w-4 h-4" />
                  <span>Validar Código</span>
                </button>
              </div>

              {/* Error notification if not found */}
              <AnimatePresence>
                {aspSearchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3 rounded-xl bg-red-100 border-3 border-black text-red-900 text-xs sm:text-sm font-bold font-game flex items-center justify-between gap-2 shadow-[2px_2px_0_#000]"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{aspSearchError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAspSearchError(null)}
                      className="text-black font-bold px-1 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        ) : (
          /* ============================================================ */
          /* CABECERA DEL DIRIGENTE VALIDADO (Highlighted 3D Header) */
          /* ============================================================ */
          <div className="space-y-2">
            {/* OK Success Banner */}
            <AnimatePresence>
              {aspSuccessBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl bg-emerald-100 border-3 border-black text-emerald-950 text-xs sm:text-sm font-bold font-game flex items-center justify-between gap-2 shadow-[2px_2px_0_#000]"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{aspSuccessBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAspSuccessBanner(null)}
                    className="text-black font-bold px-1 hover:text-emerald-700"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="
                rounded-2xl border-4 border-black bg-slate-900 text-white p-4 sm:p-5
                shadow-[6px_6px_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                w-full max-w-full overflow-hidden
              "
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
                <div className="bg-white text-blue-600 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl border-3 border-black shadow-[2px_2px_0_#000] shrink-0">
                  👤
                </div>

                <div className="min-w-0 flex-1">
                  {/* Tipo / Cargo */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="bg-yellow-400 text-black border-2 border-black font-game text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-[1px_1px_0_#000]">
                      {selectedAdulto.cargo || 'DIRIGENTE A CARGO'}
                    </span>
                  </div>

                  {/* Nombre Completo del Dirigente - Alto Contraste y Siempre Visible */}
                  <h3 className="font-game font-extrabold text-xl sm:text-2xl uppercase tracking-wide text-yellow-400 drop-shadow-[1px_1px_0_#000] break-words">
                    {selectedAdultFullName}
                  </h3>

                  {/* Datos estrictos: Código, GS y Localidad o Ciudad */}
                  <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2 flex-wrap mt-1 min-w-0">
                    <span className="bg-black/60 px-2.5 py-0.5 rounded font-mono font-bold text-yellow-300 border border-yellow-400/40 shadow-[1px_1px_0_#000]">
                      Código: {selectedAdulto.registroAsp}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-100 font-bold truncate max-w-[240px]">
                      GS: {selectedAdulto.grupoScout || selectedAdulto.unidad || 'Sin especificar'}
                    </span>
                    {(selectedAdulto.ciudad || selectedAdulto.localidad) && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 truncate max-w-[180px]">
                          {selectedAdulto.ciudad || selectedAdulto.localidad}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearAdult}
                className="btn-3d btn-yellow py-2 px-4 text-xs self-end sm:self-center shadow-[0_4px_0_#000] flex items-center gap-1.5 shrink-0"
              >
                <span>🔄 Cambiar Dirigente</span>
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* CONTENEDOR PRINCIPAL: FORMULARIO + PARTICIPANTES */}
      {/* ============================================================ */}
      {selectedAdulto ? (
        <div className="space-y-4">
          {/* RESUMEN MINIMALISTA DEL ESTADO DE SEISENAS PREVIAS */}
          {isLoadingDbLobatos ? (
            <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-black text-black text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Verificando estado con la base de datos...</span>
            </div>
          ) : dbRegisteredLobatos.length > 0 ? (
            <div className="px-3.5 py-2 bg-slate-100 border-2 border-black rounded-xl text-black shadow-[2px_2px_0_#000] flex flex-wrap items-center justify-between gap-2 text-xs font-game">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md font-bold uppercase text-[11px]">
                  Guardados: {dbRegisteredLobatos.length} lobatos ({registeredSeisenasCount} seisena{registeredSeisenasCount > 1 ? 's' : ''})
                </span>
                <span className="text-slate-700 font-bold text-[11px]">
                  • Registrando ahora: <strong className="text-blue-900 uppercase font-extrabold">{currentSeisenaLabel}</strong>
                </span>
              </div>

              {onGoToNicknames && (
                <button
                  type="button"
                  onClick={onGoToNicknames}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 shrink-0"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Ver seisenas registradas →</span>
                </button>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PANEL IZQUIERDO: NUEVO LOBATO */}
          <div className="lg:col-span-5 win-3d p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-4 border-black pb-2">
              <div className="min-w-0">
                <h3 className="text-xl font-bold uppercase font-game text-black flex items-center gap-2">
                  <img
                    src="/assets/images/lobatos.png"
                    alt="Lobato"
                    className="w-6 h-6 rounded-full border border-black object-cover"
                  />
                  <span>Nuevo Lobato ({currentSeisenaLabel})</span>
                </h3>
                {selectedAdulto && (
                  <p className="text-xs font-bold text-slate-700 font-game mt-0.5 truncate">
                    Dirigente: <span className="text-blue-900 uppercase font-extrabold">{selectedAdultFullName}</span>
                  </p>
                )}
              </div>
              {selectedAdulto && (
                <span className="text-xs font-bold text-green-700 bg-green-100 border-2 border-black px-2 py-0.5 rounded-lg shrink-0">
                  Listo
                </span>
              )}
            </div>

          {/* SUCCESS BANNER NOTIFICATION */}
          <AnimatePresence>
            {successBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-3 rounded-xl bg-green-100 border-3 border-black text-green-900 text-xs font-bold font-game flex items-center justify-between gap-2 shadow-[2px_2px_0_#000]"
              >
                <span>{successBanner}</span>
                <button onClick={() => setSuccessBanner(null)} className="text-black font-bold">
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAddLobato} className="flex flex-col gap-3.5">
            {/* Nombres */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                NOMBRES <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!selectedAdulto}
                value={formNombres}
                onChange={(e) => setFormNombres(e.target.value)}
                placeholder="Ej. Juan Diego"
                className="input-3d"
              />
              {formErrors.nombres && (
                <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.nombres}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!selectedAdulto}
                value={formApellidos}
                onChange={(e) => setFormApellidos(e.target.value)}
                placeholder="Ej. Pérez Silva"
                className="input-3d"
              />
              {formErrors.apellidos && (
                <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.apellidos}</p>
              )}
            </div>

            {/* DNI & Roblox Nick */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <label className="text-xs font-bold uppercase text-black font-game">
                    DNI / Documento <span className="text-red-500">*</span>
                  </label>
                  <FieldInfoTooltip
                    title="Documento de Identidad"
                    content="Ingresa el DNI del lobato si reside en Perú, o su número de cédula / documento nacional de identidad si es de cualquier otro país."
                  />
                </div>
                <input
                  type="text"
                  disabled={!selectedAdulto}
                  value={formDni}
                  onChange={(e) => setFormDni(e.target.value)}
                  placeholder="Ej. 78291034 o Cédula"
                  className="input-3d"
                />
                {formErrors.dni && (
                  <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.dni}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <label className="text-xs font-bold uppercase text-black font-game">
                    Roblox Nick
                  </label>
                  <FieldInfoTooltip
                    title="Nickname de Roblox"
                    content="Nombre de usuario del lobato en Roblox para participar en la Misión Virtual. El @ se añade automáticamente."
                  />
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-500 font-black font-mono text-sm select-none pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    disabled={!selectedAdulto}
                    value={formRoblox.replace(/^@+/, '')}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/^@+/, '');
                      setFormRoblox(clean ? `@${clean}` : '');
                    }}
                    placeholder="akela_2809"
                    className="input-3d !pl-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                {formFechaNac && calcularEdad(formFechaNac) !== null && (
                  <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {calcularEdad(formFechaNac)} años aprox.
                  </span>
                )}
              </div>
              <input
                type="date"
                disabled={!selectedAdulto}
                value={formFechaNac}
                onChange={(e) => setFormFechaNac(e.target.value)}
                className="input-3d cursor-pointer text-sm font-bold"
              />
              {formErrors.fechaNacimiento && (
                <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.fechaNacimiento}</p>
              )}
            </div>

            {/* Indicador de Seisena con Animal y Título Oficial */}
            <div className="bg-amber-50 border-2 border-black rounded-xl p-3 flex items-center justify-between shadow-[2px_2px_0_#000]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none" role="img" aria-label={currentSeisenaInfo.animal}>
                  {currentSeisenaInfo.emoji}
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase text-black font-game block tracking-wide">
                    Cupo de la {currentSeisenaInfo.nombreCompleto}
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold">
                    Máximo 6 lobatos por registro de seisena (Seisena #{currentSeisenaInfo.numero} de tu manada)
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg border-2 border-black font-game font-extrabold text-xs sm:text-sm shadow-[1px_1px_0_#000] shrink-0 ${
                isSeisenaFull ? 'bg-amber-400 text-black' : 'bg-white text-blue-700'
              }`}>
                {lobatos.length} / 6 Lobatos
              </span>
            </div>

            {/* Grupo Scout y numeral */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Grupo Scout y numeral <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Grupo Scout"
                  content="Ingresa o selecciona el nombre del Grupo Scout y numeral asignado (ej. Lima 02, o la denominación según su país). Si no existe en la lista, puedes registrarlo por primera vez."
                />
              </div>
              <ScoutSuggestInput
                id="lobato-grupo-scout"
                disabled={!selectedAdulto}
                value={formGrupoScout}
                onChange={(val) => {
                  setFormGrupoScout(val);
                  if (formErrors.grupoScout) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.grupoScout;
                      return next;
                    });
                  }
                }}
                placeholder="Ej. Lima 02 (o según su país)"
                categoryType="grupoScout"
                suggestions={gruposScout}
                dbSuggestionsSet={dbGruposSet}
                onBlurCustom={(val) => addCustomSuggestion('grupoScout', val)}
                error={formErrors.grupoScout}
              />
              {formErrors.grupoScout && (
                <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.grupoScout}</p>
              )}
            </div>

            {/* Región - Localidad */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Región - Localidad <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Región o Localidad"
                  content="Debe poner su región o localidad a la que pertenece acompañado de los números romanos o como se especifique según su país (ej. Arequipa Sur XI, Lima XVIII, o según su país)."
                />
              </div>
              <ScoutSuggestInput
                id="lobato-region-ciudad"
                disabled={!selectedAdulto}
                value={formCiudad}
                onChange={(val) => {
                  setFormCiudad(val);
                  if (formErrors.ciudad) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.ciudad;
                      return next;
                    });
                  }
                }}
                placeholder="Ej. Arequipa Sur XI (o según su país)"
                categoryType="region"
                suggestions={regiones}
                dbSuggestionsSet={dbRegionesSet}
                onBlurCustom={(val) => addCustomSuggestion('region', val)}
                error={formErrors.ciudad}
              />
              {formErrors.ciudad && (
                <p className="text-[11px] font-bold text-red-600 font-game">{formErrors.ciudad}</p>
              )}
            </div>

            {/* Permiso de Padre de Familia (Anexo 4) */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Permiso de padre de familia (Anexo 4)
                </label>
                <FieldInfoTooltip
                  title="Permiso de Padres"
                  content="Autorización y consentimiento firmado del padre, madre o apoderado para participar en las actividades del evento."
                />
              </div>

              <input
                ref={anexo4FileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleAnexo4File}
                className="hidden"
                id="anexo4-file-input"
              />

              {!formAnexo4 ? (
                <div
                  onClick={() => anexo4FileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingAnexo4(true);
                  }}
                  onDragLeave={() => setIsDraggingAnexo4(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingAnexo4(false);
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) {
                      processAnexo4File(droppedFile);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isDraggingAnexo4
                      ? 'bg-blue-100 border-blue-600 scale-[1.01]'
                      : 'bg-slate-50 hover:bg-slate-100 border-black'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Upload className="w-4 h-4 text-black" />
                    <span>{isDraggingAnexo4 ? 'Soltar archivo aquí...' : 'Adjuntar Anexo 4 (PDF / Imagen) *'}</span>
                  </div>
                  <span className="btn-3d btn-yellow py-0.5 px-2 text-[10px] shadow-[0_1px_0_#000]">
                    Subir
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-black rounded-xl p-2 flex items-center justify-between gap-2 shadow-[1px_1px_0_#000]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-game font-bold text-xs text-black truncate max-w-[170px] sm:max-w-[220px]" title={formAnexo4FileName || 'Documento Anexo 4'}>
                        {formAnexo4FileName || 'Documento Anexo 4'}
                      </span>
                      {formAnexo4FileSize && (
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          {formAnexo4FileSize}
                        </span>
                      )}
                    </div>
                    {isUploadingAnexo4 ? (
                      <span className="flex items-center gap-1 text-[10px] text-blue-700 font-bold ml-1 shrink-0">
                        <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-bold ml-1 shrink-0">
                        ✓ Guardado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {formAnexo4.startsWith('http') && (
                      <a
                        href={formAnexo4}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded px-1.5 py-0.5"
                        title="Ver documento subido en pestaña nueva"
                      >
                        Ver ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormAnexo4('');
                        setFormAnexo4FileName('');
                        setFormAnexo4FileSize('');
                        setFormAnexo4DocId('');
                        setAnexo4StatusNotice(null);
                        if (anexo4FileInputRef.current) anexo4FileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800 font-bold text-xs p-1"
                      title="Quitar archivo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Error si falta el Anexo 4 */}
              {formErrors.anexo4 && (
                <p className="text-[11px] font-bold text-red-600 font-game flex items-center gap-1 mt-0.5">
                  <span>⚠️</span> {formErrors.anexo4}
                </p>
              )}

              {/* Status Notice de Storage GCS */}
              {anexo4StatusNotice && (
                <div
                  className={`text-[11px] p-2 rounded-lg border border-black font-semibold mt-1 flex items-start gap-1.5 ${
                    anexo4StatusNotice.type === 'success'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
                      : anexo4StatusNotice.type === 'warning'
                      ? 'bg-amber-100 text-amber-950 border-amber-500'
                      : 'bg-red-100 text-red-950 border-red-500'
                  }`}
                >
                  <span className="shrink-0">{anexo4StatusNotice.type === 'success' ? '📁' : '⚠️'}</span>
                  <span>{anexo4StatusNotice.message}</span>
                </div>
              )}
            </div>

            {/* AVISO DE TOPE DE SEISENA */}
            {isSeisenaFull && (
              <div className="p-3 bg-amber-100 border-2 border-black rounded-xl text-amber-950 text-xs font-bold font-game flex items-center gap-2 shadow-[2px_2px_0_#000]">
                <span className="text-xl">🛑</span>
                <div>
                  <div className="uppercase">Tope de Seisena alcanzado (6 de 6)</div>
                  <div className="text-[11px] text-amber-800 normal-case font-medium">
                    Una seisena comprende un máximo de 6 lobatos por registro. Finaliza el registro con el botón a la derecha.
                  </div>
                </div>
              </div>
            )}

            {/* BOTÓN + AGREGAR A LA SEISENA CON VALIDACIÓN ESTRICTA */}
            <div className="mt-2 space-y-1">
              <button
                type="submit"
                disabled={!selectedAdulto || isSeisenaFull || !isFormComplete}
                className={`btn-3d py-3.5 w-full text-base transition-all ${
                  !selectedAdulto || isSeisenaFull || !isFormComplete
                    ? 'bg-slate-200 text-slate-500 border-slate-400 cursor-not-allowed shadow-none opacity-80'
                    : 'btn-green text-lg shadow-[3px_3px_0_#000]'
                }`}
              >
                {isSeisenaFull
                  ? `TOPE DE ${currentSeisenaLabel.toUpperCase()} ALCANZADO (6/6)`
                  : !isFormComplete && selectedAdulto
                  ? `FALTAN DATOS O SUBIR ANEXO 4 (${lobatos.length + 1} de 6)`
                  : `+ AGREGAR A LA ${currentSeisenaLabel.toUpperCase()} (${lobatos.length + 1} de 6)`}
              </button>

              {!selectedAdulto && (
                <div className="text-center mt-1 text-red-600 font-bold text-xs uppercase font-game">
                  <span>🔒 Valida primero al dirigente con su código ASP</span>
                </div>
              )}

              {selectedAdulto && !isSeisenaFull && !isFormComplete && (
                <div className="text-center text-[11px] text-slate-500 font-semibold font-game">
                  <span>* Todos los campos y la subida del Anexo 4 son obligatorios</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* PANEL DERECHO: PARTICIPANTES */}
        <div className="lg:col-span-7 win-3d p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-3">
              <h3 className="text-xl font-bold uppercase font-game text-black flex items-center gap-2">
                <span className="text-2xl select-none">{currentSeisenaInfo.emoji}</span>
                <span>Integrantes de {currentSeisenaInfo.nombreCompleto} ({lobatos.length}/6)</span>
              </h3>
              <div className="flex bg-slate-200 rounded-xl p-1 border-2 border-black">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase font-game transition-all ${
                    viewMode === 'grid' ? 'bg-black text-white' : 'text-black'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase font-game transition-all ${
                    viewMode === 'list' ? 'bg-black text-white' : 'text-black'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>

            {/* VISUALIZADOR DE SLOTS DE LA SEISENA (1 AL 6) */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const lob = lobatos[num - 1];
                const isOccupied = !!lob;
                return (
                  <div
                    key={num}
                    className={`py-1 px-0.5 sm:px-1 rounded-lg border-2 border-black font-game text-center transition-all ${
                      isOccupied
                        ? 'bg-amber-300 text-black shadow-[1px_1px_0_#000]'
                        : 'bg-slate-100 text-slate-400 border-dashed'
                    }`}
                  >
                    <div className="text-[10px] font-extrabold uppercase">
                      {isOccupied ? `✓ Lob #${num}` : `Cupo #${num}`}
                    </div>
                    <div className="text-[9px] font-sans font-bold truncate">
                      {isOccupied ? lob.nombres.split(' ')[0] : 'Libre'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIST OR GRID */}
            <div className="scroll-box overflow-y-auto max-h-[460px] sm:max-h-[500px] pr-2 pb-10">
              {lobatos.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border-2 border-dashed border-black rounded-xl">
                  <div className="text-3xl mb-1 select-none">{currentSeisenaInfo.emoji}</div>
                  <h4 className="font-game text-sm font-bold text-black uppercase">
                    {currentSeisenaInfo.nombreCompleto} vacía (0/6)
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Completa el formulario de la izquierda para agregar integrantes a esta seisena.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-8">
                  {lobatos.map((l, index) => {
                    const edadCalc = calcularEdad(l.fechaNacimiento);
                    const hasAnexo4 = Boolean(
                      l.permisoPadreAnexo4 &&
                      (l.permisoPadreAnexo4.startsWith('http') ||
                        l.permisoPadreAnexo4.startsWith('data:') ||
                        l.permisoPadreAnexo4.startsWith('blob:') ||
                        (l.permisoPadreAnexo4.trim().length > 0 && !l.permisoPadreAnexo4.startsWith('Anexo4_')))
                    );
                    return (
                      <div key={l.id} className="card-lobato flex flex-col justify-between gap-2 bg-white">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="bg-black text-white px-2 py-0.5 rounded-md text-xs font-bold font-game">
                              #{String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-game border border-black bg-blue-100 text-blue-900 truncate max-w-[180px]">
                              🏕️ {l.grupoScout || l.unidad || 'Grupo Scout'} {l.ciudad ? `• ${l.ciudad}` : ''}
                            </span>
                          </div>

                          <div className="font-bold text-base text-black truncate font-game mt-1">
                            {l.nombres} {l.apellidos}
                          </div>

                          <div className="flex justify-between text-xs text-slate-600 font-bold mt-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span>DNI: {l.dni}</span>
                            <span>F. Nac: {formatFechaNacimiento(l.fechaNacimiento)}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-blue-600 font-semibold truncate mt-1">
                            <span className="font-mono">🎮 {l.nicknameRoblox ? (l.nicknameRoblox.startsWith('@') ? l.nicknameRoblox : `@${l.nicknameRoblox}`) : '—'}</span>
                            {edadCalc !== null && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                {edadCalc} años
                              </span>
                            )}
                          </div>

                          {/* Permiso Anexo 4 Indicator */}
                          <div className="mt-1 flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-600 font-bold">Permiso Padre (Anexo 4):</span>
                            {hasAnexo4 ? (
                              l.permisoPadreAnexo4 && l.permisoPadreAnexo4.startsWith('http') ? (
                                <a
                                  href={l.permisoPadreAnexo4}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1 underline"
                                  title={l.permisoPadreAnexo4Name || 'Abrir documento Anexo 4'}
                                >
                                  <span>✓ Adjunto</span>
                                  <span className="text-[9px]">↗</span>
                                </a>
                              ) : (
                                <span className="text-emerald-700 font-extrabold flex items-center gap-1 truncate max-w-[120px]" title={l.permisoPadreAnexo4Name || undefined}>
                                  ✓ Adjunto
                                </span>
                              )
                            ) : (
                              <span className="text-red-600 font-extrabold flex items-center gap-1 truncate max-w-[120px]">
                                ⚠️ No adjunto
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2 pt-2 border-t-2 border-black/10">
                          <button
                            onClick={() => onEditLobato(l)}
                            className="btn-3d btn-yellow py-1 px-2 flex-1 text-xs shadow-[0_2px_0_#000]"
                          >
                            ✏ EDITAR
                          </button>
                          <button
                            onClick={() => onDeleteLobato(l)}
                            className="btn-3d btn-red py-1 px-2 flex-1 text-xs shadow-[0_2px_0_#000]"
                          >
                            🗑 ELIMINAR
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2 pb-8">
                  {lobatos.map((l, index) => {
                    const edadCalc = calcularEdad(l.fechaNacimiento);
                    const hasAnexo4 = Boolean(
                      l.permisoPadreAnexo4 &&
                      (l.permisoPadreAnexo4.startsWith('http') ||
                        l.permisoPadreAnexo4.startsWith('data:') ||
                        l.permisoPadreAnexo4.startsWith('blob:') ||
                        (l.permisoPadreAnexo4.trim().length > 0 && !l.permisoPadreAnexo4.startsWith('Anexo4_')))
                    );
                    return (
                      <div
                        key={l.id}
                        className="bg-white border-3 border-black p-2.5 flex justify-between items-center rounded-xl shadow-[2px_2px_0_#000]"
                      >
                        <div className="flex gap-3 items-center min-w-0">
                          <span className="font-bold text-blue-600 font-game text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-black shrink-0">
                            #{index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-black text-sm truncate">
                              {l.nombres} {l.apellidos}
                            </div>
                            <div className="text-xs text-slate-500 font-semibold truncate flex items-center gap-1.5 flex-wrap">
                              <span>DNI: {l.dni}</span>
                              <span>•</span>
                              <span>F. Nac: {formatFechaNacimiento(l.fechaNacimiento)} {edadCalc ? `(${edadCalc}a)` : ''}</span>
                              <span>•</span>
                              <span>{l.grupoScout || l.unidad} {l.ciudad ? `• ${l.ciudad}` : ''}</span>
                              <span>•</span>
                              {hasAnexo4 ? (
                                l.permisoPadreAnexo4 && l.permisoPadreAnexo4.startsWith('http') ? (
                                  <a
                                    href={l.permisoPadreAnexo4}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:text-emerald-900 underline font-extrabold text-[10px] bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-0.5"
                                    title={l.permisoPadreAnexo4Name || 'Abrir documento Anexo 4'}
                                  >
                                    <span>✓ Anexo 4</span>
                                    <span className="text-[9px]">↗</span>
                                  </a>
                                ) : (
                                  <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-300" title={l.permisoPadreAnexo4Name || undefined}>
                                    ✓ Anexo 4
                                  </span>
                                )
                              ) : (
                                <span className="text-red-600 font-extrabold text-[10px] bg-red-50 px-1 py-0.5 rounded border border-red-300">
                                  ⚠️ Sin Anexo 4
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            onClick={() => onEditLobato(l)}
                            className="btn-3d btn-yellow py-1 px-2 text-xs shadow-[0_2px_0_#000]"
                          >
                            ✏
                          </button>
                          <button
                            onClick={() => onDeleteLobato(l)}
                            className="btn-3d btn-red py-1 px-2 text-xs shadow-[0_2px_0_#000]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FINAL REGISTER ACTION */}
          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t-4 border-black">
            <div className="text-xs font-bold text-slate-700 font-game">
              Integrantes: <span className="text-blue-600 text-base">{lobatos.length}/6</span>
            </div>

            <button
              disabled={lobatos.length === 0 || !selectedAdulto}
              onClick={() => selectedAdulto && onOpenSummary(selectedAdulto, lobatos)}
              className="btn-3d btn-blue py-3 px-6 text-sm sm:text-base flex items-center gap-2"
            >
              <span>✓ REGISTRAR {currentSeisenaLabel.toUpperCase()} ({lobatos.length} LOBATO{lobatos.length === 1 ? '' : 'S'})</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      ) : (
        <div className="win-3d p-8 text-center bg-white/95 max-w-xl mx-auto space-y-4 shadow-[4px_4px_0_#000]">
          <div className="w-16 h-16 rounded-2xl bg-amber-200 border-3 border-black flex items-center justify-center text-3xl mx-auto shadow-[2px_2px_0_#000]">
            🔒
          </div>
          <h3 className="font-game text-xl sm:text-2xl font-bold uppercase text-black">
            Ingreso con Código ASP Requerido
          </h3>
          <p className="text-sm text-slate-700 font-semibold leading-relaxed">
            Para garantizar la privacidad y seguridad de cada grupo scout, debes validar tu código o registro ASP en el paso superior para habilitar el formulario de registro de tu seisena.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 font-game bg-amber-50 px-3 py-1.5 rounded-xl border-2 border-black">
            <span>🛡️ Cada dirigente solo gestiona y visualiza su propia seisena</span>
          </div>
        </div>
      )}

      {/* Unsaved exit safety dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md win-3d p-6 text-black"
          >
            <h3 className="text-xl font-bold uppercase font-game mb-2 text-red-600">
              ⚠️ Información en progreso
            </h3>
            <p className="text-sm text-slate-700 font-semibold mb-5">
              Tienes <strong className="text-blue-600">{lobatos.length} lobato(s)</strong> registrados en esta sesión. ¿Deseas salir al menú principal?
            </p>
            <div className="flex items-center justify-end gap-3 border-t-4 border-black pt-4">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-3d btn-yellow py-2 px-4 text-xs"
              >
                Continuar Aquí
              </button>
              <button
                onClick={onBack}
                className="btn-3d btn-red py-2 px-4 text-xs"
              >
                Salir al Inicio
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

