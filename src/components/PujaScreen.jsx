import React, { useRef, useEffect, useState } from 'react';
import { designSystem } from '../styles/designSystem';

const SankalpaPauseCard = ({ hostData, panchangData }) => (
  <div style={{ ...designSystem.cardContainer, background: designSystem.colors.saffron, border: `2px solid ${designSystem.colors.gold}`, padding: '20px', marginBottom: '24px' }}>
    <p style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, textAlign: 'center', margin: '0 0 16px 0', fontSize: '16px' }}>🙏 कुटुंबाच्या इच्छा जाणून घ्या</p>
    <div style={{ ...designSystem.body, color: designSystem.colors.ink, lineHeight: '1.8', fontSize: '14px' }}>
      <p><strong>{hostData.hostMaleName}</strong> — {hostData.hostMaleAspiration || 'इच्छा सांगायला अपेक्षित'}</p>
      <p><strong>{hostData.hostFemaleName}</strong> — {hostData.hostFemaleAspiration || 'इच्छा सांगायला अपेक्षित'}</p>
      {hostData.children && hostData.children.length > 0 && (
        <div>
          <p><strong>मुले:</strong></p>
          {hostData.children.map((child, idx) => (
            <p key={idx}>{child.name} — {child.aspiration || 'इच्छा सांगायला अपेक्षित'}</p>
          ))}
        </div>
      )}
    </div>
  </div>
);

const RoomCodeBadge = ({ roomCode }) => {
  if (!roomCode) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '8px',
      right: '8px',
      background: designSystem.colors.saffron,
      color: designSystem.colors.ink,
      padding: '6px 12px',
      borderRadius: '6px',
      border: `1px solid ${designSystem.colors.gold}`,
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 1000,
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }}>
      पूजा कोड: {roomCode}
    </div>
  );
};

const ControllerMode = ({
  currentSection,
  currentStep,
  currentSectionIdx,
  currentStepIdx,
  sections,
  hostData,
  panchangData,
  roomCode,
  onNext,
  onPrev,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const R2_BASE_URL = 'https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev';

  const totalSteps = sections.reduce((sum, s) => sum + s.steps.length, 0);
  const completedSteps = sections.slice(0, currentSectionIdx).reduce((sum, s) => sum + s.steps.length, 0) + currentStepIdx;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const isSankalpaPause = currentSectionIdx === 3 && currentStepIdx === 1;

  // Screen लॉक (पूजा सुरू होतेय)
  useEffect(() => {
    const wakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake lock अक्षम:', err);
      }
    };
    wakeLock();
  }, []);

  return (
    <div style={{ ...designSystem.controllerContainer }}>
      <RoomCodeBadge roomCode={roomCode} />
      <div style={designSystem.controllerHeader}>
        <div style={{ height: '4px', background: designSystem.colors.secondary, borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: designSystem.colors.gold,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <p style={{ fontSize: '12px', color: designSystem.colors.secondary, margin: 0 }}>
          {completedSteps}/{totalSteps}
        </p>
      </div>

      <div style={designSystem.controllerContent}>
        <h2 style={{ ...designSystem.body, fontSize: '16px', fontWeight: '600', color: designSystem.colors.ink, margin: '0 0 12px 0' }}>
          {currentSection.title}
        </h2>
        <p style={{ ...designSystem.body, fontSize: '24px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 16px 0' }}>
          {currentStep.title}
        </p>

        {currentStep.participation && (
          <div style={{ fontSize: '14px', color: designSystem.colors.secondary, marginBottom: '16px', padding: '12px', background: '#FFF', borderRadius: '6px', borderLeft: `4px solid ${designSystem.colors.gold}` }}>
            {currentStep.participation === 'priest-only' && '🕉️ पुजारी एकट'}
            {currentStep.participation === 'family-joins' && '🙏 परिवार सहभागी'}
            {currentStep.participation === 'all-together' && '🕉️🙏 सर्वांनी एकत्र'}
          </div>
        )}

        {isSankalpaPause && (
          <SankalpaPauseCard hostData={hostData} panchangData={panchangData} />
        )}

        {currentStep.mediaType === 'audio' && currentStep.audioFile && (
          <div style={{ marginBottom: '24px' }}>
            <audio
              ref={audioRef}
              src={`${R2_BASE_URL}/${currentStep.audioFile}`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              style={{ width: '100%', marginBottom: '12px' }}
              controls
            />
            <p style={{ fontSize: '13px', color: designSystem.colors.secondary, margin: 0 }}>
              अंदाज: {Math.ceil((currentStep.duration_hint || 0) / 60)} मिनिटे
            </p>
          </div>
        )}

        {currentStep.mediaType === 'text' && (
          <div style={{ ...designSystem.cardContainer, padding: '16px', borderLeft: `4px solid ${designSystem.colors.gold}` }}>
            <p style={{ ...designSystem.body, margin: '0 0 12px 0', lineHeight: '1.6' }}>
              {currentStep.instruction}
            </p>
            {currentStep.textContent && (
              <p style={{ fontSize: '13px', color: designSystem.colors.secondary, margin: 0, lineHeight: '1.8', fontFamily: 'Noto Devanagari' }}>
                {currentStep.textContent}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', padding: '16px', borderTop: `1px solid ${designSystem.colors.secondary}` }}>
        <button onClick={onPrev} style={{ ...designSystem.button, flex: 1 }}>
          मागे
        </button>
        <button onClick={onNext} style={{ ...designSystem.button, flex: 1 }}>
          पुढे
        </button>
      </div>
    </div>
  );
};

const AudienceMode = ({ currentSection, currentStep, hostData, panchangData, roomCode }) => (
  <div style={{
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a1a',
    color: '#FFF',
    fontFamily: 'Noto Devanagari, var(--font-sans)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    textAlign: 'center',
  }}>
    <RoomCodeBadge roomCode={roomCode} />
    <h1 style={{ fontSize: '48px', fontWeight: '600', color: designSystem.colors.gold, margin: '0 0 24px 0' }}>
      {currentSection.title}
    </h1>
    <h2 style={{ fontSize: '36px', fontWeight: '500', color: '#FFF', margin: '0 0 24px 0' }}>
      {currentStep.title}
    </h2>

    {currentStep.participation && (
      <div style={{ fontSize: '20px', color: designSystem.colors.gold, marginBottom: '24px' }}>
        {currentStep.participation === 'priest-only' && 'पुजारी'}
        {currentStep.participation === 'family-joins' && 'परिवार सहभागी'}
        {currentStep.participation === 'all-together' && 'सर्वांनी एकत्र'}
      </div>
    )}

    {currentStep.instruction && (
      <p style={{ fontSize: '18px', color: '#E0E0E0', lineHeight: '1.8', maxWidth: '600px' }}>
        {currentStep.instruction}
      </p>
    )}
  </div>
);

const PujaScreen = ({
  deviceMode,
  roomCode,
  currentSection,
  currentStep,
  currentSectionIdx,
  currentStepIdx,
  sections,
  hostData,
  panchangData,
  onNext,
  onPrev,
}) => {
  if (deviceMode === 'controller') {
    return (
      <ControllerMode
        currentSection={currentSection}
        currentStep={currentStep}
        currentSectionIdx={currentSectionIdx}
        currentStepIdx={currentStepIdx}
        sections={sections}
        hostData={hostData}
        panchangData={panchangData}
        roomCode={roomCode}
        onNext={onNext}
        onPrev={onPrev}
      />
    );
  }

  return (
    <AudienceMode
      currentSection={currentSection}
      currentStep={currentStep}
      hostData={hostData}
      panchangData={panchangData}
      roomCode={roomCode}
    />
  );
};

export default PujaScreen;
