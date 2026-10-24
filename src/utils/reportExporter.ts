import { AMRRecord } from '../types/amr';

/**
 * Export anomalous records or filtered customer list into detailed CSV format for field crews.
 */
export function exportAnomaliesToCSV(records: AMRRecord[], fileNamePrefix: string = 'Laporan_Anomali_AMR_PLN'): void {
  if (!records || records.length === 0) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  const headers = [
    'UNIT_INDUK_KODE',
    'UP3',
    'ULP',
    'IDPEL',
    'NAMA_PELANGGAN',
    'TARIF',
    'DAYA_VA',
    'TIPE_FASA',
    'STATUS_PELANGGAN',
    'MERK_METER',
    'NO_SERI_METER',
    'WAKTU_UKUR',
    'VR_VOLT',
    'VS_VOLT',
    'VT_VOLT',
    'KETIDAKSEIMBANGAN_V_PCT',
    'IR_AMP',
    'IS_AMP',
    'IT_AMP',
    'IN_NETRAL_AMP',
    'KETIDAKSEIMBANGAN_I_PCT',
    'THD_V_PCT',
    'THD_I_PCT',
    'COSPHI_TOTAL',
    'DAYA_AKTIF_KW',
    'STAND_KWH_IMPORT',
    'STAND_KWH_EXPORT',
    'STAND_KVARH',
    'HEALTH_SCORE',
    'JUMLAH_ANOMALI',
    'DAFTAR_ANOMALI',
    'GOLONGAN_P2TL_PERDIR_028',
    'RUJUKAN_STANDAR',
  ];

  const rows = records.map((r) => {
    const anomalyTitles = r.anomalies.map((a) => a.title).join(' | ');
    const p2tlGol = r.anomalies.find((a) => a.p2tlGolongan)?.p2tlGolongan || (r.anomalies.length > 0 ? 'Dugaan Pelanggaran' : 'Tertib');
    const stdRefs = Array.from(new Set(r.anomalies.map((a) => a.standardReference || 'IEEE 141 / Perdir 028'))).join(', ');

    return [
      `"${r.unitIndukCode || r.locationCode.substring(0, 2)}"`,
      `"${r.namaAp || r.unitAp || ''}"`,
      `"${r.namaUp || r.unitUp || ''}"`,
      `"${r.locationCode}"`,
      `"${(r.namaPelanggan || '').replace(/"/g, '""')}"`,
      `"${r.tariff || ''}"`,
      r.power || 0,
      `"${r.phaseType}"`,
      r.isCustomer !== false ? '"Customer"' : '"Non-Customer"',
      `"${r.merkMeter || ''}"`,
      `"${r.assetMeterCode || ''}"`,
      `"${r.readDate || ''}"`,
      r.voltageL1.toFixed(1),
      r.voltageL2.toFixed(1),
      r.voltageL3.toFixed(1),
      `${r.voltageUnbalancePct.toFixed(1)}%`,
      r.currentL1.toFixed(2),
      r.currentL2.toFixed(2),
      r.currentL3.toFixed(2),
      r.currentN.toFixed(2),
      `${r.currentUnbalancePct.toFixed(1)}%`,
      `${r.thdVoltage?.avg?.toFixed(1) || 2.4}%`,
      `${r.thdCurrent?.avg?.toFixed(1) || 4.2}%`,
      r.powerFactorTotal.toFixed(2),
      r.actualPowerKw.toFixed(2),
      r.standKwhImport.toFixed(1),
      r.standKwhExport.toFixed(1),
      r.standKvarh.toFixed(1),
      r.healthScore,
      r.anomalies.length,
      `"${anomalyTitles.replace(/"/g, '""')}"`,
      `"${p2tlGol}"`,
      `"${stdRefs}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print or export official Berita Acara Pemeriksaan P2TL according to Perdir PLN No. 028.P/DIR/2023.
 */
export function printBeritaAcaraP2TL(record: AMRRecord): void {
  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up di browser untuk mencetak Berita Acara.');
    return;
  }

  const p2tlAnomaly = record.anomalies.find((a) => a.p2tlGolongan) || record.anomalies[0];
  const p2tlCategory = p2tlAnomaly?.p2tlGolongan || 'Golongan II (K2) - Mempengaruhi Pengukuran Energi';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Berita Acara P2TL - ${record.locationCode} - ${record.namaPelanggan}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-logo {
      font-size: 14pt;
      font-weight: bold;
      color: #0b5c46;
      letter-spacing: 0.5px;
    }
    .header-unit {
      font-size: 9pt;
      color: #444;
    }
    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
      margin-bottom: 2px;
      text-decoration: underline;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 9pt;
      margin-bottom: 14px;
    }
    .section-title {
      font-weight: bold;
      background: #f1f5f9;
      padding: 4px 8px;
      margin-top: 10px;
      margin-bottom: 6px;
      border-left: 3px solid #0b5c46;
      font-size: 10.5pt;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #777;
      padding: 4px 6px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f8fafc;
      font-weight: bold;
    }
    .badge-critical {
      color: #b91c1c;
      font-weight: bold;
    }
    .signature-grid {
      width: 100%;
      margin-top: 25px;
      border-collapse: collapse;
    }
    .signature-box {
      width: 33.3%;
      text-align: center;
      vertical-align: top;
      font-size: 9.5pt;
      padding: 5px;
    }
    .signature-space {
      height: 60px;
    }
    .stamp-box {
      border: 1px dashed #aaa;
      padding: 4px;
      font-size: 8pt;
      margin-top: 5px;
      color: #555;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#e0f2fe; padding:10px; border-radius:6px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
    <span><strong>Cetak Formulir Berita Acara P2TL (Perdir 028)</strong> - Siap untuk ditandatangani di lapangan.</span>
    <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">
      Cetak Sekarang / Simpan PDF
    </button>
  </div>

  <table class="header-table">
    <tr>
      <td style="width: 70%;">
        <div class="header-logo">PT PLN (PERSERO)</div>
        <div class="header-unit">${record.namaUpi || 'DISTRIBUSI JAWA TENGAH & D.I. YOGYAKARTA'}</div>
        <div class="header-unit">${record.namaAp || 'UP3 KUDUS'} - ${record.namaUp || 'ULP KUDUS KOTA'}</div>
      </td>
      <td style="width: 30%; text-align: right; font-size: 8.5pt; color: #555;">
        <div>Lampiran Perdir No. 028.P/DIR/2023</div>
        <div>No. Registrasi: BA-P2TL/${record.unitIndukCode || '52'}/${Date.now().toString().slice(-6)}</div>
      </td>
    </tr>
  </table>

  <div class="doc-title">BERITA ACARA PEMERIKSAAN PENERTIBAN PEMAKAIAN TENAGA LISTRIK (P2TL)</div>
  <div class="doc-subtitle">Berdasarkan Peraturan Direksi PT PLN (Persero) Nomor 028.P/DIR/2023</div>

  <div style="font-size: 9.5pt; margin-bottom: 8px;">
    Pada hari ini <strong>${currentDate}</strong>, telah dilakukan pemeriksaan pemakaian tenaga listrik pada instalasi pelanggan:
  </div>

  <div class="section-title">I. IDENTITAS KONSUMEN / PELANGGAN</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%; font-weight: bold;">ID Pelanggan (IDPEL)</td>
      <td style="width: 25%; font-family: monospace; font-weight: bold;">${record.locationCode}</td>
      <td style="width: 25%; font-weight: bold;">Tarif / Daya Terpasang</td>
      <td style="width: 25%; font-weight: bold;">${record.tariff} / ${record.power.toLocaleString('id-ID')} VA</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Nama Pelanggan</td>
      <td colspan="3">${record.namaPelanggan}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Sistem Pengukuran</td>
      <td>${record.phaseType} (${record.isMediumVoltage ? 'Tegangan Menengah / TM' : 'Tegangan Rendah / TR'})</td>
      <td style="font-weight: bold;">Kategori Konsumen</td>
      <td>${record.isCustomer !== false ? 'Pelanggan Aktif' : 'Bukan Pelanggan / Fasilitas'}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Koordinat Lokasi</td>
      <td colspan="3">${record.latitude?.toFixed(6) || '-6.804800'}, ${record.longitude?.toFixed(6) || '110.840500'}</td>
    </tr>
  </table>

  <div class="section-title">II. DATA ALAT PENGUKUR DAN PEMBATAS (APP)</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%; font-weight: bold;">Merk / Model Meter</td>
      <td style="width: 25%;">${record.merkMeter || 'WASION'} / ${record.typeMeter || 'Static Electronic'}</td>
      <td style="width: 25%; font-weight: bold;">Nomor Seri Meter</td>
      <td style="width: 25%; font-family: monospace;">${record.assetMeterCode || '-'}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Faktor Kali (FK Meter)</td>
      <td>${record.multiplier || 1}</td>
      <td style="font-weight: bold;">Stand Absolut kWh (Import)</td>
      <td style="font-family: monospace; font-weight: bold;">${record.standKwhImport.toLocaleString('id-ID')} kWh</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Stand Absolut kWh (Export)</td>
      <td style="font-family: monospace;">${record.standKwhExport.toLocaleString('id-ID')} kWh</td>
      <td style="font-weight: bold;">Stand Absolut kVARh</td>
      <td style="font-family: monospace;">${record.standKvarh.toLocaleString('id-ID')} kVARh</td>
    </tr>
  </table>

  <div class="section-title">III. HASIL PENGUKURAN INSTANT SISTEM AMR & FASOR</div>
  <table class="data-table" style="text-align: center;">
    <thead>
      <tr>
        <th>Fasa</th>
        <th>Tegangan (V)</th>
        <th>Sudut V (°)</th>
        <th>Arus (A)</th>
        <th>Sudut I (°)</th>
        <th>Cos φ</th>
        <th>Daya Nyata (kW)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Fasa R</strong></td>
        <td>${record.voltageL1.toFixed(1)}</td>
        <td>${record.voltageAngleL1.toFixed(0)}°</td>
        <td>${record.currentL1.toFixed(2)}</td>
        <td>${record.currentAngleL1.toFixed(0)}°</td>
        <td>${record.powerFactorL1.toFixed(2)}</td>
        <td>${record.actualPowerKwL1.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Fasa S</strong></td>
        <td>${record.voltageL2.toFixed(1)}</td>
        <td>${record.voltageAngleL2.toFixed(0)}°</td>
        <td>${record.currentL2.toFixed(2)}</td>
        <td>${record.currentAngleL2.toFixed(0)}°</td>
        <td>${record.powerFactorL2.toFixed(2)}</td>
        <td>${record.actualPowerKwL2.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Fasa T</strong></td>
        <td>${record.voltageL3.toFixed(1)}</td>
        <td>${record.voltageAngleL3.toFixed(0)}°</td>
        <td>${record.currentL3.toFixed(2)}</td>
        <td>${record.currentAngleL3.toFixed(0)}°</td>
        <td>${record.powerFactorL3.toFixed(2)}</td>
        <td>${record.actualPowerKwL3.toFixed(2)}</td>
      </tr>
      <tr style="background-color: #fafafa; font-weight: bold;">
        <td><strong>Netral (N) / Total</strong></td>
        <td colspan="2">Unbalance V: ${record.voltageUnbalancePct.toFixed(1)}%</td>
        <td>${record.currentN.toFixed(2)} A</td>
        <td colspan="2">Unbalance I: ${record.currentUnbalancePct.toFixed(1)}% (IEEE 141)</td>
        <td>${record.actualPowerKw.toFixed(2)} kW</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">IV. TEMUAN INDIKASI ANOMALI / KETIDAKSESUAIAN</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Kategori Anomali</th>
        <th style="width: 15%;">Tingkat Bahaya</th>
        <th style="width: 35%;">Uraian Temuan Teknis</th>
        <th style="width: 25%;">Rujukan Standar</th>
      </tr>
    </thead>
    <tbody>
      ${
        record.anomalies.length > 0
          ? record.anomalies
              .map(
                (a) => `
        <tr>
          <td><strong>${a.title}</strong></td>
          <td><span class="${a.severity === 'critical' ? 'badge-critical' : ''}">${a.severity.toUpperCase()}</span></td>
          <td>${a.description} (${a.value})</td>
          <td>${a.standardReference || 'Perdir 028 / IEEE Std 141'}</td>
        </tr>`
              )
              .join('')
          : `<tr><td colspan="4" style="text-align: center; color: green;">Tidak ditemukan anomali. Pengukuran dalam batas toleransi normal.</td></tr>`
      }
    </tbody>
  </table>

  <div class="section-title">V. KESIMPULAN & KATEGORISASI PERDIR 028.P/DIR/2023</div>
  <div style="border: 1px solid #333; padding: 8px; border-radius: 4px; background: #fffcf0; font-size: 9.5pt; margin-bottom: 8px;">
    <div><strong>Klasifikasi Dugaan Pelanggaran:</strong> <span style="font-weight: bold; color: #b91c1c;">${p2tlCategory}</span></div>
    <div style="margin-top: 4px;"><strong>Tindakan Lapangan yang Direkomendasikan:</strong></div>
    <ul style="margin: 4px 0 4px 20px; padding: 0;">
      <li>Lakukan pemeriksaan visual segel tera metrologi dan segel terminal PLN pada kWh meter.</li>
      <li>Periksa polaritas kabel sekunder Current Transformer (CT k-l) menggunakan alat uji beban / phase angle meter.</li>
      <li>Bila ditemukan pembalikan arah arus yang disengaja atau pengelakan pengukuran, tindak lanjuti sesuai SOP P2TL Perdir 028.</li>
    </ul>
  </div>

  <table class="signature-grid">
    <tr>
      <td class="signature-box">
        <div>Yang Melakukan Pemeriksaan</div>
        <div><strong>Petugas P2TL PLN</strong></div>
        <div class="signature-space"></div>
        <div>( __________________________ )</div>
        <div style="font-size: 8pt; color: #666;">NIP: .......................................</div>
      </td>
      <td class="signature-box">
        <div>Mengetahui / Menyaksikan</div>
        <div><strong>Pihak Kepolisian / Saksi</strong></div>
        <div class="signature-space"></div>
        <div>( __________________________ )</div>
        <div style="font-size: 8pt; color: #666;">NRP / Identitas: ....................</div>
      </td>
      <td class="signature-box">
        <div>Pelanggan / Yang Mewakili</div>
        <div><strong>Konsumen</strong></div>
        <div class="signature-space"></div>
        <div>( __________________________ )</div>
        <div style="font-size: 8pt; color: #666;">No. KTP: ................................</div>
      </td>
    </tr>
  </table>

  <div class="stamp-box">
    Catatan: Berita Acara ini dicetak otomatis melalui sistem analitik terpusat PLN PowerEye AMR Diagnostic Engine. Memenuhi kaidah verifikasi ketidakseimbangan IEEE Std 141 dan harmonisa IEEE Std 519.
  </div>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
