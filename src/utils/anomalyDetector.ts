import { AMRAnomaly, AMRRecord, P2TLGolongan } from '../types/amr';

export interface DetectionResult {
  anomalies: AMRAnomaly[];
  healthScore: number;
  isMediumVoltage: boolean;
  unbalanceVoltagePct: number;
  unbalanceCurrentPct: number;
}

export function detectAMRAnomalies(
  record: Omit<AMRRecord, 'anomalies' | 'healthScore' | 'isMediumVoltage' | 'voltageUnbalancePct' | 'currentUnbalancePct'>
): DetectionResult {
  const anomalies: AMRAnomaly[] = [];

  const v1 = record.voltageL1;
  const v2 = record.voltageL2;
  const v3 = record.voltageL3;
  const maxV = Math.max(v1, v2, v3);
  const avgV = (v1 + v2 + v3) / 3;

  // Deteksi Tegangan Menengah (TM melalui PT sekunder 57.7V / 100V) vs Tegangan Rendah (TR 230V)
  const isMediumVoltage = maxV > 20 && maxV < 140;
  const vNominal = isMediumVoltage ? 57.7 : 230.0;
  const vUnderThreshold = isMediumVoltage ? 50.0 : 198.0; // -10% batas SPLN / IEC 60038
  const vOverThreshold = isMediumVoltage ? 63.5 : 246.0;  // +6% s/d +10% batas SPLN

  // 1. Pengecekan Hilang Tegangan Fasa (Loss of Voltage)
  if (maxV > (isMediumVoltage ? 30 : 150)) {
    if (v1 < 15) {
      anomalies.push({
        id: `${record.id}-loss-v1`,
        category: 'voltage_loss',
        severity: 'critical',
        title: 'Hilang Tegangan Fasa R',
        description: `Tegangan Fasa R hanya ${v1.toFixed(1)} V (normal ~${vNominal} V). Indikasi fuse PT putus atau kabel terminal tegangan R lepas.`,
        affectedPhase: 'R',
        value: `${v1.toFixed(1)} V`,
        recommendation: 'Periksa fuse pengaman tegangan PT fasa R dan koneksi terminal blok tegangan meter.',
        p2tlGolongan: 'Golongan II (K2)',
        standardReference: 'Perdir 028 / IEC 62053-22',
      });
    }
    if (record.phaseType === '3-Phase') {
      if (v2 < 15) {
        anomalies.push({
          id: `${record.id}-loss-v2`,
          category: 'voltage_loss',
          severity: 'critical',
          title: 'Hilang Tegangan Fasa S',
          description: `Tegangan Fasa S hanya ${v2.toFixed(1)} V (normal ~${vNominal} V). Indikasi fuse PT putus atau kabel terminal lepas.`,
          affectedPhase: 'S',
          value: `${v2.toFixed(1)} V`,
          recommendation: 'Periksa fuse pengaman tegangan PT fasa S dan pengawatan tegangan.',
          p2tlGolongan: 'Golongan II (K2)',
          standardReference: 'Perdir 028 / IEC 62053-22',
        });
      }
      if (v3 < 15) {
        anomalies.push({
          id: `${record.id}-loss-v3`,
          category: 'voltage_loss',
          severity: 'critical',
          title: 'Hilang Tegangan Fasa T',
          description: `Tegangan Fasa T hanya ${v3.toFixed(1)} V (normal ~${vNominal} V). Indikasi fuse PT putus atau kabel terminal lepas.`,
          affectedPhase: 'T',
          value: `${v3.toFixed(1)} V`,
          recommendation: 'Periksa fuse pengaman tegangan PT fasa T dan terminal blok.',
          p2tlGolongan: 'Golongan II (K2)',
          standardReference: 'Perdir 028 / IEC 62053-22',
        });
      }
    }
  }

  // 2. Under-voltage & Over-voltage
  if (avgV > 25) {
    const underPhases: string[] = [];
    const overPhases: string[] = [];
    if (v1 > 15 && v1 < vUnderThreshold) underPhases.push(`R (${v1.toFixed(1)}V)`);
    if (v2 > 15 && v2 < vUnderThreshold) underPhases.push(`S (${v2.toFixed(1)}V)`);
    if (v3 > 15 && v3 < vUnderThreshold) underPhases.push(`T (${v3.toFixed(1)}V)`);

    if (v1 > vOverThreshold) overPhases.push(`R (${v1.toFixed(1)}V)`);
    if (v2 > vOverThreshold) overPhases.push(`S (${v2.toFixed(1)}V)`);
    if (v3 > vOverThreshold) overPhases.push(`T (${v3.toFixed(1)}V)`);

    if (underPhases.length > 0) {
      anomalies.push({
        id: `${record.id}-undervoltage`,
        category: 'voltage_abnormal',
        severity: 'warning',
        title: 'Tegangan Turun (Under-Voltage)',
        description: `Tegangan di bawah batas standar SPLN (< ${vUnderThreshold} V): ${underPhases.join(', ')}.`,
        affectedPhase: 'All',
        value: underPhases.join(', '),
        recommendation: 'Koordinasi dengan tim Distribusi/Yantek untuk pengecekan drop tegangan jaringan atau trafo.',
        p2tlGolongan: 'Tertib (Normal)',
        standardReference: 'SPLN 1:1995 / ANSI C84.1 Range A',
      });
    }

    if (overPhases.length > 0) {
      anomalies.push({
        id: `${record.id}-overvoltage`,
        category: 'voltage_abnormal',
        severity: 'warning',
        title: 'Tegangan Berlebih (Over-Voltage)',
        description: `Tegangan melampaui batas atas (> ${vOverThreshold} V): ${overPhases.join(', ')}.`,
        affectedPhase: 'All',
        value: overPhases.join(', '),
        recommendation: 'Periksa tap changer transformator distribusi atau regulasi tegangan penyulang.',
        p2tlGolongan: 'Tertib (Normal)',
        standardReference: 'SPLN 1:1995 / ANSI C84.1',
      });
    }
  }

  // 3. Ketidakseimbangan Tegangan (Voltage Unbalance IEEE Std 141 & IEC 61000-4-30)
  let unbalanceVoltagePct = 0;
  if (record.phaseType === '3-Phase' && avgV > 30) {
    const maxDevV = Math.max(Math.abs(v1 - avgV), Math.abs(v2 - avgV), Math.abs(v3 - avgV));
    unbalanceVoltagePct = (maxDevV / avgV) * 100;
    if (unbalanceVoltagePct > 2.5 && anomalies.every((a) => a.category !== 'voltage_loss')) {
      anomalies.push({
        id: `${record.id}-v-unbalance`,
        category: 'voltage_unbalance',
        severity: unbalanceVoltagePct > 5.0 ? 'critical' : 'warning',
        title: `Tegangan Tidak Seimbang (${unbalanceVoltagePct.toFixed(1)}%)`,
        description: `Deviasi tegangan antar fasa sebesar ${unbalanceVoltagePct.toFixed(1)}% (Batas standar IEEE 141 / IEC 61000-4-30 maks 2.0-3.0%). V1=${v1.toFixed(1)}V, V2=${v2.toFixed(1)}V, V3=${v3.toFixed(1)}V.`,
        affectedPhase: 'All',
        value: `${unbalanceVoltagePct.toFixed(1)}%`,
        recommendation: 'Periksa pembebanan fasa pada trafo distribusi dan sambungan netral trafo.',
        p2tlGolongan: unbalanceVoltagePct > 5.0 ? 'Golongan II (K2)' : 'Tertib (Normal)',
        standardReference: 'IEEE Std 141 / IEC 61000-4-30',
      });
    }
  }

  // 4. Deteksi Wiring Terbalik / CT Terbalik (Polaritas K-L Terbalik) - Sesuai Perdir 028 Gol. II
  const i1 = record.currentL1;
  const i2 = record.currentL2;
  const i3 = record.currentL3;
  const p1 = record.activePowerL1;
  const p2 = record.activePowerL2;
  const p3 = record.activePowerL3;
  const pf1 = record.powerFactorL1;
  const pf2 = record.powerFactorL2;
  const pf3 = record.powerFactorL3;
  const pfTotal = record.powerFactorTotal;

  const revR = (p1 < -5 && i1 > 0.05) || (pf1 < -0.2 && i1 > 0.1);
  const revS = (p2 < -5 && i2 > 0.05) || (pf2 < -0.2 && i2 > 0.1);
  const revT = (p3 < -5 && i3 > 0.05) || (pf3 < -0.2 && i3 > 0.1);

  if (revR || revS || revT) {
    const revPhases: string[] = [];
    if (revR) revPhases.push(`Fasa R (P=${p1.toFixed(1)}W, I=${i1.toFixed(2)}A, Cosφ=${pf1.toFixed(2)})`);
    if (revS) revPhases.push(`Fasa S (P=${p2.toFixed(1)}W, I=${i2.toFixed(2)}A, Cosφ=${pf2.toFixed(2)})`);
    if (revT) revPhases.push(`Fasa T (P=${p3.toFixed(1)}W, I=${i3.toFixed(2)}A, Cosφ=${pf3.toFixed(2)})`);

    anomalies.push({
      id: `${record.id}-rev-wiring`,
      category: 'wiring_reverse',
      severity: 'critical',
      title: 'Wiring / CT Terbalik (Polaritas K-L Terbalik)',
      description: `Terdeteksi aliran daya aktif negatif pada ${revPhases.join(', ')}. Indikasi kabel sekunder CT terbalik atau disengaja untuk memperlambat putaran kWh meter.`,
      affectedPhase: revR && !revS && !revT ? 'R' : revS && !revR && !revT ? 'S' : revT && !revR && !revS ? 'T' : 'All',
      value: revPhases.length === 1 ? revPhases[0] : `${revPhases.length} Fasa Terbalik`,
      recommendation: 'Segera terbitkan Berita Acara (BA) pemeriksaan fisik kWh meter sesuai Perdir 028. Lakukan penukaran sambungan terminal K-L atau periksa indikasi pengelakan energi.',
      p2tlGolongan: 'Golongan II (K2)',
      standardReference: 'Perdir PLN 028 / IEC 62053-22',
    });
  }

  // 5. Anomali Cosphi (Power Factor)
  if (pfTotal < 0 && !anomalies.some((a) => a.category === 'wiring_reverse')) {
    anomalies.push({
      id: `${record.id}-pf-negative`,
      category: 'cosphi_negative',
      severity: 'critical',
      title: 'Faktor Daya Negatif (Cos φ < 0)',
      description: `Cos phi total bernilai negatif (${pfTotal.toFixed(3)}). Indikasi adanya daya aktif balik ke jaringan tanpa persetujuan net-metering PLTS.`,
      affectedPhase: 'All',
      value: pfTotal.toFixed(3),
      recommendation: 'Cek keberadaan instalasi PLTS atap tanpa izin resmi atau periksa polaritas pengukuran.',
      p2tlGolongan: 'Golongan II (K2)',
      standardReference: 'Perdir PLN 028 / SPLN D3.022',
    });
  } else if (pfTotal > 0 && pfTotal < 0.85 && (i1 > 0.1 || i2 > 0.1 || i3 > 0.1)) {
    const isVeryLow = pfTotal < 0.60;
    anomalies.push({
      id: `${record.id}-pf-low`,
      category: 'cosphi_low',
      severity: isVeryLow ? 'critical' : 'warning',
      title: `Cos φ Rendah (${pfTotal.toFixed(3)}) - Potensi Denda kVARh`,
      description: `Faktor daya ${pfTotal.toFixed(3)} berada di bawah standar regulasi PLN (0.85). Pelanggan berpotensi terkena tagihan denda kVARh tinggi.`,
      affectedPhase: 'All',
      value: pfTotal.toFixed(3),
      recommendation: 'Sarankan pelanggan mengaktifkan atau menambah kapasitas Kapasitor Bank guna memperbaiki faktor daya.',
      p2tlGolongan: 'Tertib (Normal)',
      standardReference: 'Permen ESDM / SPLN D3.009',
    });
  }

  // 6. Anomali Arus (Current Loss)
  const maxI = Math.max(i1, i2, i3);
  const avgI = (i1 + i2 + i3) / 3;

  if (maxI > 1.0) {
    if (i1 < 0.05) {
      anomalies.push({
        id: `${record.id}-loss-i1`,
        category: 'current_loss',
        severity: 'critical',
        title: 'Hilang Arus Fasa R (IR = 0 A)',
        description: `Arus Fasa R nihil (${i1.toFixed(2)} A) padahal fasa lain berbeban. Indikasi CT fasa R putus atau dishunt / dijumper.`,
        affectedPhase: 'R',
        value: `${i1.toFixed(2)} A`,
        recommendation: 'Periksa pengawatan CT fasa R dan pastikan tidak terdapat jumper/shorting jumper liar.',
        p2tlGolongan: 'Golongan II (K2)',
        standardReference: 'Perdir PLN 028 / ANSI C12.1',
      });
    }
    if (record.phaseType === '3-Phase') {
      if (i2 < 0.05) {
        anomalies.push({
          id: `${record.id}-loss-i2`,
          category: 'current_loss',
          severity: 'critical',
          title: 'Hilang Arus Fasa S (IS = 0 A)',
          description: `Arus Fasa S nihil (${i2.toFixed(2)} A) padahal fasa lain berbeban. Indikasi CT dishunt atau putus.`,
          affectedPhase: 'S',
          value: `${i2.toFixed(2)} A`,
          recommendation: 'Cek pengawatan CT fasa S dan terminal blok meter.',
          p2tlGolongan: 'Golongan II (K2)',
          standardReference: 'Perdir PLN 028 / ANSI C12.1',
        });
      }
      if (i3 < 0.05) {
        anomalies.push({
          id: `${record.id}-loss-i3`,
          category: 'current_loss',
          severity: 'critical',
          title: 'Hilang Arus Fasa T (IT = 0 A)',
          description: `Arus Fasa T nihil (${i3.toFixed(2)} A) padahal fasa lain berbeban. Indikasi CT dishunt atau putus.`,
          affectedPhase: 'T',
          value: `${i3.toFixed(2)} A`,
          recommendation: 'Cek pengawatan CT fasa T dan terminal blok meter.',
          p2tlGolongan: 'Golongan II (K2)',
          standardReference: 'Perdir PLN 028 / ANSI C12.1',
        });
      }
    }
  }

  // 7. Analisis Keseimbangan Beban Antar Fasa (Current Unbalance IEEE Std 141)
  let unbalanceCurrentPct = 0;
  if (record.phaseType === '3-Phase' && avgI > 0.5 && anomalies.every((a) => a.category !== 'current_loss')) {
    const maxDevI = Math.max(Math.abs(i1 - avgI), Math.abs(i2 - avgI), Math.abs(i3 - avgI));
    unbalanceCurrentPct = (maxDevI / avgI) * 100;

    // Batas Toleransi IEEE Std 141:
    // <= 10%: Normal
    // > 10% s/d 20%: Warning (Ketidakseimbangan Sedang)
    // > 20%: Critical (Melebihi Batas Toleransi IEEE Std 141 - Potensi Overheat Netral & Drop Tegangan)
    if (unbalanceCurrentPct > 20.0) {
      anomalies.push({
        id: `${record.id}-i-unbalance-crit`,
        category: 'current_unbalance',
        severity: 'critical',
        title: `Arus Tidak Seimbang Kritis (${unbalanceCurrentPct.toFixed(1)}% > 20% IEEE)`,
        description: `Ketidakseimbangan beban arus antar fasa sebesar ${unbalanceCurrentPct.toFixed(1)}% melebihi batas toleransi IEEE Std 141 (maks 20%). IR=${i1.toFixed(2)}A, IS=${i2.toFixed(2)}A, IT=${i3.toFixed(2)}A.`,
        affectedPhase: 'All',
        value: `${unbalanceCurrentPct.toFixed(1)}%`,
        recommendation: 'Segera lakukan penyeimbangan beban fasa (phase balancing) dan periksa isolasi konduktor serta suhu penghantar netral.',
        p2tlGolongan: unbalanceCurrentPct > 50 ? 'Golongan I (K1)' : 'Tertib (Normal)',
        standardReference: 'IEEE Std 141-1993 Section 3.7',
      });
    } else if (unbalanceCurrentPct > 10.0) {
      anomalies.push({
        id: `${record.id}-i-unbalance-warn`,
        category: 'current_unbalance',
        severity: 'warning',
        title: `Arus Tidak Seimbang (${unbalanceCurrentPct.toFixed(1)}% IEEE 141)`,
        description: `Beban fasa tidak seimbang ${unbalanceCurrentPct.toFixed(1)}% (Rekomendasi IEEE Std 141 di bawah 10%). Beban fasa tidak merata.`,
        affectedPhase: 'All',
        value: `${unbalanceCurrentPct.toFixed(1)}%`,
        recommendation: 'Jadwalkan redistribusi beban pelanggan 1-phase pada sirkit saluran distribusi sekunder.',
        p2tlGolongan: 'Tertib (Normal)',
        standardReference: 'IEEE Std 141 / SPLN 56-1',
      });
    }
  }

  // 8. Arus Netral Tinggi (High Neutral Current)
  const inVal = record.currentN || 0;
  if (record.phaseType === '3-Phase' && inVal > 0 && maxI > 1.0) {
    if (inVal > maxI * 0.70) {
      anomalies.push({
        id: `${record.id}-high-in`,
        category: 'neutral_high',
        severity: inVal > maxI ? 'critical' : 'warning',
        title: `Arus Netral Tinggi (IN = ${inVal.toFixed(2)} A)`,
        description: `Arus netral (${inVal.toFixed(2)} A) sangat tinggi mendekati atau melebihi arus fasa tertinggi (${maxI.toFixed(2)} A). Indikasi ketidakseimbangan beban tinggi atau distorsi harmonisa ke-3 (triplen harmonics).`,
        affectedPhase: 'N',
        value: `${inVal.toFixed(2)} A`,
        recommendation: 'Cek arus netral pada transformator dan periksa keberadaan beban non-linier tinggi.',
        p2tlGolongan: 'Tertib (Normal)',
        standardReference: 'IEEE Std 519 / IEEE Std 141',
      });
    }
  }

  // 9. Analisis Kualitas Daya / Harmonisa (THD IEEE 519)
  const thdV = record.thdVoltage?.avg || 0;
  const thdI = record.thdCurrent?.avg || 0;
  if (thdV > 5.0) {
    anomalies.push({
      id: `${record.id}-thd-v-high`,
      category: 'harmonic_high',
      severity: thdV > 8.0 ? 'critical' : 'warning',
      title: `Distorsi Harmonisa Tegangan Tinggi (THD-V: ${thdV.toFixed(1)}%)`,
      description: `Total Harmonic Distortion Tegangan sebesar ${thdV.toFixed(1)}% melampaui batas standar IEEE Std 519 (maksimum 5.0% untuk sistem $\le$ 1 kV). Kualitas daya buruk.`,
      affectedPhase: 'All',
      value: `THD-V ${thdV.toFixed(1)}%`,
      recommendation: 'Pasang harmonic filter atau evaluasi beban VFD/inverter pelanggan.',
      p2tlGolongan: 'Tertib (Normal)',
      standardReference: 'IEEE Std 519-2022 Table 1',
    });
  }

  if (thdI > 15.0 && avgI > 2.0) {
    anomalies.push({
      id: `${record.id}-thd-i-high`,
      category: 'harmonic_high',
      severity: thdI > 25.0 ? 'critical' : 'warning',
      title: `Distorsi Harmonisa Arus Tinggi (THD-I: ${thdI.toFixed(1)}%)`,
      description: `Total Harmonic Distortion Arus ${thdI.toFixed(1)}% melampaui batas aman IEEE Std 519 (maks 15%). Menimbulkan panas berlebih pada transformator dan kabel netral.`,
      affectedPhase: 'All',
      value: `THD-I ${thdI.toFixed(1)}%`,
      recommendation: 'Rekomendasikan pemasangan passive tuned filter atau active harmonic conditioner.',
      p2tlGolongan: 'Tertib (Normal)',
      standardReference: 'IEEE Std 519-2022 Table 2',
    });
  }

  // 10. Non-Customer P2TL Golongan IV (K4) Check
  if (record.isCustomer === false && (avgI > 0.5 || maxV > 50)) {
    anomalies.push({
      id: `${record.id}-k4-noncust`,
      category: 'p2tl_violation',
      severity: 'critical',
      title: 'Pemakaian Tenaga Listrik Non-Pelanggan (Golongan IV / K4)',
      description: `Tercatat konsumsi energi pada titik instalasi yang terdaftar sebagai Bukan Pelanggan / Aset Lepas (${record.locationCode}).`,
      affectedPhase: 'All',
      value: `${record.actualPowerKw.toFixed(2)} kW`,
      recommendation: 'Segera lakukan penertiban lapangan bersama petugas P2TL dan Penyidik Pegawai Negeri Sipil (PPNS) / Polri.',
      p2tlGolongan: 'Golongan IV (K4)',
      standardReference: 'Perdir PLN 028 Pasal 5 Ayat (4)',
    });
  }

  // Hitung Health Score (0 - 100)
  let score = 100;
  for (const anom of anomalies) {
    if (anom.severity === 'critical') {
      score -= 30;
    } else if (anom.severity === 'warning') {
      score -= 10;
    } else {
      score -= 3;
    }
  }

  if (unbalanceCurrentPct > 20) score -= 15;
  if (unbalanceVoltagePct > 3) score -= 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    anomalies,
    healthScore: score,
    isMediumVoltage,
    unbalanceVoltagePct,
    unbalanceCurrentPct,
  };
}
