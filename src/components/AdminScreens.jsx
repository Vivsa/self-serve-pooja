import React, { useState } from 'react';
import { designSystem } from '../styles/designSystem';

// ===== निर्देशक Login =====
const LoginScreen = ({ onSubmit, error, loading }) => {
  const [password, setPassword] = useState('');
  return (
    <div style={{ ...designSystem.container, textAlign: 'center', paddingTop: '60px' }}>
      <h1 style={designSystem.heading}>🔐 निर्देशक Login</h1>
      <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '24px' }}>
        मागील पूजा-यादी पाहण्यासाठी व नवीन पूजा शेड्यूल करण्यासाठी लॉगिन करा
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(password)}
        placeholder="पासवर्ड"
        style={{ ...designSystem.input, fontSize: '18px', textAlign: 'center', marginBottom: '16px' }}
      />
      {error && <p style={{ color: designSystem.colors.danger, fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
      <button onClick={() => onSubmit(password)} disabled={loading} style={designSystem.button}>
        {loading ? 'तपासत आहे...' : 'लॉगिन करा'}
      </button>
    </div>
  );
};

const STATUS_LABELS = {
  scheduled: { label: 'शेड्यूल केलेली', color: designSystem.colors.secondary, bg: '#EFEFEF' },
  performing: { label: 'सुरू आहे', color: '#2e7d32', bg: '#E6F4EA' },
  complete: { label: 'पूर्ण झाली', color: designSystem.colors.ink, bg: designSystem.colors.saffron },
};

function hostSummary(hostData) {
  const names = [hostData?.hostMaleName, hostData?.hostFemaleName].filter(Boolean).join(' — ');
  return names || 'यजमान माहिती अजून भरलेली नाही';
}

const PoojaRow = ({ pooja, onEdit, onResume, onEnd }) => {
  const statusInfo = STATUS_LABELS[pooja.status] || STATUS_LABELS.scheduled;
  return (
    <div style={{ ...designSystem.cardContainer, padding: '16px', marginBottom: '12px', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <p style={{ ...designSystem.body, fontWeight: '600', fontSize: '16px', margin: 0, color: designSystem.colors.ink }}>
            कोड: {pooja.code} {pooja.pujaDate && `· ${pooja.pujaDate}`}
          </p>
          <p style={{ ...designSystem.body, fontSize: '14px', color: designSystem.colors.secondary, margin: '4px 0 0 0' }}>
            {hostSummary(pooja.hostData)}
          </p>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: statusInfo.color,
            background: statusInfo.bg,
            padding: '4px 10px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          {statusInfo.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
        {pooja.status === 'scheduled' && (
          <button onClick={() => onEdit(pooja.code)} style={designSystem.smallButton}>
            ✏️ माहिती तपासा / संपादन करा
          </button>
        )}
        {pooja.status === 'performing' && (
          <>
            <button onClick={() => onResume(pooja.code)} style={designSystem.smallButton}>
              ▶️ पूजा सुरू ठेवा
            </button>
            <button
              onClick={() => onEnd(pooja.code)}
              style={{ ...designSystem.smallButton, background: '#FFF', color: designSystem.colors.danger, border: `1px solid ${designSystem.colors.danger}` }}
            >
              ⏹️ समाप्त करा
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ===== निर्देशक Dashboard — मागील/चालू/शेड्यूल पूजांची यादी =====
const DashboardScreen = ({ poojas, loading, error, onCreateNew, onEdit, onResume, onEnd, onLogout }) => (
  <div style={{ ...designSystem.container, paddingTop: '32px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <h1 style={{ ...designSystem.heading, margin: 0 }}>🕉️ पूजा-यादी</h1>
      <button
        onClick={onLogout}
        style={{ background: 'none', border: 'none', color: designSystem.colors.secondary, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        लॉगआउट
      </button>
    </div>
    <p style={{ ...designSystem.body, color: designSystem.colors.secondary, marginBottom: '20px' }}>
      शेड्यूल केलेल्या, सुरू असलेल्या व पूर्ण झालेल्या पूजा
    </p>

    <button onClick={onCreateNew} style={{ ...designSystem.button, marginTop: 0, marginBottom: '24px' }}>
      + नवीन पूजा शेड्यूल करा
    </button>

    {error && <p style={{ color: designSystem.colors.danger, fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
    {loading && <p style={{ ...designSystem.body, color: designSystem.colors.secondary }}>लोड होत आहे...</p>}
    {!loading && poojas.length === 0 && (
      <p style={{ ...designSystem.body, color: designSystem.colors.secondary, textAlign: 'center', marginTop: '32px' }}>
        अजून कोणतीही पूजा शेड्यूल केलेली नाही.
      </p>
    )}

    {poojas.map((pooja) => (
      <PoojaRow key={pooja.code} pooja={pooja} onEdit={onEdit} onResume={onResume} onEnd={onEnd} />
    ))}
  </div>
);

const AdminScreens = { LoginScreen, DashboardScreen };
export default AdminScreens;
