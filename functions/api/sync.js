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
    const { code, sectionIdx, stepIdx, panchangData, hostData, updatedAt, status, mediaTarget, volume } = body;

    if (!code || sectionIdx === undefined || stepIdx === undefined) {
      return new Response(JSON.stringify({ error: 'अपुरी माहिती' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Out-of-order writes टाळण्यासाठी — जुनी (stale) request नवीन स्थिती overwrite करणार नाही
    const existingRaw = await env.PUJA_SYNC.get(`puja:${code}`);
    let existing = null;
    if (existingRaw) {
      existing = JSON.parse(existingRaw);
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
      status: status || 'performing',
      // ऑडिओ/व्हिडिओ कुठे वाजवायचे (नियंत्रक/दर्शक) व आवाजाची पातळी — न पाठवल्यास आधीचीच स्थिती कायम राहते
      mediaTarget: mediaTarget !== undefined ? mediaTarget : (existing?.mediaTarget || 'controller'),
      volume: volume !== undefined ? volume : (existing?.volume !== undefined ? existing.volume : 1),
    });

    // 12 तासांनी आपोआप expire होईल (एक पूजा सत्रासाठी पुरेसे, दुसऱ्या दिवशीच्या उत्तरपूजेसाठीही)
    await env.PUJA_SYNC.put(`puja:${code}`, payload, { expirationTtl: 43200 });

    // कायमस्वरूपी पूजा-यादीत (D1) प्रगती/स्थिती प्रतिबिंबित करणे — best-effort, अपयश आले तरी सिंक थांबू नये
    if (env.POOJAS_DB) {
      try {
        await env.POOJAS_DB.prepare(
          `UPDATE poojas SET status=?, section_idx=?, step_idx=?, media_target=?, volume=?, updated_at=? WHERE code=?`
        )
          .bind(status || 'performing', sectionIdx, stepIdx, mediaTarget || 'controller', volume !== undefined ? volume : 1, Date.now(), code)
          .run();
      } catch (d1Err) {
        // D1 अद्ययावत करता आले नाही तरी दर्शक-सिंक न अडखळता चालू राहावी
      }
    }

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
