// functions/api/admin/_lib.js
// पूजा-यादी endpoints साठी समान मदत-कार्ये (हा फाईल route नाही — नावाआधी _ असल्याने Pages Functions ती वगळते)

export function rowToPooja(row) {
  return {
    code: row.code,
    status: row.status,
    pujaDate: row.puja_date,
    panchangData: JSON.parse(row.panchang_data || '{}'),
    hostData: JSON.parse(row.host_data || '{}'),
    sectionIdx: row.section_idx,
    stepIdx: row.step_idx,
    mediaTarget: row.media_target,
    volume: row.volume,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
