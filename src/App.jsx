import React, { useState, useEffect, useRef } from 'react';
import PreflightForm from './components/PreflightForm';
import AdminScreens from './components/AdminScreens';
import PujaScreen from './components/PujaScreen';
import { designSystem } from './styles/designSystem';
import { buildSankalpaText } from './sankalpaBuilder';

const AUTH_TOKEN_KEY = 'pujeSathiAuthToken';

// दर्शकाची unique ओळख (session-scoped)
function generateViewerId() {
  return 'v' + Math.random().toString(36).slice(2, 10);
}

const DEFAULT_PANCHANG = {
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
};

const DEFAULT_HOST_DATA = {
  hostMaleName: '',
  hostFemaleName: '',
  gotra: '',
  children: [],
  hostMaleAspiration: '',
  hostFemaleAspiration: '',
};

function App() {
  const [screen, setScreen] = useState('roleSelect');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vara, setVara] = useState('');
  const [panchangData, setPanchangData] = useState(DEFAULT_PANCHANG);
  const [hostData, setHostData] = useState(DEFAULT_HOST_DATA);

  const [deviceMode, setDeviceMode] = useState('controller');
  const [mediaTarget, setMediaTarget] = useState('controller'); // 'controller' किंवा 'audience' — ऑडिओ/व्हिडिओ कुठे वाजेल
  const [volume, setVolume] = useState(1); // 0.35 कमी, 0.65 मध्यम, 1 जास्त
  const [pujaCode, setPujaCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [viewerId] = useState(generateViewerId());
  const [viewers, setViewers] = useState([]);

  // ===== निर्देशक Login + पूजा-यादी (admin) =====
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [poojas, setPoojas] = useState([]);
  const [poojasLoading, setPoojasLoading] = useState(false);
  const [poojasError, setPoojasError] = useState('');
  const [savingPooja, setSavingPooja] = useState(false);

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

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // ===== सर्व्हरला status='complete' कळवणे (KV + D1 दोन्ही अद्ययावत होतात) =====
  const postSyncStatus = (code, sectionIdx, stepIdx, status) =>
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        sectionIdx: sectionIdx || 0,
        stepIdx: stepIdx || 0,
        panchangData,
        hostData,
        updatedAt: Date.now(),
        status,
        mediaTarget,
        volume,
      }),
    }).catch(() => {});

  // ===== admin API साठी Authorization header आपोआप जोडणारे मदत-कार्य — सत्र संपले तर लॉगिनकडे परत पाठवते =====
  const adminFetch = async (path, options = {}, tokenOverride) => {
    const token = tokenOverride || authToken;
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken('');
      setScreen('login');
      throw new Error('सत्र संपले');
    }
    return res;
  };

  const loadPoojas = async (tokenOverride) => {
    setPoojasLoading(true);
    setPoojasError('');
    try {
      const res = await adminFetch('/api/admin/poojas', {}, tokenOverride);
      const data = await res.json();
      setPoojas(data.poojas || []);
    } catch (err) {
      setPoojasError('यादी वाचता आली नाही — इंटरनेट तपासा');
    } finally {
      setPoojasLoading(false);
    }
  };

  // ===== प्रवेश-प्रवाह हँडलर्स =====

  const handleRoleSelect = (role) => {
    if (role === 'controller') {
      if (authToken) {
        setScreen('dashboard');
        loadPoojas();
      } else {
        setScreen('login');
      }
    } else {
      setScreen('audienceNameEntry');
    }
  };

  const handleLoginSubmit = async (password) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setLoginError(data.error || 'लॉगिन अयशस्वी');
        return;
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      setScreen('dashboard');
      loadPoojas(data.token);
    } catch (err) {
      setLoginError('जोडता आले नाही — इंटरनेट तपासा');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthToken('');
    setScreen('roleSelect');
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
      if (data.mediaTarget) setMediaTarget(data.mediaTarget);
      if (data.volume !== undefined) setVolume(data.volume);
      setDeviceMode('audience');
      setCodeError('');
      enterFullscreen();
      setScreen('mainPuja');
    } catch (err) {
      setCodeError('जोडता आले नाही — इंटरनेट तपासा');
    }
  };

  // ===== निर्देशक: पूजा-यादीतून नवीन/संपादन/सुरू-ठेवा/समाप्त =====

  const handleCreateNewSchedule = async () => {
    setPoojasError('');
    try {
      const res = await adminFetch('/api/admin/poojas', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) {
        setPoojasError(data.error || 'नवीन पूजा तयार करता आली नाही');
        return;
      }
      setPujaCode(data.pooja.code);
      setHostData(DEFAULT_HOST_DATA);
      setPanchangData(DEFAULT_PANCHANG);
      setDate(data.pooja.pujaDate || new Date().toISOString().split('T')[0]);
      setDeviceMode('controller');
      setScreen('newPujaCode');
    } catch (err) {
      // adminFetch ने आधीच लॉगिनकडे पाठवले असेल तर इथे काही करायची गरज नाही
    }
  };

  const handleEditPooja = async (code) => {
    setPoojasError('');
    try {
      const res = await adminFetch(`/api/admin/poojas/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setPoojasError(data.error || 'माहिती मिळाली नाही');
        return;
      }
      setPujaCode(data.pooja.code);
      setHostData({ ...DEFAULT_HOST_DATA, ...data.pooja.hostData });
      setPanchangData({ ...DEFAULT_PANCHANG, ...data.pooja.panchangData });
      setDate(data.pooja.pujaDate || new Date().toISOString().split('T')[0]);
      setDeviceMode('controller');
      setScreen('preflightDate');
    } catch (err) {}
  };

  const handleResumePooja = async (code) => {
    setPoojasError('');
    try {
      const res = await adminFetch(`/api/admin/poojas/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setPoojasError(data.error || 'माहिती मिळाली नाही');
        return;
      }
      const p = data.pooja;
      setPujaCode(p.code);
      setHostData({ ...DEFAULT_HOST_DATA, ...p.hostData });
      setPanchangData({ ...DEFAULT_PANCHANG, ...p.panchangData });
      setDate(p.pujaDate || new Date().toISOString().split('T')[0]);
      setCurrentSectionIdx(p.sectionIdx || 0);
      setCurrentStepIdx(p.stepIdx || 0);
      setMediaTarget(p.mediaTarget || 'controller');
      setVolume(p.volume !== undefined ? p.volume : 1);
      setDeviceMode('controller');
      enterFullscreen();
      setScreen('mainPuja');
    } catch (err) {}
  };

  const handleEndPooja = async (code) => {
    const row = poojas.find((p) => p.code === code);
    await postSyncStatus(code, row?.sectionIdx, row?.stepIdx, 'complete');
    loadPoojas();
  };

  // ===== नवीन/संपादन पूजा — तारीख→पंचांग→यजमान प्रवाह (जुने व नवीन दोन्हीसाठी सामायिक) =====

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

  // "माहिती जतन करून शेड्यूल करून ठेवा" — स्थिती बदलत नाही, यादीकडे परत
  const handleSaveScheduled = async () => {
    setSavingPooja(true);
    setPoojasError('');
    try {
      const res = await adminFetch(`/api/admin/poojas/${pujaCode}`, {
        method: 'PATCH',
        body: JSON.stringify({ pujaDate: date, panchangData, hostData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPoojasError(data.error || 'जतन करता आले नाही');
        return;
      }
      await loadPoojas();
      setScreen('dashboard');
    } catch (err) {
    } finally {
      setSavingPooja(false);
    }
  };

  // "आत्ताच पूजा सुरू करा" — स्थिती performing, थेट मुख्य पूजा स्क्रीनवर
  const handleStartNow = async () => {
    setSavingPooja(true);
    setPoojasError('');
    try {
      const res = await adminFetch(`/api/admin/poojas/${pujaCode}`, {
        method: 'PATCH',
        body: JSON.stringify({ pujaDate: date, panchangData, hostData, status: 'performing', sectionIdx: 0, stepIdx: 0 }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPoojasError(data.error || 'सुरू करता आले नाही');
        return;
      }
      setCurrentSectionIdx(0);
      setCurrentStepIdx(0);
      enterFullscreen();
      setScreen('mainPuja');
    } catch (err) {
    } finally {
      setSavingPooja(false);
    }
  };

  const handleJumpTo = (sectionIdx, stepIdx) => {
    setCurrentSectionIdx(sectionIdx);
    setCurrentStepIdx(stepIdx);
  };

  // ===== नियंत्रक: शेवटच्या पायरीनंतर "पुढे" दाबल्यावर पूजा समाप्त करा =====
  const handlePujaComplete = async () => {
    if (pujaCode) {
      await postSyncStatus(pujaCode, currentSectionIdx, currentStepIdx, 'complete');
    }
    setScreen('pujaClosed');
  };

  // ===== नियंत्रक: पायरी/ऑडिओ-स्थान/आवाज बदलल्यावर सर्व्हरला कळवा (पंचांग+यजमान माहितीसह) =====
  useEffect(() => {
    if (deviceMode !== 'controller' || screen !== 'mainPuja' || !pujaCode) return;
    postSyncStatus(pujaCode, currentSectionIdx, currentStepIdx, 'performing');
  }, [currentSectionIdx, currentStepIdx, deviceMode, screen, pujaCode, mediaTarget, volume]);

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
          if (data.mediaTarget) setMediaTarget(data.mediaTarget);
          if (data.volume !== undefined) setVolume(data.volume);
          if (data.status === 'complete') {
            clearInterval(statePollRef.current);
            setScreen('pujaClosed');
          }
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

  if (screen === 'roleSelect') {
    return <PreflightForm.RoleSelectScreen onSelect={handleRoleSelect} />;
  }

  if (screen === 'login') {
    return <AdminScreens.LoginScreen onSubmit={handleLoginSubmit} error={loginError} loading={loginLoading} />;
  }

  if (screen === 'dashboard') {
    return (
      <AdminScreens.DashboardScreen
        poojas={poojas}
        loading={poojasLoading}
        error={poojasError}
        onCreateNew={handleCreateNewSchedule}
        onEdit={handleEditPooja}
        onResume={handleResumePooja}
        onEnd={handleEndPooja}
        onLogout={handleLogout}
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

  if (screen === 'pujaClosed') {
    return (
      <PreflightForm.PujaClosedScreen
        pujaCode={pujaCode}
        deviceMode={deviceMode}
        onBackToDashboard={() => {
          setScreen('dashboard');
          loadPoojas();
        }}
      />
    );
  }

  if (screen === 'sankalpaPreview') {
    const sankalpaText = buildSankalpaText(sankalpaData, panchangData, hostData);
    return (
      <PreflightForm.SankalpaPreviewScreen
        sankalpaText={sankalpaText}
        pujaCode={pujaCode}
        saving={savingPooja}
        onStartNow={handleStartNow}
        onSaveScheduled={handleSaveScheduled}
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
      mediaTarget={mediaTarget}
      volume={volume}
      onToggleMediaTarget={() => setMediaTarget((t) => (t === 'controller' ? 'audience' : 'controller'))}
      onSetVolume={setVolume}
      onNext={() => {
        if (currentStepIdx < currentSection.steps.length - 1) {
          setCurrentStepIdx(currentStepIdx + 1);
        } else if (currentSectionIdx < pujaData.sections.length - 1) {
          setCurrentSectionIdx(currentSectionIdx + 1);
          setCurrentStepIdx(0);
        } else {
          handlePujaComplete();
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
