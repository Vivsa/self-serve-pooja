import React from 'react';
import { designSystem } from '../styles/designSystem';
import { panchangOptions, panchangLabels } from '../panchangOptions';

// ===== १. भूमिका निवड: निर्देशक की दर्शक =====
const RoleSelectScreen = ({ onSelect }) => (
  <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '60px' }}>
    <h1 style={designSystem.heading}>आपली भूमिका निवडा</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '32px' }}>
      आपण या पूजेत कसे सामील होणार?
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div
        style={{ ...designSystem.cardContainer, padding: '24px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${designSystem.colors.gold}` }}
        onClick={() => onSelect('controller')}
      >
        <h3 style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, fontSize: '18px', margin: '0 0 8px 0' }}>🎛️ निर्देशक</h3>
        <p style={{ ...designSystem.body, color: designSystem.colors.secondary, margin: 0, fontSize: '14px' }}>मी पूजा सांगत आहे</p>
      </div>
      <div
        style={{ ...designSystem.cardContainer, padding: '24px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${designSystem.colors.gold}` }}
        onClick={() => onSelect('audience')}
      >
        <h3 style={{ ...designSystem.body, fontWeight: '600', color: designSystem.colors.ink, fontSize: '18px', margin: '0 0 8px 0' }}>🙏 दर्शक</h3>
        <p style={{ ...designSystem.body, color: designSystem.colors.secondary, margin: 0, fontSize: '14px' }}>मी पूजेत सहभागी होत आहे</p>
      </div>
    </div>
  </div>
);

// ===== ३. दर्शकाचे नाव =====
const AudienceNameScreen = ({ viewerName, setViewerName, codeError, onSubmit }) => (
  <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '60px' }}>
    <h1 style={designSystem.heading}>आपले नाव सांगा</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
      निर्देशकाला दर्शक-यादीत आपले नाव दिसेल
    </p>
    <input
      type="text"
      value={viewerName}
      onChange={(e) => setViewerName(e.target.value)}
      placeholder="आपले नाव"
      style={{ ...designSystem.input, fontSize: '18px', textAlign: 'center', marginBottom: '16px' }}
    />
    {codeError && <p style={{ color: designSystem.colors.danger, fontSize: '14px', marginBottom: '16px' }}>{codeError}</p>}
    <button onClick={onSubmit} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

// ===== ४. कोड टाकणे (निर्देशक-पुनःजोड आणि दर्शक दोघांसाठी वापरता येईल) =====
const CodeEntryScreen = ({ title, subtitle, codeInput, setCodeInput, codeError, onSubmit }) => (
  <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '60px' }}>
    <h1 style={designSystem.heading}>{title}</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>{subtitle}</p>
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
    {codeError && <p style={{ color: designSystem.colors.danger, fontSize: '14px', marginBottom: '16px' }}>{codeError}</p>}
    <button onClick={onSubmit} style={designSystem.button}>
      जोडा
    </button>
  </div>
);

// ===== ५. नवीन पूजा — कोड सर्वप्रथम दाखवणे =====
const NewPujaCodeScreen = ({ pujaCode, onConfirm }) => (
  <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '60px' }}>
    <h1 style={designSystem.heading}>आपला पूजा-कोड</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
      हा कोड जपून ठेवा — दर्शकांना व इतर निर्देशक-डिव्हाइसला यानेच जोडता येईल
    </p>
    <div
      style={{
        fontSize: '56px',
        fontWeight: '700',
        letterSpacing: '8px',
        color: designSystem.colors.ink,
        background: designSystem.colors.saffron,
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '32px',
      }}
    >
      {pujaCode}
    </div>
    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला — दिनांक निवडा
    </button>
  </div>
);

// ===== ६. दिनांक =====
const DateScreen = ({ date, setDate, vara, onConfirm }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>पूजा तारीख निवडा</h1>
    <div style={designSystem.formGroup}>
      <label style={designSystem.label}>तारीख</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={designSystem.input} />
    </div>
    {vara && (
      <div style={{ background: designSystem.colors.saffron, padding: '12px', borderRadius: '6px', marginBottom: '24px' }}>
        <p style={{ ...designSystem.body, margin: 0 }}>
          वार: <strong style={{ color: designSystem.colors.ink }}>{vara}</strong>
        </p>
      </div>
    )}
    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

// ===== ७. पंचांग (dropdown) =====
const PanchangScreen = ({ panchangData, setPanchangData, onConfirm }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>पंचांग तपशील</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
      यादीतून निवडा किंवा मातांकडून विचारून संपादित करा
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
      {Object.entries(panchangData).map(([key, value]) => (
        <div key={key} style={designSystem.formGroup}>
          <label style={designSystem.label}>{panchangLabels[key] || key}</label>
          <select
            value={value}
            onChange={(e) => setPanchangData({ ...panchangData, [key]: e.target.value })}
            style={{ ...designSystem.input, cursor: 'pointer' }}
          >
            {!panchangOptions[key]?.includes(value) && value && <option value={value}>{value}</option>}
            {(panchangOptions[key] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
    <button onClick={onConfirm} style={designSystem.button}>
      पुढे चला
    </button>
  </div>
);

// ===== ८. यजमान कुटुंब =====
const HostFamilyScreen = ({ hostData, onDataChange, onAddChild, onRemoveChild, onUpdateChild, onConfirm }) => (
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
        <button onClick={() => onRemoveChild(idx)} style={{ ...designSystem.smallButton, background: designSystem.colors.danger, marginTop: '8px' }}>
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
      पुढे चला — संकल्प पाहा
    </button>
  </div>
);

// ===== ९. संकल्प पूर्वावलोकन — निर्देशक इथे वाचून यजमान कुटुंबाला ऐकवू शकतो =====
const SankalpaPreviewScreen = ({ sankalpaText, pujaCode, saving, onStartNow, onSaveScheduled }) => (
  <div style={designSystem.container}>
    <h1 style={designSystem.heading}>संकल्प</h1>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '16px' }}>
      पूजा सुरू करण्यापूर्वी हा संकल्प यजमान कुटुंबाला वाचून दाखवा
    </p>
    <div
      style={{
        ...designSystem.cardContainer,
        background: designSystem.colors.saffron,
        border: `2px solid ${designSystem.colors.gold}`,
        padding: '20px',
        marginBottom: '24px',
        fontFamily: 'Noto Devanagari, sans-serif',
        fontSize: '16px',
        lineHeight: '2',
        color: designSystem.colors.ink,
      }}
    >
      {sankalpaText}
    </div>
    <div style={{ background: '#FFF', padding: '12px', borderRadius: '6px', marginBottom: '24px', textAlign: 'center' }}>
      <p style={{ ...designSystem.body, margin: 0, fontSize: '13px', color: designSystem.colors.secondary }}>
        पूजा कोड: <strong style={{ color: designSystem.colors.ink, fontSize: '16px' }}>{pujaCode}</strong>
      </p>
    </div>
    <button onClick={onStartNow} disabled={saving} style={designSystem.button}>
      🕉️ आत्ताच पूजा सुरू करा
    </button>
    <button
      onClick={onSaveScheduled}
      disabled={saving}
      style={{ ...designSystem.button, background: '#FFF', color: designSystem.colors.ink, border: `2px solid ${designSystem.colors.gold}` }}
    >
      💾 माहिती जतन करून शेड्यूल करून ठेवा (नंतर सुरू करेन)
    </button>
  </div>
);

// ===== ९. पूजा समाप्ती =====
const PujaClosedScreen = ({ pujaCode, deviceMode, onBackToDashboard }) => (
  <div
    style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: '#1a1a1a',
      color: '#FFF',
      fontFamily: 'Noto Devanagari, sans-serif',
      padding: '24px',
    }}
  >
    <img
      src="/satyanarayan-katha-outro.png"
      alt="पूजा समाप्त"
      style={{
        width: '100%',
        maxWidth: '640px',
        borderRadius: '14px',
        border: `2px solid ${designSystem.colors.gold}`,
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5)',
        marginBottom: '28px',
      }}
    />
    <h1 style={{ fontSize: '30px', fontWeight: '600', color: designSystem.colors.gold, margin: '0 0 12px 0' }}>
      🙏 पूजा समाप्त झाली
    </h1>
    <p style={{ fontSize: '17px', color: '#E0E0E0', margin: '0 0 24px 0' }}>
      श्रीसत्यनारायणाच्या कृपेने पूजा सुफळ संपूर्ण झाली.
    </p>
    {pujaCode && (
      <div
        style={{
          fontSize: '15px',
          color: designSystem.colors.gold,
          background: 'rgba(212, 165, 116, 0.12)',
          border: `1px solid ${designSystem.colors.gold}`,
          borderRadius: '8px',
          padding: '10px 18px',
        }}
      >
        पूजा कोड: <strong>{pujaCode}</strong> — <span style={{ color: '#E0E0E0' }}>बंद (Closed)</span>
      </div>
    )}
    {deviceMode === 'controller' && (
      <button
        onClick={onBackToDashboard}
        style={{ ...designSystem.button, maxWidth: '360px', marginTop: '28px', background: designSystem.colors.gold }}
      >
        🕉️ पूजा-यादीकडे परत जा
      </button>
    )}
  </div>
);

const PreflightForm = {
  RoleSelectScreen,
  AudienceNameScreen,
  CodeEntryScreen,
  NewPujaCodeScreen,
  DateScreen,
  PanchangScreen,
  HostFamilyScreen,
  SankalpaPreviewScreen,
  PujaClosedScreen,
};

export default PreflightForm;
