import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserCheck, Shield, Check, X, Phone, Mail, MapPin, Tag, Award, Upload, FileSpreadsheet, FileText, Trash2, Loader2, Receipt, CreditCard, Image as ImageIcon } from 'lucide-react';
import { Card3D } from './Card3D';
import { Button3D } from './Button3D';
import { DirigenteRegistro } from '../types';
import { uploadDocumentoAnexo } from '../lib/databaseService';

interface LeaderRegistrationScreenProps {
  onBack: () => void;
  onSaveSuccess: (dirigente: DirigenteRegistro) => void;
}

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
    cargo: 'DIRIGENTE A CARGO' as 'DIRIGENTE A CARGO' | 'STAFF' | 'ORGANIZADORES',
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

  const isFormComplete = Boolean(
    formData.nombres.trim() &&
    formData.apellidos.trim() &&
    formData.dni.trim() &&
    formData.registroAsp.trim() &&
    formData.cargo.trim() &&
    formData.grupoScout.trim() &&
    formData.ciudad.trim() &&
    formData.nicknameRoblox.trim() &&
    formData.celular.trim() &&
    formData.email.trim() &&
    formData.archivoAnexo3.trim() &&
    formData.voucherPago.trim() &&
    !isUploadingFile &&
    !isUploadingVoucher
  );

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // TODOS LOS CAMPOS SON ESTRICTAMENTE OBLIGATORIOS
    if (!formData.nombres.trim()) newErrors.nombres = 'Ingresa los nombres del dirigente';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Ingresa los apellidos del dirigente';
    if (!formData.dni.trim()) newErrors.dni = 'Ingresa el DNI o documento de identidad';
    if (!formData.registroAsp.trim()) newErrors.registroAsp = 'Ingresa el código de Registro ASP (ej. ASP-00125)';
    if (!formData.cargo.trim()) newErrors.cargo = 'Selecciona el cargo del dirigente';
    if (!formData.grupoScout.trim()) newErrors.grupoScout = 'Ingresa el grupo scout';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'Ingresa la ciudad o localidad';
    if (!formData.nicknameRoblox.trim()) newErrors.nicknameRoblox = 'Ingresa el Nickname de Roblox (Misión Virtual)';
    if (!formData.celular.trim()) newErrors.celular = 'Ingresa el teléfono o WhatsApp de contacto';

    if (!formData.email.trim()) {
      newErrors.email = 'Ingresa el correo electrónico del dirigente';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido (ej. dirigente@scoutsperu.org)';
    }

    if (!formData.archivoAnexo3.trim()) {
      newErrors.archivoAnexo3 = 'Obligatorio: debes adjuntar el archivo del Anexo 3 o lista de participantes';
    } else if (isUploadingFile) {
      newErrors.archivoAnexo3 = 'Por favor espera a que termine de subirse el archivo Anexo 3';
    }

    if (!formData.voucherPago.trim()) {
      newErrors.voucherPago = 'Obligatorio: debes adjuntar el voucher de pago (Yape, Plin o transferencia bancaria)';
    } else if (isUploadingVoucher) {
      newErrors.voucherPago = 'Por favor espera a que termine de procesarse el voucher de pago';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const savedDirigente: DirigenteRegistro = {
      id: 'dir-' + Date.now(),
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      registroAsp: formData.registroAsp.trim(),
      grupoScout: formData.grupoScout.trim(),
      cargo: formData.cargo,
      ciudad: formData.ciudad.trim(),
      email: formData.email.trim(),
      celular: formData.celular.trim(),
      nicknameRoblox: formData.nicknameRoblox.trim(),
      archivoAnexo3: formData.archivoAnexo3 || undefined,
      archivoAnexo3Size: formData.archivoAnexo3Size || undefined,
      voucherPago: formData.voucherPago || undefined,
      voucherPagoName: formData.voucherPagoName || undefined,
      voucherPagoSize: formData.voucherPagoSize || undefined,
    };

    onSaveSuccess(savedDirigente);
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
              <label className="text-xs font-bold uppercase text-black font-game">
                DNI / Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                placeholder="Ej. 40891234"
                className={`input-3d ${errors.dni ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.dni && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.dni}</p>
              )}
            </div>

            {/* Registro ASP */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Registro ASP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.registroAsp}
                onChange={(e) => handleChange('registroAsp', e.target.value)}
                placeholder="Ej. ASP-00125"
                className={`input-3d ${errors.registroAsp ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.registroAsp && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.registroAsp}</p>
              )}
            </div>

            {/* Cargo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                className={`input-3d cursor-pointer font-bold ${errors.cargo ? 'border-red-500 bg-red-50/50' : ''}`}
              >
                <option value="DIRIGENTE A CARGO">DIRIGENTE A CARGO</option>
                <option value="STAFF">STAFF</option>
                <option value="ORGANIZADORES">ORGANIZADORES</option>
              </select>
              {errors.cargo && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.cargo}</p>
              )}
            </div>

            {/* Grupo Scout */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Grupo Scout <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.grupoScout}
                onChange={(e) => handleChange('grupoScout', e.target.value)}
                placeholder="Ej. Grupo Scout Lima 02"
                className={`input-3d ${errors.grupoScout ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.grupoScout && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.grupoScout}</p>
              )}
            </div>

            {/* Ciudad */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => handleChange('ciudad', e.target.value)}
                placeholder="Ej. Lima, Arequipa, Cusco..."
                className={`input-3d ${errors.ciudad ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.ciudad && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.ciudad}</p>
              )}
            </div>

            {/* Nickname Roblox */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Nickname Roblox (Misión Virtual) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nicknameRoblox}
                onChange={(e) => handleChange('nicknameRoblox', e.target.value)}
                placeholder="Ej. Akela_ScoutLeader"
                className={`input-3d ${errors.nicknameRoblox ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.nicknameRoblox && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.nicknameRoblox}</p>
              )}
            </div>

            {/* Celular */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Teléfono / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => handleChange('celular', e.target.value)}
                placeholder="Ej. 987 654 321"
                className={`input-3d ${errors.celular ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.celular && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.celular}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Ej. dirigente@scoutsperu.org"
                className={`input-3d ${errors.email ? 'border-red-500 bg-red-50/50' : ''}`}
              />
              {errors.email && (
                <p className="text-xs font-bold text-red-600 font-game">{errors.email}</p>
              )}
            </div>
          </div>

          {/* CAMPO DE SUBIR ARCHIVO: ANEXO 3 O LISTA DE PARTICIPANTES */}
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

          {/* CAMPO DE SUBIR ARCHIVO: VOUCHER O COMPROBANTE DE PAGO (YAPE / PLIN / TRANSFERENCIA) */}
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

          {/* Action Buttons: Guardar (Verde) / Cancelar (Rojo) */}
          <div className="pt-5 border-t-4 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-semibold font-game w-full sm:w-auto">
              {Object.keys(errors).length > 0 ? (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <span>⚠️</span> Por favor completa todos los campos obligatorios y adjunta ambos archivos (*)
                </span>
              ) : !isFormComplete ? (
                <span className="text-slate-500 font-medium">
                  * Todos los campos, el archivo Anexo 3 y el Voucher de Pago son obligatorios
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>✓</span> Todos los campos y archivos listos para guardar
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

              <button
                type="submit"
                disabled={isUploadingFile || isUploadingVoucher}
                className={`btn-3d py-3 px-6 text-sm transition-all ${
                  isUploadingFile || isUploadingVoucher
                    ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed shadow-none'
                    : 'btn-green shadow-[3px_3px_0_#000]'
                }`}
              >
                {isUploadingFile || isUploadingVoucher ? 'SUBIENDO ARCHIVOS...' : '✓ GUARDAR DIRIGENTE'}
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

