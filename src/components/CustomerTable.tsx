import React, { useState, useMemo } from 'react';
import { exportAnomaliesToExcel } from '../utils/excelTemplate';
import { exportAnomaliesToCSV, printBeritaAcaraP2TL } from '../utils/reportExporter';
import {
  Search,
  Filter,
  FileDown,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCw,
  TrendingUp,
  X,
  Sparkles,
  Leaf,
  Info,
  Maximize2,
  MousePointer,
  Building2,
  MapPin,
  RotateCcw,
  Calendar,
  BarChart2,
  Printer,
  Navigation,
  SlidersHorizontal,
  CheckSquare,
  Square,
  FileText,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { AMRRecord, FilterState, UserProfile, ROLE_PERMISSIONS } from '../types/amr';
import { useTheme } from '../context/ThemeContext';
import { PhasorDiagram } from './PhasorDiagram';
import { ConsumptionCharts } from './ConsumptionCharts';
import { CustomerTrendChart } from './CustomerTrendChart';
import { CustomerDetailModal } from './CustomerDetailModal';
import { PLN_UNIT_INDUK_MAP } from '../utils/unitInduk';

export type SortColumn =
  | 'idpel'
  | 'name'
  | 'unitInduk'
  | 'unitAp'
  | 'unitUp'
  | 'tariff'
  | 'power'
  | 'phaseType'
  | 'merk'
  | 'voltage'
  | 'current'
  | 'unbalance'
  | 'cosphi'
  | 'watt'
  | 'multiplier'
  | 'actualKw'
  | 'standKwh'
  | 'health'
  | 'anomalies';

interface CustomerTableProps {
  records: AMRRecord[];
  selectedRecord: AMRRecord | null;
  onSelectRecord: (record: AMRRecord) => void;
  currentUser?: UserProfile | null;
  onOpenRouteModal?: (selectedRecords: AMRRecord[]) => void;
  onOpenSplitView?: (idpelA: string, idpelB?: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  records,
  selectedRecord,
  onSelectRecord,
  currentUser,
  onOpenRouteModal,
  onOpenSplitView,
}) => {
  const { isDark } = useTheme();

  // Multi-selection checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    merkMeter: 'all',
    tariff: 'all',
    unitInduk: 'all',
    customerType: 'all',
    unitAp: 'all',
    unitUp: 'all',
    voltageLevel: 'all',
    phaseType: 'all',
    sortBy: 'anomalies',
    sortOrder: 'desc',
  });

  // Sorting state for all columns
  const [sortCol, setSortCol] = useState<SortColumn>('anomalies');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Active / Highlighted customer state
  const [highlightedRecord, setHighlightedRecord] = useState<AMRRecord | null>(
    selectedRecord || (records.length > 0 ? records[0] : null)
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    selectedRecord?.id || (records.length > 0 ? records[0].id : null)
  );
  const [expandedTab, setExpandedTab] = useState<'phasor' | 'trend' | 'charts' | 'keterangan'>('phasor');
  const [autoHighlight, setAutoHighlight] = useState<boolean>(true);
  const [tableScrollHeight, setTableScrollHeight] = useState<'compact' | 'standard' | 'tall'>('standard');

  // Column Visibility state
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    unitInduk: true,
    customerType: true,
    tariffPower: true,
    meter: true,
    voltage: true,
    current: true,
    thd: true,
    cosphi: true,
    actualKw: true,
    standAbsolute: true,
    health: true,
    anomalies: true,
    actions: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [tableZoom, setTableZoom] = useState<number>(100);

  // Customer Detail Modal (triggered on row click or button)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalRecord, setDetailModalRecord] = useState<AMRRecord | null>(null);
  const [detailModalInitialTab, setDetailModalInitialTab] = useState<'phasor' | 'trend' | 'profile'>('phasor');
  const [detailModalSplit, setDetailModalSplit] = useState(false);

  // Column Dropdown Checklist Filters
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);
  const [columnChecklistFilters, setColumnChecklistFilters] = useState<Record<string, Set<string>>>({});

  // Unit Induk options from loaded records + master map
  const uniqueUnitInduks = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const code = r.unitIndukCode || r.locationCode.substring(0, 2) || '52';
      set.add(code);
    });
    // Ensure standard major units exist for filtering
    ['52', '54', '53', '51', '55', '56'].forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [records]);

  // Dropdown list options for UNIT AP (UP3)
  const uniqueAps = useMemo(() => {
    const apMap = new Map<string, { code: string; name: string }>();
    records.forEach((r) => {
      const code = (r.unitAp || '').trim();
      const name = (r.namaAp || '').trim();
      const key = name || code;
      if (key && !apMap.has(key)) {
        apMap.set(key, { code, name: name || code });
      }
    });

    if (apMap.size === 0) {
      apMap.set('KUDUS', { code: '52000', name: 'UP3 KUDUS' });
      apMap.set('SEMARANG', { code: '52100', name: 'UP3 SEMARANG' });
      apMap.set('SURAKARTA', { code: '52200', name: 'UP3 SURAKARTA' });
      apMap.set('YOGYAKARTA', { code: '52300', name: 'UP3 YOGYAKARTA' });
      apMap.set('PEKALONGAN', { code: '52400', name: 'UP3 PEKALONGAN' });
    }
    return Array.from(apMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // Dropdown list options for UNIT UP (ULP)
  const uniqueUps = useMemo(() => {
    const upMap = new Map<string, { code: string; name: string; apName: string }>();
    records.forEach((r) => {
      const code = (r.unitUp || '').trim();
      const name = (r.namaUp || '').trim();
      const apName = (r.namaAp || r.unitAp || '').trim();
      const key = name || code;
      if (key && !upMap.has(key)) {
        upMap.set(key, { code, name: name || code, apName });
      }
    });

    let ups = Array.from(upMap.values());
    if (filters.unitAp !== 'all') {
      ups = ups.filter((u) => u.apName.toLowerCase() === filters.unitAp.toLowerCase());
    }
    return ups.sort((a, b) => a.name.localeCompare(b.name));
  }, [records, filters.unitAp]);

  // Unique Tariffs & Meter Brands (WASION, HEXING, etc.)
  const uniqueTariffs = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (r.tariff) s.add(r.tariff.toUpperCase().trim());
    });
    return Array.from(s).sort();
  }, [records]);

  const uniqueMerks = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      let m = (r.merkMeter || 'WASION').toUpperCase().trim();
      if (m.includes('WASIO')) m = 'WASION';
      s.add(m);
    });
    return Array.from(s).sort();
  }, [records]);

  // Filtering and Sorting
  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Unit Induk 2 digit filter
        if (filters.unitInduk !== 'all') {
          const code = r.unitIndukCode || r.locationCode.substring(0, 2);
          if (code !== filters.unitInduk) return false;
        }

        // Customer vs Non-Customer
        if (filters.customerType === 'customer' && r.isCustomer === false) return false;
        if (filters.customerType === 'non_customer' && r.isCustomer !== false) return false;

        // Search query
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchId = r.locationCode.toLowerCase().includes(q);
          const matchName = r.namaPelanggan.toLowerCase().includes(q);
          const matchMerk = (r.merkMeter || '').toLowerCase().includes(q);
          const matchAsset = (r.assetMeterCode || '').toLowerCase().includes(q);
          const matchTariff = (r.tariff || '').toLowerCase().includes(q);
          const matchUp = (r.namaUp || r.unitUp || '').toLowerCase().includes(q);
          const matchAp = (r.namaAp || r.unitAp || '').toLowerCase().includes(q);

          if (!matchId && !matchName && !matchMerk && !matchAsset && !matchTariff && !matchUp && !matchAp) {
            return false;
          }
        }

        // Category filter
        if (filters.category !== 'all') {
          if (filters.category === 'critical') {
            if (!r.anomalies.some((a) => a.severity === 'critical')) return false;
          } else if (filters.category === 'wiring_reverse') {
            if (!r.anomalies.some((a) => a.category === 'wiring_reverse')) return false;
          } else if (filters.category === 'cosphi') {
            if (!r.anomalies.some((a) => a.category === 'cosphi_low' || a.category === 'cosphi_negative')) return false;
          } else if (filters.category === 'voltage') {
            if (!r.anomalies.some((a) => a.category.startsWith('voltage'))) return false;
          } else if (filters.category === 'current') {
            if (!r.anomalies.some((a) => a.category.startsWith('current') || a.category === 'neutral_high')) return false;
          } else if (filters.category === 'unbalance') {
            if (r.currentUnbalancePct <= 10 && r.voltageUnbalancePct <= 2.5) return false;
          } else if (filters.category === 'normal') {
            if (r.anomalies.length > 0) return false;
          }
        }

        // UP3 filter
        if (filters.unitAp !== 'all') {
          const apMatch =
            (r.namaAp && r.namaAp.toLowerCase() === filters.unitAp.toLowerCase()) ||
            (r.unitAp && r.unitAp.toLowerCase() === filters.unitAp.toLowerCase());
          if (!apMatch) return false;
        }

        // ULP filter
        if (filters.unitUp !== 'all') {
          const upMatch =
            (r.namaUp && r.namaUp.toLowerCase() === filters.unitUp.toLowerCase()) ||
            (r.unitUp && r.unitUp.toLowerCase() === filters.unitUp.toLowerCase());
          if (!upMatch) return false;
        }

        // Merk filter
        if (filters.merkMeter !== 'all') {
          let m = (r.merkMeter || 'WASION').toUpperCase();
          if (m.includes('WASIO')) m = 'WASION';
          if (m !== filters.merkMeter.toUpperCase()) return false;
        }

        // Tariff filter
        if (filters.tariff !== 'all' && r.tariff !== filters.tariff) return false;

        // Phase Type filter
        if (filters.phaseType !== 'all' && r.phaseType !== filters.phaseType) return false;

        // Voltage level filter
        if (filters.voltageLevel === 'TR' && r.isMediumVoltage) return false;
        if (filters.voltageLevel === 'TM' && !r.isMediumVoltage) return false;

        // Column Dropdown Checklist Filters
        for (const [colKey, allowedSet] of Object.entries(columnChecklistFilters)) {
          if (allowedSet && allowedSet.size > 0) {
            if (colKey === 'unitInduk') {
              const code = r.unitIndukCode || r.locationCode.substring(0, 2);
              if (!allowedSet.has(code)) return false;
            } else if (colKey === 'customerType') {
              const val = r.isCustomer !== false ? 'Customer' : 'Non-Customer';
              if (!allowedSet.has(val)) return false;
            } else if (colKey === 'tariff') {
              if (!allowedSet.has(r.tariff)) return false;
            } else if (colKey === 'merk') {
              let m = (r.merkMeter || 'WASION').toUpperCase().trim();
              if (m.includes('WASIO')) m = 'WASION';
              if (!allowedSet.has(m)) return false;
            } else if (colKey === 'phaseType') {
              if (!allowedSet.has(r.phaseType)) return false;
            } else if (colKey === 'anomalies') {
              const status = r.anomalies.some((a) => a.severity === 'critical')
                ? 'critical'
                : r.anomalies.length > 0
                ? 'warning'
                : 'normal';
              if (!allowedSet.has(status)) return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortCol) {
          case 'idpel':
            cmp = a.locationCode.localeCompare(b.locationCode);
            break;
          case 'name':
            cmp = a.namaPelanggan.localeCompare(b.namaPelanggan);
            break;
          case 'unitInduk':
            cmp = (a.unitIndukCode || '').localeCompare(b.unitIndukCode || '');
            break;
          case 'unitAp':
            cmp = (a.namaAp || a.unitAp || '').localeCompare(b.namaAp || b.unitAp || '');
            break;
          case 'unitUp':
            cmp = (a.namaUp || a.unitUp || '').localeCompare(b.namaUp || b.unitUp || '');
            break;
          case 'tariff':
            cmp = a.tariff.localeCompare(b.tariff);
            break;
          case 'power':
            cmp = a.power - b.power;
            break;
          case 'phaseType':
            cmp = a.phaseType.localeCompare(b.phaseType);
            break;
          case 'merk':
            cmp = a.merkMeter.localeCompare(b.merkMeter);
            break;
          case 'voltage':
            cmp = a.voltageL1 - b.voltageL1;
            break;
          case 'current':
            cmp = Math.max(a.currentL1, a.currentL2, a.currentL3) - Math.max(b.currentL1, b.currentL2, b.currentL3);
            break;
          case 'unbalance':
            cmp = a.currentUnbalancePct - b.currentUnbalancePct;
            break;
          case 'cosphi':
            cmp = a.powerFactorTotal - b.powerFactorTotal;
            break;
          case 'watt':
            cmp = a.activePowerTotal - b.activePowerTotal;
            break;
          case 'actualKw':
            cmp = a.actualPowerKw - b.actualPowerKw;
            break;
          case 'standKwh':
            cmp = a.standKwhImport - b.standKwhImport;
            break;
          case 'health':
            cmp = a.healthScore - b.healthScore;
            break;
          case 'anomalies':
          default:
            cmp = a.anomalies.length - b.anomalies.length;
            break;
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [records, filters, sortCol, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  // Checkbox selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredAndSortedRecords.map((r) => r.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const getSelectedRecords = (): AMRRecord[] => {
    return records.filter((r) => selectedIds.has(r.id));
  };

  const canExport = currentUser ? (ROLE_PERMISSIONS[currentUser.role]?.canExport ?? true) : true;

  const handleRowClick = (r: AMRRecord) => {
    setHighlightedRecord(r);
    onSelectRecord(r);
    setDetailModalRecord(r);
    setDetailModalInitialTab('phasor');
    setDetailModalSplit(false);
    setDetailModalOpen(true);
  };

  const renderSortIndicator = (col: SortColumn) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50 ml-1 inline-block shrink-0" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-extrabold ml-1 inline-block shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-extrabold ml-1 inline-block shrink-0" />
    );
  };

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  const renderColumnFilterDropdown = (
    colKey: string,
    title: string,
    options: { label: string; value: string }[]
  ) => {
    const isOpen = openColumnFilter === colKey;
    const currentSet = columnChecklistFilters[colKey] || new Set();
    const isFiltered = currentSet.size > 0;

    return (
      <div className="relative inline-block ml-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpenColumnFilter(isOpen ? null : colKey)}
          className={`p-1 rounded-md transition ${
            isFiltered
              ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300'
              : isDark
              ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
          }`}
          title={`Filter checklist kolom ${title}`}
        >
          <Filter className="w-2.5 h-2.5" />
        </button>

        {isOpen && (
          <div
            className={`absolute left-0 top-full mt-1.5 z-50 w-52 p-3 rounded-2xl shadow-2xl border text-xs normal-case tracking-normal ${
              isDark ? 'bg-slate-900 border-slate-700 text-white shadow-slate-950' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-bold text-[11px]">
              <span>Filter {title}</span>
              <button
                type="button"
                onClick={() => setOpenColumnFilter(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 py-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  const next = { ...columnChecklistFilters };
                  delete next[colKey];
                  setColumnChecklistFilters(next);
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Pilih Semua
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => {
                  setColumnChecklistFilters({
                    ...columnChecklistFilters,
                    [colKey]: new Set(['__NONE__']),
                  });
                }}
                className="text-rose-400 hover:underline"
              >
                Hapus Semua
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1 py-1">
              {options.map((opt) => {
                const checked = currentSet.size === 0 || currentSet.has(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-800/60 cursor-pointer text-[11px] select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const prev =
                          currentSet.size === 0
                            ? new Set(options.map((o) => o.value))
                            : new Set(currentSet);
                        if (e.target.checked) {
                          prev.add(opt.value);
                          if (prev.size === options.length) {
                            const next = { ...columnChecklistFilters };
                            delete next[colKey];
                            setColumnChecklistFilters(next);
                            return;
                          }
                        } else {
                          prev.delete(opt.value);
                        }
                        setColumnChecklistFilters({
                          ...columnChecklistFilters,
                          [colKey]: prev,
                        });
                      }}
                      className="rounded accent-emerald-500"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenColumnFilter(null)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="customer-table-section"
      className={`border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md transition-colors ${
        isDark ? 'bg-slate-900/95 border-emerald-500/30 text-slate-100' : 'bg-white border-slate-200 shadow-slate-200/60 text-slate-900'
      }`}
    >
      {/* Controls & Search Toolbar */}
      <div
        className={`p-6 border-b space-y-4 transition-colors ${
          isDark
            ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30'
            : 'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                }`}
              >
                <Leaf className="w-4 h-4" />
              </div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Daftar Pelanggan AMR & Analisis Fasor Distribusi
              </h3>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Filter Unit Induk PLN (2 Digit IDPEL) • Customer & Non-Customer • Ketidakseimbangan Beban IEEE 141 • Arus Netral (IN) • Stand Absolut kWh & kVARh
            </p>
          </div>

          {/* Action cluster: Column Checklist, Multi-Selection Bulk Actions, Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Column Visibility Selector Modal Trigger */}
            <button
              onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                isDark
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Atur kolom yang ditampilkan pada tabel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kolom ({Object.values(visibleColumns).filter(Boolean).length})</span>
            </button>

            {/* Scroll Height Toggle */}
            <div
              className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span className="px-2 text-[10px] hidden lg:inline text-slate-500">Tinggi:</span>
              <button
                type="button"
                onClick={() => setTableScrollHeight('compact')}
                className={`px-2 py-1 rounded-lg transition text-[11px] ${
                  tableScrollHeight === 'compact'
                    ? isDark ? 'bg-slate-800 text-emerald-400 font-bold' : 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'hover:text-slate-200'
                }`}
              >
                460px
              </button>
              <button
                type="button"
                onClick={() => setTableScrollHeight('standard')}
                className={`px-2 py-1 rounded-lg transition text-[11px] ${
                  tableScrollHeight === 'standard'
                    ? isDark ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-600 text-white font-bold'
                    : 'hover:text-slate-200'
                }`}
              >
                620px
              </button>
              <button
                type="button"
                onClick={() => setTableScrollHeight('tall')}
                className={`px-2 py-1 rounded-lg transition text-[11px] ${
                  tableScrollHeight === 'tall'
                    ? isDark ? 'bg-slate-800 text-emerald-400 font-bold' : 'bg-white text-emerald-700 font-bold'
                    : 'hover:text-slate-200'
                }`}
              >
                820px
              </button>
            </div>

            {/* Zoom in & Zoom out tabel agar seluruh kolom muat di layar */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Zoom in & Zoom out tabel agar dapat melihat seluruh kolom"
            >
              <button
                type="button"
                onClick={() => setTableZoom((z) => Math.max(60, z - 10))}
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition"
                title="Zoom Out (Kecilkan agar semua kolom muat)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold text-emerald-400">
                {tableZoom}%
              </span>
              <button
                type="button"
                onClick={() => setTableZoom((z) => Math.min(130, z + 10))}
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition"
                title="Zoom In (Besarkan tabel)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {tableZoom !== 100 && (
                <button
                  type="button"
                  onClick={() => setTableZoom(100)}
                  className="text-[10px] px-1 text-slate-500 hover:text-slate-300 underline"
                  title="Reset Zoom ke 100%"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Per Halaman: 50, 100, 200, 500, 1000 */}
            <div
              className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Pilih jumlah baris tabel per halaman: 50, 100, 200, 500, 1000"
            >
              <span className="px-1.5 text-[10px] text-slate-500 hidden sm:inline">Baris:</span>
              {[50, 100, 200, 500, 1000].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg transition text-[11px] ${
                    pageSize === size
                      ? isDark
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'hover:text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            {canExport && (
              <button
                onClick={() => exportAnomaliesToCSV(filteredAndSortedRecords, 'Daftar_Pelanggan_AMR_PLN')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/30 transition transform hover:-translate-y-0.5"
                title="Unduh seluruh data hasil filter dalam format CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh CSV ({filteredAndSortedRecords.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Rows Action Bar (Floating notification when rows are checked) */}
        {selectedIds.size > 0 && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200 ${
              isDark
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">
                {selectedIds.size} pelanggan dipilih dari daftar
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenRouteModal && (
                <button
                  onClick={() => onOpenRouteModal(getSelectedRecords())}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Rencanakan Rute Petugas ({selectedIds.size})</span>
                </button>
              )}

              <button
                onClick={() => exportAnomaliesToCSV(getSelectedRecords(), 'Pelanggan_Terpilih_AMR')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Ekspor Terpilih CSV</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              >
                Batalkan Pilihan
              </button>
            </div>
          </div>
        )}

        {/* Column Visibility Checklist Dropdown Box */}
        {isColumnModalOpen && (
          <div
            className={`p-4 rounded-2xl border shadow-xl text-xs space-y-3 ${
              isDark ? 'bg-slate-950 border-indigo-500/40' : 'bg-white border-indigo-200 shadow-indigo-100'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/50">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Checklist Tampilan Kolom Tabel
              </span>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries({
                unitInduk: '🏢 Unit Induk (2 Digit)',
                customerType: '👥 Kategori Konsumen',
                tariffPower: '⚡ Tarif, Daya & Fasa',
                meter: '📟 Merk & No Seri Meter',
                voltage: '🔌 Tegangan & Unbalance V',
                current: '⚡ Arus IR/IS/IT/IN & Unbalance',
                thd: '📊 THD Harmonisa V & I',
                cosphi: '📉 Cos φ / PF Total',
                actualKw: '💡 Pemakaian Aktual kW',
                standAbsolute: '🔢 Stand Absolut kWh & kVARh',
                health: '❤️ Skor Kesehatan Meter',
                anomalies: '⚠️ Temuan Anomali & P2TL',
              }).map(([key, label]) => {
                const isChecked = visibleColumns[key as keyof typeof visibleColumns];
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition select-none ${
                      isChecked
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 font-semibold'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                        : isDark
                        ? 'bg-slate-900/50 border-slate-800 text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [key]: e.target.checked,
                        })
                      }
                      className="rounded accent-indigo-600"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* FITUR PENCARIAN CEPAT */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
              : 'bg-white border-emerald-300 shadow-sm shadow-emerald-100'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
              <input
                type="text"
                placeholder="Pencarian Cepat: Ketik IDPEL (12 digit), Nama Pelanggan, atau Merk Meter (Hexing, Wasion, Edmi, Itron)..."
                value={filters.searchQuery}
                onChange={(e) => {
                  setFilters({ ...filters, searchQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className={`w-full border rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium focus:outline-none transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-700/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-slate-500 shadow-inner'
                    : 'bg-slate-50 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-slate-900 placeholder-slate-400 focus:bg-white shadow-xs'
                }`}
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, searchQuery: '' });
                    setCurrentPage(1);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shrink-0 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span>Hasil Pencarian:</span>
              <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>
                {filteredAndSortedRecords.length.toLocaleString('id-ID')}
              </strong>
              <span className="text-[11px] text-slate-500">pelanggan</span>
            </div>
          </div>

          {/* Quick Filter Chips: Merk Meter WASION & shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cari Merk Meter:
            </span>
            {['WASION', 'HEXING', 'EDMI', 'ITRON', 'ACTARIS'].map((merk) => (
              <button
                key={merk}
                type="button"
                onClick={() => {
                  setFilters({ ...filters, searchQuery: filters.searchQuery.toUpperCase() === merk ? '' : merk });
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded-lg border font-mono font-medium transition ${
                  filters.searchQuery.toUpperCase() === merk
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {merk}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters with DISTINCTIVE COLORS for Differentiation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Dropdown 1: Unit Induk PLN (2 Digit IDPEL) - Amber / Orange Accent */}
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-amber-500" />
            <select
              value={filters.unitInduk}
              onChange={(e) => {
                setFilters({ ...filters, unitInduk: e.target.value });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl pl-8 pr-2.5 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-300 focus:border-amber-400'
                  : 'bg-amber-50/80 border-amber-300 text-amber-900 focus:border-amber-600 shadow-xs'
              }`}
              title="Filter Unit Induk PLN berdasarkan kode 2 digit awal IDPEL"
            >
              <option value="all">🏢 Semua Unit Induk PLN</option>
              {uniqueUnitInduks.map((code) => {
                const info = PLN_UNIT_INDUK_MAP[code];
                return (
                  <option key={code} value={code}>
                    [{code}] {info ? info.shortName : `UID Kode ${code}`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dropdown 2: Customer vs Non-Customer - Sky Blue Accent */}
          <div className="relative">
            <select
              value={filters.customerType}
              onChange={(e) => {
                setFilters({ ...filters, customerType: e.target.value as any });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-sky-950/20 border-sky-500/40 text-sky-300 focus:border-sky-400'
                  : 'bg-sky-50/80 border-sky-300 text-sky-900 focus:border-sky-600 shadow-xs'
              }`}
              title="Pisahkan Pelanggan Aktif vs Bukan Pelanggan / Fasilitas"
            >
              <option value="all">👥 Semua Kategori Konsumen</option>
              <option value="customer">✅ Customer (Pelanggan Aktif)</option>
              <option value="non_customer">⚠️ Non-Customer (PJU/Aset/Gardu)</option>
            </select>
          </div>

          {/* Dropdown 3: UNIT AP (UP3) - Emerald Accent */}
          <div className="relative">
            <select
              value={filters.unitAp}
              onChange={(e) => {
                setFilters({ ...filters, unitAp: e.target.value, unitUp: 'all' });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 focus:border-emerald-400'
                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-900 focus:border-emerald-600 shadow-xs'
              }`}
              title="Pilih UP3"
            >
              <option value="all">🏢 Semua Unit AP (UP3)</option>
              {uniqueAps.map((ap) => (
                <option key={ap.code || ap.name} value={ap.name}>
                  {ap.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 4: UNIT UP (ULP) - Teal Accent */}
          <div className="relative">
            <select
              value={filters.unitUp}
              onChange={(e) => {
                setFilters({ ...filters, unitUp: e.target.value });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-teal-950/20 border-teal-500/40 text-teal-300 focus:border-teal-400'
                  : 'bg-teal-50/80 border-teal-300 text-teal-900 focus:border-teal-600 shadow-xs'
              }`}
              title="Pilih ULP"
            >
              <option value="all">📍 Semua Unit UP (ULP)</option>
              {uniqueUps.map((up) => (
                <option key={up.code || up.name} value={up.name}>
                  {up.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 5: Status Anomali / Kategori - Rose Accent */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300 focus:border-rose-400'
                  : 'bg-rose-50/80 border-rose-300 text-rose-900 focus:border-rose-600 shadow-xs'
              }`}
            >
              <option value="all">Semua Status Anomali</option>
              <option value="critical">🚨 Anomali Kritis Saja</option>
              <option value="wiring_reverse">⚡ CT / Wiring Terbalik</option>
              <option value="unbalance">⚖️ Beban Tidak Seimbang (IEEE 141)</option>
              <option value="cosphi">📉 Cos φ Buruk (&lt;0.85/Negatif)</option>
              <option value="voltage">⚠️ Anomali Tegangan (Drop/Loss)</option>
              <option value="current">🔌 Anomali Arus (Loss/IN Tinggi)</option>
              <option value="normal">✅ Kondisi Normal Saja</option>
            </select>
          </div>

          {/* Dropdown 6: Phase Type (NO PARENTHESES: 1-Phase / 3-Phase) - Violet Accent */}
          <div className="relative">
            <select
              value={filters.phaseType}
              onChange={(e) => {
                setFilters({ ...filters, phaseType: e.target.value as any });
                setCurrentPage(1);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition ${
                isDark
                  ? 'bg-violet-950/20 border-violet-500/40 text-violet-300 focus:border-violet-400'
                  : 'bg-violet-50/80 border-violet-300 text-violet-900 focus:border-violet-600 shadow-xs'
              }`}
            >
              <option value="all">Semua Fasa</option>
              <option value="3-Phase">3-Phase</option>
              <option value="1-Phase">1-Phase</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container with Freeze Header and Responsive Scroll */}
      <div
        className={`overflow-x-auto overflow-y-auto relative border-t transition-all duration-150 scroll-smooth ${
          tableScrollHeight === 'compact'
            ? 'max-h-[460px]'
            : tableScrollHeight === 'tall'
            ? 'max-h-[820px]'
            : 'max-h-[620px]'
        } ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}
      >
        <table
          className="w-full text-xs text-left border-collapse min-w-[1200px]"
          style={{ zoom: `${tableZoom}%` }}
        >
          <thead
            className={`sticky top-0 z-20 uppercase tracking-wider text-[10px] border-b-2 select-none shadow-md backdrop-blur-md transition-colors ${
              isDark ? 'bg-slate-950 text-slate-300 border-slate-700 shadow-slate-950/90' : 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-300/70'
            }`}
          >
            <tr>
              {/* Checkbox Select All */}
              <th className="sticky top-0 z-20 py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedRecords.length > 0 && paginatedRecords.every((r) => selectedIds.has(r.id))}
                  onChange={handleSelectAll}
                  className="rounded accent-emerald-500 cursor-pointer"
                  title="Pilih semua baris pada halaman ini"
                />
              </th>

              <th className="sticky top-0 z-20 py-3 px-2 w-8 text-center text-slate-400">#</th>

              {visibleColumns.unitInduk && (
                <th
                  onClick={() => toggleSort('unitInduk')}
                  className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Unit Induk</span>
                    {renderSortIndicator('unitInduk')}
                    {renderColumnFilterDropdown(
                      'unitInduk',
                      'Unit Induk',
                      uniqueUnitInduks.map((c) => ({
                        label: `[${c}] ${PLN_UNIT_INDUK_MAP[c]?.shortName || c}`,
                        value: c,
                      }))
                    )}
                  </div>
                </th>
              )}

              <th
                onClick={() => toggleSort('idpel')}
                className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition"
              >
                <div className="flex items-center gap-1">
                  <span>ID Pelanggan &amp; Nama</span>
                  {renderSortIndicator('idpel')}
                </div>
              </th>

              {visibleColumns.customerType && (
                <th className="sticky top-0 z-20 py-3 px-2.5">
                  <div className="flex items-center gap-1">
                    <span>Kategori</span>
                    {renderColumnFilterDropdown('customerType', 'Kategori', [
                      { label: 'Customer', value: 'Customer' },
                      { label: 'Non-Customer', value: 'Non-Customer' },
                    ])}
                  </div>
                </th>
              )}

              {visibleColumns.tariffPower && (
                <th
                  onClick={() => toggleSort('tariff')}
                  className="sticky top-0 z-20 py-3 px-2.5 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Tarif &amp; Daya</span>
                    {renderSortIndicator('tariff')}
                    {renderColumnFilterDropdown(
                      'tariff',
                      'Tarif',
                      uniqueTariffs.map((t) => ({ label: t, value: t }))
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.meter && (
                <th
                  onClick={() => toggleSort('merk')}
                  className="sticky top-0 z-20 py-3 px-2.5 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Merk &amp; Seri Meter</span>
                    {renderSortIndicator('merk')}
                    {renderColumnFilterDropdown(
                      'merk',
                      'Merk Meter',
                      uniqueMerks.map((m) => ({ label: m, value: m }))
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.voltage && (
                <th
                  onClick={() => toggleSort('voltage')}
                  className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Tegangan (VR/VS/VT)</span>
                    {renderSortIndicator('voltage')}
                  </div>
                </th>
              )}

              {visibleColumns.current && (
                <th
                  onClick={() => toggleSort('current')}
                  className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Arus (IR/IS/IT/IN)</span>
                    {renderSortIndicator('current')}
                  </div>
                </th>
              )}

              {visibleColumns.thd && (
                <th className="sticky top-0 z-20 py-3 px-2.5">
                  <span>THD V / I (IEEE 519)</span>
                </th>
              )}

              {visibleColumns.cosphi && (
                <th
                  onClick={() => toggleSort('cosphi')}
                  className="sticky top-0 z-20 py-3 px-2.5 cursor-pointer hover:text-emerald-400 transition text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cos φ</span>
                    {renderSortIndicator('cosphi')}
                  </div>
                </th>
              )}

              {visibleColumns.actualKw && (
                <th
                  onClick={() => toggleSort('actualKw')}
                  className="sticky top-0 z-20 py-3 px-2.5 cursor-pointer hover:text-emerald-400 transition text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Beban (kW)</span>
                    {renderSortIndicator('actualKw')}
                  </div>
                </th>
              )}

              {visibleColumns.standAbsolute && (
                <th
                  onClick={() => toggleSort('standKwh')}
                  className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stand Absolut</span>
                    {renderSortIndicator('standKwh')}
                  </div>
                </th>
              )}

              {visibleColumns.health && (
                <th
                  onClick={() => toggleSort('health')}
                  className="sticky top-0 z-20 py-3 px-2.5 cursor-pointer hover:text-emerald-400 transition text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Kesehatan</span>
                    {renderSortIndicator('health')}
                  </div>
                </th>
              )}

              {visibleColumns.anomalies && (
                <th
                  onClick={() => toggleSort('anomalies')}
                  className="sticky top-0 z-20 py-3 px-3 cursor-pointer hover:text-emerald-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Temuan Anomali</span>
                    {renderSortIndicator('anomalies')}
                    {renderColumnFilterDropdown('anomalies', 'Status Anomali', [
                      { label: 'Normal', value: 'normal' },
                      { label: 'Kritis (CT Terbalik)', value: 'critical' },
                      { label: 'Peringatan', value: 'warning' },
                    ])}
                  </div>
                </th>
              )}

              {visibleColumns.actions && (
                <th className="sticky top-0 z-20 py-3 px-3 text-center">
                  <span>Aksi Lapangan</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className={`divide-y transition-colors ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-amber-500 opacity-60" />
                    <p className="font-semibold text-sm">Tidak ada pelanggan yang cocok dengan kriteria filter.</p>
                    <p className="text-xs">Coba sesuaikan filter Unit Induk, UP3, ULP, atau reset kata kunci pencarian.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, idx) => {
                const isSelected = selectedIds.has(r.id);
                const isExpanded = expandedId === r.id;
                const rowNum = (currentPage - 1) * pageSize + idx + 1;
                const criticalAnom = r.anomalies.filter((a) => a.severity === 'critical');
                const warningAnom = r.anomalies.filter((a) => a.severity === 'warning');
                const unitInfo = PLN_UNIT_INDUK_MAP[r.unitIndukCode || r.locationCode.substring(0, 2)];

                return (
                  <React.Fragment key={r.id}>
                    <tr
                      onClick={() => handleRowClick(r)}
                      className={`cursor-pointer transition duration-150 select-none ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-950/30 hover:bg-emerald-950/40'
                            : 'bg-emerald-50/70 hover:bg-emerald-100/60'
                          : isExpanded
                          ? isDark
                            ? 'bg-slate-800/60'
                            : 'bg-slate-100/80'
                          : isDark
                          ? 'hover:bg-slate-800/40 odd:bg-slate-900/40 even:bg-slate-950/20'
                          : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/40'
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => handleToggleRowSelect(r.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded accent-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[10px]">
                        {rowNum}
                      </td>

                      {/* Unit Induk 2-digit code badge */}
                      {visibleColumns.unitInduk && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${
                              unitInfo?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            title={unitInfo?.fullName || 'Unit Induk PLN'}
                          >
                            <span>{r.unitIndukCode || r.locationCode.substring(0, 2)}</span>
                            <span className="font-sans font-normal text-[10px] hidden sm:inline">
                              {unitInfo?.shortName.replace('UID ', '') || 'PLN'}
                            </span>
                          </span>
                        </td>
                      )}

                      {/* IDPEL & Customer Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span className={isDark ? 'text-white' : 'text-slate-900'}>{r.namaPelanggan}</span>
                          {/* Deduplication with anomaly count note */}
                          {r.sameIdpelAnomalyCount && r.sameIdpelAnomalyCount > 1 && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold"
                              title={`Terdapat beberapa data pada IDPEL ini. Dipilih yang berarus terbesar (${r.currentL1}A), dengan total ${r.sameIdpelAnomalyCount} temuan anomali.`}
                            >
                              ⚡ {r.sameIdpelAnomalyCount} Temuan (Arus Max)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}>
                            {r.locationCode}
                          </span>
                          <span>•</span>
                          <span>{r.namaUp || r.unitUp}</span>
                        </div>
                      </td>

                      {/* Customer vs Non-Customer */}
                      {visibleColumns.customerType && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          {r.isCustomer !== false ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Customer
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              Non-Cust
                            </span>
                          )}
                        </td>
                      )}

                      {/* Tariff & Power & Phase (NO PARENTHESES: 1-Phase / 3-Phase) */}
                      {visibleColumns.tariffPower && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <div className="font-bold text-xs">{r.tariff}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {r.power >= 1000 ? `${(r.power / 1000).toLocaleString('id-ID')} kVA` : `${r.power} VA`}{' '}
                            <span className="font-sans font-medium text-[9px] text-slate-400">
                              • {r.phaseType}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Meter Brand & Serial */}
                      {visibleColumns.meter && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <div className="font-semibold text-xs text-cyan-400">{r.merkMeter}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.assetMeterCode || '-'}</div>
                        </td>
                      )}

                      {/* Voltage VR/VS/VT & Unbalance V */}
                      {visibleColumns.voltage && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className={r.voltageL1 < 198 ? 'text-rose-400 font-bold' : ''}>
                              {r.voltageL1.toFixed(1)}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className={r.voltageL2 < 198 ? 'text-rose-400 font-bold' : ''}>
                              {r.voltageL2.toFixed(1)}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className={r.voltageL3 < 198 ? 'text-rose-400 font-bold' : ''}>
                              {r.voltageL3.toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-[10px]">V</span>
                          </div>
                          {/* Voltage Unbalance note */}
                          <div className="text-[10px] font-sans">
                            <span
                              className={`px-1 rounded text-[9px] font-bold ${
                                r.voltageUnbalancePct > 2.5
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'text-slate-500'
                              }`}
                            >
                              Unb V: {r.voltageUnbalancePct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Current IR/IS/IT/IN & Unbalance I (IEEE 141) */}
                      {visibleColumns.current && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className={r.currentL1 < 0.05 ? 'text-rose-400 font-bold' : ''}>
                              {r.currentL1.toFixed(1)}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className={r.currentL2 < 0.05 ? 'text-rose-400 font-bold' : ''}>
                              {r.currentL2.toFixed(1)}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className={r.currentL3 < 0.05 ? 'text-rose-400 font-bold' : ''}>
                              {r.currentL3.toFixed(1)}
                            </span>
                            <span className="text-slate-400 font-semibold" title="Arus Netral (IN)">
                              | N: {r.currentN.toFixed(1)}A
                            </span>
                          </div>
                          {/* Current Unbalance IEEE 141 tolerance */}
                          <div className="text-[10px] font-sans mt-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                r.currentUnbalancePct > 20
                                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                                  : r.currentUnbalancePct > 10
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'text-emerald-400'
                              }`}
                            >
                              Unb I: {r.currentUnbalancePct.toFixed(1)}% {r.currentUnbalancePct > 20 ? '(>20% Kritis IEEE)' : ''}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* THD V & I */}
                      {visibleColumns.thd && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap font-mono text-[10px]">
                          <div className={r.thdVoltage.avg > 5 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            THD-V: {r.thdVoltage.avg.toFixed(1)}%
                          </div>
                          <div className={r.thdCurrent.avg > 15 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            THD-I: {r.thdCurrent.avg.toFixed(1)}%
                          </div>
                        </td>
                      )}

                      {/* Cosphi */}
                      {visibleColumns.cosphi && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap font-mono text-[11px] text-right">
                          <span
                            className={`font-bold ${
                              r.powerFactorTotal < 0
                                ? 'text-rose-400 bg-rose-500/20 px-1 rounded'
                                : r.powerFactorTotal < 0.85
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {r.powerFactorTotal.toFixed(2)}
                          </span>
                        </td>
                      )}

                      {/* Actual kW */}
                      {visibleColumns.actualKw && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap font-mono text-[11px] text-right font-bold text-emerald-400">
                          {r.actualPowerKw.toFixed(1)}{' '}
                          <span className="text-[9px] font-normal text-slate-500">kW</span>
                        </td>
                      )}

                      {/* Stand Absolut kWh & kVARh */}
                      {visibleColumns.standAbsolute && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-right">
                          <div className="font-bold text-white">
                            {r.standKwhImport.toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                            <span className="text-[9px] text-slate-400">kWh</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {r.standKvarh.toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                            <span className="text-[9px] text-slate-500">kVARh</span>
                          </div>
                        </td>
                      )}

                      {/* Health score */}
                      {visibleColumns.health && (
                        <td className="py-2.5 px-2.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.healthScore >= 80
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : r.healthScore >= 50
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {r.healthScore}
                          </span>
                        </td>
                      )}

                      {/* Anomalies and Perdir 028 P2TL category */}
                      {visibleColumns.anomalies && (
                        <td className="py-2.5 px-3">
                          {r.anomalies.length === 0 ? (
                            <span className="text-emerald-500 text-[11px] flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Normal
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1">
                                {criticalAnom.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold">
                                    🚨 {criticalAnom[0].title}
                                  </span>
                                )}
                                {warningAnom.length > 0 && criticalAnom.length === 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                    ⚠️ {warningAnom[0].title}
                                  </span>
                                )}
                              </div>
                              {/* Perdir 028 Category Tag */}
                              {r.anomalies[0]?.p2tlGolongan && (
                                <div className="text-[9px] text-indigo-300 font-semibold">
                                  Rujukan: {r.anomalies[0].p2tlGolongan}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Action buttons with distinctive color coding */}
                      {visibleColumns.actions && (
                        <td className="py-2.5 px-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Blue Button: Buka Fasor */}
                            <button
                              onClick={() => {
                                setHighlightedRecord(r);
                                onSelectRecord(r);
                                setDetailModalRecord(r);
                                setDetailModalInitialTab('phasor');
                                setDetailModalSplit(false);
                                setDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow"
                              title="Buka Diagram Fasor & Detail"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Violet Button: Cetak Berita Acara P2TL (Perdir 028) */}
                            <button
                              onClick={() => printBeritaAcaraP2TL(r)}
                              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition shadow"
                              title="Cetak Berita Acara P2TL Resmi Perdir 028"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Amber Button: Buka Split View Perbandingan */}
                            <button
                              onClick={() => {
                                setHighlightedRecord(r);
                                onSelectRecord(r);
                                setDetailModalRecord(r);
                                setDetailModalInitialTab('phasor');
                                setDetailModalSplit(true);
                                setDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow"
                              title="Bandingkan Fasor Bersebelahan (Split-View) dengan Meter Lain"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Inline Expandable Panel (Phasor, Trend, Monthly Consumption, Keterangan) */}
                    {isExpanded && (
                      <tr className={isDark ? 'bg-slate-900/90' : 'bg-slate-50'}>
                        <td colSpan={16} className="p-4 border-y border-emerald-500/30">
                          <div className="space-y-4">
                            {/* Tab Switcher inside expansion */}
                            <div className="flex items-center justify-between border-b pb-2 border-slate-700/50">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">
                                  Investigasi Meter: {r.namaPelanggan} ({r.locationCode})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <button
                                  onClick={() => setExpandedTab('phasor')}
                                  className={`px-3 py-1 rounded-lg transition ${
                                    expandedTab === 'phasor'
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Diagram Fasor
                                </button>
                                <button
                                  onClick={() => setExpandedTab('trend')}
                                  className={`px-3 py-1 rounded-lg transition ${
                                    expandedTab === 'trend'
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Tren Pemakaian
                                </button>
                                <button
                                  onClick={() => setExpandedTab('charts')}
                                  className={`px-3 py-1 rounded-lg transition ${
                                    expandedTab === 'charts'
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Profil 12 Bulan
                                </button>
                              </div>
                            </div>

                            {/* Tab contents */}
                            {expandedTab === 'phasor' && (
                              <div className="p-2">
                                <PhasorDiagram record={r} />
                              </div>
                            )}

                            {expandedTab === 'trend' && (
                              <div className="p-2">
                                <CustomerTrendChart record={r} />
                              </div>
                            )}

                            {expandedTab === 'charts' && (
                              <div className="p-2">
                                <ConsumptionCharts records={[r]} selectedRecord={r} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        <div>
          Menampilkan baris <strong>{Math.min(filteredAndSortedRecords.length, (currentPage - 1) * pageSize + 1)}</strong> -{' '}
          <strong>{Math.min(filteredAndSortedRecords.length, currentPage * pageSize)}</strong> dari total{' '}
          <strong>{filteredAndSortedRecords.length.toLocaleString('id-ID')}</strong> pelanggan
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl border font-semibold transition ${
              currentPage === 1
                ? 'opacity-40 cursor-not-allowed'
                : isDark
                ? 'hover:bg-slate-800 text-white'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            Sebelumnya
          </button>
          <span>
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl border font-semibold transition ${
              currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed'
                : isDark
                ? 'hover:bg-slate-800 text-white'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            Berikutnya
          </button>
        </div>
      </div>

      {/* Customer Detail Investigation Modal with Left Buttons & Split View */}
      {detailModalOpen && detailModalRecord && (
        <CustomerDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          record={detailModalRecord}
          allRecords={records}
          onSelectRecord={(r) => {
            setHighlightedRecord(r);
            onSelectRecord(r);
            setDetailModalRecord(r);
          }}
          initialTab={detailModalInitialTab}
          initialSplitMode={detailModalSplit}
        />
      )}
    </div>
  );
};
