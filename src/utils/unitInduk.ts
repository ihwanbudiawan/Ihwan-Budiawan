export interface UnitIndukInfo {
  code: string; // 2 digit prefix, misal "52"
  shortName: string; // "UID Jateng & DIY"
  fullName: string; // "PT PLN (Persero) Unit Induk Distribusi Jawa Tengah & D.I. Yogyakarta"
  region: 'Jawa-Madura-Bali' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Maluku-Papua' | 'Nusa Tenggara';
  badgeColor: string; // Tailwind color class
}

export const PLN_UNIT_INDUK_MAP: Record<string, UnitIndukInfo> = {
  '52': {
    code: '52',
    shortName: 'UID Jateng & DIY',
    fullName: 'PT PLN (Persero) UID Jawa Tengah & D.I. Yogyakarta',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  '54': {
    code: '54',
    shortName: 'UID Jawa Barat',
    fullName: 'PT PLN (Persero) UID Jawa Barat',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  '53': {
    code: '53',
    shortName: 'UID Jawa Timur',
    fullName: 'PT PLN (Persero) UID Jawa Timur',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  '51': {
    code: '51',
    shortName: 'UID Jakarta Raya',
    fullName: 'PT PLN (Persero) UID Jakarta Raya (Disjaya)',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  '55': {
    code: '55',
    shortName: 'UID Banten',
    fullName: 'PT PLN (Persero) UID Banten',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  '56': {
    code: '56',
    shortName: 'UID Bali',
    fullName: 'PT PLN (Persero) UID Bali',
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  '11': {
    code: '11',
    shortName: 'UID Aceh',
    fullName: 'PT PLN (Persero) UID Aceh',
    region: 'Sumatera',
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  '12': {
    code: '12',
    shortName: 'UID Sumatera Utara',
    fullName: 'PT PLN (Persero) UID Sumatera Utara',
    region: 'Sumatera',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  '13': {
    code: '13',
    shortName: 'UID Sumatera Barat',
    fullName: 'PT PLN (Persero) UID Sumatera Barat',
    region: 'Sumatera',
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  '14': {
    code: '14',
    shortName: 'UID Riau & Kepri',
    fullName: 'PT PLN (Persero) UID Riau dan Kepulauan Riau',
    region: 'Sumatera',
    badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
  '16': {
    code: '16',
    shortName: 'UID S2JB',
    fullName: 'PT PLN (Persero) UID Sumatera Selatan, Jambi & Bengkulu',
    region: 'Sumatera',
    badgeColor: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  },
  '17': {
    code: '17',
    shortName: 'UID Lampung',
    fullName: 'PT PLN (Persero) UID Lampung',
    region: 'Sumatera',
    badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  },
  '31': {
    code: '31',
    shortName: 'UID Kalimantan Barat',
    fullName: 'PT PLN (Persero) UID Kalimantan Barat',
    region: 'Kalimantan',
    badgeColor: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
  },
  '32': {
    code: '32',
    shortName: 'UID Kalselteng',
    fullName: 'PT PLN (Persero) UID Kalimantan Selatan & Kalimantan Tengah',
    region: 'Kalimantan',
    badgeColor: 'bg-amber-600/15 text-amber-300 border-amber-600/30',
  },
  '33': {
    code: '33',
    shortName: 'UID Kaltimra',
    fullName: 'PT PLN (Persero) UID Kalimantan Timur & Kalimantan Utara',
    region: 'Kalimantan',
    badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  '41': {
    code: '41',
    shortName: 'UID Sulselrabar',
    fullName: 'PT PLN (Persero) UID Sulawesi Selatan, Tenggara & Barat',
    region: 'Sulawesi',
    badgeColor: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  },
  '42': {
    code: '42',
    shortName: 'UID Suluttenggo',
    fullName: 'PT PLN (Persero) UID Sulawesi Utara, Tengah & Gorontalo',
    region: 'Sulawesi',
    badgeColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  '61': {
    code: '61',
    shortName: 'UIW Maluku & Malut',
    fullName: 'PT PLN (Persero) UIW Maluku dan Maluku Utara',
    region: 'Maluku-Papua',
    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  '62': {
    code: '62',
    shortName: 'UIW Papua',
    fullName: 'PT PLN (Persero) UIW Papua dan Papua Barat',
    region: 'Maluku-Papua',
    badgeColor: 'bg-rose-600/15 text-rose-300 border-rose-600/30',
  },
  '57': {
    code: '57',
    shortName: 'UIW NTB',
    fullName: 'PT PLN (Persero) UIW Nusa Tenggara Barat',
    region: 'Nusa Tenggara',
    badgeColor: 'bg-teal-600/15 text-teal-300 border-teal-600/30',
  },
  '58': {
    code: '58',
    shortName: 'UIW NTT',
    fullName: 'PT PLN (Persero) UIW Nusa Tenggara Timur',
    region: 'Nusa Tenggara',
    badgeColor: 'bg-cyan-600/15 text-cyan-300 border-cyan-600/30',
  },
};

/**
 * Ekstraksi kode 2-digit awal Unit Induk dari IDPEL atau nama file
 */
export function extractUnitIndukCode(idpel: string, fileName?: string): string {
  // Cek dari IDPEL terlebih dahulu (e.g. 520010001001 -> '52')
  const cleanIdpel = (idpel || '').replace(/\D/g, '');
  if (cleanIdpel.length >= 2) {
    const prefix = cleanIdpel.substring(0, 2);
    if (PLN_UNIT_INDUK_MAP[prefix]) {
      return prefix;
    }
  }

  // Jika tidak ditemukan, cek dari nama file (e.g. "52_INSTANT_..." atau "54_LOAD_PROFILE_...")
  if (fileName) {
    const fileMatch = fileName.match(/^([0-9]{2})[_-]/);
    if (fileMatch && PLN_UNIT_INDUK_MAP[fileMatch[1]]) {
      return fileMatch[1];
    }
  }

  // Fallback default PLN UID Jateng & DIY jika berawalan 52 atau umum
  if (cleanIdpel.startsWith('52')) return '52';

  // Jika 2 digit sembarang angka
  if (cleanIdpel.length >= 2) {
    return cleanIdpel.substring(0, 2);
  }

  return '52'; // default unit induk
}

export function getUnitIndukInfo(codeOrIdpel: string, fileName?: string): UnitIndukInfo {
  const code = extractUnitIndukCode(codeOrIdpel, fileName);
  if (PLN_UNIT_INDUK_MAP[code]) {
    return PLN_UNIT_INDUK_MAP[code];
  }
  return {
    code,
    shortName: `UID ${code}`,
    fullName: `PT PLN (Persero) Unit Induk Kode ${code}`,
    region: 'Jawa-Madura-Bali',
    badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };
}

export function getAllUnitIndukList(): UnitIndukInfo[] {
  return Object.values(PLN_UNIT_INDUK_MAP);
}
