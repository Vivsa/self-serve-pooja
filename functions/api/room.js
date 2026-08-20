// functions/api/room.js
// नियंत्रक व दर्शक यांची WebSocket जोडणी येथून थेट PujaRoom Durable Object कडे पाठवली जाते.
// GET /api/room?code=1234&role=controller
// GET /api/room?code=1234&role=audience&viewerId=xxx&name=यजमान
//
// PUJA_ROOM हे binding Cloudflare Pages dashboard वर (Settings → Bindings → Add →
// Durable Object) जोडलेले असणे आवश्यक आहे — worker/README.md मध्ये सविस्तर पायऱ्या आहेत.

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

  if (!env.PUJA_ROOM) {
    return new Response(JSON.stringify({ error: 'PUJA_ROOM binding सेट केलेले नाही' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = env.PUJA_ROOM.idFromName(code);
  const stub = env.PUJA_ROOM.get(id);
  return stub.fetch(request);
}
