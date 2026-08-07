// functions/api/sync.js
// नियंत्रक (Controller) आणि दर्शक (Audience) यांच्यातील सध्याची पायरी सिंक करण्यासाठी.
// GET  /api/sync?code=1234           → सध्याची स्थिती वाचा
// POST /api/sync  {code, sectionIdx, stepIdx} → नवीन स्थिती लिहा (फक्त नियंत्रक वापरतो)

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
    const { code, sectionIdx, stepIdx } = body;

    if (!code || sectionIdx === undefined || stepIdx === undefined) {
      return new Response(JSON.stringify({ error: 'अपुरी माहिती' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      found: true,
      sectionIdx,
      stepIdx,
      updatedAt: Date.now(),
    });

    // 6 तासांनी आपोआप expire होईल (एक पूजा सत्रासाठी पुरेसे)
    await env.PUJA_SYNC.put(`puja:${code}`, payload, { expirationTtl: 21600 });

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
