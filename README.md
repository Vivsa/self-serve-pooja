# Self-Serve Pooja — पूजेसाठी / पूजासाथी

एक multi-lingual PWA जो कुटुंबांना स्वतः श्री सत्यनारायण पूजा सरलतेने, निर्दोषपणे आणि
भक्तिभावाने करता यावी यासाठी बनवले आहे. **सद्य स्थिती: "पूजेसाठी तयार"** — पूर्ण मंत्र,
सोपे मराठी अर्थ आणि पाच अध्यायांची कथा एकत्र करून एक प्रत्यक्ष पूजा यशस्वीरीत्या पार
पडली आहे.

## भाषा समर्थन व लाईव्ह डोमेन

सद्य लाईव्ह डोमेन: **[puje-sathi.app](https://puje-sathi.app)** (+ Cloudflare चे स्वयंचलित
`self-serve-pooja.pages.dev`). मराठी/हिंदी/English साठी स्वतंत्र डोमेन (पूजेसाठी.app,
पूजासाथी.app, self-serve-pooja.app) पुढील टप्प्यात जोडायचे नियोजन आहे — तूर्तास एकाच
डोमेनवरून सेवा सुरू आहे.

## वैशिष्ट्ये

- ✅ **पूजा-कोड प्रवेश-प्रवाह** — ४ अंकी कोडने नियंत्रक/दर्शक दोघेही एका पूजेत सामील होतात
- ✅ **Two-Device Architecture** — नियंत्रक (Controller, minimalist) + दर्शक (Audience Display, rich) — `PujaRoom` Durable Object (`worker/`) शी WebSocket ने real-time sync, पायरी बदलताच तात्काळ push
- ✅ **अनेक दर्शक + उपस्थिती-यादी** — नियंत्रकाला कोण-कोण दर्शक-मोडमध्ये जोडलेले आहे ते तात्काळ दिसते (उघड्या WebSocket जोडणीवरूनच, वेगळे heartbeat-लेखन नाही)
- ✅ **निर्देशक Login + पूजा-यादी** — Google-सारखे शेअर्ड-पासवर्ड login, जुन्या/चालू पूजांची D1-आधारित यादी, कधीही "पुढे सुरू ठेवा"
- ✅ **दर्शक-मोड TV/desktop लेआउट** — landscape मोठ्या स्क्रीनवर डावीकडे चित्र(े) ८०% (अनेक असल्यास आडवे स्क्रोल) व उजवीकडे मंत्र/अर्थ/कथा २०% (स्वतंत्र उभे स्क्रोल)
- ✅ **पंचांग फॉर्म** — dropdown-आधारित पंचांग निवड, संकल्प-वाक्याशी जुळणारी डीफॉल्ट मूल्ये
- ✅ **यजमान-कुटुंब माहिती** — यजमान नाव, गोत्र, मुले, संकल्प — संकल्प-पूर्वावलोकन आधीच दाखवते
- ✅ **पूर्ण मंत्र + सोपे मराठी अर्थ + कथा + चित्रे** — १४१ पायऱ्या, १२७ मंत्र, पाच अध्यायांची सत्यनारायण कथा, बहुतेक पायऱ्यांना स्वतंत्र चित्र (टॅप-टू-झूम)
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

# PujaRoom Durable Object (live-sync) deploy — स्वतंत्र Worker, worker/README.md पहा
npm run sync:deploy

# PujaRoom स्थानिक चाचणी
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
├── room.js                     — नियंत्रक/दर्शक यांची WebSocket जोडणी PujaRoom Durable Object कडे पाठवणे
├── admin-login.js, admin/      — निर्देशक login (session token) व पूजा-यादी (D1: poojas table)

worker/
├── puja-room.js                — PujaRoom Durable Object — live-sync + server-push (स्वतंत्र Worker)
├── wrangler.toml                — त्याचे बंधन (bindings) व migrations
└── README.md                   — तैनातीच्या (deploy) पायऱ्या

public/
├── puja.json                   — पूजा steps + मंत्र + अर्थ + कथा + चित्र-फाइलनावे (Excel export)
└── sankalpa.json               — संकल्प template (Excel export)
```

## Audio Files

Audio base URL: `https://pub-ab818d5a685640d2a45fa39c4f0b2a85.r2.dev`

सर्व MP3 files R2 bucket मध्ये hosted आहेत. व्हिडिओ स्रोत R2 किंवा YouTube यापैकी निवडता येतो.

## Development Notes

- React 18 + Vite
- Cloudflare Pages + Pages Functions, Cloudflare Durable Object (live-sync, `worker/`),
  Cloudflare D1 (निर्देशक-यादी), Cloudflare R2 (ऑडिओ/व्हिडिओ)
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
