import React, { useState, useEffect, useRef } from 'react';
import PreflightForm from './components/PreflightForm';
import PujaScreen from './components/PujaScreen';
import { designSystem } from './styles/designSystem';
import { buildSankalpaText } from './sankalpaBuilder';

// दर्शकाची unique ओळख (session-scoped)
function generateViewerId() {
  return 'v' + Math.random().toString(36).slice(2, 10);
}

function App() {
  const [screen, setScreen] = useState('entryCheck');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vara, setVara] = useState('');
  const [panchangData, setPanchangData] = useState({
    samvatsara: 'पराभव',
    ayana: 'दक्षिणायन',
    rutu: 'वर्षा',
    masa: 'आषाढ',
    paksha: 'कृष्ण पक्ष',
    tithi: 'दशमी',
    vara: 'रविवार',
    nakshatra: 'रोहिणी',
    chandraRashi: 'वृषभ',
    suryaRashi: 'कर्क',
    guruRashi: 'कर्क',
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
  const [viewerName, setViewerName] = useState('');
  const [viewerId] = useState(generateViewerId());
  const [viewers, setViewers] = useState([]);

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [pujaData, setPujaData] = useState(null);
  const [sankalpaData, setSankalpaData] = useState(null);
  const [loading, setLoading] = useState(true);

  const statePollRef = useRef(null);
  const viewersPollRef = useRef(null);
  const heartbeatRef = useRef(null);

  // वार गणना
  useEffect(() => {
    if (date) {
      const d = new Date(date);
      const varaNames = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      setVara(varaNames[d.getDay()]);
      setPanchangData((prev) => ({ ...prev, vara: varaNames[d.getDay()] }));
    }
  }, [date]);

  // puja.json + sankalpa.json लोड करा
  useEffect(() => {
    Promise.all([
      fetch('/puja.json').then((r) => r.json()),
      fetch('/sankalpa.json').then((r) => r.json()),
    ])
      .then(([puja, sankalpa]) => {
        setPujaData(puja);
        setSankalpaData(sankalpa);
        setLoading(false);
      })
      .catch((err) => {
        console.error('डेटा लोड करण्यात अयशस्वी:', err);
        setLoading(false);
      });
  }, []);

  // ===== प्रवेश-प्रवाह हँडलर्स =====

  const handleEntryCheck = (hasCode) => {
    if (hasCode) {
      setScreen('roleSelect');
    } else {
      // नवीन पूजा — निर्देशक मार्ग, आधी कोड तयार करा
      const newCode = String(Math.floor(1000 + Math.random() * 9000));
      setPujaCode(newCode);
      setDeviceMode('controller');
      setScreen('newPujaCode');
    }
  };

  const handleRoleSelect = (role) => {
    if (role === 'controller') {
      setScreen('controllerCodeEntry');
    } else {
      setScreen('audienceNameEntry');
    }
  };

  const handleControllerCodeSubmit = async () => {
    if (codeInput.length !== 4) {
      setCodeError('कृपया ४ अंकी कोड टाका');
      return;
    }
    try {
      const res = await fetch(`/api/sync?code=${codeInput}`);
      const data = await res.json();
      if (!data.found) {
        setCodeError('हा कोड सापडला नाही — कृपया पुन्हा तपासा');
        return;
      }
      setPujaCode(codeInput);
      if (data.panchangData) setPanchangData(data.panchangData);
      if (data.hostData) setHostData(data.hostData);
      setCurrentSectionIdx(data.sectionIdx || 0);
      setCurrentStepIdx(data.stepIdx || 0);
      setDeviceMode('controller');
      setCodeError('');
      enterFullscreen();
      setScreen('mainPuja');
    } catch (err) {
      setCodeError('जोडता आले नाही — इंटरनेट तपासा');
    }
  };

  const handleAudienceNameSubmit = () => {
    if (!viewerName.trim()) {
      setCodeError('कृपया आपले नाव टाका');
      return;
    }
    setCodeError('');
    setScreen('audienceCodeEntry');
  };

  const handleAudienceCodeSubmit = async () => {
    if (codeInput.length !== 4) {
      setCodeError('कृपया ४ अंकी कोड टाका');
      return;
    }
    try {
      const res = await fetch(`/api/sync?code=${codeInput}`);
      const data = await res.json();
      if (!data.found) {
        setCodeError('हा कोड सापडला नाही — कृपया नियंत्रकाकडून पुन्हा तपासा');
        return;
      }
      setPujaCode(codeInput);
      if (data.panchangData) setPanchangData(data.panchangData);
      if (data.hostData) setHostData(data.hostData);
      setCurrentSectionIdx(data.sectionIdx || 0);
      setCurrentStepIdx(data.stepIdx || 0);
      setDeviceMode('audience');
      setCodeError('');
      enterFullscreen();
      setScreen('mainPuja');
    } catch (err) {
      setCodeError('जोडता आले नाही — इंटरनेट तपासा');
    }
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // ===== नवीन पूजा (निर्देशक) प्रवाह =====

  const handleNewPujaCodeConfirm = () => setScreen('preflightDate');
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

  const handleHostFamilyConfirm = () => setScreen('sankalpaPreview');

  const handleSankalpaConfirm = () => {
    enterFullscreen();
    setScreen('mainPuja');
  };

  const handleJumpTo = (sectionIdx, stepIdx) => {
    setCurrentSectionIdx(sectionIdx);
    setCurrentStepIdx(stepIdx);
  };

  // ===== नियंत्रक: पायरी बदलल्यावर सर्व्हरला कळवा (पंचांग+यजमान माहितीसह) =====
  useEffect(() => {
    if (deviceMode !== 'controller' || screen !== 'mainPuja' || !pujaCode) return;
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: pujaCode,
        sectionIdx: currentSectionIdx,
        stepIdx: currentStepIdx,
        panchangData,
        hostData,
        updatedAt: Date.now(),
      }),
    }).catch(() => {});
  }, [currentSectionIdx, currentStepIdx, deviceMode, screen, pujaCode]);

  // ===== नियंत्रक: दर्शक-यादी दर ३ सेकंदांनी वाचा =====
  useEffect(() => {
    if (deviceMode !== 'controller' || screen !== 'mainPuja' || !pujaCode) return;

    const pollViewers = async () => {
      try {
        const res = await fetch(`/api/viewers?code=${pujaCode}`);
        const data = await res.json();
        setViewers(data.viewers || []);
      } catch (err) {}
    };

    pollViewers();
    viewersPollRef.current = setInterval(pollViewers, 3000);
    return () => clearInterval(viewersPollRef.current);
  }, [deviceMode, screen, pujaCode]);

  // ===== दर्शक: दर १ सेकंदाला सध्याची स्थिती वाचा (जलद sync) =====
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
      } catch (err) {}
    };

    poll();
    statePollRef.current = setInterval(poll, 1000);
    return () => clearInterval(statePollRef.current);
  }, [deviceMode, screen, pujaCode]);

  // ===== दर्शक: स्वतःची उपस्थिती (heartbeat) दर ५ सेकंदांनी नोंदवा =====
  useEffect(() => {
    if (deviceMode !== 'audience' || screen !== 'mainPuja' || !pujaCode || !viewerName) return;

    const sendHeartbeat = () => {
      fetch('/api/viewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pujaCode, viewerId, name: viewerName }),
      }).catch(() => {});
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(heartbeatRef.current);
  }, [deviceMode, screen, pujaCode, viewerName, viewerId]);

  if (loading) {
    return (
      <div style={{ ...designSystem.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '18px', color: designSystem.colors.ink }}>लोड होत आहे...</p>
      </div>
    );
  }

  if (!pujaData || !sankalpaData) {
    return (
      <div style={{ ...designSystem.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '18px', color: designSystem.colors.danger }}>डेटा लोड करता आला नाही.</p>
      </div>
    );
  }

  // ===== स्क्रीन राउटिंग =====

  if (screen === 'entryCheck') {
    return <PreflightForm.EntryCheckScreen onSelect={handleEntryCheck} />;
  }

  if (screen === 'roleSelect') {
    return <PreflightForm.RoleSelectScreen onSelect={handleRoleSelect} />;
  }

  if (screen === 'controllerCodeEntry') {
    return (
      <PreflightForm.CodeEntryScreen
        title="निर्देशक — पूजा कोड टाका"
        subtitle="चालू असलेल्या पूजेचा ४ अंकी कोड टाका"
        codeInput={codeInput}
        setCodeInput={setCodeInput}
        codeError={codeError}
        onSubmit={handleControllerCodeSubmit}
      />
    );
  }

  if (screen === 'audienceNameEntry') {
    return (
      <PreflightForm.AudienceNameScreen
        viewerName={viewerName}
        setViewerName={setViewerName}
        codeError={codeError}
        onSubmit={handleAudienceNameSubmit}
      />
    );
  }

  if (screen === 'audienceCodeEntry') {
    return (
      <PreflightForm.CodeEntryScreen
        title="दर्शक — पूजा कोड टाका"
        subtitle={`${viewerName}, कृपया निर्देशकाकडून मिळालेला ४ अंकी कोड टाका`}
        codeInput={codeInput}
        setCodeInput={setCodeInput}
        codeError={codeError}
        onSubmit={handleAudienceCodeSubmit}
      />
    );
  }

  if (screen === 'newPujaCode') {
    return <PreflightForm.NewPujaCodeScreen pujaCode={pujaCode} onConfirm={handleNewPujaCodeConfirm} />;
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

  if (screen === 'sankalpaPreview') {
    const sankalpaText = buildSankalpaText(sankalpaData, panchangData, hostData);
    return (
      <PreflightForm.SankalpaPreviewScreen
        sankalpaText={sankalpaText}
        pujaCode={pujaCode}
        onConfirm={handleSankalpaConfirm}
      />
    );
  }

  // ===== मुख्य पूजा स्क्रीन =====
  const currentSection = pujaData.sections[currentSectionIdx];
  const currentStep = currentSection?.steps[currentStepIdx];
  const sankalpaText = buildSankalpaText(sankalpaData, panchangData, hostData);

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
      sankalpaText={sankalpaText}
      pujaCode={pujaCode}
      viewers={viewers}
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
