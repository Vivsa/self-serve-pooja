import React, { useRef, useEffect, useState } from 'react';
import { designSystem } from '../styles/designSystem';
import AccordionNav from './AccordionNav';

const AUDIO_BASE_URL = 'https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev';
const VIDEO_BASE_URL = 'https://pub-2b949e8d261e43a1a336b83ec67443d4.r2.dev';

// Desktop/TV सारखी रुंद-आडवी स्क्रीन आहे का — नियंत्रक व दर्शक दोन्ही मोडमध्ये वापरतो
function useLandscapeWide() {
  const [isLandscapeWide, setIsLandscapeWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (min-width: 768px)');
    const updateLayout = () => setIsLandscapeWide(mq.matches);
    updateLayout();
    mq.addEventListener('change', updateLayout);
    return () => mq.removeEventListener('change', updateLayout);
  }, []);
  return isLandscapeWide;
}

// नियंत्रक/दर्शक दोन्हीसाठी वापरता येणारा video player — R2 (offline) किंवा YouTube निवडता येते,
// आणि विशिष्ट सेकंदापासून सुरू करता येते (उदा. जाहिरात/परिचय टाळण्यासाठी)
// पूर्ण YouTube URL (watch?v=... किंवा youtu.be/...) मधून फक्त video ID काढणे
function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const VideoPlayer = ({ videoFile, videoLink, videoIsLocal = false, startSeconds = 0, volume = 1, style }) => {
  const youtubeId = extractYoutubeId(videoLink);
  const [source, setSource] = useState('r2'); // 'r2' किंवा 'youtube'
  const videoRef = useRef(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current && startSeconds) {
      videoRef.current.currentTime = startSeconds;
    }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume, videoFile]);

  return (
    <div style={{ marginBottom: '24px' }}>
      {youtubeId && (
        <div style={styles.sourceToggle}>
          <button
            onClick={() => setSource('r2')}
            style={{ ...styles.sourceButton, ...(source === 'r2' ? styles.sourceButtonActive : {}) }}
          >
            📱 माझ्या डिव्हाइसवरून (Offline)
          </button>
          <button
            onClick={() => setSource('youtube')}
            style={{ ...styles.sourceButton, ...(source === 'youtube' ? styles.sourceButtonActive : {}) }}
          >
            ▶️ YouTube वरून
          </button>
        </div>
      )}

      {source === 'r2' && videoFile && (
        <video
          key={videoFile}
          ref={videoRef}
          src={videoIsLocal ? `/${videoFile}` : `${VIDEO_BASE_URL}/${videoFile}`}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          style={{ width: '100%', borderRadius: '6px', ...style }}
          controls
          autoPlay
        />
      )}

      {source === 'youtube' && youtubeId && (
        <iframe
          key={youtubeId}
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${youtubeId}?start=${startSeconds}&autoplay=1`}
          title="YouTube video"
          style={{ borderRadius: '6px', border: 'none', ...style }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {source === 'r2' && !videoFile && (
        <p style={{ fontSize: '13px', color: designSystem.colors.danger }}>
          Offline व्हिडिओ अजून उपलब्ध नाही — YouTube वापरा.
        </p>
      )}
    </div>
  );
};

// संकल्प विभागात (s04) पूर्ण भरलेले संस्कृत संकल्प-वाक्य दाखवणारे कार्ड
const SankalpaTextCard = ({ sankalpaText, variant = 'controller' }) => {
  if (!sankalpaText) return null;
  const isAudience = variant === 'audience';
  return (
    <div
      style={
        isAudience
          ? styles.audienceSankalpaCard
          : { ...designSystem.cardContainer, background: designSystem.colors.saffron, border: `2px solid ${designSystem.colors.gold}`, padding: '18px', marginBottom: '16px' }
      }
    >
      {!isAudience && (
        <p style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, margin: '0 0 12px 0', fontSize: '14px' }}>
          📜 संकल्प
        </p>
      )}
      <p
        style={
          isAudience
            ? styles.audienceSankalpaText
            : { fontSize: '14px', color: designSystem.colors.ink, lineHeight: '1.9', fontFamily: 'Noto Devanagari, sans-serif', margin: 0 }
        }
      >
        {sankalpaText}
      </p>
    </div>
  );
};

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

// नियंत्रक मोड — ऑडिओ/व्हिडिओच्या खाली मंत्र+अर्थ+कथा collapsible स्वरूपात
const MantraAccordion = ({ mantraText, mantraMeaningInMarathi, kathaTitle, kathaText }) => {
  const [open, setOpen] = useState(false);
  if (!mantraText && !kathaText) return null;

  return (
    <div style={styles.mantraAccordion}>
      <button onClick={() => setOpen(!open)} style={styles.mantraAccordionHeader}>
        <span>📖 मंत्र, अर्थ{kathaText ? ' व कथा' : ''}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={styles.mantraAccordionBody}>
          {mantraText && (
            <p style={styles.accordionMantra}>{mantraText}</p>
          )}
          {mantraMeaningInMarathi && (
            <p style={styles.accordionMeaning}>{mantraMeaningInMarathi}</p>
          )}
          {kathaTitle && <h4 style={styles.accordionKathaTitle}>{kathaTitle}</h4>}
          {kathaText && <p style={styles.accordionKatha}>{kathaText}</p>}
        </div>
      )}
    </div>
  );
};

// दर्शक मोड — त्या पायरीचे चित्र सुंदरपणे दाखवणारा भाग (एक किंवा अनेक चित्रे, उदा. मोठ्या कथा-अध्यायांसाठी)
const StepImage = ({ imageFile, imageFiles, alt, wide }) => {
  const files = imageFiles && imageFiles.length > 0 ? imageFiles : imageFile ? [imageFile] : [];
  if (files.length === 0) return null;
  return (
    <div style={wide ? styles.audienceImageWrapWide : styles.audienceImageWrap}>
      {files.map((file) => (
        <img key={file} src={`/${file}`} alt={alt || ''} style={styles.audienceImage} loading="eager" />
      ))}
    </div>
  );
};

// दर्शक मोड — मोठ्या (desktop/TV) आडव्या स्क्रीनवर कथा-पायऱ्यांसाठी बाजू-बाजूला मांडणी:
// डावीकडे मोठी चित्रे (स्वतंत्र स्क्रोल), उजवीकडे कथेचा मजकूर (स्वतंत्र स्क्रोल)
const KathaSplitView = ({ currentStep }) => (
  <div style={styles.kathaSplitWrap}>
    <div style={styles.kathaSplitImages}>
      <StepImage imageFile={currentStep.imageFile} imageFiles={currentStep.imageFiles} alt={currentStep.title} wide />
    </div>
    <div style={styles.kathaSplitText}>
      {currentStep.kathaTitle && <h3 style={styles.audienceKathaTitle}>🪔 {currentStep.kathaTitle}</h3>}
      {currentStep.kathaText && <p style={styles.audienceKatha}>{currentStep.kathaText}</p>}
    </div>
  </div>
);

// दर्शक मोड — मंत्र + सोपा मराठी अर्थ + कथा भक्तिभावाने दाखवणारा भाग
const MantraDisplayForAudience = ({ mantraText, mantraMeaningInMarathi, kathaTitle, kathaText }) => {
  if (!mantraText && !kathaText) return null;
  return (
    <div style={styles.audienceMantraWrap}>
      {mantraText && <p style={styles.audienceMantra}>{mantraText}</p>}
      {mantraMeaningInMarathi && <p style={styles.audienceMeaning}>{mantraMeaningInMarathi}</p>}
      {kathaTitle && <h3 style={styles.audienceKathaTitle}>🪔 {kathaTitle}</h3>}
      {kathaText && <p style={styles.audienceKatha}>{kathaText}</p>}
    </div>
  );
};

// उरलेला अंदाजे वेळ तास-मिनिटांत काढणे
function calcRemainingTime(sections, currentSectionIdx, currentStepIdx) {
  let remainingSeconds = 0;
  sections.forEach((section, sIdx) => {
    section.steps.forEach((step, stIdx) => {
      const isPast = sIdx < currentSectionIdx || (sIdx === currentSectionIdx && stIdx < currentStepIdx);
      if (!isPast) {
        remainingSeconds += step.duration_hint || 0;
      }
    });
  });
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.round((remainingSeconds % 3600) / 60);
  if (hours > 0) return `${hours} तास ${minutes} मिनिटे`;
  return `${minutes} मिनिटे`;
}

// यजमान+पंचांग यांचा एका ओळीचा सारांश
function buildSummaryLine(hostData, panchangData) {
  const names = [hostData.hostMaleName, hostData.hostFemaleName].filter(Boolean).join(' — ');
  const panchang = [panchangData.tithi, panchangData.vara].filter(Boolean).join(', ');
  return [names, panchang].filter(Boolean).join(' · ');
}

const SummaryBar = ({ hostData, panchangData, sections, currentSectionIdx, currentStepIdx, viewers, deviceMode }) => {
  const [expanded, setExpanded] = useState(false);
  const summaryLine = buildSummaryLine(hostData, panchangData);
  const remainingTime = calcRemainingTime(sections, currentSectionIdx, currentStepIdx);

  return (
    <div style={styles.summaryBar}>
      <div style={styles.summaryTop} onClick={() => setExpanded(!expanded)}>
        <span style={styles.summaryText}>{summaryLine || 'यजमान माहिती'}</span>
        <span style={styles.summaryChevron}>{expanded ? '▲' : '▼'}</span>
      </div>
      <div style={styles.summaryMeta}>
        <span>⏱️ अंदाजे उरलेला वेळ: {remainingTime}</span>
        {deviceMode === 'controller' && (
          <span>🙏 दर्शक: {viewers?.length || 0}</span>
        )}
      </div>
      {expanded && deviceMode === 'controller' && viewers && viewers.length > 0 && (
        <div style={styles.viewersList}>
          {viewers.map((v) => (
            <span key={v.viewerId} style={styles.viewerChip}>{v.name}</span>
          ))}
        </div>
      )}
      {expanded && deviceMode === 'controller' && (!viewers || viewers.length === 0) && (
        <p style={{ fontSize: '12px', color: designSystem.colors.secondary, margin: '8px 0 0 0' }}>
          अजून कोणी दर्शक जोडलेले नाहीत.
        </p>
      )}
    </div>
  );
};

// नियंत्रक — ऑडिओ/व्हिडिओ कुठे वाजेल (नियंत्रक/दर्शक) व आवाजाची पातळी नियंत्रित करणारा पट्टी, कोड-बॅजच्या शेजारी
const VOLUME_LEVELS = [
  { label: 'कमी', value: 0.35 },
  { label: 'मध्यम', value: 0.65 },
  { label: 'जास्त', value: 1 },
];

const MediaControls = ({ mediaTarget, volume, onToggleMediaTarget, onSetVolume }) => (
  <div style={styles.mediaControls}>
    <button onClick={onToggleMediaTarget} style={styles.mediaToggleButton} title="ऑडिओ/व्हिडिओ कुठे वाजवायचे ते बदला">
      {mediaTarget === 'audience' ? '📺 दर्शकावर' : '🔊 नियंत्रकावर'}
    </button>
    <div style={styles.volumeGroup}>
      {VOLUME_LEVELS.map((lvl) => (
        <button
          key={lvl.label}
          onClick={() => onSetVolume(lvl.value)}
          style={{ ...styles.volumeButton, ...(Math.abs(volume - lvl.value) < 0.01 ? styles.volumeButtonActive : {}) }}
        >
          {lvl.label}
        </button>
      ))}
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
  sankalpaText,
  pujaCode,
  viewers,
  mediaTarget = 'controller',
  volume = 1,
  onToggleMediaTarget,
  onSetVolume,
  onNext,
  onPrev,
  onJumpTo,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const isLandscapeWide = useLandscapeWide();
  const totalSteps = sections.reduce((sum, s) => sum + s.steps.length, 0);
  const completedSteps = sections.slice(0, currentSectionIdx).reduce((sum, s) => sum + s.steps.length, 0) + currentStepIdx;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const isSankalpaPause = currentStep?.isSankalpaPause === true;
  const isSankalpaSection = currentSection?.id === 's04';

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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, currentStep?.audioFile]);

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
            <div className="puja-nav-overlay" style={styles.overlay} onClick={() => setNavOpen(false)} />
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
        <div className="puja-sticky-top" style={designSystem.controllerHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={() => setNavOpen(true)} className="puja-nav-toggle-button" style={styles.navToggleButton}>
              ☰ पायऱ्या
            </button>
            {pujaCode && <span style={styles.codeBadge}>कोड: {pujaCode}</span>}
            {onToggleMediaTarget && (
              <MediaControls mediaTarget={mediaTarget} volume={volume} onToggleMediaTarget={onToggleMediaTarget} onSetVolume={onSetVolume} />
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
          <p style={{ fontSize: '12px', color: designSystem.colors.secondary, margin: '0 0 8px 0' }}>
            {completedSteps}/{totalSteps}
          </p>
          <SummaryBar
            hostData={hostData}
            panchangData={panchangData}
            sections={sections}
            currentSectionIdx={currentSectionIdx}
            currentStepIdx={currentStepIdx}
            viewers={viewers}
            deviceMode="controller"
          />
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
              {currentStep.participation === 'family-joins' && '🙏 परिवार सहभागी'}
              {currentStep.participation === 'all-together' && '🕉️🙏 सर्वांनी एकत्र'}
            </div>
          )}

          {isSankalpaSection && <SankalpaTextCard sankalpaText={sankalpaText} variant="controller" />}

          {isSankalpaPause && <SankalpaPauseCard hostData={hostData} panchangData={panchangData} />}

          <div style={styles.controllerImageWrap}>
            <StepImage imageFile={currentStep.imageFile} imageFiles={currentStep.imageFiles} alt={currentStep.title} />
          </div>

          {mediaTarget === 'audience' && (currentStep.mediaType === 'audio' || currentStep.mediaType === 'video') && (
            <div style={styles.mediaOnAudienceNote}>📺 ऑडिओ/व्हिडिओ सध्या दर्शक-डिव्हाइसवर वाजत आहे</div>
          )}

          {mediaTarget === 'controller' && currentStep.mediaType === 'audio' && currentStep.audioFile && (
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
            </div>
          )}

          {mediaTarget === 'controller' && currentStep.mediaType === 'video' && (
            <VideoPlayer
              videoFile={currentStep.videoFile}
              videoLink={currentStep.videoLink}
              videoIsLocal={currentStep.videoIsLocal}
              startSeconds={currentStep.videoStartSeconds || 0}
              volume={volume}
            />
          )}

          {currentStep.instruction && (
            <div style={{ ...designSystem.cardContainer, padding: '16px', borderLeft: `4px solid ${designSystem.colors.gold}`, marginBottom: '16px' }}>
              <p style={{ ...designSystem.body, margin: 0, lineHeight: '1.6' }}>{currentStep.instruction}</p>
            </div>
          )}

          <MantraAccordion
            mantraText={currentStep.mantraText}
            mantraMeaningInMarathi={currentStep.mantraMeaningInMarathi}
            kathaTitle={currentStep.kathaTitle}
            kathaText={currentStep.kathaText}
          />
        </div>

        <div className="puja-sticky-bottom" style={{ display: 'flex', gap: '12px', padding: '16px', borderTop: `1px solid ${designSystem.colors.secondary}` }}>
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

const AudienceMode = ({ currentSection, currentStep, hostData, panchangData, sections, currentSectionIdx, currentStepIdx, sankalpaText, mediaTarget = 'controller', volume = 1 }) => {
  const isLandscapeWide = useLandscapeWide();
  const isKathaStep = Boolean(currentStep.kathaText);
  const showKathaSplit = isKathaStep && isLandscapeWide;
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const playsHere = mediaTarget === 'audience';
  const audienceAudioRef = useRef(null);

  useEffect(() => {
    if (audienceAudioRef.current) audienceAudioRef.current.volume = volume;
  }, [volume, currentStep?.audioFile]);

  return (
    <div className="puja-layout">
      <div className="puja-controller-column" style={{ background: '#1a1a1a', color: '#FFF', fontFamily: 'Noto Devanagari, sans-serif', position: 'relative' }}>
        {playsHere && !audioUnlocked && (
          <button style={styles.audioUnlockOverlay} onClick={() => setAudioUnlocked(true)}>
            🔊 आवाज सुरू करण्यासाठी येथे टॅप करा
          </button>
        )}
        <div style={styles.audienceSummaryBar}>
          <span>{buildSummaryLine(hostData, panchangData)}</span>
          <span>⏱️ {calcRemainingTime(sections, currentSectionIdx, currentStepIdx)}</span>
        </div>

        {showKathaSplit ? (
          <KathaSplitView currentStep={currentStep} />
        ) : (
          <div className="puja-scrollable" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '600', color: designSystem.colors.gold, margin: '0 0 12px 0' }}>
              {currentSection.title}
            </h1>
            <h2 style={{ fontSize: '26px', fontWeight: '500', color: '#FFF', margin: '0 0 20px 0' }}>
              {currentStep.title}
            </h2>

            {currentSection?.id === 's04' && <SankalpaTextCard sankalpaText={sankalpaText} variant="audience" />}

            <StepImage imageFile={currentStep.imageFile} imageFiles={currentStep.imageFiles} alt={currentStep.title} />

            {playsHere && audioUnlocked && currentStep.mediaType === 'audio' && currentStep.audioFile && (
              <audio
                key={currentStep.audioFile}
                ref={audienceAudioRef}
                src={`${AUDIO_BASE_URL}/${currentStep.audioFile}`}
                style={{ width: '100%', maxWidth: '640px', marginBottom: '20px' }}
                controls
                autoPlay
              />
            )}

            {playsHere && audioUnlocked && currentStep.mediaType === 'video' && (
              <VideoPlayer
                videoFile={currentStep.videoFile}
                videoLink={currentStep.videoLink}
                videoIsLocal={currentStep.videoIsLocal}
                startSeconds={currentStep.videoStartSeconds || 0}
                volume={volume}
                style={{ maxWidth: '90%', maxHeight: '60vh' }}
              />
            )}

            {currentStep.participation && (
              <div style={{ fontSize: '18px', color: designSystem.colors.gold, marginBottom: '20px' }}>
                {currentStep.participation === 'family-joins' && 'परिवार सहभागी'}
                {currentStep.participation === 'all-together' && 'सर्वांनी एकत्र'}
              </div>
            )}

            {currentStep.instruction && (
              <p style={{ fontSize: '17px', color: '#E0E0E0', lineHeight: '1.8', maxWidth: '640px', marginBottom: '8px' }}>{currentStep.instruction}</p>
            )}

            <MantraDisplayForAudience
              mantraText={currentStep.mantraText}
              mantraMeaningInMarathi={currentStep.mantraMeaningInMarathi}
              kathaTitle={currentStep.kathaTitle}
              kathaText={currentStep.kathaText}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const PujaScreen = ({
  deviceMode,
  currentSection,
  currentStep,
  currentSectionIdx,
  currentStepIdx,
  sections,
  hostData,
  panchangData,
  sankalpaText,
  pujaCode,
  viewers,
  mediaTarget,
  volume,
  onToggleMediaTarget,
  onSetVolume,
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
        sankalpaText={sankalpaText}
        pujaCode={pujaCode}
        viewers={viewers}
        mediaTarget={mediaTarget}
        volume={volume}
        onToggleMediaTarget={onToggleMediaTarget}
        onSetVolume={onSetVolume}
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
      sankalpaText={sankalpaText}
      sections={sections}
      currentSectionIdx={currentSectionIdx}
      currentStepIdx={currentStepIdx}
      mediaTarget={mediaTarget}
      volume={volume}
    />
  );
};

const styles = {
  audienceSankalpaCard: {
    maxWidth: '680px',
    background: 'rgba(212, 165, 116, 0.12)',
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
  },
  audienceSankalpaText: {
    fontSize: '17px',
    color: designSystem.colors.gold,
    lineHeight: '2.1',
    fontFamily: 'Noto Devanagari, sans-serif',
    margin: 0,
  },
  // नियंत्रक — collapsible मंत्र/अर्थ/कथा पट्टी
  mantraAccordion: {
    background: '#FFF',
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  mantraAccordionHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: designSystem.colors.saffron,
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: designSystem.colors.ink,
    fontFamily: 'Noto Devanagari, sans-serif',
  },
  mantraAccordionBody: {
    padding: '16px',
  },
  accordionMantra: {
    fontSize: '15px',
    color: designSystem.colors.ink,
    lineHeight: '1.9',
    fontFamily: 'Noto Devanagari, sans-serif',
    marginBottom: '12px',
    fontWeight: '500',
  },
  accordionMeaning: {
    fontSize: '14px',
    color: designSystem.colors.secondary,
    lineHeight: '1.8',
    fontStyle: 'italic',
    marginBottom: '12px',
  },
  accordionKathaTitle: {
    fontSize: '15px',
    color: designSystem.colors.ink,
    margin: '12px 0 8px 0',
  },
  accordionKatha: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.9',
    textAlign: 'left',
  },
  // दर्शक — त्या पायरीचे चित्र सुंदरपणे दाखवणे
  audienceImageWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '680px',
    marginBottom: '24px',
  },
  audienceImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '14px',
    border: `2px solid ${designSystem.colors.gold}`,
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5)',
    display: 'block',
  },
  // नियंत्रक — पायरीचे चित्र, गडद पार्श्वभूमीशिवाय, थोडं लहान (नियंत्रणे वाचनासाठी जागा राहावी म्हणून)
  controllerImageWrap: {
    maxWidth: '420px',
    margin: '0 0 20px 0',
  },
  audienceImageWrapWide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  // दर्शक — desktop/TV वर कथा-पायऱ्यांसाठी बाजू-बाजूला मांडणी (चित्रे व मजकूर दोन्ही स्वतंत्रपणे स्क्रोल होतात)
  kathaSplitWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
  },
  kathaSplitImages: {
    flex: '0 0 76%',
    maxWidth: '76%',
    height: '100%',
    overflowY: 'auto',
    padding: '24px',
    boxSizing: 'border-box',
    borderRight: '1px solid rgba(212, 165, 116, 0.25)',
  },
  kathaSplitText: {
    flex: '1 1 24%',
    height: '100%',
    overflowY: 'auto',
    padding: '24px 28px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  // दर्शक — भक्तिभावाने मंत्र/अर्थ/कथा दाखवणे
  audienceMantraWrap: {
    maxWidth: '680px',
    marginTop: '16px',
    paddingTop: '20px',
    borderTop: `1px solid rgba(212, 165, 116, 0.3)`,
  },
  audienceMantra: {
    fontSize: '19px',
    color: designSystem.colors.gold,
    lineHeight: '2',
    fontFamily: 'Noto Devanagari, sans-serif',
    fontWeight: '500',
    marginBottom: '16px',
  },
  audienceMeaning: {
    fontSize: '16px',
    color: '#D9D9D9',
    lineHeight: '1.9',
    fontStyle: 'italic',
    marginBottom: '16px',
  },
  audienceKathaTitle: {
    fontSize: '20px',
    color: designSystem.colors.gold,
    margin: '20px 0 12px 0',
  },
  audienceKatha: {
    fontSize: '16px',
    color: '#E8E8E8',
    lineHeight: '2',
    textAlign: 'left',
    marginBottom: '24px',
  },

  sourceToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  sourceButton: {
    flex: 1,
    padding: '10px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#FFF',
    color: designSystem.colors.secondary,
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Noto Devanagari, sans-serif',
  },
  sourceButtonActive: {
    background: designSystem.colors.gold,
    color: '#FFF',
    fontWeight: '600',
  },
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
  mediaControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  mediaToggleButton: {
    fontSize: '12px',
    fontWeight: '600',
    color: designSystem.colors.ink,
    background: '#FFF',
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  volumeGroup: {
    display: 'flex',
    border: `1px solid ${designSystem.colors.gold}`,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  volumeButton: {
    fontSize: '11px',
    fontWeight: '500',
    color: designSystem.colors.ink,
    background: '#FFF',
    border: 'none',
    padding: '6px 8px',
    cursor: 'pointer',
  },
  volumeButtonActive: {
    background: designSystem.colors.gold,
    color: '#FFF',
    fontWeight: '600',
  },
  mediaOnAudienceNote: {
    fontSize: '13px',
    color: designSystem.colors.secondary,
    background: designSystem.colors.saffron,
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '16px',
  },
  // दर्शक — पहिल्यांदा टॅप होईपर्यंत ऑडिओ/व्हिडिओ ब्राउझर आपोआप वाजवत नाही, त्यासाठी झाकण
  audioUnlockOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
    background: 'rgba(0, 0, 0, 0.85)',
    color: designSystem.colors.gold,
    border: 'none',
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: 'Noto Devanagari, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px',
  },
  summaryBar: {
    background: '#FFF',
    borderRadius: '6px',
    padding: '8px 12px',
    border: `1px solid ${designSystem.colors.gold}`,
  },
  summaryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  summaryText: {
    fontSize: '13px',
    fontWeight: '500',
    color: designSystem.colors.ink,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  summaryChevron: {
    fontSize: '10px',
    color: designSystem.colors.secondary,
    marginLeft: '8px',
  },
  summaryMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: designSystem.colors.secondary,
    marginTop: '4px',
  },
  viewersList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  viewerChip: {
    fontSize: '12px',
    background: designSystem.colors.saffron,
    color: designSystem.colors.ink,
    padding: '4px 10px',
    borderRadius: '12px',
  },
  audienceSummaryBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: '#000',
    color: designSystem.colors.gold,
    fontSize: '13px',
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
