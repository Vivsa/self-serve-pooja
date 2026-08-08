// functions/api/sync.js
// नियंत्रक (Controller) आणि दर्शक (Audience) यांच्यातील संपूर्ण पूजा-स्थिती सिंक करण्यासाठी.
// GET  /api/sync?code=1234  → सध्याची संपूर्ण स्थिती वाचा (पायरी + पंचांग + यजमान माहिती)
// POST /api/sync            → नवीन स्थिती लिहा

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
    const data = await env.PUJA_SYNC.get(`puja:${code}`);
    if (!data) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(data, {
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
    const { code, sectionIdx, stepIdx, panchangData, hostData, updatedAt } = body;

    if (!code || sectionIdx === undefined || stepIdx === undefined) {
      return new Response(JSON.stringify({ error: 'अपुरी माहिती' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Out-of-order writes टाळण्यासाठी — जुनी (stale) request नवीन स्थिती overwrite करणार नाही
    const existingRaw = await env.PUJA_SYNC.get(`puja:${code}`);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw);
      if (existing.updatedAt && updatedAt && updatedAt < existing.updatedAt) {
        return new Response(existingRaw, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.stringify({
      found: true,
      sectionIdx,
      stepIdx,
      panchangData: panchangData || null,
      hostData: hostData || null,
      updatedAt: updatedAt || Date.now(),
    });

    // 12 तासांनी आपोआप expire होईल (एक पूजा सत्रासाठी पुरेसे, दुसऱ्या दिवशीच्या उत्तरपूजेसाठीही)
    await env.PUJA_SYNC.put(`puja:${code}`, payload, { expirationTtl: 43200 });

    return new Response(payload, {
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
