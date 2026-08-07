import React, { useState, useEffect, useRef } from 'react';
import PreflightForm from './components/PreflightForm';
import PujaScreen from './components/PujaScreen';
import { designSystem } from './styles/designSystem';

function App() {
  const [screen, setScreen] = useState('preflightDate');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vara, setVara] = useState('');
  const [panchangData, setPanchangData] = useState({
    samvatsara: 'विश्वावसु',
    ayana: 'दक्षिणायने',
    rutu: 'सौर वर्षा',
    masa: 'श्रावण',
    paksha: 'शुक्ल',
    tithi: 'द्वितीया',
    vara: 'मंद',
    nakshatra: 'आश्लेषा',
    chandraRashi: 'कर्क',
    suryaRashi: 'कर्क',
    guruRashi: 'मिथुन',
  });

  const [hostData, setHostData] = useState({
    hostMaleName: '',
    hostFemaleName: '',
    gotra: '',
    children: [],
    hostMaleAspiration: '',
    hostFemaleAspiration: '',
  });

  const [deviceMode, setDeviceMode] = useState('controller');
  const [pujaCode, setPujaCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [pujaData, setPujaData] = useState(null);
  const [loading, setLoading] = useState(true);

  const pollRef = useRef(null);

  useEffect(() => {
    if (date) {
      const d = new Date(date);
      const varaNames = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      setVara(varaNames[d.getDay()]);
      setPanchangData(prev => ({ ...prev, vara: varaNames[d.getDay()] }));
    }
  }, [date]);

  useEffect(() => {
    fetch('/puja.json')
      .then(r => r.json())
      .then(data => {
        setPujaData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('puja.json लोड करण्यात अयशस्वी:', err);
        setLoading(false);
      });
  }, []);

  const handleDateConfirm = () => setScreen('panchang');
  const handlePanchangConfirm = () => setScreen('hostFamily');
  const handleHostDataChange = (field, value) => setHostData({ ...hostData, [field]: value });

  const addChild = () => {
    setHostData({ ...hostData, children: [...hostData.children, { name: '', aspiration: '' }] });
  };
  const removeChild = (idx) => {
    setHostData({ ...hostData, children: hostData.children.filter((_, i) => i !== idx) });
  };
  const updateChild = (idx, field, value) => {
    const newChildren = [...hostData.children];
    newChildren[idx] = { ...newChildren[idx], [field]: value };
    setHostData({ ...hostData, children: newChildren });
  };

  const handleHostFamilyConfirm = () => setScreen('deviceMode');

  const handleDeviceModeSelect = (mode) => {
    setDeviceMode(mode);
    if (mode === 'controller') {
      // नियंत्रकासाठी नवीन ४-अंकी कोड तयार करा
      const newCode = String(Math.floor(1000 + Math.random() * 9000));
      setPujaCode(newCode);
    }
    setScreen('codeSetup');
  };

  const handleControllerCodeConfirm = () => {
    setScreen('mainPuja');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleAudienceCodeSubmit = async () => {
    if (codeInput.length !== 4) {
      setCodeError('कृपया ४ अंकी कोड टाका');
      return;
    }
    setPujaCode(codeInput);
    setCodeError('');
    setScreen('mainPuja');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleJumpTo = (sectionIdx, stepIdx) => {
    setCurrentSectionIdx(sectionIdx);
    setCurrentStepIdx(stepIdx);
  };

  // नियंत्रक: पायरी बदलल्यावर सर्व्हरला कळवा
  useEffect(() => {
    if (deviceMode !== 'controller' || screen !== 'mainPuja' || !pujaCode) return;
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: pujaCode,
        sectionIdx: currentSectionIdx,
        stepIdx: currentStepIdx,
      }),
    }).catch(() => {
      // Network समस्या असल्यास शांतपणे दुर्लक्ष करा — local नियंत्रण चालूच राहते
    });
  }, [currentSectionIdx, currentStepIdx, deviceMode, screen, pujaCode]);

  // दर्शक: दर २ सेकंदांनी नियंत्रकाची सध्याची पायरी वाचा
  useEffect(() => {
    if (deviceMode !== 'audience' || screen !== 'mainPuja' || !pujaCode) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/sync?code=${pujaCode}`);
        const data = await res.json();
        if (data.found) {
          setCurrentSectionIdx(data.sectionIdx);
          setCurrentStepIdx(data.stepIdx);
        }
      } catch (err) {
        // Network समस्या असल्यास पुढच्या poll ला पुन्हा प्रयत्न होईल
      }
    };

    poll(); // लगेच एकदा
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [deviceMode, screen, pujaCode]);

  if (loading) {
    return (
      <div style={{ ...designSystem.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '18px', color: designSystem.colors.ink }}>लोड होत आहे...</p>
      </div>
    );
  }

  if (!pujaData) {
    return (
      <div style={{ ...designSystem.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '18px', color: designSystem.colors.danger }}>puja.json लोड करता आला नाही.</p>
      </div>
    );
  }

  if (screen === 'preflightDate') {
    return <PreflightForm.DateScreen date={date} setDate={setDate} vara={vara} onConfirm={handleDateConfirm} />;
  }
  if (screen === 'panchang') {
    return <PreflightForm.PanchangScreen panchangData={panchangData} setPanchangData={setPanchangData} onConfirm={handlePanchangConfirm} />;
  }
  if (screen === 'hostFamily') {
    return (
      <PreflightForm.HostFamilyScreen
        hostData={hostData}
        onDataChange={handleHostDataChange}
        onAddChild={addChild}
        onRemoveChild={removeChild}
        onUpdateChild={updateChild}
        onConfirm={handleHostFamilyConfirm}
      />
    );
  }
  if (screen === 'deviceMode') {
    return <PreflightForm.DeviceModeScreen onSelect={handleDeviceModeSelect} />;
  }

  if (screen === 'codeSetup') {
    if (deviceMode === 'controller') {
      return (
        <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={designSystem.heading}>पूजा कोड</h1>
          <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
            दर्शक (Audience) डिव्हाइसवर हा कोड टाका
          </p>
          <div style={{
            fontSize: '56px',
            fontWeight: '700',
            letterSpacing: '8px',
            color: designSystem.colors.ink,
            background: designSystem.colors.saffron,
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px',
          }}>
            {pujaCode}
          </div>
          <button onClick={handleControllerCodeConfirm} style={designSystem.button}>
            पूजा सुरू करा
          </button>
        </div>
      );
    }
    // दर्शक मोड — कोड टाकायचा
    return (
      <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '80px' }}>
        <h1 style={designSystem.heading}>पूजा कोड टाका</h1>
        <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
          नियंत्रक (Controller) डिव्हाइसवर दिसणारा ४ अंकी कोड टाका
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
          style={{
            ...designSystem.input,
            fontSize: '36px',
            textAlign: 'center',
            letterSpacing: '12px',
            marginBottom: '16px',
          }}
          placeholder="0000"
        />
        {codeError && (
          <p style={{ color: designSystem.colors.danger, fontSize: '14px', marginBottom: '16px' }}>{codeError}</p>
        )}
        <button onClick={handleAudienceCodeSubmit} style={designSystem.button}>
          जोडा
        </button>
      </div>
    );
  }

  const currentSection = pujaData.sections[currentSectionIdx];
  const currentStep = currentSection?.steps[currentStepIdx];

  return (
    <PujaScreen
      deviceMode={deviceMode}
      currentSection={currentSection}
      currentStep={currentStep}
      currentSectionIdx={currentSectionIdx}
      currentStepIdx={currentStepIdx}
      sections={pujaData.sections}
      hostData={hostData}
      panchangData={panchangData}
      pujaCode={pujaCode}
      onNext={() => {
        if (currentStepIdx < currentSection.steps.length - 1) {
          setCurrentStepIdx(currentStepIdx + 1);
        } else if (currentSectionIdx < pujaData.sections.length - 1) {
          setCurrentSectionIdx(currentSectionIdx + 1);
          setCurrentStepIdx(0);
        }
      }}
      onPrev={() => {
        if (currentStepIdx > 0) {
          setCurrentStepIdx(currentStepIdx - 1);
        } else if (currentSectionIdx > 0) {
          setCurrentSectionIdx(currentSectionIdx - 1);
          const prevSection = pujaData.sections[currentSectionIdx - 1];
          setCurrentStepIdx(prevSection.steps.length - 1);
        }
      }}
      onJumpTo={handleJumpTo}
    />
  );
}

export default App;
