// functions/api/admin/poojas/[code].js
// GET   /api/admin/poojas/:code  → एका पूजेचा तपशील (Edit स्क्रीन भरण्यासाठी)
// PATCH /api/admin/poojas/:code  → माहिती/स्थिती अद्ययावत करा (Edit जतन करणे, सुरू करणे, समाप्त करणे)

import { rowToPooja, json } from '../_lib.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const row = await env.POOJAS_DB.prepare('SELECT * FROM poojas WHERE code = ?').bind(params.code).first();
  if (!row) return json({ error: 'ही पूजा सापडली नाही' }, 404);
  return json({ pooja: rowToPooja(row) });
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;

  try {
    const existing = await env.POOJAS_DB.prepare('SELECT * FROM poojas WHERE code = ?').bind(params.code).first();
    if (!existing) return json({ error: 'ही पूजा सापडली नाही' }, 404);

    const body = await request.json();

    const next = {
      status: body.status !== undefined ? body.status : existing.status,
      puja_date: body.pujaDate !== undefined ? body.pujaDate : existing.puja_date,
      panchang_data: body.panchangData !== undefined ? JSON.stringify(body.panchangData) : existing.panchang_data,
      host_data: body.hostData !== undefined ? JSON.stringify(body.hostData) : existing.host_data,
      section_idx: body.sectionIdx !== undefined ? body.sectionIdx : existing.section_idx,
      step_idx: body.stepIdx !== undefined ? body.stepIdx : existing.step_idx,
      media_target: body.mediaTarget !== undefined ? body.mediaTarget : existing.media_target,
      volume: body.volume !== undefined ? body.volume : existing.volume,
    };

    await env.POOJAS_DB.prepare(
      `UPDATE poojas SET status=?, puja_date=?, panchang_data=?, host_data=?, section_idx=?, step_idx=?, media_target=?, volume=?, updated_at=?
       WHERE code=?`
    )
      .bind(
        next.status,
        next.puja_date,
        next.panchang_data,
        next.host_data,
        next.section_idx,
        next.step_idx,
        next.media_target,
        next.volume,
        Date.now(),
        params.code
      )
      .run();

    const row = await env.POOJAS_DB.prepare('SELECT * FROM poojas WHERE code = ?').bind(params.code).first();
    return json({ pooja: rowToPooja(row) });
  } catch (err) {
    return json({ error: 'जतन करता आले नाही' }, 500);
  }
}
