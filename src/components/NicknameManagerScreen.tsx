import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Search,
  Save,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  LogOut,
  Sparkles,
  CheckCircle2,
  Users,
  UserCheck,
  Edit3,
  X,
  Layers,
  ArrowRight,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { Lobato, AdultoVoluntario } from '../types';
import {
  groupLobatosBySeisena,
  SeisenaGroup,
  MAX_SEISENA_LOBATOS,
} from '../utils/lobatoUtils';
import {
  getAdultosFromFirestore,
  getLobatosByAdulto,
  updateLobatoNicknameInFirestore,
  saveMultipleLobatosToFirestore,
} from '../lib/databaseService';

interface NicknameManagerScreenProps {
  lobatos?: Lobato[];
  onUpdateNickname: (id: string, newNickname: string) => void;
  onUpdateBatchNicknames?: (updatedLobatos: Lobato[]) => void;
  onBack: () => void;
  onGoToRegistration: () => void;
}

// Estilos visuales dinámicos para las seisenas
const SEISENA_PALETTES = [
  {
    bgHeader: 'bg-amber-400',
    border: 'border-black',
    badgeBg: 'bg-amber-100',
    textColor: 'text-black',
    badgeText: 'text-amber-950 border-amber-400',
    iconEmoji: '🐺',
  },
  {
    bgHeader: 'bg-blue-600',
    border: 'border-black',
    badgeBg: 'bg-blue-100',
    textColor: 'text-white',
    badgeText: 'text-blue-900 border-blue-300',
    iconEmoji: '🐾',
  },
  {
    bgHeader: 'bg-emerald-600',
    border: 'border-black',
    badgeBg: 'bg-emerald-100',
    textColor: 'text-white',
    badgeText: 'text-emerald-900 border-emerald-300',
    iconEmoji: '🌲',
  },
  {
    bgHeader: 'bg-red-600',
    border: 'border-black',
    badgeBg: 'bg-red-100',
    textColor: 'text-white',
    badgeText: 'text-red-900 border-red-300',
    iconEmoji: '🔥',
  },
  {
    bgHeader: 'bg-purple-600',
    border: 'border-black',
    badgeBg: 'bg-purple-100',
    textColor: 'text-white',
    badgeText: 'text-purple-900 border-purple-300',
    iconEmoji: '⚡',
  },
];

export const NicknameManagerScreen: React.FC<NicknameManagerScreenProps> = ({
  lobatos,
  onUpdateNickname,
  onBack,
  onGoToRegistration,
}) => {
  // Solo se solicita el código ASP del adulto
  const [aspInput, setAspInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Dirigente autorizado en sesión
  const [authorizedDirigente, setAuthorizedDirigente] = useState<AdultoVoluntario | null>(null);
  const [allAdultos, setAllAdultos] = useState<AdultoVoluntario[]>([]);

  // Lobatos registrados pertenecientes ÚNICAMENTE a este dirigente
  const [dirigenteLobatos, setDirigenteLobatos] = useState<Lobato[]>([]);
  const [isLoadingLobatos, setIsLoadingLobatos] = useState(false);

  // Lobato seleccionado para cambiar nickname
  const [selectedLobatoId, setSelectedLobatoId] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtro de búsqueda rápida opcional dentro de su manada
  const [searchFilter, setSearchFilter] = useState('');

  const editPanelRef = useRef<HTMLDivElement>(null);

  // Cargar lista de dirigentes registrados desde Firestore
  useEffect(() => {
    async function loadAdults() {
      try {
        const remote = await getAdultosFromFirestore();
        if (remote) {
          const map = new Map<string, AdultoVoluntario>();
          remote.forEach((ad) => {
            if (ad.registroAsp) {
              map.set(ad.registroAsp.toUpperCase(), ad);
            }
          });
          setAllAdultos(Array.from(map.values()));
        }
      } catch (e) {
        console.warn('Error cargando dirigentes:', e);
      }
    }
    loadAdults();
  }, []);

  // 1. Verificación ÚNICAMENTE con el Código del Adulto (Coincidencia EXACTA por números) y carga de SUS lobatos
  const handleVerifyAdult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const inputDigits = aspInput.trim().replace(/[^0-9]/g, '');
    if (!inputDigits) {
      setAuthError('Por favor ingresa únicamente los números de tu código ASP (ej. 202021).');
      return;
    }

    const expectedStandardAsp = `ASP-${inputDigits}`;
    setIsLoadingLobatos(true);

    let adults = allAdultos;
    if (adults.length === 0) {
      try {
        adults = await getAdultosFromFirestore();
        setAllAdultos(adults);
      } catch (err) {
        console.warn('Error refrescando adultos desde Firestore:', err);
      }
    }

    // Búsqueda ESTRICTA y EXACTA: sin includes ni coincidencias parciales
    let foundDirigente = adults.find((adult) => {
      const currentAsp = (adult.registroAsp || '').trim().toUpperCase();
      const currentDigits = currentAsp.replace(/[^0-9]/g, '');
      return (
        (currentDigits !== '' && currentDigits === inputDigits) ||
        currentAsp === expectedStandardAsp ||
        currentAsp === `ASP${inputDigits}`
      );
    });

    if (!foundDirigente) {
      setIsLoadingLobatos(false);
      setAuthError(
        `❌ No se encontró ningún adulto/dirigente con el código ASP-${inputDigits}. Por favor ingresa el número exacto e intenta nuevamente.`
      );
      return;
    }

    let remoteLobatos: Lobato[] = [];
    try {
      remoteLobatos = await getLobatosByAdulto(foundDirigente.id, expectedStandardAsp);
    } catch (err) {
      console.warn('Error cargando lobatos del dirigente:', err);
    }

    // Si aún no se encuentran lobatos en Firestore, revisar si hay borrador en sessionStorage de este dirigente
    if (remoteLobatos.length === 0 && inputDigits) {
      const draft = sessionStorage.getItem(`draft_seisena_${inputDigits}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (Array.isArray(parsed) && parsed.length > 0) {
            remoteLobatos = parsed;
            // Persistir de forma segura en Firestore para sincronización definitiva
            saveMultipleLobatosToFirestore(parsed).catch((err) => {
              console.warn('Error persistiendo borrador en Firestore:', err);
            });
          }
        } catch (e) {
          console.warn('Error leyendo borrador local:', e);
        }
      }
    }

    // Autorización exitosa: cargamos ÚNICAMENTE sus lobatos
    setAuthorizedDirigente(foundDirigente);
    setSelectedLobatoId(null);
    setNewNickname('');
    setSuccessToast(null);
    setAuthError(null);
    setDirigenteLobatos(remoteLobatos);
    setIsLoadingLobatos(false);
  };

  // Filtrado por texto dentro de los lobatos del dirigente autenticado
  const filteredLobatos = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return dirigenteLobatos;
    return dirigenteLobatos.filter((l) => {
      const nombre = `${l.nombres} ${l.apellidos}`.toLowerCase();
      const nick = (l.nicknameRoblox || '').toLowerCase();
      const dni = (l.dni || '').toLowerCase();
      const seisena = (l.seisena || '').toLowerCase();
      return (
        nombre.includes(q) ||
        nick.includes(q) ||
        dni.includes(q) ||
        seisena.includes(q)
      );
    });
  }, [dirigenteLobatos, searchFilter]);

  // Agrupación de lobatos por SEISENA (grupos de máximo 6 lobatos)
  const seisenas = useMemo<SeisenaGroup[]>(() => {
    return groupLobatosBySeisena(filteredLobatos);
  }, [filteredLobatos]);

  // Lobato actualmente seleccionado para editar
  const selectedLobato = useMemo(() => {
    if (!selectedLobatoId) return null;
    return dirigenteLobatos.find((l) => l.id === selectedLobatoId) || null;
  }, [dirigenteLobatos, selectedLobatoId]);

  // Al dar click en un lobato, seleccionarlo y preparar input
  const handleSelectLobato = (lob: Lobato) => {
    setSelectedLobatoId(lob.id);
    setNewNickname(lob.nicknameRoblox || '');
    setNicknameError(null);
    setSuccessToast(null);

    // Scroll suave al panel de edición si está en pantalla
    setTimeout(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  // Guardar/Actualizar el Nickname
  const handleSaveNickname = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLobato) return;

    const clean = newNickname.replace(/^@+/, '').trim();
    if (!clean) {
      setNicknameError('Por favor ingresa un nuevo nickname de Roblox válido (ej. @akela_2809).');
      return;
    }

    const trimmed = clean.startsWith('@') ? clean : `@${clean}`;

    setNicknameError(null);

    // Actualizar localmente en la lista del dirigente
    setDirigenteLobatos((prev) =>
      prev.map((item) => (item.id === selectedLobato.id ? { ...item, nicknameRoblox: trimmed } : item))
    );

    // Actualizar en Firestore
    try {
      await updateLobatoNicknameInFirestore(selectedLobato.id, trimmed);
    } catch (err) {
      console.warn('Error guardando nickname en Firestore:', err);
    }

    onUpdateNickname(selectedLobato.id, trimmed);

    // Feedback de éxito
    setSuccessToast(
      `✓ ¡Nickname de ${selectedLobato.nombres} actualizado a "${trimmed}" con éxito!`
    );

    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Sugerencias de nickname para el lobato seleccionado
  const nicknameSuggestions = useMemo(() => {
    if (!selectedLobato) return [];
    const first = selectedLobato.nombres.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    const last = selectedLobato.apellidos.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    return [
      `Scout_${first}26`,
      `${first}_${last}`,
      `Lobato_${first}`,
      `Peru_${first}26`,
    ];
  }, [selectedLobato]);

  // Cambiar Dirigente (Cerrar sesión de consulta)
  const handleLogout = () => {
    setAuthorizedDirigente(null);
    setDirigenteLobatos([]);
    setSelectedLobatoId(null);
    setNewNickname('');
    setAuthError(null);
    setSuccessToast(null);
    setSearchFilter('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 space-y-5"
    >
      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="btn-3d btn-red py-2 px-4 text-sm font-game">
          ← VOLVER AL INICIO
        </button>

        <div className="text-center flex-1 mx-2">
          <h2
            className="text-2xl sm:text-3xl font-bold uppercase text-white font-game"
            style={{
              WebkitTextStroke: '1.5px #000000',
              textShadow: '2px 2px 0 #000000',
            }}
          >
            Actualizar Nickname Roblox
          </h2>
        </div>

        {authorizedDirigente ? (
          <button
            onClick={handleLogout}
            className="btn-3d btn-blue py-2 px-3 text-xs font-bold font-game flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar Dirigente</span>
          </button>
        ) : (
          <button
            onClick={onGoToRegistration}
            className="btn-3d btn-yellow py-2 px-4 text-xs font-bold font-game"
          >
            + Registrar Lobatos
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: INGRESO EXCLUSIVO DEL CÓDIGO DEL ADULTO         */}
      {/* ======================================================== */}
      {!authorizedDirigente && (
        <div className="win-3d p-6 sm:p-8 text-black space-y-6 max-w-2xl mx-auto">
          {/* Cabecera */}
          <div className="flex items-center gap-3 border-b-4 border-black pb-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-3 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0_#000] shrink-0">
              <KeyRound className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white font-game text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                  Acceso por Dirigente
                </span>
                <span className="bg-blue-600 text-white font-game text-[10px] font-bold px-2 py-0.5 rounded border border-black">
                  JOTA JOTI 2026
                </span>
              </div>
              <h3 className="font-game text-xl sm:text-2xl font-bold text-black uppercase mt-1">
                Consulta de Manada por Código de Adulto
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                Ingresa únicamente tu <strong>código ASP de adulto</strong> para ver todos los lobatos que puedes modificar agrupados por seisena.
              </p>
            </div>
          </div>

          {/* Mensaje de Error */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-100 border-3 border-black text-red-950 text-xs font-bold font-game flex items-start gap-2.5 shadow-[2px_2px_0_#000]">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{authError}</div>
            </div>
          )}

          {/* Formulario: SOLO Código del Adulto */}
          <form onSubmit={handleVerifyAdult} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-black font-game flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Código ASP del Adulto <span className="text-red-500">*</span>
                </span>
                <span className="text-xs text-slate-500 normal-case font-semibold">
                  Solo números
                </span>
              </label>

              <div className="flex rounded-xl overflow-hidden border-3 border-black shadow-[3px_3px_0_#000] bg-white focus-within:ring-3 focus-within:ring-yellow-400">
                <div className="bg-yellow-400 text-black font-game font-extrabold px-3.5 sm:px-4 py-3 border-r-3 border-black flex items-center justify-center select-none text-base sm:text-lg tracking-wider shrink-0">
                  ASP-
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={aspInput.replace(/^ASP-?/i, '')}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                    setAspInput(onlyNums);
                    setAuthError(null);
                  }}
                  placeholder="Solo números (ej. 202021)"
                  className="flex-1 px-4 py-3 text-base sm:text-lg font-bold font-mono text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-600 font-semibold">
                El prefijo <strong>ASP-</strong> ya está precargado; ingresa a su derecha únicamente los dígitos numéricos.
              </p>
            </div>

            <button
              type="submit"
              className="btn-3d btn-green py-3 w-full text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]"
            >
              <Users className="w-4 h-4" />
              <span>Ver Lobatos de mi Manada por Seisena</span>
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: LISTADO DE LOBATOS POR SEISENA Y ACTUALIZACIÓN  */}
      {/* ======================================================== */}
      {authorizedDirigente && (
        <div className="space-y-5">
          {/* Banner del Dirigente Activo */}
          <div className="win-3d p-4 sm:p-5 text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 border-3 border-black flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0_#000]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-game text-xs font-bold bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-500">
                    ✓ Dirigente Autorizado: {authorizedDirigente.registroAsp}
                  </span>
                  <span className="font-game text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-400">
                    {authorizedDirigente.cargo || 'DIRIGENTE A CARGO'}
                  </span>
                </div>
                <h3 className="font-game text-lg sm:text-xl font-bold text-black mt-0.5">
                  {authorizedDirigente.nombre}
                </h3>
                <p className="text-xs text-slate-600 font-semibold">
                  Grupo Scout: <strong className="text-black">{authorizedDirigente.grupoScout}</strong> • {authorizedDirigente.ciudad || 'Lima'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleLogout}
                className="btn-3d btn-red py-1.5 px-3 text-xs font-game flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Cambiar Adulto</span>
              </button>
            </div>
          </div>

          {/* Toast de Éxito al actualizar */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="p-4 rounded-xl bg-emerald-400 border-3 border-black text-black font-game font-bold flex items-center justify-between shadow-[3px_3px_0_#000]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-black shrink-0" />
                  <span className="text-sm">{successToast}</span>
                </div>
                <button
                  onClick={() => setSuccessToast(null)}
                  className="p-1 hover:bg-black/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PANEL DESTACADO: EDITAR NICKNAME DEL LOBATO SELECCIONADO */}
          <AnimatePresence>
            {selectedLobato && (
              <motion.div
                ref={editPanelRef}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="win-3d p-5 sm:p-6 text-black border-4 border-yellow-500 bg-yellow-50 shadow-[4px_4px_0_#000] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedLobatoId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/10 hover:bg-black/20 border border-black"
                  title="Cerrar panel de edición"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-xs font-game font-bold text-yellow-900 uppercase">
                  <Edit3 className="w-4 h-4 text-black" />
                  <span>Actualizando Nickname de Participante</span>
                </div>

                <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
                  <div>
                    <h3 className="font-game text-xl sm:text-2xl font-bold text-black">
                      {selectedLobato.nombres} {selectedLobato.apellidos}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-700 mt-1">
                      <span className="px-2 py-0.5 rounded bg-black text-white font-game font-bold text-[11px]">
                        🐾 {selectedLobato.seisena || 'Seisena Asignada'}
                      </span>
                      <span>DNI: <strong>{selectedLobato.dni}</strong></span>
                      <span>•</span>
                      <span>Grupo: <strong>{selectedLobato.grupoScout}</strong></span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]">
                    <span className="text-[11px] font-game font-bold uppercase text-slate-500 block">
                      Usuario actual de Roblox:
                    </span>
                    <span className="text-base font-game font-bold text-emerald-800 flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-emerald-600" />
                      @{selectedLobato.nicknameRoblox || 'Sin registrar'}
                    </span>
                  </div>
                </div>

                {/* Error de Nickname */}
                {nicknameError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-100 border-2 border-black text-red-900 text-xs font-game font-bold">
                    {nicknameError}
                  </div>
                )}

                {/* Formulario de actualización */}
                <form onSubmit={handleSaveNickname} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-black font-game flex items-center justify-between mb-1">
                      <span>Nuevo Nickname de Roblox:</span>
                      <span className="text-[11px] text-slate-600 normal-case font-semibold">
                        Usuario: @akela_2809
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 flex items-center">
                        <span className="absolute left-3.5 text-emerald-700 font-black font-mono text-base select-none pointer-events-none z-10">
                          @
                        </span>
                        <input
                          type="text"
                          value={newNickname.replace(/^@+/, '')}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/^@+/, '');
                            setNewNickname(clean ? `@${clean}` : '');
                          }}
                          placeholder="akela_2809"
                          className="input-3d !pl-9 text-base font-bold w-full"
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-3d btn-green py-2.5 px-6 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap shadow-[2px_2px_0_#000]"
                      >
                        <Save className="w-4 h-4" />
                        <span>Actualizar Nickname</span>
                      </button>
                    </div>
                  </div>

                  {/* Sugerencias Rápidas de Nickname */}
                  {nicknameSuggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                      <span className="font-game font-bold text-[11px] text-slate-600">Sugerencias:</span>
                      {nicknameSuggestions.map((sug) => {
                        const formattedSug = sug.startsWith('@') ? sug : `@${sug}`;
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setNewNickname(formattedSug)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 border border-black font-game font-bold text-xs text-black transition-colors"
                          >
                            +{formattedSug}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BARRA DE CONTROLES: Búsqueda rápida y conteo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border-2 border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="font-game font-bold text-white text-sm">
                Lobatos de mi Manada:
              </span>
              <span className="bg-yellow-400 text-black font-game font-bold px-2 py-0.5 rounded text-xs border border-black">
                {filteredLobatos.length} lobato(s)
              </span>
              <span className="text-white/70 text-xs hidden md:inline">
                • Haz clic en un lobato para cambiar su usuario de Roblox
              </span>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por nombre o usuario..."
                className="bg-white/90 focus:bg-white text-black text-xs font-semibold rounded-lg !pl-10 !pr-8 py-2 border-2 border-black w-full outline-none"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECCIONES POR SEISENA (MÁXIMO 6 LOBATOS POR SEISENA)      */}
          {/* ======================================================== */}
          {isLoadingLobatos ? (
            <div className="win-3d p-8 text-center text-black space-y-3 bg-white/95">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <h3 className="font-game text-lg font-bold uppercase">Cargando lobatos de tu manada...</h3>
              <p className="text-xs text-slate-600 font-semibold">
                Consultando registros confidenciales para el código {authorizedDirigente.registroAsp}
              </p>
            </div>
          ) : dirigenteLobatos.length === 0 ? (
            <div className="win-3d p-8 text-center text-black space-y-4 max-w-lg mx-auto bg-white/95 shadow-[4px_4px_0_#000]">
              <div className="w-16 h-16 rounded-2xl bg-amber-200 border-3 border-black flex items-center justify-center text-3xl mx-auto shadow-[2px_2px_0_#000]">
                🐾
              </div>
              <h3 className="font-game text-xl font-bold uppercase">No tienes lobatos registrados aún</h3>
              <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                No encontramos lobatos inscritos bajo tu código ASP (<strong className="text-blue-700">{authorizedDirigente.registroAsp}</strong>).
                Para registrar a los integrantes de tu seisena, dirígete al módulo de registro de lobatos.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={onGoToRegistration}
                  className="btn-3d btn-green py-2 px-5 text-xs sm:text-sm font-game"
                >
                  🎒 Ir a Registrar Lobato(s)
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-3d py-2 px-4 text-xs sm:text-sm font-game bg-slate-200"
                >
                  Cambiar Dirigente
                </button>
              </div>
            </div>
          ) : seisenas.length === 0 ? (
            <div className="win-3d p-8 text-center text-black space-y-3 bg-white/95">
              <Users className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-game text-xl font-bold uppercase">Sin coincidencias</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                No se encontraron lobatos en tu manada que coincidan con &ldquo;{searchFilter}&rdquo;.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setSearchFilter('')}
                  className="btn-3d btn-blue py-2 px-4 text-xs font-game"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {seisenas.map((seisena, sIdx) => {
                const palette = SEISENA_PALETTES[sIdx % SEISENA_PALETTES.length];
                const isFull = seisena.lobatos.length >= MAX_SEISENA_LOBATOS;

                return (
                  <div
                    key={seisena.nombre}
                    className="rounded-2xl border-4 border-black bg-white/95 overflow-hidden shadow-[4px_4px_0_#000]"
                  >
                    {/* Encabezado de la Seisena */}
                    <div
                      className={`${palette.bgHeader} px-4 py-3 border-b-3 border-black flex items-center justify-between flex-wrap gap-2`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl select-none">{seisena.info?.emoji || palette.iconEmoji}</span>
                        <h3 className={`font-game text-lg sm:text-xl font-bold uppercase ${palette.textColor}`}>
                          {seisena.info
                            ? `Seisena ${seisena.info.numero}: ${seisena.info.animal} ${seisena.info.titulo}`
                            : seisena.nombre}
                        </h3>
                        <span
                          className={`text-xs font-game font-bold px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1px_1px_0_#000] ${
                            isFull
                              ? 'bg-amber-300 text-black'
                              : 'bg-white text-blue-900'
                          }`}
                        >
                          {isFull
                            ? `✓ Seisena Completa (${seisena.lobatos.length}/6)`
                            : `🐾 ${seisena.lobatos.length} / 6 Lobatos`}
                        </span>
                      </div>
                      <span className={`text-xs font-game font-semibold hidden sm:inline ${palette.textColor}`}>
                        Haz clic en cualquier lobato para actualizar su usuario de Roblox
                      </span>
                    </div>

                    {/* Tarjetas de Lobatos de la Seisena */}
                    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {seisena.lobatos.map((lob, lIdx) => {
                        const isSelected = selectedLobatoId === lob.id;

                        return (
                          <div
                            key={lob.id}
                            onClick={() => handleSelectLobato(lob)}
                            className={`p-3.5 rounded-xl border-3 transition-all cursor-pointer text-left flex flex-col justify-between gap-2.5 relative group ${
                              isSelected
                                ? 'bg-yellow-200 border-black ring-4 ring-yellow-400 shadow-[3px_3px_0_#000] scale-[1.02]'
                                : 'bg-white hover:bg-yellow-50 border-black hover:border-black shadow-[2px_2px_0_#000]'
                            }`}
                          >
                            {/* Orden & Status Badge */}
                            <div className="flex items-center justify-between">
                              <span className="font-game font-bold text-[11px] px-2 py-0.5 rounded bg-slate-900 text-white">
                                Lobato #{lIdx + 1} de {seisena.lobatos.length}
                              </span>

                              {isSelected ? (
                                <span className="bg-emerald-600 text-white font-game text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" /> Editando
                                </span>
                              ) : (
                                <span className="text-[10px] font-game font-bold text-slate-600 group-hover:text-blue-700 flex items-center gap-1">
                                  <Edit3 className="w-3 h-3" /> Clic para editar
                                </span>
                              )}
                            </div>

                            {/* Nombre del Lobato */}
                            <div>
                              <h4 className="font-game font-bold text-base text-black group-hover:text-blue-900 leading-tight">
                                {lob.nombres} {lob.apellidos}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                DNI: <strong className="text-black">{lob.dni}</strong> • {lob.grupoScout}
                              </p>
                            </div>

                            {/* Usuario de Roblox Actual (Destacado) */}
                            <div className="pt-2 border-t-2 border-black/10 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                              <div className="min-w-0 pr-1">
                                <span className="text-[10px] font-game font-bold text-slate-500 uppercase block">
                                  Usuario Roblox:
                                </span>
                                <span className="font-game font-bold text-xs text-emerald-800 flex items-center gap-1 truncate">
                                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">
                                    @{lob.nicknameRoblox || 'Sin registrar'}
                                  </span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectLobato(lob);
                                }}
                                className={`px-2.5 py-1 rounded text-xs font-game font-bold border-2 border-black shadow-[1px_1px_0_#000] shrink-0 transition-transform active:translate-y-0.5 ${
                                  isSelected
                                    ? 'bg-black text-white'
                                    : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                                }`}
                              >
                                {isSelected ? 'Activo' : 'Cambiar'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
