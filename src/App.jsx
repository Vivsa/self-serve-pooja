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

  // पूजा-कोडासाठी उघडलेली WebSocket जोडणी (नियंत्रक व दर्शक दोघेही — /api/room मार्फत PujaRoom
  // Durable Object शी थेट, पायरी बदलताच तात्काळ push मिळते, दर सेकंदाला विचारावे लागत नाही)
  const roomSocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const connectRoomRef = useRef(null);
  // WS-व्यवस्थापन effect पायरी बदलताच पुन्हा चालत नाही (मुद्दाम — तसं झाल्यास प्रत्येक पायरीला
  // जोडणी तुटून पुन्हा जोडावी लागेल), त्यामुळे reconnect-वेळी नियंत्रकाची ताजी स्थिती इथून वाचतो
  const latestControllerStateRef = useRef({});
  useEffect(() => {
    latestControllerStateRef.current = {
      sectionIdx: currentSectionIdx,
      stepIdx: currentStepIdx,
      panchangData,
      hostData,
      mediaTarget,
      volume,
    };
  }, [currentSectionIdx, currentStepIdx, panchangData, hostData, mediaTarget, volume]);

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

  // ===== सर्व्हरला (Durable Object + D1 दोन्हीकडे) स्थिती कळवणे — HTTP द्वारे, एकदाच (WebSocket
  // उघडे नसतानाही, उदा. dashboard मधून थेट "समाप्त करा") =====
  const postRoomStatus = (code, sectionIdx, stepIdx, status) =>
    fetch(`/api/room?code=${code}`, {
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

  // ===== नियंत्रक: चालू WebSocket जोडणीवरून पायरी-बदल तात्काळ पाठवणे (server push चा स्रोत) =====
  const sendStepChange = (code, sectionIdx, stepIdx, status) => {
    const payload = {
      type: 'stepChange',
      code,
      sectionIdx: sectionIdx || 0,
      stepIdx: stepIdx || 0,
      panchangData,
      hostData,
      updatedAt: Date.now(),
      status,
      mediaTarget,
      volume,
    };
    const ws = roomSocketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      // सॉकेट अजून तयार नसेल (उदा. जोडणी होत असतानाच पायरी बदलली) तर HTTP fallback
      postRoomStatus(code, sectionIdx, stepIdx, status);
    }
  };

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
      const res = await fetch(`/api/room?code=${codeInput}`);
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
    await postRoomStatus(code, row?.sectionIdx, row?.stepIdx, 'complete');
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
      sendStepChange(pujaCode, currentSectionIdx, currentStepIdx, 'complete');
    }
    setScreen('pujaClosed');
  };

  // ===== नियंत्रक: पायरी/ऑडिओ-स्थान/आवाज बदलल्यावर तात्काळ (WebSocket द्वारे) सर्व्हरला कळवा =====
  useEffect(() => {
    if (deviceMode !== 'controller' || screen !== 'mainPuja' || !pujaCode) return;
    sendStepChange(pujaCode, currentSectionIdx, currentStepIdx, 'performing');
  }, [currentSectionIdx, currentStepIdx, deviceMode, screen, pujaCode, mediaTarget, volume]);

  // ===== नियंत्रक व दर्शक दोघेही: पूजा-कोडासाठी एकच सतत-चालू WebSocket जोडणी =====
  // - दर्शक: सर्व्हरकडून पायरी-बदल तात्काळ मिळतात (poll करावे लागत नाही), स्वतःची उपस्थिती
  //   जोडणी उघडी असण्यावरूनच आपोआप कळते (वेगळे heartbeat-लेखन नाही)
  // - नियंत्रक: दर्शक-यादी तात्काळ मिळते; जोडणी उघडताच स्वतःची (कदाचित dashboard वरून resume
  //   केलेली) स्थिती सर्व्हरला कळवली जाते, जेणेकरून उशिरा जोडणाऱ्या दर्शकालाही बरोबर स्थिती मिळेल
  // - जोडणी अनपेक्षितपणे तुटली (उदा. TV ब्राउझर बॅकग्राउंडला गेल्यावर) तर वाढत्या विलंबाने पुन्हा
  //   जोडते; टॅब परत समोर आल्यावर (visibilitychange) लगेच तपासून गरज असल्यास पुन्हा जोडते
  useEffect(() => {
    if (screen !== 'mainPuja' || !pujaCode) return;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({ code: pujaCode, role: deviceMode });
      if (deviceMode === 'audience') {
        params.set('viewerId', viewerId);
        params.set('name', viewerName || '');
      }
      const ws = new WebSocket(`${proto}//${window.location.host}/api/room?${params.toString()}`);
      roomSocketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        if (deviceMode === 'controller') {
          // ही जोडणी-effect पायरी बदलताच पुन्हा चालत नाही, म्हणून बंद पडलेल्या क्षणापर्यंतची जुनी
          // (stale) स्थिती परत पाठवली जाऊ नये यासाठी ताजी मूल्ये थेट ref मधून वाचतो
          const s = latestControllerStateRef.current;
          ws.send(
            JSON.stringify({
              type: 'stepChange',
              code: pujaCode,
              sectionIdx: s.sectionIdx || 0,
              stepIdx: s.stepIdx || 0,
              panchangData: s.panchangData,
              hostData: s.hostData,
              updatedAt: Date.now(),
              status: 'performing',
              mediaTarget: s.mediaTarget,
              volume: s.volume,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (err) {
          return;
        }
        if (msg.type === 'viewers') {
          setViewers(msg.viewers || []);
        } else if (msg.type === 'state' && deviceMode === 'audience' && msg.found !== false) {
          setCurrentSectionIdx(msg.sectionIdx || 0);
          setCurrentStepIdx(msg.stepIdx || 0);
          if (msg.panchangData) setPanchangData(msg.panchangData);
          if (msg.hostData) setHostData(msg.hostData);
          if (msg.mediaTarget) setMediaTarget(msg.mediaTarget);
          if (msg.volume !== undefined) setVolume(msg.volume);
          if (msg.status === 'complete') setScreen('pujaClosed');
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        roomSocketRef.current = null;
        const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 15000);
        reconnectAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    };

    connectRoomRef.current = connect;
    connect();

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const ws = roomSocketRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectAttemptRef.current = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(reconnectTimeoutRef.current);
      if (roomSocketRef.current) {
        roomSocketRef.current.onclose = null;
        roomSocketRef.current.close();
        roomSocketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceMode, screen, pujaCode, viewerId, viewerName]);

  // ===== दर्शक: "🔄 आत्ता जुळवा" — मॅन्युअली, तात्काळ पुन्हा-जोडणी करून ताजी स्थिती आणणे =====
  const handleManualSync = () => {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectAttemptRef.current = 0;
    const ws = roomSocketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'syncRequest' }));
      return;
    }
    if (ws) {
      ws.onclose = null;
      ws.close();
      roomSocketRef.current = null;
    }
    if (connectRoomRef.current) connectRoomRef.current();
  };

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
      onManualSync={handleManualSync}
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
