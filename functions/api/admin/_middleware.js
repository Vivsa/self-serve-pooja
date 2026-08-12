// functions/api/admin/_middleware.js
// /api/admin/* खालील सर्व मार्गांसाठी — वैध सत्र-टोकन (Authorization: Bearer <token>) असल्याशिवाय पुढे जाऊ देत नाही.
// /api/admin-login (हा मार्ग /api/admin/ बाहेर आहे) यातून सूट आहे — तिथूनच टोकन मिळतो.

export async function onRequest(context) {
  const { request, env, next, data } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return new Response(JSON.stringify({ error: 'लॉगिन आवश्यक' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionRaw = await env.PUJA_SYNC.get(`session:${token}`);
  if (!sessionRaw) {
    return new Response(JSON.stringify({ error: 'सत्र संपले — पुन्हा लॉगिन करा' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  data.owner = JSON.parse(sessionRaw).owner || 'default';

  // टेबल आधीच नसेल तर (उदा. स्थानिक wrangler dev चा रिकामा D1) आपोआप तयार करणे — विद्यमान टेबलवर काहीही परिणाम होत नाही
  if (env.POOJAS_DB) {
    await env.POOJAS_DB.exec(
      `CREATE TABLE IF NOT EXISTS poojas (code TEXT PRIMARY KEY, owner TEXT NOT NULL DEFAULT 'default', status TEXT NOT NULL DEFAULT 'scheduled', puja_date TEXT, panchang_data TEXT, host_data TEXT, section_idx INTEGER NOT NULL DEFAULT 0, step_idx INTEGER NOT NULL DEFAULT 0, media_target TEXT NOT NULL DEFAULT 'controller', volume REAL NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`
    );
  }

  return next();
}
