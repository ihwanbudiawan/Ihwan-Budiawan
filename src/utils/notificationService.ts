import { AMRRecord, EmailDispatchRecord, UserProfile } from '../types/amr';

export type NotificationSoundType = 'chime' | 'radar' | 'bell' | 'electronic';

// Web Audio synthesizer for alert sound (no external mp3 files needed)
export function playAlertChime(
  severity: 'critical' | 'warning' | 'info' = 'critical',
  soundType: NotificationSoundType = 'chime'
) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (soundType === 'radar') {
      // Substation Radar sonar ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.52);
    } else if (soundType === 'bell') {
      // Industrial Substation Bell chime
      const freqs = [520, 1040, 1560];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.2 / (i + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.62);
      });
    } else if (soundType === 'electronic') {
      // High-tech digital dual pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Standard harmonic chime
      if (severity === 'critical') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain1.gain.setValueAtTime(0.25, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.16);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.18); // D6
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.41);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      }
    }
  } catch (e) {
    console.debug('Audio context not allowed or supported yet', e);
  }
}

export function generatePLNEmailBody(
  user: UserProfile,
  criticalRecords: AMRRecord[],
  unitName = 'UP3 KUDUS'
): { subject: string; htmlBody: string; textBody: string } {
  const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
  const count = criticalRecords.length;
  const reverseCount = criticalRecords.filter(r => r.anomalies.some(a => a.category === 'wiring_reverse')).length;

  const subject = `[URGENT PLN-AMR] Deteksi ${count} Anomali Kritis Meter (${reverseCount} Wiring/CT Terbalik) - ${unitName}`;

  const topRecords = criticalRecords.slice(0, 5);

  const textBody = `
NOTIFIKASI ANOMALI SISTEM AMR PLN - ${unitName}
==================================================
Penerima: ${user.name} (${user.email}) - Peran: ${user.role.toUpperCase()}
Waktu Deteksi: ${timestamp}
Jumlah Meter Bermasalah: ${count} Pelanggan

RINGKASAN TEMUAN:
- Wiring / CT Terbalik: ${reverseCount} kasus (Potensi Kerugian Pembacaan kWh)
- Tegangan Turun / Hilang Fasa: ${criticalRecords.filter(r => r.anomalies.some(a => a.category.startsWith('voltage'))).length} kasus
- Cosphi Buruk / Negatif: ${criticalRecords.filter(r => r.anomalies.some(a => a.category.startsWith('cosphi'))).length} kasus

DETAIL SAMPEL METER KRITIS:
${topRecords.map((r, i) => `
${i + 1}. ${r.namaPelanggan} (IDPEL: ${r.locationCode})
   Tarif/Daya: ${r.tariff} / ${(r.power / 1000).toFixed(0)} kVA | No Seri: ${r.assetMeterCode || '-'}
   Tegangan: VR=${r.voltageL1.toFixed(1)}V, VS=${r.voltageL2.toFixed(1)}V, VT=${r.voltageL3.toFixed(1)}V
   Arus: IR=${r.currentL1.toFixed(2)}A, IS=${r.currentL2.toFixed(2)}A, IT=${r.currentL3.toFixed(2)}A
   Daya Aktif: P1=${r.activePowerL1.toFixed(0)}W, P2=${r.activePowerL2.toFixed(0)}W, P3=${r.activePowerL3.toFixed(0)}W
   Anomali: ${r.anomalies.map(a => a.title).join('; ')}
   Tindakan: ${r.anomalies[0]?.recommendation || 'Pemeriksaan lapangan'}
`).join('')}

REKOMENDASI TINDAKAN LAPANGAN:
1. Terbitkan Berita Acara (BA) Pemeriksaan Transaksi Energi Listrik / P2TL.
2. Lakukan pengecekan fisik polaritas sekunder CT (k-l) dan tegangan sekunder PT.
3. Gunakan fitur Ekspor Audit di AMR PowerEye untuk lampiran berkas resmi.

Pesan ini dibuat otomatis oleh Sistem Diagnostik AMR PowerEye.
  `.trim();

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">PERINGATAN KRITIS AMR</span>
        <h2 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 20px;">Laporan Deteksi Anomali Meter Listrik</h2>
        <div style="color: #94a3b8; font-size: 12px;">Unit: ${unitName} • Waktu: ${timestamp}</div>
      </div>

      <div style="background: #1e293b; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;">
        <div style="font-size: 13px; color: #e2e8f0;">Halo <strong>${user.name}</strong>,</div>
        <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0 0 0; line-height: 1.5;">
          Sistem AMR PowerEye mendeteksi <strong>${count} pelanggan</strong> dengan parameter pengukuran abnormal berisiko tinggi. Terdeteksi <strong>${reverseCount} kasus CT / Pengawatan Terbalik</strong> yang berpotensi menyebabkan ketidaksesuaian kWh meter.
        </p>
      </div>

      <h3 style="font-size: 14px; color: #38bdf8; text-transform: uppercase; margin-bottom: 10px;">Daftar Kasus Prioritas Utama:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #020617; color: #94a3b8; text-align: left;">
            <th style="padding: 8px; border-bottom: 1px solid #334155;">IDPEL & Pelanggan</th>
            <th style="padding: 8px; border-bottom: 1px solid #334155;">Tarif/Daya</th>
            <th style="padding: 8px; border-bottom: 1px solid #334155;">Anomali</th>
            <th style="padding: 8px; border-bottom: 1px solid #334155;">Daya Aktif</th>
          </tr>
        </thead>
        <tbody>
          ${topRecords.map(r => `
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding: 8px;"><strong>${r.namaPelanggan}</strong><br/><span style="color:#64748b; font-family:monospace;">${r.locationCode}</span></td>
              <td style="padding: 8px;">${r.tariff} / ${(r.power/1000).toFixed(0)} kVA</td>
              <td style="padding: 8px; color: #f87171;"><strong>${r.anomalies[0]?.title || 'Anomali'}</strong></td>
              <td style="padding: 8px; font-family: monospace; color: ${r.activePowerTotal < 0 ? '#ef4444' : '#e2e8f0'}; font-weight: bold;">${r.activePowerTotal.toFixed(0)} W</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: 12px; font-size: 12px; color: #fca5a5; margin-bottom: 20px;">
        <strong>Tindakan yang Diperlukan:</strong><br/>
        Segera tugaskan tim P2TL / Transaksi Energi untuk pemeriksaan fisik segel dan polaritas terminal k-l kWh meter. Unduh Diagram Fasor dan Laporan Audit resmi dari dasbor AMR PowerEye.
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 14px;">
        Notifikasi Resmi Otomatis • AMR PowerEye PLN Distribusi
      </div>
    </div>
  `;

  return { subject, htmlBody, textBody };
}

// In-memory / localStorage email outbox history
const EMAIL_STORAGE_KEY = 'amr_email_history_v1';

export function getDispatchedEmails(): EmailDispatchRecord[] {
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordEmailDispatch(record: EmailDispatchRecord) {
  try {
    const current = getDispatchedEmails();
    const updated = [record, ...current].slice(0, 50);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email history', e);
  }
}
