import React, { useState, useRef, useEffect } from 'react';
import { AMRRecord } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import {
  RotateCw,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Info,
  Maximize2,
  Compass,
  Zap,
  Sparkles,
  Play,
  Pause,
  Box,
  SplitSquareVertical,
  Printer,
  BookOpen
} from 'lucide-react';
import { printBeritaAcaraP2TL } from '../utils/reportExporter';

interface PhasorDiagramProps {
  record: AMRRecord;
  allRecords?: AMRRecord[];
  onExportBA?: (record: AMRRecord) => void;
  initialCompareRecord?: AMRRecord;
}

export const PhasorDiagram: React.FC<PhasorDiagramProps> = ({
  record: primaryRecord,
  allRecords = [],
  onExportBA,
  initialCompareRecord,
}) => {
  const { isDark } = useTheme();

  // Split-View Comparison State
  const [isSplitView, setIsSplitView] = useState(Boolean(initialCompareRecord));
  const [compareIdpel, setCompareIdpel] = useState<string>(
    initialCompareRecord?.locationCode || (allRecords.find((r) => r.locationCode !== primaryRecord.locationCode)?.locationCode || '')
  );

  // Display toggles
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isAnimated, setIsAnimated] = useState(false);
  const [showVoltage, setShowVoltage] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showNeutral, setShowNeutral] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [angleReference, setAngleReference] = useState<'east' | 'north'>('east');

  // Animation frame angle for vector rotation
  const [animAngle, setAnimAngle] = useState(0);

  useEffect(() => {
    let animationId: number;
    if (isAnimated) {
      const step = () => {
        setAnimAngle((prev) => (prev + 1.5) % 360);
        animationId = requestAnimationFrame(step);
      };
      animationId = requestAnimationFrame(step);
    } else {
      setAnimAngle(0);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isAnimated]);

  const compareRecord = allRecords.find((r) => r.locationCode === compareIdpel);

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Split-View Toggle */}
          {allRecords.length > 1 && (
            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition border ${
                isSplitView
                  ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title="Tampilkan 2 Diagram Fasor berdampingan untuk cross-check anomali grid yang sama"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split-View 2 Pelanggan: {isSplitView ? 'Aktif' : 'Non-Aktif'}</span>
            </button>
          )}

          {/* 2D vs 3D Perspective Toggle */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                viewMode === '2d'
                  ? isDark
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Fasor
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                viewMode === '3d'
                  ? isDark
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D Proyeksi</span>
            </button>
          </div>

          {/* Animated Vector Rotation Toggle */}
          <button
            onClick={() => setIsAnimated(!isAnimated)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border font-semibold transition ${
              isAnimated
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {isAnimated ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>Animasi Vektor (50Hz)</span>
          </button>
        </div>

        {/* Print BA P2TL Quick Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => printBeritaAcaraP2TL(primaryRecord)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak BA P2TL (Perdir 028)</span>
          </button>
        </div>
      </div>

      {/* Split-View IDPEL Selector Bar */}
      {isSplitView && allRecords.length > 1 && (
        <div
          className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">Bandingkan IDPEL A:</span>
            <span className="font-mono bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
              {primaryRecord.locationCode} ({primaryRecord.namaPelanggan})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold">dengan IDPEL B:</span>
            <select
              value={compareIdpel}
              onChange={(e) => setCompareIdpel(e.target.value)}
              className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold bg-slate-900 border border-amber-500/50 text-amber-300 focus:outline-none"
            >
              {allRecords
                .filter((r) => r.locationCode !== primaryRecord.locationCode)
                .slice(0, 50)
                .map((r) => (
                  <option key={r.id} value={r.locationCode}>
                    {r.locationCode} - {r.namaPelanggan} ({r.tariff} {r.power}VA)
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Diagram Area: Single View or Split Side-by-Side */}
      <div className={isSplitView && compareRecord ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'w-full'}>
        {/* Panel 1: Primary Customer Phasor */}
        <div className="space-y-3">
          {isSplitView && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs">
              <span className="font-bold text-emerald-400">
                [IDPEL 1] {primaryRecord.locationCode} - {primaryRecord.namaPelanggan}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {primaryRecord.namaUp || primaryRecord.unitUp}
              </span>
            </div>
          )}
          <SinglePhasorCanvas
            record={primaryRecord}
            isDark={isDark}
            viewMode={viewMode}
            isAnimated={isAnimated}
            animAngle={animAngle}
            angleReference={angleReference}
            showVoltage={showVoltage}
            showCurrent={showCurrent}
            showNeutral={showNeutral}
            showArcs={showArcs}
          />
        </div>

        {/* Panel 2: Compare Customer Phasor (Split-View) */}
        {isSplitView && compareRecord && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
              <span className="font-bold text-amber-400">
                [IDPEL 2] {compareRecord.locationCode} - {compareRecord.namaPelanggan}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {compareRecord.namaUp || compareRecord.unitUp}
              </span>
            </div>
            <SinglePhasorCanvas
              record={compareRecord}
              isDark={isDark}
              viewMode={viewMode}
              isAnimated={isAnimated}
              animAngle={animAngle}
              angleReference={angleReference}
              showVoltage={showVoltage}
              showCurrent={showCurrent}
              showNeutral={showNeutral}
              showArcs={showArcs}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface SinglePhasorCanvasProps {
  record: AMRRecord;
  isDark: boolean;
  viewMode: '2d' | '3d';
  isAnimated: boolean;
  animAngle: number;
  angleReference: 'east' | 'north';
  showVoltage: boolean;
  showCurrent: boolean;
  showNeutral: boolean;
  showArcs: boolean;
}

const SinglePhasorCanvas: React.FC<SinglePhasorCanvasProps> = ({
  record,
  isDark,
  viewMode,
  animAngle,
  angleReference,
  showVoltage,
  showCurrent,
  showNeutral,
  showArcs,
}) => {
  const cx = 220;
  const cy = 220;
  const radius = 160;

  const isOnePhase = record.phaseType === '1-Phase';
  const maxV = Math.max(record.voltageL1, isOnePhase ? 0 : record.voltageL2, isOnePhase ? 0 : record.voltageL3, 1);
  const maxI = Math.max(record.currentL1, isOnePhase ? 0 : record.currentL2, isOnePhase ? 0 : record.currentL3, record.currentN, 0.1);

  const lenVR = maxV > 0 ? (record.voltageL1 / maxV) * (radius * 0.88) : 0;
  const lenVS = !isOnePhase && maxV > 0 ? (record.voltageL2 / maxV) * (radius * 0.88) : 0;
  const lenVT = !isOnePhase && maxV > 0 ? (record.voltageL3 / maxV) * (radius * 0.88) : 0;

  const lenIR = maxI > 0 ? (record.currentL1 / maxI) * (radius * 0.80) : 0;
  const lenIS = !isOnePhase && maxI > 0 ? (record.currentL2 / maxI) * (radius * 0.80) : 0;
  const lenIT = !isOnePhase && maxI > 0 ? (record.currentL3 / maxI) * (radius * 0.80) : 0;
  const lenIN = !isOnePhase && maxI > 0 ? (record.currentN / maxI) * (radius * 0.50) : 0;

  const angleOffset = (angleReference === 'north' ? 90 : 0) + animAngle;

  // 2D & 3D coordinate converter
  const projectPoint = (r: number, angleDeg: number, zElevation = 0) => {
    const adjustedAngle = angleDeg + angleOffset;
    const rad = (adjustedAngle * Math.PI) / 180;
    const px = r * Math.cos(rad);
    const py = -r * Math.sin(rad);

    if (viewMode === '3d') {
      // Isometric-like 3D tilt: compress Y axis and add depth offset
      const tilt = 0.55;
      const x3d = cx + px;
      const y3d = cy + py * tilt - zElevation;
      return { x: x3d, y: y3d };
    }

    return {
      x: cx + px,
      y: cy + py,
    };
  };

  const ptVR = projectPoint(lenVR, record.voltageAngleL1, 15);
  const ptVS = projectPoint(lenVS, record.voltageAngleL2, 15);
  const ptVT = projectPoint(lenVT, record.voltageAngleL3, 15);

  const ptIR = projectPoint(lenIR, record.currentAngleL1, 0);
  const ptIS = projectPoint(lenIS, record.currentAngleL2, 0);
  const ptIT = projectPoint(lenIT, record.currentAngleL3, 0);

  // In Angle calculation
  const iRad1 = (record.currentAngleL1 * Math.PI) / 180;
  const iRad2 = (record.currentAngleL2 * Math.PI) / 180;
  const iRad3 = (record.currentAngleL3 * Math.PI) / 180;
  const inX = -(record.currentL1 * Math.cos(iRad1) + record.currentL2 * Math.cos(iRad2) + record.currentL3 * Math.cos(iRad3));
  const inY = -(record.currentL1 * Math.sin(iRad1) + record.currentL2 * Math.sin(iRad2) + record.currentL3 * Math.sin(iRad3));
  const inAngle = (Math.atan2(inY, inX) * 180) / Math.PI;
  const ptIN = projectPoint(lenIN, inAngle, 0);

  // Anomaly badges
  const reverseAnom = record.anomalies.find((a) => a.category === 'wiring_reverse');
  const unbalanceCrit = record.currentUnbalancePct > 20;

  return (
    <div
      className={`border rounded-2xl p-4 shadow-md transition-colors ${
        isDark ? 'bg-slate-950/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b pb-2.5 border-slate-700/60 text-xs">
        <div>
          <span className="font-extrabold text-sm text-cyan-400">{record.namaPelanggan}</span>
          <span className="text-slate-400 ml-2 font-mono">({record.locationCode})</span>
        </div>
        <div className="flex items-center gap-2">
          {reverseAnom && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold text-[10px]">
              🚨 CT Terbalik
            </span>
          )}
          {unbalanceCrit && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
              ⚖️ Unbalance &gt; 20% (IEEE 141)
            </span>
          )}
          <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-800 rounded text-slate-300">
            {record.phaseType} • {record.power >= 1000 ? `${record.power / 1000} kVA` : `${record.power} VA`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-2">
        <svg
          viewBox="0 0 440 440"
          className="w-full max-w-[400px] h-auto select-none overflow-visible filter drop-shadow-md"
        >
          <defs>
            <marker id={`arr-vr-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
            </marker>
            <marker id={`arr-vs-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#eab308" />
            </marker>
            <marker id={`arr-vt-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" />
            </marker>
            <marker id={`arr-ir-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#f87171" />
            </marker>
            <marker id={`arr-is-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#fde047" />
            </marker>
            <marker id={`arr-it-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#93c5fd" />
            </marker>
            <marker id={`arr-in-${record.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Background Grid Rings */}
          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const rx = radius * frac;
            const ry = viewMode === '3d' ? rx * 0.55 : rx;
            return (
              <ellipse
                key={idx}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth={idx === 3 ? 1.5 : 0.8}
                strokeDasharray={idx < 3 ? '3 3' : undefined}
                opacity={0.6}
              />
            );
          })}

          {/* Coordinate Axes */}
          <line
            x1={cx - radius - 15}
            y1={cy}
            x2={cx + radius + 15}
            y2={cy}
            stroke={isDark ? '#475569' : '#94a3b8'}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          <line
            x1={cx}
            y1={cy - (viewMode === '3d' ? (radius + 15) * 0.55 : radius + 15)}
            x2={cx}
            y2={cy + (viewMode === '3d' ? (radius + 15) * 0.55 : radius + 15)}
            stroke={isDark ? '#475569' : '#94a3b8'}
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Angle degree indicators */}
          <text x={cx + radius + 8} y={cy + 4} fontSize="9" fill="#94a3b8" textAnchor="start">0°</text>
          <text x={cx} y={cy - (viewMode === '3d' ? radius * 0.55 : radius) - 6} fontSize="9" fill="#94a3b8" textAnchor="middle">90°</text>
          <text x={cx - radius - 8} y={cy + 4} fontSize="9" fill="#94a3b8" textAnchor="end">180°</text>
          <text x={cx} y={cy + (viewMode === '3d' ? radius * 0.55 : radius) + 12} fontSize="9" fill="#94a3b8" textAnchor="middle">270°</text>

          {/* Voltage Vectors (Solid Lines) */}
          {showVoltage && (
            <>
              {/* VR */}
              <line
                x1={cx}
                y1={cy}
                x2={ptVR.x}
                y2={ptVR.y}
                stroke="#ef4444"
                strokeWidth="2.5"
                markerEnd={`url(#arr-vr-${record.id})`}
              />
              <text x={ptVR.x + 6} y={ptVR.y - 4} fill="#ef4444" fontSize="10" fontWeight="bold">
                VR ({record.voltageL1.toFixed(0)}V, {record.voltageAngleL1.toFixed(0)}°)
              </text>

              {/* VS */}
              {!isOnePhase && (
                <>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={ptVS.x}
                    y2={ptVS.y}
                    stroke="#eab308"
                    strokeWidth="2.5"
                    markerEnd={`url(#arr-vs-${record.id})`}
                  />
                  <text x={ptVS.x + 6} y={ptVS.y - 4} fill="#eab308" fontSize="10" fontWeight="bold">
                    VS ({record.voltageL2.toFixed(0)}V, {record.voltageAngleL2.toFixed(0)}°)
                  </text>
                </>
              )}

              {/* VT */}
              {!isOnePhase && (
                <>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={ptVT.x}
                    y2={ptVT.y}
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    markerEnd={`url(#arr-vt-${record.id})`}
                  />
                  <text x={ptVT.x + 6} y={ptVT.y - 4} fill="#3b82f6" fontSize="10" fontWeight="bold">
                    VT ({record.voltageL3.toFixed(0)}V, {record.voltageAngleL3.toFixed(0)}°)
                  </text>
                </>
              )}
            </>
          )}

          {/* Current Vectors (Dashed Lines) */}
          {showCurrent && (
            <>
              {/* IR */}
              <line
                x1={cx}
                y1={cy}
                x2={ptIR.x}
                y2={ptIR.y}
                stroke="#f87171"
                strokeWidth="2"
                strokeDasharray="4 2"
                markerEnd={`url(#arr-ir-${record.id})`}
              />
              <text x={ptIR.x + 6} y={ptIR.y + 10} fill="#f87171" fontSize="9" fontWeight="bold">
                IR ({record.currentL1.toFixed(1)}A, {record.currentAngleL1.toFixed(0)}°)
              </text>

              {/* IS */}
              {!isOnePhase && (
                <>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={ptIS.x}
                    y2={ptIS.y}
                    stroke="#fde047"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    markerEnd={`url(#arr-is-${record.id})`}
                  />
                  <text x={ptIS.x + 6} y={ptIS.y + 10} fill="#fde047" fontSize="9" fontWeight="bold">
                    IS ({record.currentL2.toFixed(1)}A, {record.currentAngleL2.toFixed(0)}°)
                  </text>
                </>
              )}

              {/* IT */}
              {!isOnePhase && (
                <>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={ptIT.x}
                    y2={ptIT.y}
                    stroke="#93c5fd"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    markerEnd={`url(#arr-it-${record.id})`}
                  />
                  <text x={ptIT.x + 6} y={ptIT.y + 10} fill="#93c5fd" fontSize="9" fontWeight="bold">
                    IT ({record.currentL3.toFixed(1)}A, {record.currentAngleL3.toFixed(0)}°)
                  </text>
                </>
              )}

              {/* IN Netral */}
              {showNeutral && !isOnePhase && record.currentN > 0 && (
                <>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={ptIN.x}
                    y2={ptIN.y}
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                    markerEnd={`url(#arr-in-${record.id})`}
                  />
                  <text x={ptIN.x + 6} y={ptIN.y - 4} fill="#c084fc" fontSize="9" fontWeight="bold">
                    IN ({record.currentN.toFixed(1)}A)
                  </text>
                </>
              )}
            </>
          )}

          {/* Center Origin Dot */}
          <circle cx={cx} cy={cy} r="4" fill="#10b981" />
        </svg>
      </div>

      {/* Summary Measurement Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono p-2.5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-slate-400 block text-[10px]">Cos φ Total</span>
          <strong className={record.powerFactorTotal < 0.85 ? 'text-amber-400' : 'text-emerald-400'}>
            {record.powerFactorTotal.toFixed(3)}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Unbalance Arus</span>
          <strong className={record.currentUnbalancePct > 20 ? 'text-rose-400' : 'text-emerald-400'}>
            {record.currentUnbalancePct.toFixed(1)}% (IEEE 141)
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">THD Tegangan</span>
          <strong className={record.thdVoltage.avg > 5 ? 'text-rose-400' : 'text-slate-300'}>
            {record.thdVoltage.avg.toFixed(1)}%
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Daya Primer kW</span>
          <strong className="text-cyan-400">{record.actualPowerKw.toFixed(1)} kW</strong>
        </div>
      </div>
    </div>
  );
};

