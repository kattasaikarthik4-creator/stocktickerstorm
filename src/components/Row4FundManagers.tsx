import React from 'react';
import { Star, ShieldCheck, TrendingUp, Award, ExternalLink } from 'lucide-react';

interface FundManager {
  id: string;
  name: string;
  role: string;
  avatar: string;
  scheme_name: string;
  aum: string;
  rating: number;
  three_year_return: number;
  experience: string;
}

const DEFAULT_MANAGERS: FundManager[] = [
  {
    id: 'mgr_1',
    name: 'Kevin Black',
    role: 'Fund Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    scheme_name: 'Alpha Growth Opportunity Scheme',
    aum: '$1.2B AUM',
    rating: 4.9,
    three_year_return: 24.6,
    experience: '14 yrs exp',
  },
  {
    id: 'mgr_2',
    name: 'Sarah Jenkins',
    role: 'Senior Portfolio Manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    scheme_name: 'Horizon Bluechip Innovation Scheme',
    aum: '$950M AUM',
    rating: 4.8,
    three_year_return: 22.1,
    experience: '11 yrs exp',
  },
  {
    id: 'mgr_3',
    name: 'David Chen',
    role: 'Quantitative Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    scheme_name: 'Apex Global Macro Strategies',
    aum: '$1.8B AUM',
    rating: 5.0,
    three_year_return: 28.4,
    experience: '16 yrs exp',
  },
  {
    id: 'mgr_4',
    name: 'Elena Rostova',
    role: 'Director of Equities',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scheme_name: 'Clean Planet & Emerging Tech Scheme',
    aum: '$740M AUM',
    rating: 4.7,
    three_year_return: 19.8,
    experience: '9 yrs exp',
  },
];

interface Row4Props {
  managers?: FundManager[];
}

export const Row4FundManagers: React.FC<Row4Props> = ({ managers = DEFAULT_MANAGERS }) => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Fund Managers
          </h2>
          <p className="text-xs text-slate-400">
            People managing the money
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {managers.map((mgr) => (
          <div
            key={mgr.id}
            className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
          >
            <div>
              {/* Header with Avatar & Rating */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={mgr.avatar}
                    alt={mgr.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {mgr.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {mgr.role}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {mgr.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400">({mgr.experience})</span>
                  </div>
                </div>
              </div>

              {/* Scheme Title */}
              <div className="mt-3.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Scheme
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                  {mgr.scheme_name}
                </span>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  AUM
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {mgr.aum}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  3Y Return
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{mgr.three_year_return.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
