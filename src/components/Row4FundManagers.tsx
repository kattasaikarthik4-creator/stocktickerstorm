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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Schemes Managed By</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              Verified Fund Directors
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Institutional asset managers with verified track records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {managers.map((mgr) => (
          <div
            key={mgr.id}
            className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header with Avatar & Rating */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={mgr.avatar}
                    alt={mgr.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-emerald-500/50 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">
                    <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                  </div>
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
              <div className="mt-3.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Managed Scheme
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                  {mgr.scheme_name}
                </span>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
                  3Y Annualized
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono flex items-center justify-end gap-0.5">
                  <TrendingUp className="w-3 h-3" />
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
