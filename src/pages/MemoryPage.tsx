import React, { useState, useEffect } from 'react';
import { Brain, Search, Database, Calendar } from 'lucide-react';
import { api } from '../lib/api-client';
import { MemoryItem } from '../types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const MemoryPage: React.FC = () => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = async (q: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.searchMemory(q);
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Security Context Memory
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Persistent knowledge retrieval: CVE advisories, domain allowlists, and confirmed analyst overrides.
        </p>
      </div>

      {/* Search Input */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 bg-white border border-[#CED5E0] rounded-[16px] p-2.5 shadow-sm"
      >
        <Search size={18} strokeWidth={1.7} className="text-[#59627E] ml-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Semantic search query (e.g. lodash prototype pollution, git shell injection)..."
          className="w-full bg-transparent text-[14px] text-[#020C21] placeholder-[#59627E] outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-[#0F1B31] text-white px-5 py-1.5 text-[13px] font-[500] hover:bg-[#020C21] transition-colors cursor-pointer shrink-0"
        >
          Search
        </button>
      </form>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={4} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No memory items found"
          description="Try querying for general vulnerability concepts or rules."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-[520] text-[#020C21]">
                  {item.key}
                </span>
                <span className="text-[11px] font-[500] uppercase px-2.5 py-0.5 rounded-full bg-[#E6EDF6] text-[#1F4E79]">
                  {item.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[14px] font-[425] text-[#59627E] leading-relaxed">
                {item.content}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#CED5E0] text-[12px] text-[#59627E]">
                <span>Relevance Score: {(item.score * 100).toFixed(0)}%</span>
                <span>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
