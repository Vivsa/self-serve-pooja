import React, { useState, useEffect, useRef } from 'react';
import PreflightForm from './components/PreflightForm';
import PujaScreen from './components/PujaScreen';
import { designSystem } from './styles/designSystem';
import { createRoomSync, generateRoomCode } from './sync';

function App() {
  const [screen, setScreen] = useState('deviceMode');
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
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [pujaData, setPujaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const syncRef = useRef(null);

  // वार गणना करा
  useEffect(() => {
    if (date) {
      const d = new Date(date);
      const varaNames = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      setVara(varaNames[d.getDay()]);
      setPanchangData(prev => ({ ...prev, vara: varaNames[d.getDay()] }));
    }
  }, [date]);

  // puja.json लोड करा
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

  const handleDateConfirm = () => {
    setScreen('panchang');
  };

  const handlePanchangConfirm = () => {
    setScreen('hostFamily');
  };

  const handleHostDataChange = (field, value) => {
    setHostData({ ...hostData, [field]: value });
  };

  const addChild = () => {
    setHostData({
      ...hostData,
      children: [...hostData.children, { name: '', aspiration: '' }],
    });
  };

  const removeChild = (idx) => {
    setHostData({
      ...hostData,
      children: hostData.children.filter((_, i) => i !== idx),
    });
  };

  const updateChild = (idx, field, value) => {
    const newChildren = [...hostData.children];
    newChildren[idx] = { ...newChildren[idx], [field]: value };
    setHostData({ ...hostData, children: newChildren });
  };

  const handleHostFamilyConfirm = () => {
    startPuja(generateRoomCode());
  };

  const handleDeviceModeSelect = (mode) => {
    setDeviceMode(mode);
    if (mode === 'controller') {
      setScreen('preflightDate');
    } else {
      setScreen('roomCodeEntry');
    }
  };

  const startPuja = (code) => {
    setRoomCode(code);
    setScreen('mainPuja');

    syncRef.current = createRoomSync({
      roomCode: code,
      onState: (data) => {
        setCurrentSectionIdx(data.sectionIdx);
        setCurrentStepIdx(data.stepIdx);
      },
    });

    // Screen लॉक सक्षम करा (पूजा सुरू होतेय)
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen अक्षम:', err);
      });
    }
  };

  useEffect(() => {
    if (screen === 'mainPuja' && deviceMode === 'controller' && syncRef.current) {
      syncRef.current.sendState(currentSectionIdx, currentStepIdx);
    }
  }, [currentSectionIdx, currentStepIdx, screen, deviceMode]);

  useEffect(() => () => {
    syncRef.current?.close();
  }, []);

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

  if (screen === 'deviceMode') {
    return <PreflightForm.DeviceModeScreen onSelect={handleDeviceModeSelect} />;
  }

  if (screen === 'roomCodeEntry') {
    return <PreflightForm.RoomCodeEntryScreen onConfirm={startPuja} />;
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

  // मुख्य पूजा screen
  const currentSection = pujaData.sections[currentSectionIdx];
  const currentStep = currentSection?.steps[currentStepIdx];

  return (
    <PujaScreen
      deviceMode={deviceMode}
      roomCode={roomCode}
      currentSection={currentSection}
      currentStep={currentStep}
      currentSectionIdx={currentSectionIdx}
      currentStepIdx={currentStepIdx}
      sections={pujaData.sections}
      hostData={hostData}
      panchangData={panchangData}
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
    />
  );
}

export default App;
