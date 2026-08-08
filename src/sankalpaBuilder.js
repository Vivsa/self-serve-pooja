// संकल्प template मध्ये सर्व placeholders भरून पूर्ण वाक्य तयार करते.
// sankalpa.json मधील template, fixedPrefix, fixedSuffix, hostClause, purposeClause वापरते.

function fillPlaceholders(template, values) {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, value ?? '');
  });
  return result;
}

export function buildSankalpaText(sankalpaData, panchangData, hostData) {
  if (!sankalpaData) return '';

  // स्थळ (sthala) साठी डिफॉल्ट मूल्ये वापरा
  const sthala = {};
  (sankalpaData.fields?.sthala || []).forEach((f) => {
    sthala[f.key] = f.default;
  });

  const hostClause = fillPlaceholders(sankalpaData.hostClause || '', {
    gotra: hostData.gotra,
    hostMaleName: hostData.hostMaleName,
    hostFemaleName: hostData.hostFemaleName,
  });

  const values = {
    fixedPrefix: sankalpaData.fixedPrefix,
    mahadvipa: sthala.mahadvipa,
    upadvipa: sthala.upadvipa,
    dvipa: sthala.dvipa,
    locality: sthala.locality,
    grama: sthala.grama,
    samvatsara: panchangData.samvatsara,
    ayana: panchangData.ayana,
    rutu: panchangData.rutu,
    masa: panchangData.masa,
    paksha: panchangData.paksha,
    tithi: panchangData.tithi,
    vara: panchangData.vara,
    nakshatra: panchangData.nakshatra,
    chandraRashi: panchangData.chandraRashi,
    suryaRashi: panchangData.suryaRashi,
    guruRashi: panchangData.guruRashi,
    fixedSuffix: sankalpaData.fixedSuffix,
    hostClause: hostClause,
    purposeClause: sankalpaData.purposeClause,
  };

  return fillPlaceholders(sankalpaData.template || '', values);
}
