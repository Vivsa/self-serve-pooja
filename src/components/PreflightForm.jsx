import React, { useState } from 'react';
import { designSystem } from '../styles/designSystem';

const DateScreen = ({ date, setDate, vara, onConfirm }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>पूजा तारीख निवडा</h1>
    <div style={designSystem.formGroup}>
      <label style={designSystem.label}>तारीख</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={designSystem.input}
      />
    </div>
    {vara && (
      <div style={{ background: designSystem.colors.saffron, padding: '12px', borderRadius: '6px', marginBottom: '24px' }}>
        <p style={{ ...designSystem.body, margin: 0 }}>वार: <strong style={{ color: designSystem.colors.ink }}>{vara}</strong></p>
      </div>
    )}
    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

const PanchangScreen = ({ panchangData, setPanchangData, onConfirm }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>पंचांग तपशील</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
      पुष्टी करा किंवा मातांकडून विचारून संपादित करा
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
      {Object.entries(panchangData).map(([key, value]) => (
        <div key={key} style={designSystem.formGroup}>
          <label style={designSystem.label}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) =>
              setPanchangData({ ...panchangData, [key]: e.target.value })
            }
            style={designSystem.input}
          />
        </div>
      ))}
    </div>
    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

const HostFamilyScreen = ({
  hostData,
  onDataChange,
  onAddChild,
  onRemoveChild,
  onUpdateChild,
  onConfirm,
}) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>यजमान कुटुंब</h1>
    
    <div style={designSystem.formGroup}>
      <label style={designSystem.label}>यजमान (पुरुष) नाव</label>
      <input
        type="text"
        placeholder="उदा. रामचंद्र"
        value={hostData.hostMaleName}
        onChange={(e) => onDataChange('hostMaleName', e.target.value)}
        style={designSystem.input}
      />
    </div>

    <div style={designSystem.formGroup}>
      <label style={designSystem.label}>यजमान (स्त्री) नाव</label>
      <input
        type="text"
        placeholder="उदा. सीता"
        value={hostData.hostFemaleName}
        onChange={(e) => onDataChange('hostFemaleName', e.target.value)}
        style={designSystem.input}
      />
    </div>

    <div style={designSystem.formGroup}>
      <label style={designSystem.label}>गोत्र</label>
      <input
        type="text"
        placeholder="उदा. कश्यप"
        value={hostData.gotra}
        onChange={(e) => onDataChange('gotra', e.target.value)}
        style={designSystem.input}
      />
    </div>

    <h2 style={designSystem.subheading}>मुले / मुली</h2>
    {hostData.children.map((child, idx) => (
      <div key={idx} style={{ ...designSystem.cardContainer, marginBottom: '12px', padding: '16px', background: designSystem.colors.saffron }}>
        <input
          type="text"
          placeholder="नाव"
          value={child.name}
          onChange={(e) => onUpdateChild(idx, 'name', e.target.value)}
          style={designSystem.input}
        />
        <textarea
          placeholder="इच्छा / संकल्प"
          value={child.aspiration}
          onChange={(e) => onUpdateChild(idx, 'aspiration', e.target.value)}
          style={{ ...designSystem.input, minHeight: '60px', marginTop: '8px' }}
        />
        <button
          onClick={() => onRemoveChild(idx)}
          style={{ ...designSystem.smallButton, background: designSystem.colors.danger, marginTop: '8px' }}
        >
          हटवा
        </button>
      </div>
    ))}
    <button onClick={onAddChild} style={designSystem.button}>
      + मूल जोडा
    </button>

    <h2 style={designSystem.subheading}>यजमान (पुरुष) — मनोकामना</h2>
    <textarea
      placeholder="उदा. व्यवसायात वृद्धी, पदोन्नती"
      value={hostData.hostMaleAspiration}
      onChange={(e) => onDataChange('hostMaleAspiration', e.target.value)}
      style={{ ...designSystem.input, minHeight: '60px', marginBottom: '24px' }}
    />

    <h2 style={designSystem.subheading}>यजमान (स्त्री) — मनोकामना</h2>
    <textarea
      placeholder="उदा. कुटुंबाचे आरोग्य, समाजसेवा"
      value={hostData.hostFemaleAspiration}
      onChange={(e) => onDataChange('hostFemaleAspiration', e.target.value)}
      style={{ ...designSystem.input, minHeight: '60px', marginBottom: '24px' }}
    />

    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

const DeviceModeScreen = ({ onSelect }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>डिव्हाइस निवडा</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
      कुठे चालवायचे?
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
      <div 
        style={{ ...designSystem.cardContainer, padding: '24px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${designSystem.colors.gold}` }}
        onClick={() => onSelect('controller')}
      >
        <h3 style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, fontSize: '18px', margin: '0 0 8px 0' }}>नियंत्रक</h3>
        <p style={{ ...designSystem.body, color: designSystem.colors.secondary, margin: 0, fontSize: '14px' }}>किमान UI, एक मुठी नियंत्रण</p>
      </div>
      <div 
        style={{ ...designSystem.cardContainer, padding: '24px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${designSystem.colors.gold}` }}
        onClick={() => onSelect('audience')}
      >
        <h3 style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, fontSize: '18px', margin: '0 0 8px 0' }}>दर्शक</h3>
        <p style={{ ...designSystem.body, color: designSystem.colors.secondary, margin: 0, fontSize: '14px' }}>मोठे पाठ, सुंदर प्रदर्शन</p>
      </div>
    </div>
  </div>
);

const RoomCodeEntryScreen = ({ onConfirm }) => {
  const [code, setCode] = useState('');
  return (
    <div style={designSystem.container}>
      <h1 style={designSystem.heading}>रूम कोड टाका</h1>
      <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
        नियंत्रक डिव्हाइसवर दाखवलेला कोड टाका
      </p>
      <div style={designSystem.formGroup}>
        <input
          type="text"
          placeholder="उदा. AB3D"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ ...designSystem.input, fontSize: '24px', textAlign: 'center', letterSpacing: '4px' }}
          maxLength={4}
        />
      </div>
      <button
        onClick={() => onConfirm(code)}
        disabled={code.trim().length !== 4}
        style={{ ...designSystem.button, opacity: code.trim().length === 4 ? 1 : 0.5 }}
      >
        जोडा
      </button>
    </div>
  );
};

const PreflightForm = {
  DateScreen,
  PanchangScreen,
  HostFamilyScreen,
  DeviceModeScreen,
  RoomCodeEntryScreen,
};

export default PreflightForm;
