import React from 'react';
import { Layers, Building2, ExternalLink } from 'lucide-react';

interface SectorHolding {
  id: number;
  symbol: string;
  name: string;
  allocation_percent: number;
  holding_value: number;
}

interface CompanyHolding {
  id: number;
  company_name: string;
  ticker: string;
  allocation_percent: number;
  holding_value: number;
}

const DEFAULT_SECTORS: SectorHolding[] = [
  { id: 1, symbol: 'XLK', name: 'Technology', allocation_percent: 38.5, holding_value: 3898.12 },
  { id: 2, symbol: 'XLF', name: 'Financial Services', allocation_percent: 22.1, holding_value: 2237.62 },
  { id: 3, symbol: 'XLV', name: 'Healthcare & Biotech', allocation_percent: 16.4, holding_value: 1660.50 },
  { id: 4, symbol: 'XLE', name: 'Energy & Clean Tech', allocation_percent: 12.2, holding_value: 1235.25 },
  { id: 5, symbol: 'XLY', name: 'Consumer Discretionary', allocation_percent: 10.8, holding_value: 1093.51 },
];

const DEFAULT_COMPANIES: CompanyHolding[] = [
  { id: 1, company_name: 'Layzoo Ltd.', ticker: 'LYZ', allocation_percent: 24.2, holding_value: 1420.50 },
  { id: 2, company_name: 'NightBlink Ltd.', ticker: 'NBL', allocation_percent: 20.1, holding_value: 1180.20 },
  { id: 3, company_name: 'Lcyflame Ltd.', ticker: 'LCY', allocation_percent: 16.1, holding_value: 945.80 },
  { id: 4, company_name: 'Feelopie Services Ltd.', ticker: 'FLP', allocation_percent: 13.9, holding_value: 820.00 },
  { id: 5, company_name: 'Grofler Ltd.', ticker: 'GRF', allocation_percent: 11.6, holding_value: 685.40 },
];

interface Row5Props {
  sectors?: SectorHolding[];
  companies?: CompanyHolding[];
}

export const Row5FundTables: React.FC<Row5Props> = ({
  sectors = DEFAULT_SECTORS,
  companies = DEFAULT_COMPANIES,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Table 1: Sectors Holding In This Online Fund */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sectors Holding In This Online Fund
              </h2>
              <span className="text-xs text-slate-400">Sectoral allocation weights</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            5 Core Sectors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Symbol / Sector</th>
                <th className="py-2.5 px-3">Allocation</th>
                <th className="py-2.5 px-3 text-right">Holding Value ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {sectors.map((sector) => (
                <tr
                  key={sector.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sector.symbol}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {sector.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 w-44">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${sector.allocation_percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-500 font-semibold w-10 text-right">
                        {sector.allocation_percent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${sector.holding_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Companies Holding in This Online Fund */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Companies Holding in This Online Fund
              </h2>
              <span className="text-xs text-slate-400">Institutional company holdings</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Top Holdings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3">Allocation</th>
                <th className="py-2.5 px-3 text-right">Holding Value ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        {company.ticker}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {company.company_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 w-44">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${company.allocation_percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-500 font-semibold w-10 text-right">
                        {company.allocation_percent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${company.holding_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
