// functions/api/admin-login.js
// निर्देशकाचे Login — साधा शेअर्ड पासवर्ड तपासून सत्र-टोकन देतो.
// पासवर्ड env.OWNER_PASSWORD (Cloudflare Pages secret) मध्ये साठवलेला असतो, कोडमध्ये कुठेही नाही.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();

    if (!env.OWNER_PASSWORD) {
      return new Response(JSON.stringify({ error: 'सर्व्हरवर OWNER_PASSWORD सेट केलेला नाही' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password !== env.OWNER_PASSWORD) {
      return new Response(JSON.stringify({ error: 'चुकीचा पासवर्ड' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = crypto.randomUUID();
    // ३० दिवस — पुन्हा पुन्हा लॉगिन करावं लागू नये म्हणून
    await env.PUJA_SYNC.put(`session:${token}`, JSON.stringify({ owner: 'default', createdAt: Date.now() }), {
      expirationTtl: 2592000,
    });

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'लॉगिन अयशस्वी' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
