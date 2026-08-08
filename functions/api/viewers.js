// functions/api/viewers.js
// एकाच पूजा-कोडला जोडलेल्या अनेक दर्शकांची यादी.
// प्रत्येक दर्शक स्वतःचे नाव + heartbeat (दर काही सेकंदांनी) नोंदवतो.
// नियंत्रक ही यादी वाचून "किती दर्शक जोडलेले आहेत" दाखवू शकतो.
// GET  /api/viewers?code=1234           → सध्या सक्रिय दर्शकांची यादी
// POST /api/viewers  {code, viewerId, name} → स्वतःची उपस्थिती नोंदवा (heartbeat)

const ACTIVE_WINDOW_MS = 15000; // १५ सेकंदात heartbeat न आल्यास दर्शक "गेला" असे मानले जाईल

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'कोड आवश्यक आहे' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await env.PUJA_SYNC.get(`viewers:${code}`);
    if (!data) {
      return new Response(JSON.stringify({ viewers: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const viewers = JSON.parse(data);
    const now = Date.now();
    const active = Object.values(viewers).filter((v) => now - v.lastSeen < ACTIVE_WINDOW_MS);
    return new Response(JSON.stringify({ viewers: active }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'वाचता आले नाही' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, viewerId, name } = body;

    if (!code || !viewerId || !name) {
      return new Response(JSON.stringify({ error: 'अपुरी माहिती' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingRaw = await env.PUJA_SYNC.get(`viewers:${code}`);
    const viewers = existingRaw ? JSON.parse(existingRaw) : {};
    viewers[viewerId] = { viewerId, name, lastSeen: Date.now() };

    await env.PUJA_SYNC.put(`viewers:${code}`, JSON.stringify(viewers), { expirationTtl: 43200 });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'लिहिता आले नाही' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
