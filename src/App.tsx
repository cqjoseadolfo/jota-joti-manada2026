import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SpaceBackground } from './components/SpaceBackground';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { LeaderRegistrationScreen } from './components/LeaderRegistrationScreen';
import { LobatosRegistrationScreen } from './components/LobatosRegistrationScreen';
import { NicknameManagerScreen } from './components/NicknameManagerScreen';
import {
  EditLobatoModal,
  DeleteConfirmModal,
  SummaryModal,
  SuccessVictoryModal,
  DirigenteSuccessModal,
} from './components/Modals';
import {
  ScreenType,
  Lobato,
  AdultoVoluntario,
  ModalState,
  DirigenteRegistro,
} from './types';
import {
  saveLobatoToFirestore,
  saveMultipleLobatosToFirestore,
  deleteLobatoFromFirestore,
  updateLobatoNicknameInFirestore,
} from './lib/databaseService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedAdulto, setSelectedAdulto] = useState<AdultoVoluntario | null>(null);
  // Lista de lobatos para el borrador/lote de registro actual (privado por sesión de dirigente)
  const [lobatos, setLobatos] = useState<Lobato[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });

  // Handle Lobato update
  const handleSaveEditedLobato = async (updated: Lobato) => {
    setLobatos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setModalState({ type: 'none' });
    try {
      await saveLobatoToFirestore(updated);
    } catch (e) {
      console.warn('Error guardando en Firestore:', e);
    }
  };

  // Handle single nickname update
  const handleUpdateLobatoNickname = async (id: string, newNickname: string) => {
    try {
      await updateLobatoNicknameInFirestore(id, newNickname);
    } catch (e) {
      console.warn('Error actualizando nickname en Firestore:', e);
    }
  };

  // Handle batch nicknames update
  const handleBatchNicknamesUpdate = async (updatedLobatos: Lobato[]) => {
    try {
      await saveMultipleLobatosToFirestore(updatedLobatos);
    } catch (e) {
      console.warn('Error en lote Firestore:', e);
    }
  };

  // Handle Lobato delete
  const handleConfirmDelete = async (id: string) => {
    setLobatos((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, index) => ({
        ...item,
        orden: index + 1,
      }));
    });
    setModalState({ type: 'none' });
    try {
      await deleteLobatoFromFirestore(id);
    } catch (e) {
      console.warn('Error eliminando de Firestore:', e);
    }
  };

  // Handle Dirigente saved
  const handleDirigenteSaved = (dirigente: DirigenteRegistro) => {
    setModalState({ type: 'dirigente_success', dirigente });
  };

  // Handle Final Lobatos Confirmation
  const handleConfirmSummary = async () => {
    if (!selectedAdulto) return;
    const finalCount = lobatos.length;
    setModalState({
      type: 'success',
      count: finalCount,
      adulto: selectedAdulto,
    });
    try {
      const rawAsp = (selectedAdulto.registroAsp || '').trim().toUpperCase();
      const digits = rawAsp.replace(/[^0-9]/g, '');
      const standardAsp = digits ? `ASP-${digits}` : rawAsp;
      const adultFullName = selectedAdulto.nombre
        || `${(selectedAdulto as any).nombres || ''} ${(selectedAdulto as any).apellidos || ''}`.trim() || 'Dirigente';

      const normalizedLobatos = lobatos.map((lob) => ({
        ...lob,
        adultoId: selectedAdulto.id,
        adultoNombre: adultFullName,
        adultoAsp: standardAsp,
      }));

      await saveMultipleLobatosToFirestore(normalizedLobatos);
      const cleanAspKey = standardAsp.replace(/[^A-Z0-9]/g, '');
      if (cleanAspKey) {
        sessionStorage.removeItem(`draft_seisena_${cleanAspKey}`);
      }
    } catch (e) {
      console.warn('Error guardando participantes finales en Firestore:', e);
    }
  };

  // Reset for next seisena registration
  const handleResetForNextBatch = () => {
    setLobatos([]);
    // Mantener el dirigente seleccionado para que pueda registrar su siguiente seisena de inmediato
    setModalState({ type: 'none' });
    setCurrentScreen('lobatos');
  };

  const handleGoHomeAfterSuccess = () => {
    setLobatos([]);
    setSelectedAdulto(null);
    setModalState({ type: 'none' });
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-slate-100 selection:bg-yellow-400 selection:text-slate-950">
      {/* 3D Animated Space Canvas & Galaxy Background */}
      <SpaceBackground />

      {/* Main Container */}
      <div className="w-full relative z-10 flex-1 flex flex-col">
        {/* Main Header with JOTA JOTI Identity */}
        <Header
          onGoHome={() => setCurrentScreen('home')}
          showHomeButton={currentScreen !== 'home'}
        />

        {/* Screen Transitions */}
        <main className="flex-1 flex flex-col items-center justify-center pb-8">
          <AnimatePresence mode="wait">
            {currentScreen === 'home' && (
              <HomeScreen
                key="home-screen"
                onSelectDirigente={() => setCurrentScreen('dirigente')}
                onSelectLobatos={() => setCurrentScreen('lobatos')}
                onSelectNicknames={() => setCurrentScreen('nicknames')}
              />
            )}

            {currentScreen === 'dirigente' && (
              <LeaderRegistrationScreen
                key="dirigente-screen"
                onBack={() => setCurrentScreen('home')}
                onSaveSuccess={handleDirigenteSaved}
              />
            )}

            {currentScreen === 'lobatos' && (
              <LobatosRegistrationScreen
                key="lobatos-screen"
                onBack={() => setCurrentScreen('home')}
                onGoToNicknames={() => setCurrentScreen('nicknames')}
                onOpenSummary={(adulto, lobatosList) => {
                  setModalState({ type: 'summary' });
                }}
                onEditLobato={(lobato) => {
                  setModalState({ type: 'edit', lobato });
                }}
                onDeleteLobato={(lobato) => {
                  setModalState({ type: 'delete', lobato });
                }}
                lobatos={lobatos}
                setLobatos={setLobatos}
                selectedAdulto={selectedAdulto}
                setSelectedAdulto={setSelectedAdulto}
              />
            )}

            {currentScreen === 'nicknames' && (
              <NicknameManagerScreen
                key="nicknames-screen"
                lobatos={lobatos}
                onUpdateNickname={handleUpdateLobatoNickname}
                onUpdateBatchNicknames={handleBatchNicknamesUpdate}
                onBack={() => setCurrentScreen('home')}
                onGoToRegistration={() => setCurrentScreen('lobatos')}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      <AnimatePresence>
        {/* EDIT MODAL */}
        {modalState.type === 'edit' && (
          <EditLobatoModal
            key="edit-modal"
            lobato={modalState.lobato}
            onSave={handleSaveEditedLobato}
            onClose={() => setModalState({ type: 'none' })}
          />
        )}

        {/* DELETE CONFIRM MODAL */}
        {modalState.type === 'delete' && (
          <DeleteConfirmModal
            key="delete-modal"
            lobato={modalState.lobato}
            onConfirm={() => handleConfirmDelete(modalState.lobato.id)}
            onCancel={() => setModalState({ type: 'none' })}
          />
        )}

        {/* SUMMARY MODAL */}
        {modalState.type === 'summary' && selectedAdulto && (
          <SummaryModal
            key="summary-modal"
            adulto={selectedAdulto}
            lobatos={lobatos}
            onConfirm={handleConfirmSummary}
            onCancel={() => setModalState({ type: 'none' })}
          />
        )}

        {/* SUCCESS VICTORY MODAL */}
        {modalState.type === 'success' && (
          <SuccessVictoryModal
            key="success-modal"
            count={modalState.count}
            adulto={modalState.adulto}
            onReset={handleResetForNextBatch}
            onGoHome={handleGoHomeAfterSuccess}
          />
        )}

        {/* DIRIGENTE SUCCESS MODAL */}
        {modalState.type === 'dirigente_success' && (
          <DirigenteSuccessModal
            key="dirigente-success-modal"
            dirigente={modalState.dirigente}
            onGoHome={() => {
              setModalState({ type: 'none' });
              setCurrentScreen('home');
            }}
            onRegisterAnother={() => {
              setModalState({ type: 'none' });
              setCurrentScreen('dirigente');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

