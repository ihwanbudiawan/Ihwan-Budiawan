import React, { useState, useMemo } from 'react';
import { AMRRecord, AnomalyRegressionPrediction } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import {
  TrendingDown,
  Brain,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  BarChart2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface DashboardPredictiveModelProps {
  records: AMRRecord[];
  onSelectCustomer?: (record: AMRRecord) => void;
}

export const DashboardPredictiveModel: React.FC<DashboardPredictiveModelProps> = ({
  records,
  onSelectCustomer,
}) => {
  const { isDark } = useTheme();

  // Selected customer for detailed regression inspection
  const [selectedIdpel, setSelectedIdpel] = useState<string>(
    records.length > 0 ? records[0].locationCode : ''
  );

  // Train simple linear regression for each customer based on 12-month history
  const predictions: AnomalyRegressionPrediction[] = useMemo(() => {
    return records.map((r) => {
      const history = r.historical12Months || [];
      const n = history.length;

      if (n < 3) {
        return {
          idpel: r.locationCode,
          namaPelanggan: r.namaPelanggan,
          currentHealthScore: r.healthScore,
          historicalPointsCount: n,
          slope: 0,
          intercept: r.healthScore,
          rSquared: 0,
          predictedHealth30Days: r.healthScore,
          predictedHealth60Days: r.healthScore,
          predictedHealth90Days: r.healthScore,
          predictedHealth180Days: r.healthScore,
          failureRiskProbability: r.healthScore < 60 ? 65 : 10,
          suspectedComponent: 'Metering_Firmware',
          componentRiskLabel: 'Firmware & Memory Meter',
          recommendationAction: 'Pemantauan periodik standar.',
        };
      }

      // x: month index 0..11, y: health score
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      let sumYY = 0;

      for (let i = 0; i < n; i++) {
        const x = i;
        const y = history[i].healthScore;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
        sumYY += y * y;
      }

      // Linear Regression: y = m*x + b
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;

      // R^2 Calculation
      const numerator = n * sumXY - sumX * sumY;
      const denom = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY) || 1);
      const rVal = denom !== 0 ? numerator / denom : 0;
      const rSquared = Math.min(1, Math.max(0, Math.round(rVal * rVal * 100) / 100));

      // Future projections:
      // 30 days = Month 12, 60 days = Month 13, 90 days = Month 14, 180 days = Month 17
      const pred30 = Math.max(0, Math.min(100, Math.round(intercept + slope * 12)));
      const pred60 = Math.max(0, Math.min(100, Math.round(intercept + slope * 13)));
      const pred90 = Math.max(0, Math.min(100, Math.round(intercept + slope * 14)));
      const pred180 = Math.max(0, Math.min(100, Math.round(intercept + slope * 17)));

      // Failure probability based on current health + slope
      let riskPct = 10;
      if (pred90 < 50) riskPct = 85;
      else if (pred90 < 70) riskPct = 55;
      else if (pred180 < 70) riskPct = 35;
      if (slope < -1.5) riskPct = Math.min(98, riskPct + 25);

      // Suspected Component analysis based on existing anomaly signs
      let suspected: AnomalyRegressionPrediction['suspectedComponent'] = 'Wiring_Wear';
      let compLabel = 'Keausan Kabel Pengawatan CT/PT';
      let recAction = 'Jadwalkan rekondisi terminal dan pemeriksaan pengawatan.';

      if (r.anomalies.some((a) => a.category === 'wiring_reverse')) {
        suspected = 'CT_Saturation';
        compLabel = 'Polaritas CT / Saturasi Trafo Arus';
        recAction = 'Prioritas P2TL: Tukar balik kabel sekunder CT dan uji akurasi APP.';
      } else if (r.currentUnbalancePct > 20) {
        suspected = 'Terminal_Overheat';
        compLabel = 'Overheat Terminal Blok Netral (Ketidakseimbangan > 20%)';
        recAction = 'Lakukan thermovisi inframerah terminal blok dan balance beban fasa.';
      } else if (r.voltageL1 < 198 || r.voltageL2 < 198 || r.voltageL3 < 198) {
        suspected = 'PT_Drift';
        compLabel = 'Drift / Penurunan Akurasi Trafo Tegangan (PT)';
        recAction = 'Periksa fuse pengaman PT dan drop impedansi saluran.';
      } else if (r.powerFactorTotal < 0.85) {
        suspected = 'Relay_Stuck';
        compLabel = 'Kapasitor Bank / Relay Kompensasi Rusak';
        recAction = 'Periksa kontaktor kontrol daya reaktif agar terhindar denda kVARh.';
      }

      return {
        idpel: r.locationCode,
        namaPelanggan: r.namaPelanggan,
        currentHealthScore: r.healthScore,
        historicalPointsCount: n,
        slope: Math.round(slope * 100) / 100,
        intercept: Math.round(intercept * 10) / 10,
        rSquared,
        predictedHealth30Days: pred30,
        predictedHealth60Days: pred60,
        predictedHealth90Days: pred90,
        predictedHealth180Days: pred180,
        failureRiskProbability: riskPct,
        suspectedComponent: suspected,
        componentRiskLabel: compLabel,
        recommendationAction: recAction,
      };
    });
  }, [records]);

  // Sort by failure risk descending
  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => b.failureRiskProbability - a.failureRiskProbability);
  }, [predictions]);

  // Currently inspected customer prediction
  const activePred =
    predictions.find((p) => p.idpel === selectedIdpel) ||
    sortedPredictions[0] ||
    predictions[0];

  const activeRecord = records.find((r) => r.locationCode === activePred?.idpel);

  const highRiskCount = predictions.filter((p) => p.failureRiskProbability >= 70).length;
  const mediumRiskCount = predictions.filter((p) => p.failureRiskProbability >= 40 && p.failureRiskProbability < 70).length;

  return (
    <div
      className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold flex items-center gap-2">
              Model Regresi Prediktif Anomali & Kerusakan Komponen Meter (12 Bulan Historis)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Melatih model regresi linier sederhana (y = mx + b) pada 12 titik riwayat bulanan untuk memprediksi probabilitas kerusakan komponen 30-180 hari ke depan
          </p>
        </div>

        {/* High Risk Metric Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{highRiskCount} Meter Berisiko Tinggi Rusak (&lt; 90 Hari)</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Main Regression Chart & High-Risk Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Regression Curve (y = mx + b) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400">Meter Diperiksa:</span>{' '}
                <strong className="text-white">{activePred?.namaPelanggan}</strong>{' '}
                <span className="font-mono text-cyan-400">({activePred?.idpel})</span>
              </div>
              <div className="font-mono text-[11px] text-purple-300 font-bold">
                Formula: y = {activePred?.slope}x + {activePred?.intercept} (R² = {activePred?.rSquared})
              </div>
            </div>

            {/* Regression Plot Visualization Canvas */}
            <div className="h-56 relative border-b border-l border-slate-800 p-2 flex items-end">
              {/* Threshold Danger Line (Health = 50) */}
              <div className="absolute w-full left-0 bottom-[50%] border-b border-dashed border-rose-500/60 z-10">
                <span className="absolute right-2 -top-4 text-[9px] text-rose-400 font-mono font-bold">
                  Batas Kritis / Rusak (Skor 50)
                </span>
              </div>

              {/* Data points 12 months + 4 future projection months */}
              <div className="w-full h-full flex items-end gap-1.5">
                {(activeRecord?.historical12Months || []).map((h, i) => {
                  const hScore = Math.max(5, Math.min(100, h.healthScore));
                  const fittedY = Math.max(5, Math.min(100, (activePred?.intercept || 0) + (activePred?.slope || 0) * i));

                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center relative group">
                      {/* Fitted line dot */}
                      <div
                        style={{ bottom: `${fittedY}%` }}
                        className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 z-10 pointer-events-none"
                      />

                      {/* Actual Historical bar */}
                      <div
                        style={{ height: `${hScore}%` }}
                        className="w-full bg-gradient-to-t from-emerald-700/60 to-emerald-400/80 rounded-t-sm transition hover:brightness-125"
                      />
                      <span className="text-[8px] text-slate-500 font-mono mt-1">{h.label.split(' ')[0]}</span>
                    </div>
                  );
                })}

                {/* 4 Projected Future Months (Dashed purple gradient) */}
                {[
                  { label: '+30h', val: activePred?.predictedHealth30Days || 0 },
                  { label: '+60h', val: activePred?.predictedHealth60Days || 0 },
                  { label: '+90h', val: activePred?.predictedHealth90Days || 0 },
                  { label: '+180h', val: activePred?.predictedHealth180Days || 0 },
                ].map((f, i) => (
                  <div key={`proj-${i}`} className="flex-1 h-full flex flex-col justify-end items-center relative">
                    <div
                      style={{ height: `${f.val}%` }}
                      className={`w-full rounded-t-sm border border-dashed ${
                        f.val < 50
                          ? 'bg-rose-950/40 border-rose-500/60'
                          : 'bg-purple-950/40 border-purple-500/60'
                      }`}
                    />
                    <span className="text-[8px] text-purple-300 font-mono font-bold mt-1">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prediction Breakdown Strip */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">30 Hari Depan</span>
                <strong className={activePred?.predictedHealth30Days! < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                  Skor {activePred?.predictedHealth30Days}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">60 Hari Depan</span>
                <strong className={activePred?.predictedHealth60Days! < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                  Skor {activePred?.predictedHealth60Days}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">90 Hari Depan</span>
                <strong className={activePred?.predictedHealth90Days! < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                  Skor {activePred?.predictedHealth90Days}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">180 Hari Depan</span>
                <strong className={activePred?.predictedHealth180Days! < 50 ? 'text-rose-400' : 'text-amber-400'}>
                  Skor {activePred?.predictedHealth180Days}
                </strong>
              </div>
            </div>
          </div>

          {/* Component Degradation & Preventive Action */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> Diagnosa Kerusakan Komponen Terprediksi
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  activePred?.failureRiskProbability! >= 70
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                Probabilitas Gangguan: {activePred?.failureRiskProbability}%
              </span>
            </div>
            <div className="text-white font-semibold">
              Komponen Rentan: <span className="text-amber-300">{activePred?.componentRiskLabel}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Tindakan Preventif Direkomendasikan: {activePred?.recommendationAction}
            </p>
          </div>
        </div>

        {/* Right Column: High Risk Meter Priority Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Prioritas Penggantian / Perbaikan Komponen (Urutan Risiko)
            </span>
            <span className="text-slate-500 text-[10px]">{sortedPredictions.length} meter</span>
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {sortedPredictions.slice(0, 8).map((p) => {
              const isSelected = p.idpel === activePred?.idpel;
              return (
                <div
                  key={p.idpel}
                  onClick={() => setSelectedIdpel(p.idpel)}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{p.namaPelanggan}</span>
                    <span
                      className={`font-mono text-[11px] ${
                        p.failureRiskProbability >= 70 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {p.failureRiskProbability}% Risiko
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>IDPEL: {p.idpel}</span>
                    <span>Laju: {p.slope} skor/bln</span>
                  </div>
                  <div className="text-[10px] text-purple-300 mt-1 truncate">
                    Komponen: {p.componentRiskLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
