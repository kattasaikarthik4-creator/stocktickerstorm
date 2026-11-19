import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, TrendingUp, DollarSign, Wallet, Percent, ArrowDownRight } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

interface Row1MetricsProps {
  indexValue?: number;
  indexChangePercent?: number;
  investedCapital?: number;
  currentValuation?: number;
  roiPercent?: number;
  sparklineData?: number[];
  currency?: 'USD' | 'IDR';
}

export const Row1Metrics: React.FC<Row1MetricsProps> = ({
  indexValue = 60021.21,
  indexChangePercent = 1.42,
  investedCapital = 8032,
  currentValuation = 10125,
  roiPercent = 28.2,
  sparklineData = [59200, 59450, 59380, 59720, 59650, 59900, 60021.21],
  currency = 'USD',
}) => {
  // Flash animation trigger when live valuation modifies
  const [valFlash, setValFlash] = useState<'up' | 'down' | null>(null);
  const prevValRef = useRef(currentValuation);

  useEffect(() => {
    if (currentValuation > prevValRef.current) {
      setValFlash('up');
      const timer = setTimeout(() => setValFlash(null), 800);
      prevValRef.current = currentValuation;
      return () => clearTimeout(timer);
    } else if (currentValuation < prevValRef.current) {
      setValFlash('down');
      const timer = setTimeout(() => setValFlash(null), 800);
      prevValRef.current = currentValuation;
      return () => clearTimeout(timer);
    }
  }, [currentValuation]);

  const isPositiveROI = roiPercent >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* 1. Index / Market Overview Card */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Market Overview
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +{indexChangePercent.toFixed(2)}%
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
              {formatCurrency(indexValue, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">S&P Benchmark Index</div>
          </div>
          <div className="w-24 h-10">
            <Sparkline data={sparklineData} width={96} height={36} isPositive={true} />
          </div>
        </div>
      </div>

      {/* 2. Your Investment Card */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Investment
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {formatCurrency(investedCapital, currency)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Capital invested</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+15.4% yoy</span>
          </div>
        </div>
      </div>

      {/* 3. Current Value Card - Dynamic Live Flash */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Current Value
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-2xl lg:text-3xl font-extrabold tracking-tight font-mono transition-colors duration-300 ${
              valFlash === 'up'
                ? 'text-emerald-500'
                : valFlash === 'down'
                ? 'text-rose-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatCurrency(currentValuation, currency)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              +{formatCurrency(currentValuation - investedCapital, currency)}
            </span>
            <span>overall profit</span>
          </div>
        </div>
      </div>

      {/* 4. ROI Card */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ROI
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Percent className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div
              className={`text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-1 font-mono ${
                isPositiveROI ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositiveROI ? '+' : ''}{roiPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Net Return on Investment</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20">
            Optimal
          </span>
        </div>
      </div>
    </div>
  );
};
