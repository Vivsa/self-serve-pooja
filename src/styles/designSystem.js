export const designSystem = {
  colors: {
    ink: '#8B4513',        // शाई
    gold: '#D4A574',       // सोनेरी
    saffron: '#F5E6D3',    // केशरी
    primary: '#1a1a1a',
    secondary: '#666666',
    danger: '#d32f2f',
    white: '#FFFFFF',
    lightBg: '#F9F6F0',
  },

  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'Noto Devanagari, sans-serif',
    color: '#1a1a1a',
  },

  heading: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#8B4513',
  },

  subheading: {
    fontSize: '18px',
    fontWeight: '500',
    marginTop: '24px',
    marginBottom: '12px',
    color: '#8B4513',
  },

  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.6',
    color: '#333333',
  },

  formGroup: {
    marginBottom: '16px',
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#333',
  },

  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'Noto Devanagari, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
  },

  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
    background: '#D4A574',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '24px',
    transition: 'background 0.3s',
    fontFamily: 'Noto Devanagari, sans-serif',
  },

  smallButton: {
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    background: '#D4A574',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Noto Devanagari, sans-serif',
  },

  cardContainer: {
    background: '#FFFFFF',
    border: '0.5px solid #E0D5C8',
    borderRadius: '6px',
    padding: '16px',
  },

  // Controller mode styles
  controllerContainer: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#F9F6F0',
    fontFamily: 'Noto Devanagari, sans-serif',
  },

  controllerHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #E0D5C8',
  },

  controllerContent: {
    flex: 1,
    padding: '24px 16px',
    overflowY: 'auto',
  },
};
