# PujaRoom Durable Object — तैनाती (deployment) पायऱ्या

हा एक स्वतंत्र, छोटा Worker आहे (Pages पासून वेगळा — Cloudflare वर Durable Object Pages
प्रकल्पाच्या आत तयार करता येत नाही, तो नेहमी वेगळा Worker म्हणूनच deploy करावा लागतो).
यात `PujaRoom` नावाचा Durable Object आहे — प्रत्येक पूजा-कोडसाठी एक स्वतंत्र instance,
जो नियंत्रक व सर्व दर्शक यांना WebSocket ने जोडतो आणि पायरी बदलताच सर्वांना तात्काळ कळवतो.

**खर्च नाही** — Durable Objects (SQLite-backed) Cloudflare च्या मोफत Workers योजनेतच
समाविष्ट आहेत (Apr 2025 पासून), वेगळी Paid योजना घ्यावी लागत नाही.

## एकदाच करायच्या पायऱ्या

### १. D1 database id भरा

`worker/wrangler.toml` उघडा, तळाशी:

```toml
[[d1_databases]]
binding = "POOJAS_DB"
database_name = "REPLACE_WITH_YOUR_D1_DATABASE_NAME"
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

हे तेच D1 database आहे जे आधीच मुख्य Pages प्रकल्पाला (`functions/api/admin/*`) जोडलेले
आहे. नाव/id Cloudflare dashboard → **Workers & Pages** → **D1** मध्ये सापडेल —
तिथून कॉपी करून वरील दोन्ही जागी भरा (नाव आणि id दोन्ही, database_name फक्त वाचनीयतेसाठी).

### २. Worker deploy करा

रेपोच्या मूळ फोल्डरमधून:

```bash
npm run sync:deploy
```

(हे `wrangler deploy --config worker/wrangler.toml` चालवते — पहिल्यांदा चालवाल तेव्हा
`wrangler login` मागेल, ब्राउझरमध्ये Cloudflare खाते निवडा.)

यशस्वी झाल्यावर टर्मिनलवर Worker चे नाव दिसेल: **`self-serve-pooja-sync`**
(हेच नाव पुढच्या पायरीत लागेल).

### ३. Pages प्रकल्पाला Durable Object शी जोडा (एकदाच, dashboard वरून)

Cloudflare dashboard → **Workers & Pages** → तुमचा Pages प्रकल्प (self-serve-pooja) →
**Settings** → **Bindings** → **Add** → **Durable Object**:

- **Variable name**: `PUJA_ROOM`
- **Durable Object namespace**: वरच्या पायरीत deploy झालेला `self-serve-pooja-sync` Worker
  आणि त्यातला `PujaRoom` class निवडा

सेव्ह करून प्रकल्प पुन्हा deploy करा (नवीन commit push केला की आपोआप होईल, किंवा dashboard
वरून "Retry deployment").

## त्यानंतर

पुढच्या प्रत्येक बदलासाठी:
- **App/Pages कोड बदलला** (`src/`, `functions/`) → नेहमीप्रमाणे `npm run deploy`
- **PujaRoom (worker/puja-room.js) बदलला** → `npm run sync:deploy`

दोन्ही स्वतंत्र आहेत, एकमेकांवर अवलंबून नाहीत (binding एकदा जोडल्यावर कायम राहते).

## स्थानिक चाचणी (ऐच्छिक)

```bash
# टर्मिनल १ — DO worker
npm run sync:dev

# टर्मिनल २ — Pages (--do फ्लॅगने स्थानिक DO ला जोडून)
npx wrangler pages dev dist --do PUJA_ROOM=PujaRoom@self-serve-pooja-sync
```
