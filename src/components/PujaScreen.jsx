import React, { useRef, useEffect, useState } from 'react';
import { designSystem } from '../styles/designSystem';
import AccordionNav from './AccordionNav';

const AUDIO_BASE_URL = 'https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev';
const VIDEO_BASE_URL = 'https://pub-2b949e8d261e43a1a336b83ec67443d4.r2.dev';

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

const ControllerMode = ({
  currentSection,
  currentStep,
  currentSectionIdx,
  currentStepIdx,
  sections,
  hostData,
  panchangData,
  pujaCode,
  onNext,
  onPrev,
  onJumpTo,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isLandscapeWide, setIsLandscapeWide] = useState(false);
  const totalSteps = sections.reduce((sum, s) => sum + s.steps.length, 0);
  const completedSteps = sections.slice(0, currentSectionIdx).reduce((sum, s) => sum + s.steps.length, 0) + currentStepIdx;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const isSankalpaPause = currentStep?.isSankalpaPause === true;

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

  // Surface Pro सारख्या आडव्या रुंद स्क्रीनवर accordion कायम उघडा ठेवणे
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (min-width: 768px)');
    const updateLayout = () => setIsLandscapeWide(mq.matches);
    updateLayout();
    mq.addEventListener('change', updateLayout);
    return () => mq.removeEventListener('change', updateLayout);
  }, []);

  // landscape मध्ये accordion नेहमी दिसतो (state वर अवलंबून नाही), portrait मध्ये फक्त navOpen असेल तर
  const showNav = navOpen || isLandscapeWide;

  const handleJump = (sIdx, stIdx) => {
    onJumpTo(sIdx, stIdx);
    if (!isLandscapeWide) setNavOpen(false);
  };

  return (
    <div className="puja-layout puja-full-height">
      {showNav && (
        <>
          {!isLandscapeWide && (
            <div
              className="puja-nav-overlay"
              style={styles.overlay}
              onClick={() => setNavOpen(false)}
            />
          )}
          <div className="puja-nav-drawer" style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitle}>सर्व पायऱ्या</span>
              {!isLandscapeWide && (
                <button onClick={() => setNavOpen(false)} style={styles.closeButton}>✕</button>
              )}
            </div>
            <AccordionNav
              sections={sections}
              currentSectionIdx={currentSectionIdx}
              currentStepIdx={currentStepIdx}
              onStepSelect={handleJump}
            />
          </div>
        </>
      )}

      <div className="puja-controller-column" style={{ ...designSystem.controllerContainer, position: 'relative' }}>
      <div style={designSystem.controllerHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={() => setNavOpen(true)} className="puja-nav-toggle-button" style={styles.navToggleButton}>
            ☰ पायऱ्या
          </button>
          {pujaCode && (
            <span style={styles.codeBadge}>कोड: {pujaCode}</span>
          )}
          <div style={{ flex: 1, height: '4px', background: designSystem.colors.secondary, borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: designSystem.colors.gold,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: designSystem.colors.secondary, margin: 0 }}>
          {completedSteps}/{totalSteps}
        </p>
      </div>

      <div className="puja-scrollable" style={designSystem.controllerContent}>
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
              key={currentStep.audioFile}
              ref={audioRef}
              src={`${AUDIO_BASE_URL}/${currentStep.audioFile}`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              style={{ width: '100%', marginBottom: '12px' }}
              controls
              autoPlay
            />
            <p style={{ fontSize: '13px', color: designSystem.colors.secondary, margin: 0 }}>
              अंदाज: {Math.ceil((currentStep.duration_hint || 0) / 60)} मिनिटे
            </p>
          </div>
        )}

        {currentStep.mediaType === 'video' && currentStep.videoFile && (
          <div style={{ marginBottom: '24px' }}>
            <video
              key={currentStep.videoFile}
              src={`${VIDEO_BASE_URL}/${currentStep.videoFile}`}
              preload="metadata"
              style={{ width: '100%', borderRadius: '6px' }}
              controls
            />
          </div>
        )}

        {(currentStep.mediaType === 'text' || !currentStep.audioFile) && currentStep.mediaType !== 'video' && (
          <div style={{ ...designSystem.cardContainer, padding: '16px', borderLeft: `4px solid ${designSystem.colors.gold}` }}>
            <p style={{ ...designSystem.body, margin: '0 0 12px 0', lineHeight: '1.6' }}>
              {currentStep.instruction}
            </p>
            {currentStep.mantraText && (
              <p style={{ fontSize: '13px', color: designSystem.colors.secondary, margin: 0, lineHeight: '1.8', fontFamily: 'Noto Devanagari' }}>
                {currentStep.mantraText}
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
    </div>
  );
};

const AudienceMode = ({ currentSection, currentStep, hostData, panchangData }) => (
  <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a1a',
    color: '#FFF',
    fontFamily: 'Noto Devanagari, sans-serif',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    textAlign: 'center',
  }}>
    <h1 style={{ fontSize: '48px', fontWeight: '600', color: designSystem.colors.gold, margin: '0 0 24px 0' }}>
      {currentSection.title}
    </h1>
    <h2 style={{ fontSize: '36px', fontWeight: '500', color: '#FFF', margin: '0 0 24px 0' }}>
      {currentStep.title}
    </h2>

    {currentStep.mediaType === 'video' && currentStep.videoFile && (
      <video
        src={`${VIDEO_BASE_URL}/${currentStep.videoFile}`}
        preload="metadata"
        style={{ maxWidth: '90%', maxHeight: '60vh', borderRadius: '8px', marginBottom: '24px' }}
        controls
        autoPlay
      />
    )}

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
  currentSection,
  currentStep,
  currentSectionIdx,
  currentStepIdx,
  sections,
  hostData,
  panchangData,
  pujaCode,
  onNext,
  onPrev,
  onJumpTo,
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
        pujaCode={pujaCode}
        onNext={onNext}
        onPrev={onPrev}
        onJumpTo={onJumpTo}
      />
    );
  }

  return (
    <AudienceMode
      currentSection={currentSection}
      currentStep={currentStep}
      hostData={hostData}
      panchangData={panchangData}
    />
  );
};

const styles = {
  navToggleButton: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    background: '#FFF',
    color: designSystem.colors.ink,
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  codeBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: designSystem.colors.ink,
    background: designSystem.colors.saffron,
    padding: '6px 10px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '85%',
    maxWidth: '360px',
    background: '#FFF',
    zIndex: 101,
    boxShadow: '2px 0 12px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: `1px solid ${designSystem.colors.gold}`,
    background: designSystem.colors.saffron,
  },
  drawerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: designSystem.colors.ink,
    fontFamily: 'Noto Devanagari, sans-serif',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: designSystem.colors.ink,
  },
};

export default PujaScreen;
