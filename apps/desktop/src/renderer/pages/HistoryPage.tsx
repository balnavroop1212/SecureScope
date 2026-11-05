import React, { useState } from 'react';
import { Search, History, Filter, ArrowUpDown } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const HistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-graphite border border-slateBorder">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter past scans by website URL..."
            className="w-full bg-obsidian border border-slateBorder rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-textMain placeholder-textMuted focus:outline-none focus:border-cyanBrand transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian border border-slateBorder text-xs text-textMuted">
            <Filter className="w-3.5 h-3.5 text-cyanBrand" />
            <span>Mode: All</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian border border-slateBorder text-xs text-textMuted">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyanBrand" />
            <span>Sort: Latest First</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <Card className="p-0 overflow-hidden border-slateBorder">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slateBorder bg-obsidian-900/60 text-textMuted text-[11px] font-mono uppercase tracking-wider">
                <th className="py-3 px-6">Target Website</th>
                <th className="py-3 px-6">Scan Date & Time</th>
                <th className="py-3 px-6">Scan Mode</th>
                <th className="py-3 px-6">Findings Summary</th>
                <th className="py-3 px-6">Highest Risk</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slateBorder/60 text-xs font-mono">
              {/* Empty State */}
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-graphite border border-slateBorder flex items-center justify-center mx-auto text-textMuted">
                      <History className="w-6 h-6 text-cyanBrand/50" />
                    </div>
                    <h4 className="text-sm font-semibold text-textMain">No Saved Scans Yet</h4>
                    <p className="text-xs text-textMuted">
                      Your assessment history and comprehensive vulnerability reports will appear here automatically.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
