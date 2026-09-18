import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserCheck, Shield, Check, X, Phone, Mail, MapPin, Tag, Award, Upload, FileSpreadsheet, FileText, Trash2, Loader2, Receipt, CreditCard, Image as ImageIcon, Users, Search, HelpCircle } from 'lucide-react';
import { Card3D } from './Card3D';
import { Button3D } from './Button3D';
import { DirigenteRegistro, AdultoVoluntario } from '../types';
import { uploadDocumentoAnexo, getAdultosFromFirestore, saveAdultoToFirestore } from '../lib/databaseService';
import { REGIONES_LOCALIDADES_SCOUT } from '../data/regionesScout';
import { FieldInfoTooltip } from './FieldInfoTooltip';
import { PAISES_CODIGOS } from '../data/paisesCodigos';
import { ScoutSuggestInput } from './ScoutSuggestInput';
import { useScoutSuggestions } from '../hooks/useScoutSuggestions';

interface LeaderRegistrationScreenProps {
  onBack: () => void;
  onSaveSuccess: (dirigente: DirigenteRegistro) => void;
}

export const COMISIONES_STAFF = [
  'PROGRAMAS',
  'SERVICIOS',
  'SEGURIDAD Y SFH',
  'COMUNICACION',
  'ADMINISTRACION Y FINANZAS',
] as const;

export type ComisionStaff = typeof COMISIONES_STAFF[number];

/**
 * Muestra únicamente el nombre del dirigente y la referencia de los últimos 2 dígitos de su ASP
 * con el formato: Nombre del Dirigente (ASP- ..XX)
 */
const formatMaskedAsp = (nombre: string, rawAsp?: string): string => {
  const cleanNombre = nombre?.trim() || 'Dirigente Scout';
  const digits = (rawAsp || '').replace(/[^0-9]/g, '');
  if (!digits) return cleanNombre;
  const last2 = digits.slice(-2);
  return `${cleanNombre} (ASP- ..${last2})`;
};

export const LeaderRegistrationScreen: React.FC<LeaderRegistrationScreenProps> = ({
  onBack,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    registroAsp: '',
    grupoScout: '',
    cargo: 'DIRIGENTE A CARGO' as 'DIRIGENTE A CARGO' | 'EQUIPO DE APOYO' | 'STAFF',
    comisionStaff: '',
    dirigenteReferenteId: '',
    dirigenteReferenteNombre: '',
    dirigenteReferenteAsp: '',
    ciudad: '',
    email: '',
    celular: '',
    nicknameRoblox: '',
    archivoAnexo3: '',
    archivoAnexo3Name: '',
    archivoAnexo3Size: '',
    voucherPago: '',
    voucherPagoName: '',
    voucherPagoSize: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Estados para Teléfono Internacional
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+51');
  const [phoneNum, setPhoneNum] = useState<string>('');

  // Estados para Registro ASP / Código Scout Nacional e Internacional
  const [aspType, setAspType] = useState<'ASP' | 'OTRO'>('ASP');
  const [aspValue, setAspValue] = useState<string>('');

  // Catálogo unificado y sugerencias inteligentes de Grupo Scout y Región
  const {
    gruposScout,
    regiones,
    dbGruposSet,
    dbRegionesSet,
    addCustomSuggestion,
  } = useScoutSuggestions();

  const handlePhoneNumChange = (val: string) => {
    setPhoneNum(val);
    const cleanNum = val.trim();
    handleChange('celular', cleanNum ? `${selectedCountryCode} ${cleanNum}` : '');
    if (errors.celular) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.celular;
        return next;
      });
    }
  };

  const handleCountryCodeChange = (code: string) => {
    setSelectedCountryCode(code);
    const cleanNum = phoneNum.trim();
    handleChange('celular', cleanNum ? `${code} ${cleanNum}` : '');
  };

  const handleAspTypeChange = (type: 'ASP' | 'OTRO') => {
    setAspType(type);
    if (type === 'ASP') {
      const onlyDigits = aspValue.replace(/[^0-9]/g, '');
      setAspValue(onlyDigits);
      handleChange('registroAsp', onlyDigits ? `ASP-${onlyDigits}` : '');
    } else {
      handleChange('registroAsp', aspValue.trim());
    }
    if (errors.registroAsp) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.registroAsp;
        return next;
      });
    }
  };

  const handleAspValueChange = (val: string) => {
    if (aspType === 'ASP') {
      const onlyDigits = val.replace(/[^0-9]/g, '');
      setAspValue(onlyDigits);
      handleChange('registroAsp', onlyDigits ? `ASP-${onlyDigits}` : '');
    } else {
      setAspValue(val);
      handleChange('registroAsp', val.trim());
    }
    if (errors.registroAsp) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.registroAsp;
        return next;
      });
    }
  };

  // Lista de Dirigentes a Cargo registrados para "EQUIPO DE APOYO"
  const [dirigentesACargoList, setDirigentesACargoList] = useState<AdultoVoluntario[]>([]);
  const [isLoadingDirigentes, setIsLoadingDirigentes] = useState(false);

  // Cargar dirigentes a cargo desde Firestore
  useEffect(() => {
    let isMounted = true;
    const loadAdultos = async () => {
      setIsLoadingDirigentes(true);
      try {
        const list = await getAdultosFromFirestore();
        if (isMounted) {
          // Filtrar preferentemente los dirigentes que son a cargo o tienen manada
          const aCargo = list.filter((a) => {
            const cargoUpper = (a.cargo || '').toUpperCase();
            return cargoUpper.includes('CARGO') || !cargoUpper.includes('APOYO');
          });
          setDirigentesACargoList(aCargo.length > 0 ? aCargo : list);
        }
      } catch (err) {
        console.warn('Error al cargar dirigentes para referencia de apoyo:', err);
      } finally {
        if (isMounted) setIsLoadingDirigentes(false);
      }
    };
    loadAdultos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Estados para Anexo 3
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [anexo3StatusNotice, setAnexo3StatusNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Voucher de Pago (Yape, Plin, Transferencia)
  const [isDraggingVoucher, setIsDraggingVoucher] = useState(false);
  const [isUploadingVoucher, setIsUploadingVoucher] = useState(false);
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState<string | null>(null);
  const [voucherStatusNotice, setVoucherStatusNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [selectedVoucherFileObj, setSelectedVoucherFileObj] = useState<File | null>(null);
  const voucherFileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = Object.values(formData).some(
    (v) => typeof v === 'string' && v.trim() !== '' && v !== 'DIRIGENTE A CARGO'
  );

  // Validación condicional de formulario completo según el cargo
  const isFormComplete = (() => {
    const baseComplete = Boolean(
      formData.nombres.trim() &&
      formData.apellidos.trim() &&
      formData.dni.trim() &&
      formData.registroAsp.trim() &&
      formData.cargo.trim() &&
      formData.grupoScout.trim() &&
      formData.ciudad.trim() &&
      formData.nicknameRoblox.trim() &&
      formData.celular.trim() &&
      formData.email.trim()
    );

    if (!baseComplete) return false;

    if (formData.cargo === 'DIRIGENTE A CARGO') {
      return Boolean(
        formData.archivoAnexo3.trim() &&
        formData.voucherPago.trim() &&
        !isUploadingFile &&
        !isUploadingVoucher
      );
    }

    if (formData.cargo === 'EQUIPO DE APOYO') {
      return Boolean(formData.dirigenteReferenteId.trim());
    }

    if (formData.cargo === 'STAFF') {
      return Boolean(formData.comisionStaff.trim());
    }

    return true;
  })();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const processFile = async (file: File) => {
    setSelectedFileObj(file);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    // Limpiar error de anexo 3 de inmediato
    if (errors.archivoAnexo3) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.archivoAnexo3;
        return next;
      });
    }

    setFormData((prev) => ({
      ...prev,
      archivoAnexo3: file.name,
      archivoAnexo3Name: file.name,
      archivoAnexo3Size: sizeFormatted,
    }));
    
    // Subir directamente al bucket de Google Cloud Storage en carpeta documentos_anexos/
    setIsUploadingFile(true);
    setAnexo3StatusNotice(null);
    try {
      const uploadRes = await uploadDocumentoAnexo('ANEXO_3_DIRIGENTE', file);
      const url = uploadRes.meta?.downloadUrl || uploadRes.meta?.dataUrl || '';
      if (uploadRes.success && url) {
        setFormData((prev) => ({
          ...prev,
          archivoAnexo3: url,
          archivoAnexo3Name: file.name,
          archivoAnexo3Size: sizeFormatted,
          archivoAnexo3DocId: uploadRes.meta?.id,
        }));
        setAnexo3StatusNotice({
          type: 'success',
          message: `✓ Guardado en Google Cloud Storage (${file.name})`,
        });
      } else if (url) {
        setFormData((prev) => ({
          ...prev,
          archivoAnexo3: url,
          archivoAnexo3Name: file.name,
          archivoAnexo3Size: sizeFormatted,
          archivoAnexo3DocId: uploadRes.meta?.id,
        }));
        setAnexo3StatusNotice({
          type: 'success',
          message: `✓ Documento procesado correctamente (${file.name})`,
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          archivoAnexo3: file.name,
          archivoAnexo3Name: file.name,
          archivoAnexo3Size: sizeFormatted,
          archivoAnexo3DocId: '',
        }));
        setAnexo3StatusNotice({
          type: 'warning',
          message: `⚠️ Subida directa a GCS pendiente de permisos/CORS: ${uploadRes.error || 'Revisa consola'}.`,
        });
      }
    } catch (err: any) {
      console.error('[LeaderRegistration] Error al procesar archivo anexo 3:', err);
      setFormData((prev) => ({
        ...prev,
        archivoAnexo3: file.name,
        archivoAnexo3Name: file.name,
        archivoAnexo3Size: sizeFormatted,
      }));
      setAnexo3StatusNotice({
        type: 'error',
        message: `❌ Error al subir: ${err?.message || String(err)}`,
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Procesador para Voucher de Pago (Yape, Plin, Transferencia)
  const processVoucherFile = async (file: File) => {
    setSelectedVoucherFileObj(file);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    // Vista previa inmediata para imágenes
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setVoucherPreviewUrl(preview);
    } else {
      setVoucherPreviewUrl(null);
    }

    // Limpiar error del voucher
    if (errors.voucherPago) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.voucherPago;
        return next;
      });
    }

    setFormData((prev) => ({
      ...prev,
      voucherPago: file.name,
      voucherPagoName: file.name,
      voucherPagoSize: sizeFormatted,
    }));

    setIsUploadingVoucher(true);
    setVoucherStatusNotice(null);

    try {
      const uploadRes = await uploadDocumentoAnexo('VOUCHER_PAGO_DIRIGENTE', file);
      const url = uploadRes.meta?.downloadUrl || uploadRes.meta?.dataUrl || '';
      if (uploadRes.success && url) {
        setFormData((prev) => ({
          ...prev,
          voucherPago: url,
          voucherPagoName: file.name,
          voucherPagoSize: sizeFormatted,
          voucherPagoDocId: uploadRes.meta?.id,
        }));
        if (uploadRes.meta?.dataUrl) {
          setVoucherPreviewUrl(uploadRes.meta.dataUrl);
        }
        setVoucherStatusNotice({
          type: 'success',
          message: `✓ Voucher guardado en Google Cloud Storage (${file.name})`,
        });
      } else if (url) {
        setFormData((prev) => ({
          ...prev,
          voucherPago: url,
          voucherPagoName: file.name,
          voucherPagoSize: sizeFormatted,
          voucherPagoDocId: uploadRes.meta?.id,
        }));
        setVoucherStatusNotice({
          type: 'success',
          message: `✓ Voucher procesado correctamente (${file.name})`,
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          voucherPago: file.name,
          voucherPagoName: file.name,
          voucherPagoSize: sizeFormatted,
          voucherPagoDocId: '',
        }));
        setVoucherStatusNotice({
          type: 'warning',
          message: `⚠️ Subida directa a GCS pendiente de permisos/CORS: ${uploadRes.error || 'Revisa consola'}.`,
        });
      }
    } catch (err: any) {
      console.error('[LeaderRegistration] Error al procesar voucher de pago:', err);
      setFormData((prev) => ({
        ...prev,
        voucherPago: file.name,
        voucherPagoName: file.name,
        voucherPagoSize: sizeFormatted,
      }));
      setVoucherStatusNotice({
        type: 'error',
        message: `❌ Error al subir voucher: ${err?.message || String(err)}`,
      });
    } finally {
      setIsUploadingVoucher(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleVoucherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVoucherFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleVoucherDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVoucher(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVoucherFile(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnexo3StatusNotice(null);
    setFormData((prev) => ({
      ...prev,
      archivoAnexo3: '',
      archivoAnexo3Name: '',
      archivoAnexo3Size: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveVoucher = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVoucherStatusNotice(null);
    setVoucherPreviewUrl(null);
    setFormData((prev) => ({
      ...prev,
      voucherPago: '',
      voucherPagoName: '',
      voucherPagoSize: '',
    }));
    if (voucherFileInputRef.current) {
      voucherFileInputRef.current.value = '';
    }
  };

  const handleBackAttempt = () => {
    if (hasChanges) {
      setShowExitWarning(true);
    } else {
      onBack();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Campos personales y de contacto requeridos para todos
    if (!formData.nombres.trim()) newErrors.nombres = 'Ingresa los nombres';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Ingresa los apellidos';
    if (!formData.dni.trim()) newErrors.dni = 'Ingresa el DNI o documento de identidad';
    
    if (aspType === 'ASP') {
      const aspDigits = aspValue.replace(/[^0-9]/g, '');
      if (!aspDigits) {
        newErrors.registroAsp = 'Ingresa los números de tu Registro ASP (ej. 202021)';
      }
    } else {
      if (!aspValue.trim()) {
        newErrors.registroAsp = 'Ingresa el número o código de scout de tu país';
      }
    }

    if (!formData.cargo.trim()) newErrors.cargo = 'Selecciona el cargo';
    if (!formData.grupoScout.trim()) newErrors.grupoScout = 'Ingresa el Grupo Scout y numeral (ej. Lima 02)';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'Ingresa la Región - Localidad (ej. Arequipa Sur XI)';
    const cleanNick = formData.nicknameRoblox.replace(/^@+/, '').trim();
    if (!cleanNick) newErrors.nicknameRoblox = 'Ingresa el Nickname de Roblox (ej. @akela_2809)';
    if (!phoneNum.trim()) newErrors.celular = 'Ingresa el teléfono o WhatsApp de contacto';

    if (!formData.email.trim()) {
      newErrors.email = 'Ingresa el correo electrónico';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido (ej. ejemplo@correo.com)';
    }

    // Reglas según Cargo:
    if (formData.cargo === 'DIRIGENTE A CARGO') {
      // 1. Debe adjuntar Anexo 3 o lista de participantes
      if (!formData.archivoAnexo3.trim()) {
        newErrors.archivoAnexo3 = 'Obligatorio: debes adjuntar el archivo del Anexo 3 o lista de participantes';
      } else if (isUploadingFile) {
        newErrors.archivoAnexo3 = 'Por favor espera a que termine de subirse el archivo Anexo 3';
      }

      // 2. Debe adjuntar Voucher de pago
      if (!formData.voucherPago.trim()) {
        newErrors.voucherPago = 'Obligatorio: debes adjuntar el voucher de pago (Yape, Plin o transferencia bancaria)';
      } else if (isUploadingVoucher) {
        newErrors.voucherPago = 'Por favor espera a que termine de procesarse el voucher de pago';
      }
    } else if (formData.cargo === 'EQUIPO DE APOYO') {
      // Obligatorio vincular al Dirigente a Cargo que apoyará
      if (!formData.dirigenteReferenteId.trim()) {
        newErrors.dirigenteReferenteId = 'Obligatorio: Selecciona al Dirigente a Cargo que apoyarás';
      }
    } else if (formData.cargo === 'STAFF') {
      // Obligatorio seleccionar la comisión o unidad de Staff
      if (!formData.comisionStaff.trim()) {
        newErrors.comisionStaff = 'Obligatorio: Selecciona la comisión o unidad de Staff a la que perteneces';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const standardAsp = aspType === 'ASP'
      ? `ASP-${aspValue.replace(/[^0-9]/g, '')}`
      : aspValue.trim().toUpperCase();
    const formattedNickname = cleanNick ? (cleanNick.startsWith('@') ? cleanNick : `@${cleanNick}`) : '';
    const fullPhone = `${selectedCountryCode} ${phoneNum.trim()}`.trim();

    const savedDirigente: DirigenteRegistro = {
      id: 'dir-' + Date.now(),
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      registroAsp: standardAsp,
      grupoScout: formData.grupoScout.trim(),
      cargo: formData.cargo,
      comisionStaff: formData.cargo === 'STAFF' ? formData.comisionStaff.trim() : undefined,
      ciudad: formData.ciudad.trim(),
      email: formData.email.trim(),
      celular: fullPhone,
      nicknameRoblox: formattedNickname,
      dirigenteReferenteId: formData.cargo === 'EQUIPO DE APOYO' ? formData.dirigenteReferenteId : undefined,
      dirigenteReferenteNombre: formData.cargo === 'EQUIPO DE APOYO' ? formData.dirigenteReferenteNombre : undefined,
      dirigenteReferenteAsp: formData.cargo === 'EQUIPO DE APOYO' ? formData.dirigenteReferenteAsp : undefined,
      archivoAnexo3: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.archivoAnexo3 || undefined) : undefined,
      archivoAnexo3Name: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.archivoAnexo3Name || undefined) : undefined,
      archivoAnexo3Size: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.archivoAnexo3Size || undefined) : undefined,
      voucherPago: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.voucherPago || undefined) : undefined,
      voucherPagoName: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.voucherPagoName || undefined) : undefined,
      voucherPagoSize: formData.cargo === 'DIRIGENTE A CARGO' ? (formData.voucherPagoSize || undefined) : undefined,
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await saveAdultoToFirestore(savedDirigente);
      onSaveSuccess(savedDirigente);
    } catch (saveErr: any) {
      console.error('[LeaderRegistrationScreen] Error guardando dirigente en Firestore:', saveErr);
      setSubmitError(
        `Error al guardar en la base de datos: ${saveErr?.message || 'Verifica tu conexión a internet e inténtalo nuevamente.'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto px-4 py-4"
    >
      {/* Navigation & Header row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={handleBackAttempt}
          className="btn-3d btn-red py-2 px-4 text-sm"
        >
          ← VOLVER
        </button>

        <span className="px-3.5 py-1 rounded-xl bg-white border-3 border-black text-black text-xs font-bold font-game uppercase tracking-wider shadow-[2px_2px_0_#000] flex items-center gap-2">
          <img
            src="/assets/images/World_Scout_Emblem.png"
            alt="World Scout Emblem"
            className="w-5 h-5 object-contain"
          />
          Ficha Dirigente Scout
        </span>
      </div>

      <div className="win-3d p-6 sm:p-8 text-black">
        <div className="border-b-4 border-black pb-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase font-game text-black flex items-center gap-3">
            <img
              src="/assets/images/World_Scout_Emblem.png"
              alt="World Scout Emblem"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow"
            />
            <span>Registrar Dirigente</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-red-700 bg-red-100 border-2 border-black px-2.5 py-1 rounded-lg font-game">
              * Todos los campos obligatorios
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 border-2 border-black px-2.5 py-1 rounded-lg">
              Adulto Responsable
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Main info block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombres */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                placeholder="Ej. Carlos Alberto"
                className={`input-3d ${errors.nombres ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.nombres && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.nombres}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                placeholder="Ej. Mendoza Vega"
                className={`input-3d ${errors.apellidos ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.apellidos && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.apellidos}</p>
              )}
            </div>

            {/* DNI */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  DNI / Documento <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Documento de Identidad"
                  content="Ingresa tu número de DNI si resides en Perú, o tu número de cédula, pasaporte, carnet de identidad o documento nacional en caso de ser de cualquier otro país."
                />
              </div>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                placeholder="Ej. 40891234 o Cédula/Pasaporte"
                className={`input-3d ${errors.dni ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.dni && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.dni}</p>
              )}
            </div>

            {/* Cargo */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Cargo en la Actividad"
                  content="Selecciona tu función en el evento: Dirigente a Cargo (responsable de la manada), Equipo de Apoyo, o Staff organizador."
                />
              </div>
              <select
                value={formData.cargo}
                onChange={(e) => {
                  const newCargo = e.target.value as 'DIRIGENTE A CARGO' | 'EQUIPO DE APOYO' | 'STAFF';
                  handleChange('cargo', newCargo);
                  // Limpiar errores específicos cuando cambia el rol
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.cargo;
                    delete next.dirigenteReferenteId;
                    delete next.archivoAnexo3;
                    delete next.voucherPago;
                    return next;
                  });
                }}
                className={`input-3d cursor-pointer font-bold ${errors.cargo ? 'border-red-500 bg-red-50/50' : ''}`}
              >
                <option value="DIRIGENTE A CARGO">DIRIGENTE A CARGO (Responsable de Manada - Requiere Voucher)</option>
                <option value="EQUIPO DE APOYO">EQUIPO DE APOYO (Sin costo / Exonerado de pago - Referido por Dirigente a Cargo)</option>
                <option value="STAFF">STAFF (Comisión Organizadora)</option>
              </select>
              {errors.cargo && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.cargo}</p>
              )}

              {/* Banner aclaratorio inmediato para EQUIPO DE APOYO */}
              {formData.cargo === 'EQUIPO DE APOYO' && (
                <div className="mt-2.5 p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-start gap-2.5 text-emerald-950 text-xs shadow-xs">
                  <span className="text-xl shrink-0">🎁</span>
                  <div className="space-y-0.5">
                    <p className="font-game font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                      <span>¡INGRESO SIN PAGO / TOTALMENTE GRATUITO!</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500 uppercase font-black tracking-wide">
                        S/ 0.00
                      </span>
                    </p>
                    <p className="text-emerald-800 font-medium leading-relaxed">
                      Como <strong>Equipo de Apoyo</strong>, <u>no se te exige realizar ningún pago ni comprobante bancario</u> para ingresar. Tu participación está formalmente <strong>referida y respaldada por el Dirigente a Cargo</strong> que seleccionas en este formulario.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Registro ASP / Código Scout (Ancho completo para máxima comodidad al digitar) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center">
                  <label className="text-xs font-bold uppercase text-black font-game">
                    Registro ASP / Código Scout <span className="text-red-500">*</span>
                  </label>
                  <FieldInfoTooltip
                    title="Registro ASP o Código Scout"
                    content="Si perteneces a Scouts del Perú, ingresa tu número de Registro ASP. Si eres de otro país, selecciona 'Otro País' e ingresa el número o código de scout de la asociación scout que te registre."
                  />
                </div>

                {/* Selector tipo toggle para no quitar espacio horizontal al campo de texto */}
                <div className="inline-flex p-1 rounded-xl bg-slate-200 border-2 border-black text-xs font-bold shadow-[1px_1px_0_#000]">
                  <button
                    type="button"
                    onClick={() => handleAspTypeChange('ASP')}
                    className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      aspType === 'ASP'
                        ? 'bg-yellow-400 text-black shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <span>🇵🇪</span>
                    <span>ASP (Perú)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAspTypeChange('OTRO')}
                    className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                      aspType === 'OTRO'
                        ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <span>🌐</span>
                    <span>Otro País (Scout)</span>
                  </button>
                </div>
              </div>

              {aspType === 'ASP' ? (
                <div className={`flex w-full rounded-xl overflow-hidden border-3 border-black bg-white shadow-[2px_2px_0_#000] focus-within:ring-2 focus-within:ring-yellow-400 ${errors.registroAsp ? 'border-red-500 bg-red-50/50' : ''}`}>
                  <div className="bg-yellow-400 text-black font-game font-extrabold px-4 py-2.5 border-r-3 border-black flex items-center justify-center select-none text-xs sm:text-sm shrink-0">
                    ASP-
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={aspValue}
                    onChange={(e) => handleAspValueChange(e.target.value)}
                    placeholder="Ingresa los números de tu Registro ASP (ej. 202021)"
                    className="flex-1 w-full px-4 py-2.5 text-sm sm:text-base font-bold font-mono text-black focus:outline-none placeholder:text-slate-400 placeholder:font-sans"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={aspValue}
                  onChange={(e) => handleAspValueChange(e.target.value)}
                  placeholder="Ingresa el código o número scout asignado por la asociación de tu país"
                  className={`input-3d w-full font-mono font-bold text-sm sm:text-base py-2.5 ${errors.registroAsp ? 'border-red-500 bg-red-50/50' : ''}`}
                />
              )}

              {errors.registroAsp && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.registroAsp}</p>
              )}
            </div>

            {/* CAMPO CONDICIONAL: COMISIÓN O UNIDAD (Solo si es STAFF) */}
            {formData.cargo === 'STAFF' && (
              <div className="col-span-1 md:col-span-2 p-3.5 bg-purple-50 border-3 border-black rounded-2xl shadow-[2px_2px_0_#000] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 border-2 border-black flex items-center justify-center font-bold text-white shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <label className="text-xs font-bold uppercase text-black font-game block">
                        Comisión o Unidad de Staff <span className="text-red-500">*</span>
                      </label>
                      <FieldInfoTooltip
                        title="Comisión de Staff"
                        content="Área organizadora oficial en la que participarás durante la actividad."
                      />
                    </div>
                    <p className="text-[11px] text-purple-900 font-medium">
                      Indica la comisión o área organizadora a la que pertenecerás.
                    </p>
                  </div>
                </div>

                <select
                  value={formData.comisionStaff}
                  onChange={(e) => handleChange('comisionStaff', e.target.value)}
                  className={`input-3d cursor-pointer font-bold w-full ${errors.comisionStaff ? 'border-red-500 bg-red-50/50' : 'bg-white'}`}
                >
                  <option value="">-- Selecciona tu Comisión o Unidad --</option>
                  {COMISIONES_STAFF.map((com) => (
                    <option key={com} value={com}>
                      {com}
                    </option>
                  ))}
                </select>

                {errors.comisionStaff && (
                  <p className="text-xs font-bold text-red-600 font-game">{errors.comisionStaff}</p>
                )}
              </div>
            )}

            {/* CAMPO CONDICIONAL: DIRIGENTE REFERENTE (Solo si es EQUIPO DE APOYO) */}
            {formData.cargo === 'EQUIPO DE APOYO' && (
              <div className="col-span-1 md:col-span-2 p-4 bg-emerald-50/70 border-3 border-emerald-600 rounded-2xl shadow-[3px_3px_0_#000] space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 border-2 border-black flex items-center justify-center font-bold text-white shrink-0 mt-0.5 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center">
                        <label className="text-xs font-bold uppercase text-black font-game block">
                          Dirigente a Cargo que te Refiere y Apoyarás <span className="text-red-500">*</span>
                        </label>
                        <FieldInfoTooltip
                          title="Dirigente a Cargo Referente"
                          content="Como Equipo de Apoyo, tu ingreso está avalado y cubierto por el Dirigente a Cargo de tu manada. Selecciona a quién acompañas."
                        />
                      </div>
                      <span className="bg-emerald-200 text-emerald-950 border border-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Ingreso Gratuito (S/ 0.00)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-snug">
                      Al pertenecer al <strong>Equipo de Apoyo</strong>, <u className="font-semibold text-emerald-900">no se te exige realizar ningún pago</u>. Tu participación e ingreso están formalmente <strong>referidos y amparados por el Dirigente a Cargo</strong> que selecciones a continuación:
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={formData.dirigenteReferenteId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const refObj = dirigentesACargoList.find((d) => d.id === selectedId);
                      setFormData((prev) => ({
                        ...prev,
                        dirigenteReferenteId: selectedId,
                        dirigenteReferenteNombre: refObj?.nombre || '',
                        dirigenteReferenteAsp: refObj?.registroAsp || '',
                      }));
                      if (errors.dirigenteReferenteId) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.dirigenteReferenteId;
                          return next;
                        });
                      }
                    }}
                    className={`input-3d cursor-pointer font-bold w-full ${errors.dirigenteReferenteId ? 'border-red-500 bg-red-50/50' : 'bg-white'}`}
                  >
                    <option value="">-- Selecciona al Dirigente a Cargo que te refiere --</option>
                    {dirigentesACargoList.map((dir) => (
                      <option key={dir.id} value={dir.id}>
                        {formatMaskedAsp(dir.nombre, dir.registroAsp)}
                      </option>
                    ))}
                  </select>
                  {isLoadingDirigentes && (
                    <div className="absolute right-3 top-2.5 flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                    </div>
                  )}
                </div>

                {errors.dirigenteReferenteId && (
                  <p className="text-xs font-bold text-red-600 font-game">{errors.dirigenteReferenteId}</p>
                )}

                {dirigentesACargoList.length === 0 && !isLoadingDirigentes && (
                  <p className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg border border-amber-300">
                    ℹ️ Aún no hay Dirigentes a Cargo registrados en el sistema. El responsable de tu manada debe inscribirse primero para que puedas seleccionarlo como referente de tu ingreso gratuito.
                  </p>
                )}

                {formData.dirigenteReferenteNombre && (
                  <div className="text-xs text-emerald-900 font-bold flex items-center gap-1.5 p-2 bg-emerald-100 border border-emerald-400 rounded-xl">
                    <span className="text-emerald-700 text-sm">✓</span>
                    <span>
                      Referido y avalado por: <strong>{formatMaskedAsp(formData.dirigenteReferenteNombre, formData.dirigenteReferenteAsp)}</strong> • <span className="text-emerald-700 font-extrabold uppercase">Exonerado de pago</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Grupo Scout y numeral */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Grupo Scout y numeral <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Grupo Scout"
                  content="Ingresa o selecciona el nombre de tu Grupo Scout y numeral (ej. Lima 02, o la identificación según tu país). Si no existe en la lista, puedes registrarlo por primera vez."
                />
              </div>
              <ScoutSuggestInput
                id="leader-grupo-scout"
                value={formData.grupoScout}
                onChange={(val) => handleChange('grupoScout', val)}
                placeholder="Ej. Lima 02 (o según tu país)"
                categoryType="grupoScout"
                suggestions={gruposScout}
                dbSuggestionsSet={dbGruposSet}
                onBlurCustom={(val) => addCustomSuggestion('grupoScout', val)}
                error={errors.grupoScout}
              />
              {errors.grupoScout && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.grupoScout}</p>
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
                  content="Debe poner su región o localidad a la que pertenece acompañado de los números romanos o como se especifique según su país (ej. Arequipa Sur XI, Lima XVIII, o según tu asociación nacional)."
                />
              </div>
              <ScoutSuggestInput
                id="leader-region-ciudad"
                value={formData.ciudad}
                onChange={(val) => handleChange('ciudad', val)}
                placeholder="Ej. Arequipa Sur XI (o según tu país)"
                categoryType="region"
                suggestions={regiones}
                dbSuggestionsSet={dbRegionesSet}
                onBlurCustom={(val) => addCustomSuggestion('region', val)}
                error={errors.ciudad}
              />
              {errors.ciudad && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.ciudad}</p>
              )}
            </div>

            {/* Nickname Roblox */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Nickname Roblox (Misión Virtual) <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Nickname de Roblox"
                  content="Nombre de usuario en Roblox para la Misión Virtual del evento. El símbolo @ se agrega de manera automática."
                />
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 font-black font-mono text-base select-none pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  value={formData.nicknameRoblox.replace(/^@+/, '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^@+/, '');
                    handleChange('nicknameRoblox', clean ? `@${clean}` : '');
                  }}
                  placeholder="akela_2809"
                  className={`input-3d !pl-9 ${errors.nicknameRoblox ? 'border-red-500 bg-red-50/50' : ''}`}
                />
              </div>
              {errors.nicknameRoblox && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.nicknameRoblox}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Correo Electrónico"
                  content="Puede ir el correo personal o el de la asociación scout. Ambos son válidos."
                />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="ejemplo@correo.com"
                className={`input-3d ${errors.email ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.email && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.email}</p>
              )}
            </div>

            {/* Celular con Selector de Código de País (Ancho completo para máxima comodidad al digitar) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center">
                <label className="text-xs font-bold uppercase text-black font-game">
                  Teléfono / WhatsApp <span className="text-red-500">*</span>
                </label>
                <FieldInfoTooltip
                  title="Teléfono de Contacto"
                  content="Selecciona el código del país según elijas tu país y completa únicamente con tu número de teléfono o WhatsApp."
                />
              </div>

              {/* Input unificado con selector compacto de código de país para maximizar el ancho del campo */}
              <div className={`flex w-full rounded-xl overflow-hidden border-3 border-black bg-white shadow-[2px_2px_0_#000] focus-within:ring-2 focus-within:ring-yellow-400 ${errors.celular ? 'border-red-500 bg-red-50/50' : ''}`}>
                <div className="relative bg-amber-50 border-r-3 border-black flex items-center shrink-0">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryCodeChange(e.target.value)}
                    className="appearance-none bg-transparent pl-3 pr-7 py-2.5 font-bold font-mono text-xs sm:text-sm text-black cursor-pointer focus:outline-none"
                    title="Selecciona el código de tu país"
                  >
                    {PAISES_CODIGOS.map((p) => (
                      <option key={p.codigoIso} value={p.dialCode}>
                        {p.flag} {p.dialCode} ({p.nombre})
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2 pointer-events-none text-slate-700 text-[10px] font-bold">
                    ▼
                  </span>
                </div>
                <input
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => handlePhoneNumChange(e.target.value)}
                  placeholder="Ingresa tu número telefónico o WhatsApp (ej. 987 654 321)"
                  className="flex-1 w-full px-4 py-2.5 text-sm sm:text-base font-bold text-black focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {errors.celular && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.celular}</p>
              )}
            </div>
          </div>

          {/* CAMPO DE SUBIR ARCHIVO: ANEXO 3 O LISTA DE PARTICIPANTES (Solo para DIRIGENTE A CARGO) */}
          {formData.cargo === 'DIRIGENTE A CARGO' && (
            <div className="mt-4 pt-4 border-t-2 border-slate-200 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-black font-game flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Anexo 3 o lista de participantes <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 normal-case">
                  (PDF, Excel .xlsx, .csv, Word o Imagen)
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="anexo3-file-input"
              />

              {!formData.archivoAnexo3 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-3 border-dashed rounded-2xl p-4 sm:p-5
                    flex flex-col items-center justify-center text-center cursor-pointer
                    transition-all duration-200 select-none
                    ${
                      errors.archivoAnexo3
                        ? 'border-red-500 bg-red-50/60'
                        : isDragging
                        ? 'border-black bg-yellow-100 scale-[1.01]'
                        : 'border-black bg-slate-50 hover:bg-slate-100'
                    }
                  `}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0_#000]">
                    <Upload className="w-5 h-5 text-black" />
                  </div>
                  <p className="font-game font-bold text-sm text-black">
                    Haz clic aquí o arrastra el archivo del <span className="text-blue-700">Anexo 3</span> <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Formatos admitidos: Excel (.xlsx), PDF o lista de participantes escaneada
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border-3 border-black p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0_#000]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 border-2 border-black flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0_#000]">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-game font-bold text-sm text-black truncate" title={formData.archivoAnexo3Name || formData.archivoAnexo3}>
                        {formData.archivoAnexo3Name || (formData.archivoAnexo3.startsWith('http') ? 'Documento Anexo 3' : formData.archivoAnexo3)}
                      </div>
                      <div className="text-xs text-emerald-800 font-bold flex items-center gap-2">
                        {isUploadingFile ? (
                          <span className="flex items-center gap-1 text-blue-700">
                            <Loader2 className="w-3 h-3 animate-spin" /> Subiendo a almacenamiento...
                          </span>
                        ) : (
                          <span>✓ Archivo guardado y sincronizado</span>
                        )}
                        {formData.archivoAnexo3Size && (
                          <span>• {formData.archivoAnexo3Size}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {formData.archivoAnexo3.startsWith('http') && (
                      <a
                        href={formData.archivoAnexo3}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-3d btn-yellow py-1 px-2 text-xs flex items-center gap-1 shadow-[0_2px_0_#000]"
                        title="Ver documento subido en pestaña nueva"
                      >
                        <span>Ver</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-3d btn-yellow py-1 px-2.5 text-xs shadow-[0_2px_0_#000]"
                      title="Cambiar archivo"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="btn-3d btn-red py-1 px-2.5 text-xs shadow-[0_2px_0_#000]"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error específico para Anexo 3 */}
              {errors.archivoAnexo3 && (
                <p className="text-xs font-bold text-red-600 font-game flex items-center gap-1 mt-0.5">
                  <span>⚠️</span> {errors.archivoAnexo3}
                </p>
              )}

              {/* Aviso diagnóstico de Google Cloud Storage */}
              {anexo3StatusNotice && (
                <div
                  className={`text-xs p-2.5 rounded-xl border-2 border-black font-game font-semibold mt-1 flex items-start gap-2 shadow-[2px_2px_0_#000] ${
                    anexo3StatusNotice.type === 'success'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                      : anexo3StatusNotice.type === 'warning'
                      ? 'bg-amber-100 text-amber-950 border-amber-600'
                      : 'bg-red-100 text-red-950 border-red-600'
                  }`}
                >
                  <span className="shrink-0 text-sm">{anexo3StatusNotice.type === 'success' ? '📁' : '⚠️'}</span>
                  <span>{anexo3StatusNotice.message}</span>
                </div>
              )}
            </div>
          )}

          {/* CAMPO DE SUBIR ARCHIVO: VOUCHER O COMPROBANTE DE PAGO (Solo para DIRIGENTE A CARGO) */}
          {formData.cargo === 'DIRIGENTE A CARGO' ? (
            <div className="mt-4 pt-4 border-t-2 border-slate-200 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-black font-game flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  Voucher de Pago (Yape / Plin / Transferencia) <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 normal-case">
                  (Imagen JPG, PNG, WEBP o comprobante PDF)
                </span>
              </label>

              <input
                ref={voucherFileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                onChange={handleVoucherFileChange}
                className="hidden"
                id="voucher-file-input"
              />

              {!formData.voucherPago ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingVoucher(true);
                  }}
                  onDragLeave={() => setIsDraggingVoucher(false)}
                  onDrop={handleVoucherDrop}
                  onClick={() => voucherFileInputRef.current?.click()}
                  className={`
                    border-3 border-dashed rounded-2xl p-4 sm:p-5
                    flex flex-col items-center justify-center text-center cursor-pointer
                    transition-all duration-200 select-none
                    ${
                      errors.voucherPago
                        ? 'border-red-500 bg-red-50/60'
                        : isDraggingVoucher
                        ? 'border-purple-600 bg-purple-100 scale-[1.01]'
                        : 'border-black bg-slate-50 hover:bg-purple-50/40'
                    }
                  `}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0_#000]">
                    <CreditCard className="w-5 h-5 text-purple-700" />
                  </div>
                  <p className="font-game font-bold text-sm text-black">
                    Haz clic aquí o arrastra la captura de tu <span className="text-purple-700">Yape, Plin o Transferencia</span> <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Formatos admitidos: Captura de pantalla (.png, .jpg), foto del voucher o PDF
                  </p>
                </div>
              ) : (
                <div className="bg-purple-50/70 border-3 border-black p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0_#000]">
                  <div className="flex items-center gap-3 min-w-0">
                    {voucherPreviewUrl ? (
                      <img
                        src={voucherPreviewUrl}
                        alt="Voucher de pago"
                        className="w-11 h-11 rounded-xl object-cover border-2 border-black shrink-0 shadow-[1px_1px_0_#000]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-purple-600 border-2 border-black flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0_#000]">
                        <Receipt className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 border border-black font-game uppercase">
                          Voucher Pago
                        </span>
                        <span className="font-game font-bold text-sm text-black truncate max-w-[200px] sm:max-w-xs" title={formData.voucherPagoName || formData.voucherPago}>
                          {formData.voucherPagoName || (formData.voucherPago.startsWith('http') ? 'Comprobante de Pago' : formData.voucherPago)}
                        </span>
                      </div>
                      <div className="text-xs text-purple-900 font-bold flex items-center gap-2 mt-0.5">
                        {isUploadingVoucher ? (
                          <span className="flex items-center gap-1 text-purple-700">
                            <Loader2 className="w-3 h-3 animate-spin" /> Subiendo voucher...
                          </span>
                        ) : (
                          <span className="text-emerald-700">✓ Voucher guardado y vinculado</span>
                        )}
                        {formData.voucherPagoSize && (
                          <span className="text-slate-500">• {formData.voucherPagoSize}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {formData.voucherPago.startsWith('http') && (
                      <a
                        href={formData.voucherPago}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-3d btn-yellow py-1 px-2 text-xs flex items-center gap-1 shadow-[0_2px_0_#000]"
                        title="Ver voucher subido en pestaña nueva"
                      >
                        <span>Ver</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => voucherFileInputRef.current?.click()}
                      className="btn-3d btn-yellow py-1 px-2.5 text-xs shadow-[0_2px_0_#000]"
                      title="Cambiar voucher"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="btn-3d btn-red py-1 px-2.5 text-xs shadow-[0_2px_0_#000]"
                      title="Eliminar voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error específico para Voucher de Pago */}
              {errors.voucherPago && (
                <p className="text-xs font-bold text-red-600 font-game flex items-center gap-1 mt-0.5">
                  <span>⚠️</span> {errors.voucherPago}
                </p>
              )}

              {/* Aviso diagnóstico de Google Cloud Storage para el voucher */}
              {voucherStatusNotice && (
                <div
                  className={`text-xs p-2.5 rounded-xl border-2 border-black font-game font-semibold mt-1 flex items-start gap-2 shadow-[2px_2px_0_#000] ${
                    voucherStatusNotice.type === 'success'
                      ? 'bg-purple-100 text-purple-950 border-purple-600'
                      : voucherStatusNotice.type === 'warning'
                      ? 'bg-amber-100 text-amber-950 border-amber-600'
                      : 'bg-red-100 text-red-950 border-red-600'
                  }`}
                >
                  <span className="shrink-0 text-sm">{voucherStatusNotice.type === 'success' ? '💳' : '⚠️'}</span>
                  <span>{voucherStatusNotice.message}</span>
                </div>
              )}
            </div>
          ) : formData.cargo === 'EQUIPO DE APOYO' ? (
            /* Mensaje claro y destacado para EQUIPO DE APOYO sobre el ingreso sin costo y referido */
            <div className="mt-4 pt-4 border-t-2 border-slate-200">
              <div className="p-4 bg-emerald-50 border-3 border-emerald-600 rounded-2xl flex flex-col sm:flex-row items-start gap-3.5 shadow-[2px_2px_0_#000]">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 border-2 border-black text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-xs">
                  🎁
                </div>
                <div className="space-y-1 text-emerald-950 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold font-game uppercase text-emerald-900 text-sm">
                      Ingreso Exonerado de Pago — S/ 0.00
                    </h4>
                    <span className="bg-emerald-200 text-emerald-900 border border-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      No se exige pago ni voucher
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                    Al formar parte del <strong>Equipo de Apoyo</strong>, <u>no se te exige realizar ningún pago ni adjuntar comprobante bancario</u> para ingresar al evento. Tu registro y participación están formalmente <strong>referidos y avalados por el Dirigente a Cargo</strong> de tu manada {formData.dirigenteReferenteNombre ? (<span>(<strong>{formData.dirigenteReferenteNombre}</strong>)</span>) : '(seleccionado arriba)'}.
                  </p>
                  <div className="pt-1.5 flex items-center gap-2 text-[11px] text-emerald-800 font-bold flex-wrap">
                    <span>✓ Costo de Ingreso: S/ 0.00</span>
                    <span>•</span>
                    <span>✓ Sin exigencia de comprobante</span>
                    <span>•</span>
                    <span>✓ Referido por Dirigente Titular</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons: Guardar (Verde) / Cancelar (Rojo) */}
          <div className="pt-5 border-t-4 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold font-game w-full sm:w-auto">
              {Object.keys(errors).length > 0 ? (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <span>⚠️</span> Por favor completa los campos obligatorios señalados en rojo
                </span>
              ) : !isFormComplete ? (
                <span className="text-slate-500 font-medium">
                  {formData.cargo === 'DIRIGENTE A CARGO'
                    ? '* Todos los campos, el Anexo 3 y el Voucher de Pago son obligatorios'
                    : formData.cargo === 'EQUIPO DE APOYO'
                    ? '* Equipo de Apoyo: Ingreso gratuito (S/ 0.00) — Selecciona al Dirigente a Cargo que te refiere'
                    : '* Completa tus datos para el registro de Staff'}
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>✓</span> Todos los campos requeridos listos para guardar
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleBackAttempt}
                className="btn-3d btn-red py-3 px-5 text-sm"
              >
                ✕ CANCELAR
              </button>

              {submitError && (
                <div className="w-full p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-800 text-xs font-bold font-game flex items-center gap-2 mb-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isUploadingFile || isUploadingVoucher}
                className={`btn-3d py-3 px-6 text-sm transition-all flex items-center gap-2 ${
                  isSubmitting || isUploadingFile || isUploadingVoucher
                    ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed shadow-none'
                    : 'btn-green shadow-[3px_3px_0_#000]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO EN BD...</span>
                  </>
                ) : isUploadingFile || isUploadingVoucher ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SUBIENDO ARCHIVOS...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>GUARDAR DIRIGENTE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved data exit warning dialog */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md win-3d p-6 text-black"
          >
            <h3 className="text-xl font-bold uppercase font-game mb-2 text-red-600">
              ⚠️ Información sin guardar
            </h3>
            <p className="text-sm text-slate-700 font-semibold mb-6">
              Hay información sin guardar en este formulario. Si sales ahora, los datos ingresados se descartarán.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="btn-3d btn-yellow py-2 px-4 text-xs"
              >
                Continuar Editando
              </button>
              <button
                onClick={onBack}
                className="btn-3d btn-red py-2 px-4 text-xs"
              >
                Salir sin Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

