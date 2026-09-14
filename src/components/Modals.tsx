import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, X, Trash2, Edit3, Shield, Award, FileText, Upload, FileCheck, Loader2 } from 'lucide-react';
import { Lobato, AdultoVoluntario, DirigenteRegistro } from '../types';
import { formatFechaNacimiento, calcularEdad } from '../utils/lobatoUtils';
import { uploadDocumentoAnexo } from '../lib/databaseService';

// --- EDIT LOBATO MODAL ---
interface EditLobatoModalProps {
  lobato: Lobato;
  onSave: (updated: Lobato) => void;
  onClose: () => void;
}

export const EditLobatoModal: React.FC<EditLobatoModalProps> = ({ lobato, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    nombres: lobato.nombres,
    apellidos: lobato.apellidos,
    dni: lobato.dni,
    fechaNacimiento: lobato.fechaNacimiento,
    nicknameRoblox: lobato.nicknameRoblox,
    seisena: lobato.seisena || 'Seisena Blanca',
    grupoScout: lobato.grupoScout || lobato.unidad || '',
    ciudad: lobato.ciudad || '',
    permisoPadreAnexo4: lobato.permisoPadreAnexo4 || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [storageNotice, setStorageNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setStorageNotice(null);
      try {
        const uploadRes = await uploadDocumentoAnexo('ANEXO_4_LOBATO', file, lobato.id);
        const url = uploadRes.meta?.downloadUrl || uploadRes.meta?.dataUrl || '';
        if (uploadRes.success && url) {
          setFormData((prev) => ({ ...prev, permisoPadreAnexo4: url }));
          setStorageNotice({
            type: 'success',
            message: `✓ Archivo guardado en Google Cloud Storage (${file.name})`,
          });
        } else if (url) {
          setFormData((prev) => ({ ...prev, permisoPadreAnexo4: url }));
          setStorageNotice({
            type: 'success',
            message: `✓ Documento procesado (${file.name})`,
          });
        } else {
          setFormData((prev) => ({ ...prev, permisoPadreAnexo4: file.name }));
          setStorageNotice({
            type: 'warning',
            message: `⚠️ Subida a GCS pendiente de permisos/CORS: ${uploadRes.error || 'Revisa consola'}.`,
          });
        }
      } catch (err: any) {
        console.error('[EditLobatoModal] Error al subir anexo 4:', err);
        setStorageNotice({
          type: 'error',
          message: `❌ Error al subir: ${err?.message || String(err)}`,
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.nombres.trim()) newErrors.nombres = 'Ingresa los nombres';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Ingresa los apellidos';
    if (!formData.dni.trim()) newErrors.dni = 'Ingresa el DNI';
    if (!formData.fechaNacimiento.trim()) newErrors.fechaNacimiento = 'Selecciona la fecha de nacimiento';
    if (!formData.grupoScout.trim()) newErrors.grupoScout = 'Ingresa el grupo scout';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'Ingresa la ciudad';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...lobato,
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      dni: formData.dni.trim(),
      fechaNacimiento: formData.fechaNacimiento.trim(),
      nicknameRoblox: formData.nicknameRoblox.trim(),
      seisena: formData.seisena,
      grupoScout: formData.grupoScout.trim(),
      ciudad: formData.ciudad.trim(),
      unidad: formData.grupoScout.trim(),
      permisoPadreAnexo4: formData.permisoPadreAnexo4.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-xl my-auto win-3d p-6 sm:p-8 text-black"
      >
        <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-5">
          <h3 className="text-xl sm:text-2xl font-bold uppercase font-game text-black flex items-center gap-2.5">
            <img
              src="/assets/images/lobatos.jpg"
              alt="Lobato"
              className="w-7 h-7 rounded-full border border-black object-cover"
            />
            <span>Editar Lobato #{String(lobato.orden).padStart(2, '0')}</span>
          </h3>
          <button
            onClick={onClose}
            className="btn-3d btn-red py-1 px-2.5 text-xs shadow-[0_2px_0_#000]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                NOMBRES <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="input-3d"
              />
              {errors.nombres && <p className="text-xs text-red-600 font-bold font-game">{errors.nombres}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="input-3d"
              />
              {errors.apellidos && <p className="text-xs text-red-600 font-bold font-game">{errors.apellidos}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                DNI / Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="input-3d"
              />
              {errors.dni && <p className="text-xs text-red-600 font-bold font-game">{errors.dni}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Nickname Roblox
              </label>
              <input
                type="text"
                value={formData.nicknameRoblox}
                onChange={(e) => setFormData({ ...formData, nicknameRoblox: e.target.value })}
                className="input-3d"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game flex items-center justify-between">
                <span>Fecha Nacimiento <span className="text-red-500">*</span></span>
                {formData.fechaNacimiento && calcularEdad(formData.fechaNacimiento) !== null && (
                  <span className="text-[10px] text-blue-700 font-bold">
                    {calcularEdad(formData.fechaNacimiento)} años
                  </span>
                )}
              </label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="input-3d cursor-pointer"
              />
              {errors.fechaNacimiento && <p className="text-xs text-red-600 font-bold font-game">{errors.fechaNacimiento}</p>}
            </div>

            {/* Seisena */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Seisena <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.seisena}
                onChange={(e) => setFormData({ ...formData, seisena: e.target.value })}
                className="input-3d font-game font-bold text-xs"
              >
                <option value="Seisena Blanca">⚪ Seisena Blanca</option>
                <option value="Seisena Gris">🐺 Seisena Gris</option>
                <option value="Seisena Parda">🐾 Seisena Parda</option>
                <option value="Seisena Negra">🖤 Seisena Negra</option>
                <option value="Seisena Roja">🔴 Seisena Roja</option>
                <option value="Seisena Amarilla">🟡 Seisena Amarilla</option>
              </select>
            </div>

            {/* Grupo Scout (Input text) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-black font-game">
                Grupo Scout <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.grupoScout}
                onChange={(e) => setFormData({ ...formData, grupoScout: e.target.value })}
                placeholder="Ej. Grupo Scout Lima 02"
                className="input-3d"
              />
              {errors.grupoScout && <p className="text-xs text-red-600 font-bold font-game">{errors.grupoScout}</p>}
            </div>

            {/* Ciudad */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold uppercase text-black font-game">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Ej. Lima, Arequipa, Cusco..."
                className="input-3d"
              />
              {errors.ciudad && <p className="text-xs text-red-600 font-bold font-game">{errors.ciudad}</p>}
            </div>
          </div>

          {/* Permiso de Padre de Familia (Anexo 4 Perú) */}
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold uppercase text-black font-game flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Permiso de padre de familia (Anexo 4 Perú)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            {!formData.permisoPadreAnexo4 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-black rounded-xl p-2.5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <Upload className="w-4 h-4 text-black" />
                  <span>Adjuntar Anexo 4</span>
                </div>
                <span className="btn-3d btn-yellow py-0.5 px-2 text-[10px]">Subir</span>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-black rounded-xl p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-game font-bold text-xs text-black truncate">
                    {formData.permisoPadreAnexo4}
                  </span>
                  {isUploading && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-700 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, permisoPadreAnexo4: '' });
                    setStorageNotice(null);
                  }}
                  className="text-red-600 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Notificación de Google Cloud Storage */}
            {storageNotice && (
              <div
                className={`text-[11px] p-2 rounded-lg border border-black font-semibold mt-1 flex items-start gap-1.5 ${
                  storageNotice.type === 'success'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
                    : storageNotice.type === 'warning'
                    ? 'bg-amber-100 text-amber-950 border-amber-500'
                    : 'bg-red-100 text-red-950 border-red-500'
                }`}
              >
                <span className="shrink-0">{storageNotice.type === 'success' ? '📁' : '⚠️'}</span>
                <span>{storageNotice.message}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t-4 border-black flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-3d btn-red py-2 px-4 text-xs">
              ✕ Cancelar
            </button>
            <button type="submit" className="btn-3d btn-green py-2 px-5 text-xs">
              ✓ Guardar Cambios
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- DELETE CONFIRM MODAL ---
interface DeleteConfirmModalProps {
  lobato: Lobato;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  lobato,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-md win-3d p-6 sm:p-7 text-black"
      >
        <h3 className="text-xl font-bold uppercase font-game text-red-600 mb-3 flex items-center gap-2">
          <span>🗑</span> ¿Eliminar este lobato?
        </h3>

        <div className="p-4 rounded-xl bg-slate-50 border-3 border-black mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-black flex items-center justify-center text-xl shrink-0">
              🧒
            </div>
            <div>
              <h4 className="font-game text-base font-bold text-black">
                #{String(lobato.orden).padStart(2, '0')} - {lobato.nombres} {lobato.apellidos}
              </h4>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                DNI: {lobato.dni || 'Sin DNI'} • F. Nac: {formatFechaNacimiento(lobato.fechaNacimiento)} • {lobato.grupoScout || lobato.unidad}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 font-semibold mb-6">
          Esta acción quitará al participante de la lista actual de registro de esta sesión.
        </p>

        <div className="flex items-center justify-end gap-3 border-t-4 border-black pt-4">
          <button onClick={onCancel} className="btn-3d btn-yellow py-2 px-4 text-xs">
            ✕ Cancelar
          </button>
          <button onClick={onConfirm} className="btn-3d btn-red py-2 px-4 text-xs">
            ✓ Sí, Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- SUMMARY MODAL ---
interface SummaryModalProps {
  adulto: AdultoVoluntario;
  lobatos: Lobato[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  adulto,
  lobatos,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-2xl my-auto win-3d p-6 sm:p-8 text-black"
      >
        <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-5">
          <div>
            <h3 className="text-2xl font-bold uppercase font-game text-black flex items-center gap-2">
              <span>📋</span> Resumen de la Seisena
            </h3>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Verifica los datos de los integrantes de esta seisena antes de confirmar
            </p>
          </div>
          <span className="bg-amber-400 border-2 border-black text-black px-3 py-1 rounded-xl text-xs font-bold font-game shadow-[1px_1px_0_#000]">
            🐾 {lobatos.length} / 6 Lobatos
          </span>
        </div>

        {/* Adult Header Summary */}
        <div className="p-4 rounded-xl bg-blue-50 border-3 border-black mb-5 shadow-[2px_2px_0_#000]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-game mb-0.5">
            RESPONSABLE ADULTO
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-game text-lg font-bold text-black flex items-center gap-2">
                <img
                  src="/assets/images/World_Scout_Emblem.png"
                  alt="World Scout Emblem"
                  className="w-5 h-5 object-contain"
                />
                <span>{adulto.nombre}</span>
              </h4>
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap mt-0.5">
                <span>ASP: <strong>{adulto.registroAsp}</strong></span>
                <span>•</span>
                <span>Grupo Scout: <strong>{adulto.grupoScout || adulto.unidad}</strong></span>
                <span>•</span>
                <span>Ciudad: <strong>{adulto.ciudad || adulto.localidad}</strong></span>
                {adulto.archivoAnexo3 && (
                  <span>• <span className="text-blue-800 font-bold">📄 {adulto.archivoAnexo3Name || (adulto.archivoAnexo3.startsWith('http') ? 'Anexo 3' : adulto.archivoAnexo3)}</span></span>
                )}
                {adulto.voucherPago && (
                  <span>• <span className="text-purple-800 font-bold">💳 {adulto.voucherPagoName || (adulto.voucherPago.startsWith('http') ? 'Voucher' : adulto.voucherPago)}</span></span>
                )}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-white border border-black text-xs font-bold font-game">
              {adulto.cargo || 'DIRIGENTE A CARGO'}
            </span>
          </div>
        </div>

        {/* Lobatos Count Banner */}
        <div className="flex items-center justify-between px-1 mb-2">
          <h5 className="font-game text-xs font-bold text-black uppercase tracking-wider">
            Lobatos Registrados ({lobatos.length})
          </h5>
          <span className="text-xs text-green-700 font-bold font-game">
            ✓ Todos vinculados
          </span>
        </div>

        {/* Scrollable Lobatos List */}
        <div className="scroll-box max-h-56 space-y-2 mb-6">
          {lobatos.map((lob) => {
            const edadCalc = calcularEdad(lob.fechaNacimiento);
            return (
              <div
                key={lob.id}
                className="p-3 rounded-xl bg-white border-2 border-black flex items-center justify-between gap-3 text-xs shadow-[2px_2px_0_#000]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-game font-bold text-xs shrink-0">
                    {String(lob.orden).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-black text-sm truncate">
                      {lob.nombres} {lob.apellidos}
                    </div>
                    <div className="text-slate-500 text-[11px] font-semibold truncate flex items-center gap-2 flex-wrap">
                      <span>DNI: <strong>{lob.dni}</strong></span>
                      <span>•</span>
                      <span>F. Nac: {formatFechaNacimiento(lob.fechaNacimiento)} {edadCalc ? `(${edadCalc}a)` : ''}</span>
                      <span>•</span>
                      <span>Roblox: <strong className="text-blue-600">{lob.nicknameRoblox || 'N/A'}</strong></span>
                      {lob.permisoPadreAnexo4 && (
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1 rounded border border-emerald-200">
                          ✓ Anexo 4
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-game border border-black bg-blue-50 text-blue-900 truncate max-w-[170px]">
                    🏕️ {lob.grupoScout || lob.unidad} {lob.ciudad ? `• ${lob.ciudad}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons: Confirmar / Cancelar */}
        <div className="pt-4 border-t-4 border-black flex items-center justify-end gap-3 flex-wrap">
          <button onClick={onCancel} className="btn-3d btn-red py-2.5 px-5 text-xs sm:text-sm">
            ✕ CANCELAR
          </button>

          <button onClick={onConfirm} className="btn-3d btn-green py-2.5 px-6 text-xs sm:text-sm">
            ✓ CONFIRMAR REGISTRO DE SEISENA
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- SUCCESS VICTORY MODAL ---
interface SuccessVictoryModalProps {
  count: number;
  adulto: AdultoVoluntario;
  onReset: () => void;
  onGoHome: () => void;
}

export const SuccessVictoryModal: React.FC<SuccessVictoryModalProps> = ({
  count,
  adulto,
  onReset,
  onGoHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg text-center win-3d p-6 sm:p-8 text-black"
      >
        <div className="text-6xl mb-3 animate-bounce">
          🎉
        </div>

        <div className="bg-[#FFD700] border-3 border-black px-4 py-1 rounded-xl inline-block shadow-[2px_2px_0_#000] mb-3">
          <span className="text-black font-bold text-xs uppercase italic font-game">
            ¡Misión JOTA JOTI Registrada!
          </span>
        </div>

        <h2 className="font-game text-2xl sm:text-4xl font-bold uppercase text-black mb-2">
          ¡REGISTRO EXITOSO!
        </h2>

        <p className="text-sm text-slate-700 font-semibold leading-relaxed max-w-md mx-auto mb-6">
          Se han procesado correctamente <strong className="text-blue-700 font-bold">{count} lobato(s)</strong> bajo la responsabilidad de <strong className="text-black font-bold">{adulto.nombre}</strong>.
        </p>

        {/* Ticket / Confirmation Code Badge */}
        <div className="p-4 rounded-xl bg-slate-50 border-3 border-black mb-6 text-left shadow-[2px_2px_0_#000]">
          <div className="flex items-center justify-between text-xs text-slate-600 border-b-2 border-black pb-2 mb-2">
            <span className="font-game font-bold uppercase">Comprobante Oficial</span>
            <span className="font-mono text-black font-extrabold">JJ-PE26-{(Math.random() * 90000 + 10000).toFixed(0)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">Grupo Scout</span>
              <span className="text-black font-bold">{adulto.grupoScout || adulto.unidad}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">Ciudad</span>
              <span className="text-black font-bold">{adulto.ciudad || adulto.localidad}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGoHome}
            className="btn-3d btn-blue py-3 px-6 w-full text-sm font-bold"
          >
            🏠 Menú Principal
          </button>

          <button
            onClick={onReset}
            className="btn-3d btn-yellow py-3 px-6 w-full text-sm font-bold"
          >
            + Registrar Otra Manada
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- DIRIGENTE SUCCESS MODAL ---
interface DirigenteSuccessModalProps {
  dirigente: DirigenteRegistro;
  onGoHome: () => void;
  onRegisterAnother: () => void;
}

export const DirigenteSuccessModal: React.FC<DirigenteSuccessModalProps> = ({
  dirigente,
  onGoHome,
  onRegisterAnother,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-md text-center win-3d p-6 sm:p-8 text-black"
      >
        <div className="flex items-center justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-black p-2 flex items-center justify-center shadow-[2px_2px_0_#000]">
            <img
              src="/assets/images/World_Scout_Emblem.png"
              alt="World Scout Emblem"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="bg-[#1E90FF] text-white border-3 border-black px-4 py-1 rounded-xl inline-block shadow-[2px_2px_0_#000] mb-3">
          <span className="font-bold text-xs uppercase font-game">
            Dirigente Guardado
          </span>
        </div>

        <h3 className="font-game text-2xl font-bold uppercase text-black mb-2">
          ¡Dirigente Registrado!
        </h3>

        <p className="text-sm text-slate-700 font-semibold mb-5">
          Los datos de <strong className="text-blue-700">{dirigente.nombres} {dirigente.apellidos}</strong> ({dirigente.cargo}) se han registrado con éxito en el sistema oficial.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 border-3 border-black mb-6 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Cargo:</span>
            <span className="text-emerald-700 font-extrabold">{dirigente.cargo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">ASP:</span>
            <span className="text-black font-extrabold">{dirigente.registroAsp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">DNI:</span>
            <span className="text-black font-bold">{dirigente.dni}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Grupo Scout:</span>
            <span className="text-black font-bold">{dirigente.grupoScout || dirigente.unidad}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-bold">Ciudad:</span>
            <span className="text-black font-bold">{dirigente.ciudad || dirigente.localidad}</span>
          </div>
          {dirigente.archivoAnexo3 && (
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Anexo 3 / Lista:</span>
              <span className="text-blue-700 font-bold truncate max-w-[180px]">📄 {dirigente.archivoAnexo3Name || (dirigente.archivoAnexo3.startsWith('http') ? 'Anexo 3 Adjunto' : dirigente.archivoAnexo3)}</span>
            </div>
          )}
          {dirigente.voucherPago && (
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Voucher de Pago:</span>
              <span className="text-purple-700 font-bold flex items-center gap-1 truncate max-w-[180px]">
                💳 {dirigente.voucherPagoName || (dirigente.voucherPago.startsWith('http') ? 'Voucher Adjunto' : dirigente.voucherPago)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRegisterAnother}
            className="btn-3d btn-yellow py-2.5 px-4 w-full text-xs font-bold"
          >
            + Otro Dirigente
          </button>
          <button
            onClick={onGoHome}
            className="btn-3d btn-green py-2.5 px-4 w-full text-xs font-bold"
          >
            ✓ Ir al Inicio
          </button>
        </div>
      </motion.div>
    </div>
  );
};



