# Self-Serve Pooja — पूजेसाठी / पूजासाथी

एक multi-lingual PWA जो कुटुंबांना स्वतः श्री सत्यनारायण पूजा सरलतेने, निर्दोषपणे आणि
भक्तिभावाने करता यावी यासाठी बनवले आहे. **सद्य स्थिती: "पूजेसाठी तयार"** — पूर्ण मंत्र,
सोपे मराठी अर्थ आणि पाच अध्यायांची कथा एकत्र करून एक प्रत्यक्ष पूजा यशस्वीरीत्या पार
पडली आहे.

## भाषा समर्थन

- **मराठी**: पूजेसाठी.app
- **हिंदी**: पूजासाथी.app
- **English**: self-serve-pooja.app

## वैशिष्ट्ये

- ✅ **पूजा-कोड प्रवेश-प्रवाह** — ४ अंकी कोडने नियंत्रक/दर्शक दोघेही एका पूजेत सामील होतात
- ✅ **Two-Device Architecture** — नियंत्रक (Controller, minimalist) + दर्शक (Audience Display, rich) — Cloudflare Pages Functions (`/api/sync`, `/api/viewers`) मार्फत sync
- ✅ **अनेक दर्शक + उपस्थिती-यादी** — नियंत्रकाला कोण-कोण दर्शक-मोडमध्ये जोडलेले आहे ते दिसते (heartbeat-आधारित उपस्थिती, दर ३ सेकंदांनी अद्ययावत)
- ✅ **जलद Sync** — दर्शक-मोड दर १ सेकंदाला सध्याची पायरी वाचतो
- ✅ **पंचांग फॉर्म** — dropdown-आधारित पंचांग निवड, संकल्प-वाक्याशी जुळणारी डीफॉल्ट मूल्ये
- ✅ **यजमान-कुटुंब माहिती** — यजमान नाव, गोत्र, मुले, संकल्प — संकल्प-पूर्वावलोकन आधीच दाखवते
- ✅ **पूर्ण मंत्र + सोपे मराठी अर्थ + कथा** — १४१ पायऱ्या, १२७ मंत्र, पाच अध्यायांची सत्यनारायण कथा
- ✅ **Video स्रोत निवड (R2/YouTube)** — विष्णुसहस्रनाम ८व्या सेकंदापासून सुरू
- ✅ **Guide Mode** — पायरी-दर-पायरी मार्गदर्शन, ऑडिओसह
- ✅ **Offline-First** — सर्व MP3 files cache होतात
- ✅ **मोबाईल-फर्स्ट** — dvh वापरून 100vh बग दुरुस्त, touch-scroll समस्या दुरुस्त, portrait मध्ये नैसर्गिक page-scroll (sticky header/footer)
- ✅ **Devanagari First** — Noto Devanagari font
- ✅ **Design System** — शाई/सोनेरी/केशरी पॅलेट
- ✅ **Wake Lock API** — पूजेदरम्यान स्क्रीन चालू राहते
- ✅ **Fullscreen मोड** — पूजा सुरू झाल्यावर आपोआप

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

# Sync API स्थानिक चाचणी (Cloudflare Workers)
npm run sync:dev
```

## Project Structure

```
src/
├── App.jsx                     — मुख्य component, प्रवेश-प्रवाह व स्क्रीन राउटिंग
├── components/
│   ├── PreflightForm.jsx       — प्रवेश-तपासणी, कोड-प्रविष्टी, दिनांक/पंचांग/यजमान फॉर्म,
│   │                              संकल्प-पूर्वावलोकन
│   ├── PujaScreen.jsx          — नियंत्रक आणि दर्शक मोड, व्हिडिओ/ऑडिओ, कथा
│   └── AccordionNav.jsx        — पायऱ्यांमधून जलद नेव्हिगेशन (jump-to)
├── sankalpaBuilder.js          — पंचांग + यजमान-माहितीवरून संकल्प-वाक्य तयार करणे
├── panchangOptions.js          — पंचांग dropdown पर्याय
├── styles/
│   └── designSystem.js         — रंग आणि शैलीकरण
├── main.jsx                    — Entry point
└── index.css                   — वैश्विक CSS

functions/api/
├── sync.js                     — पूजा-कोड आधारित स्थिती sync (पायरी, पंचांग, यजमान-माहिती)
└── viewers.js                  — दर्शक उपस्थिती (heartbeat) व यादी

public/
├── puja.json                   — पूजा steps + मंत्र + अर्थ + कथा (Excel export)
└── sankalpa.json               — संकल्प template (Excel export)
```

## Audio Files

Audio base URL: `https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev`

सर्व MP3 files R2 bucket मध्ये hosted आहेत. व्हिडिओ स्रोत R2 किंवा YouTube यापैकी निवडता येतो.

## Development Notes

- React 18 + Vite
- Cloudflare Pages + Pages Functions (sync/viewers API), Cloudflare R2 (ऑडिओ/व्हिडिओ)
- Noto Devanagari font
- No external UI framework (pure CSS)
- Mobile-first responsive design
- Wake lock API for screen staying on during pooja

## पुढील दिशा

प्रकल्पाचे तत्त्वज्ञान, समुदाय-केंद्रित रोडमॅप (सिद्धता-यादी, WhatsApp आमंत्रण, RSVP,
दर्शन-पान, मंदिर-जोडणी धोरण, इ.) आणि टप्पानिहाय योजना [`CLAUDE.md`](./CLAUDE.md) मध्ये
नोंदवली आहे.

## License

MIT

---

**निर्माता**: VivSa (Vivek Bhaskar Sathe)
**संस्था**: Self-Serve Pooja Foundation
🙏 जय जय रघुवीर समर्थ 🙏
