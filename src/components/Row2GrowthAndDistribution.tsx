import React, { useState } from 'react';
import { Home, Plane, ArrowUpRight, Plus, X, Sparkles, Target, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

interface GrowthPoint {
  month: string;
  value: number;
}

const TIMEFRAME_DATA: Record<'1M' | '6M' | '1Y' | 'ALL', GrowthPoint[]> = {
  '1M': [
    { month: 'Nov 1', value: 9650 },
    { month: 'Nov 4', value: 9780 },
    { month: 'Nov 8', value: 9890 },
    { month: 'Nov 11', value: 9940 },
    { month: 'Nov 13', value: 10050 },
    { month: 'Nov 15', value: 10090 },
    { month: 'Nov 16', value: 10125 },
  ],
  '6M': [
    { month: 'May', value: 6820 },
    { month: 'Jun', value: 7240 },
    { month: 'Jul', value: 7100 },
    { month: 'Aug', value: 7850 },
    { month: 'Sep', value: 8430 },
    { month: 'Oct', value: 9280 },
    { month: 'Nov', value: 10125 },
  ],
  '1Y': [
    { month: 'Nov 25', value: 5400 },
    { month: 'Jan 26', value: 6100 },
    { month: 'Mar 26', value: 6600 },
    { month: 'May 26', value: 6820 },
    { month: 'Jul 26', value: 7100 },
    { month: 'Sep 26', value: 8430 },
    { month: 'Nov 26', value: 10125 },
  ],
  'ALL': [
    { month: '2023', value: 3800 },
    { month: '2024', value: 5200 },
    { month: 'Q2 25', value: 6400 },
    { month: 'Q4 25', value: 7800 },
    { month: 'Q2 26', value: 8900 },
    { month: 'Q4 26', value: 10125 },
  ],
};

interface TargetGoal {
  id: string;
  name: string;
  total_value: number;
  target_amount: number;
  roi_percent: number;
  iconType: 'house' | 'plane' | 'general';
}

const DEFAULT_TARGETS: TargetGoal[] = [
  {
    id: 'port_house_02',
    name: 'Dream House',
    total_value: 545569,
    target_amount: 700000,
    roi_percent: 2.5,
    iconType: 'house',
  },
  {
    id: 'port_travel_03',
    name: 'My Travel',
    total_value: 345155,
    target_amount: 500000,
    roi_percent: 4.5,
    iconType: 'plane',
  },
];

interface Row2Props {
  livePortfolioValuation?: number;
  currency?: 'USD' | 'IDR';
}

export const Row2GrowthAndDistribution: React.FC<Row2Props> = ({ livePortfolioValuation = 10125, currency = 'USD' }) => {
  const { token } = useAuth();
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | 'ALL'>('6M');
  const [hoveredPoint, setHoveredPoint] = useState<GrowthPoint | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Dynamic Targets List
  const [targets, setTargets] = useState<TargetGoal[]>(DEFAULT_TARGETS);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('250000');
  const [newGoalInitial, setNewGoalInitial] = useState('125000');

  // Dynamic data for the selected timeframe
  const rawData = TIMEFRAME_DATA[timeframe];
  // Apply live valuation to the latest point
  const data = rawData.map((pt, idx) => {
    if (idx === rawData.length - 1) {
      return { ...pt, value: Math.round(livePortfolioValuation) };
    }
    return pt;
  });

  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values) * 0.95;
  const maxValue = Math.max(...values) * 1.05;
  const range = maxValue - minValue || 1;

  const points = data.map((pt, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((pt.value - minValue) / range) * (height - paddingY * 2);
    return { x, y, ...pt };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Dynamic Donut Allocation
  const donutRadius = 65;
  const donutStrokeWidth = 18;
  const centerCoord = 90;
  const circumference = 2 * Math.PI * donutRadius;

  const segments = [
    { name: 'Large Cap Funds', percent: 45, color: '#10B981', amount: livePortfolioValuation * 0.45 },
    { name: 'Diversified Funds', percent: 35, color: '#06B6D4', amount: livePortfolioValuation * 0.35 },
    { name: 'Debt Funds', percent: 20, color: '#6366F1', amount: livePortfolioValuation * 0.20 },
  ];

  let accumulatedPercent = 0;

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const targetVal = Number(newGoalTarget) || 100000;
    const currentVal = Number(newGoalInitial) || 50000;

    const newTarget: TargetGoal = {
      id: `port_custom_${Date.now()}`,
      name: newGoalName.trim(),
      total_value: currentVal,
      target_amount: targetVal,
      roi_percent: 3.8,
      iconType: 'general',
    };

    setTargets((prev) => [newTarget, ...prev.slice(0, 2)]);
    setIsAddGoalOpen(false);
    setNewGoalName('');

    // Persist to backend if token exists
    if (token) {
      try {
        await fetch('/api/portfolio/targets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newTarget.name,
            target_amount: targetVal,
            total_value: currentVal,
            invested_amount: currentVal * 0.95,
          }),
        });
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-6">
      {/* 1. Large Investment Growth Area Chart (Column 1: 6 cols) */}
      <div className="lg:col-span-6 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Investment Growth
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                Dynamic Live Trajectory
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive timeline trajectory ({timeframe} view)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            {(['1M', '6M', '1Y', 'ALL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeframe === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Area Chart Container */}
        <div className="relative w-full h-[220px]">
          {hoveredPoint && (
            <div
              className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full border border-slate-700"
              style={{
                left: `${(data.findIndex((d) => d.month === hoveredPoint.month) / (data.length - 1)) * 100}%`,
                top: '25%',
              }}
            >
              <div className="text-[10px] text-slate-400 font-sans">{hoveredPoint.month}</div>
              <div className="font-bold text-emerald-400">{formatCurrency(hoveredPoint.value, currency)}</div>
            </div>
          )}

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Subtle horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((fraction) => {
              const yVal = minValue + fraction * range;
              const y = height - paddingY - ((yVal - minValue) / range) * (height - paddingY * 2);
              return (
                <line
                  key={fraction}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Solid Area Fill */}
            <path d={areaD} fill="#10B981" fillOpacity="0.12" />

            {/* Smooth Emerald Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Nodes */}
            {points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.month === pt.month ? 6 : 4}
                  className="fill-white dark:fill-[#111827] stroke-[#10B981] stroke-[2.5] cursor-pointer transition-all hover:scale-125"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-slate-400 dark:fill-slate-500"
                >
                  {pt.month}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 2. Donut Chart: Your Portfolio (Column 2: 3 cols) */}
      <div className="lg:col-span-3 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Your Portfolio
          </h2>
          <p className="text-xs text-slate-400">
            Fund distribution breakdown
          </p>
        </div>

        {/* Donut Graphic */}
        <div className="relative flex items-center justify-center my-3">
          <svg width={180} height={180} className="transform -rotate-90">
            {segments.map((seg, idx) => {
              const dashLength = (seg.percent / 100) * circumference;
              const dashOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += seg.percent;

              return (
                <circle
                  key={idx}
                  cx={centerCoord}
                  cy={centerCoord}
                  r={donutRadius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={selectedSegment === idx ? donutStrokeWidth + 4 : donutStrokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setSelectedSegment(idx)}
                  onMouseLeave={() => setSelectedSegment(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400">
              {selectedSegment !== null ? segments[selectedSegment].name : 'Total Valuation'}
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
              {formatCurrency(selectedSegment !== null
                ? segments[selectedSegment].amount
                : livePortfolioValuation, currency)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setSelectedSegment(idx)}
              onMouseLeave={() => setSelectedSegment(null)}
              className={`flex items-center justify-between text-xs p-1 rounded-lg cursor-pointer transition-colors ${
                selectedSegment === idx ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{seg.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">{seg.percent}%</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(Math.round(seg.amount), currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Target Portfolio Cards (Column 3: 3 cols) - Dynamic Goals */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-4">
        {targets.slice(0, 2).map((tgt, index) => {
          const pct = Math.min(100, Math.round((tgt.total_value / tgt.target_amount) * 100));
          const isHouse = tgt.iconType === 'house' || tgt.name.toLowerCase().includes('house');

          return (
            <div
              key={tgt.id || index}
              className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex-1 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isHouse
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                    }`}
                  >
                    {isHouse ? <Home className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {tgt.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Goal: {formatCurrency(tgt.target_amount, currency)}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                  <ArrowUpRight className="w-3 h-3" />
                  +{tgt.roi_percent}% profit
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(tgt.total_value, currency)}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isHouse
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-teal-600 dark:text-teal-400'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHouse ? 'bg-emerald-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic "+ Modify / Add Target Goal" Button */}
        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors bg-white/50 dark:bg-slate-900/40"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Target Goal</span>
        </button>
      </div>

      {/* Add Custom Goal Modal */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setIsAddGoalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold">New Target Portfolio</h3>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. Retirement Reserve or Tesla Model 3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="250000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Initial Saved Amount ($)
                </label>
                <input
                  type="number"
                  required
                  value={newGoalInitial}
                  onChange={(e) => setNewGoalInitial(e.target.value)}
                  placeholder="125000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
              >
                Save Target Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
