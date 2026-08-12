// functions/api/admin/poojas.js
// GET  /api/admin/poojas  → या owner च्या सर्व पूजांची यादी (नवीन आधी)
// POST /api/admin/poojas  → नवीन पूजा शेड्यूल करा (रिकामी माहिती, status: scheduled)

import { rowToPooja, json, genCode } from './_lib.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  const owner = data.owner || 'default';

  try {
    const { results } = await env.POOJAS_DB.prepare(
      'SELECT * FROM poojas WHERE owner = ? ORDER BY updated_at DESC'
    )
      .bind(owner)
      .all();
    return json({ poojas: results.map(rowToPooja) });
  } catch (err) {
    return json({ error: 'यादी वाचता आली नाही' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data, request } = context;
  const owner = data.owner || 'default';

  try {
    let code = null;
    for (let i = 0; i < 10; i++) {
      const candidate = genCode();
      const existing = await env.POOJAS_DB.prepare('SELECT code FROM poojas WHERE code = ?').bind(candidate).first();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) return json({ error: 'नवीन कोड तयार करता आला नाही, पुन्हा प्रयत्न करा' }, 500);

    const body = await request.json().catch(() => ({}));
    const pujaDate = body.pujaDate || new Date().toISOString().split('T')[0];
    const now = Date.now();

    await env.POOJAS_DB.prepare(
      `INSERT INTO poojas (code, owner, status, puja_date, panchang_data, host_data, section_idx, step_idx, media_target, volume, created_at, updated_at)
       VALUES (?, ?, 'scheduled', ?, '{}', '{}', 0, 0, 'controller', 1, ?, ?)`
    )
      .bind(code, owner, pujaDate, now, now)
      .run();

    const row = await env.POOJAS_DB.prepare('SELECT * FROM poojas WHERE code = ?').bind(code).first();
    return json({ pooja: rowToPooja(row) });
  } catch (err) {
    return json({ error: 'नवीन पूजा तयार करता आली नाही' }, 500);
  }
}
