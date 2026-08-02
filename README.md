# Self-Serve Pooja — पूजेसाठी / पूजासाथी

एक multi-lingual PWA जो आपल्या कुटुंबाला श्री सत्यनारायण पूजा सरलतेने करता येईल.

## भाषा समर्थन

- **मराठी**: पूजेसाठी.app
- **हिंदी**: पूजासाथी.app
- **English**: self-serve-pooja.app

## विशेषतायें

✅ **Guide Mode** — Step-by-step guidance with audio  
✅ **Two-Device Architecture** — Controller (minimalist) + Audience Display (rich)  
✅ **Offline-First** — सर्व MP3 files cache होतात  
✅ **Sankalpa Pause** — परिवार च्या इच्छा हाताने विचारा  
✅ **Devanagari First** — Noto Devanagari font  
✅ **Design System** — शाई/सोनेरी/केशरी पॅलेट  

## Setup

```bash
# Install dependencies
npm install

# Local development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Project Structure

```
src/
├── App.jsx                 — मुख्य component
├── components/
│   ├── PreflightForm.jsx   — दिनांक, पंचांग, कुटुंब फॉर्म
│   └── PujaScreen.jsx      — नियंत्रक आणि दर्शक मोड
├── styles/
│   └── designSystem.js     — रंग आणि शैलीकरण
├── main.jsx                — Entry point
└── index.css               — वैश्विक CSS

public/
├── puja.json               — पूजा steps (Excel export)
└── sankalpa.json           — संकल्प template (Excel export)
```

## Audio Files

Audio base URL: `https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev`

सर्व MP3 files R2 bucket मध्ये hosted आहेत.

## Development Notes

- React 18 + Vite
- Noto Devanagari font
- No external UI framework (pure CSS)
- Mobile-first responsive design
- Wake lock API for screen staying on during pooja

## License

MIT

---

**निर्माता**: VivSa (Vivek Bhaskar Sathe)  
**संस्था**: Self-Serve Pooja Foundation  
🙏 जय जय रघुवीर समर्थ 🙏
