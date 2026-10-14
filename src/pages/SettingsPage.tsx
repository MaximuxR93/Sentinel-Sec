import React, { useState } from 'react';
import { Sliders, Shield, Key, GitBranch, Database, Check, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { dbStatus, connectAtlas, refreshDbStatus } = useAuth();

  const [osvCacheEnabled, setOsvCacheEnabled] = useState(true);
  const [ssrfGuardrailStrict, setSsrfGuardrailStrict] = useState(true);
  const [autoDiffGeneration, setAutoDiffGeneration] = useState(true);
  const [saved, setSaved] = useState(false);

  // Atlas Connection
  const [atlasUri, setAtlasUri] = useState('');
  const [isTestingAtlas, setIsTestingAtlas] = useState(false);
  const [atlasMsg, setAtlasMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConnectAtlas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atlasUri.trim()) return;
    setIsTestingAtlas(true);
    setAtlasMsg(null);
    try {
      const res = await connectAtlas(atlasUri.trim());
      setAtlasMsg({ type: 'success', text: res.message });
      setAtlasUri('');
    } catch (err: any) {
      setAtlasMsg({ type: 'error', text: err.message || 'Failed to connect to MongoDB Atlas' });
    } finally {
      setIsTestingAtlas(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          System & Database Settings
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          MongoDB Atlas persistence, telemetry storage, scan policies, network isolation constraints, and OSV cache.
        </p>
      </div>

      {/* MongoDB Atlas Database Status & Connector */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#CED5E0]">
          <div className="flex items-center gap-2">
            <Database size={18} strokeWidth={1.7} className="text-[#2f5f9e]" />
            <h3 className="text-[18px] font-[500] text-[#020C21]">MongoDB Atlas Telemetry Store</h3>
          </div>
          <button
            onClick={() => refreshDbStatus()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#CED5E0] bg-[#F4F7FB] hover:bg-[#E6EDF6] text-[12px] font-[470] text-[#0F1B31] transition-colors cursor-pointer"
          >
            <RefreshCw size={12} strokeWidth={1.7} />
            <span>Ping Check</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-[14px] bg-[#F4F7FB] border border-[#DDE4EE]">
            <span className="text-[11px] font-[470] uppercase text-[#59627E] block">Connection State</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[14px] font-[520] text-[#020C21]">
                {dbStatus?.connected ? 'Atlas Connected' : 'Local Memory Buffer'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-[14px] bg-[#F4F7FB] border border-[#DDE4EE]">
            <span className="text-[11px] font-[470] uppercase text-[#59627E] block">Cluster / Target</span>
            <span className="text-[13px] font-mono text-[#020C21] mt-1 block truncate">
              {dbStatus?.connected ? dbStatus.cluster : 'In-Memory (Local)'}
            </span>
          </div>

          <div className="p-3.5 rounded-[14px] bg-[#F4F7FB] border border-[#DDE4EE]">
            <span className="text-[11px] font-[470] uppercase text-[#59627E] block">Round-Trip Latency</span>
            <span className="text-[13px] font-mono text-[#020C21] mt-1 block">
              {dbStatus?.connected ? `${dbStatus.lastPingMs} ms` : '< 1 ms (Local)'}
            </span>
          </div>
        </div>

        {/* Update Atlas URI */}
        <form onSubmit={handleConnectAtlas} className="space-y-3 pt-2">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1">
              Connect to MongoDB Atlas Cluster (URI)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="mongodb+srv://<user>:<password>@cluster0.mongodb.net/sentinelflow?retryWrites=true&w=majority"
                value={atlasUri}
                onChange={(e) => setAtlasUri(e.target.value)}
                className="flex-1 font-mono text-[12px] rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
              />
              <button
                type="submit"
                disabled={isTestingAtlas || !atlasUri.trim()}
                className="rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isTestingAtlas ? 'Pinging Atlas...' : 'Test & Connect'}
              </button>
            </div>
            <p className="text-[11px] text-[#59627E] mt-1">
              Stores collections <code className="bg-[#E6EDF6] px-1 py-0.2 rounded font-mono">users</code>, <code className="bg-[#E6EDF6] px-1 py-0.2 rounded font-mono">sessions</code> (with 24h TTL index), and <code className="bg-[#E6EDF6] px-1 py-0.2 rounded font-mono">audit_logs</code>.
            </p>
          </div>

          {atlasMsg && (
            <div
              className={`rounded-[12px] p-3 text-[13px] flex items-center gap-2 ${
                atlasMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-[#FADADD] border border-[#A1121F]/30 text-[#A1121F]'
              }`}
            >
              {atlasMsg.type === 'success' ? (
                <CheckCircle2 size={15} strokeWidth={1.7} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={15} strokeWidth={1.7} className="shrink-0" />
              )}
              <span>{atlasMsg.text}</span>
            </div>
          )}
        </form>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Isolation & SSRF Protection */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#CED5E0]">
            <Shield size={18} strokeWidth={1.7} className="text-[#4A78B0]" />
            <h3 className="text-[18px] font-[500] text-[#020C21]">Ingestion & SSRF Guardrails</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[14px] font-[500] text-[#020C21] block">
                Strict Public DNS Revalidation
              </span>
              <p className="text-[13px] text-[#59627E]">
                Block private RFC-1918, loopback (127.0.0.1), and cloud link-local metadata addresses (169.254.169.254).
              </p>
            </div>
            <input
              type="checkbox"
              checked={ssrfGuardrailStrict}
              onChange={(e) => setSsrfGuardrailStrict(e.target.checked)}
              className="h-5 w-5 rounded border-[#CED5E0] text-[#0F1B31] focus:ring-[#2f5f9e]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#DDE4EE]">
            <div className="space-y-0.5">
              <span className="text-[14px] font-[500] text-[#020C21] block">
                Sandboxed Git Command Execution
              </span>
              <p className="text-[13px] text-[#59627E]">
                Never invoke shell=True. Pass array arguments with safe git flag delimiters (--).
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              disabled
              className="h-5 w-5 rounded border-[#CED5E0] text-[#0F1B31]"
            />
          </div>
        </div>

        {/* Vulnerability Scanning Policies */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#CED5E0]">
            <Sliders size={18} strokeWidth={1.7} className="text-[#4A78B0]" />
            <h3 className="text-[18px] font-[500] text-[#020C21]">OSV & Advisory Cache</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[14px] font-[500] text-[#020C21] block">
                Local OSV Advisory Cache
              </span>
              <p className="text-[13px] text-[#59627E]">
                Caches package vulnerability queries in local storage to prevent remote rate-limiting.
              </p>
            </div>
            <input
              type="checkbox"
              checked={osvCacheEnabled}
              onChange={(e) => setOsvCacheEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-[#CED5E0] text-[#0F1B31]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#DDE4EE]">
            <div className="space-y-0.5">
              <span className="text-[14px] font-[500] text-[#020C21] block">
                Automated Patch & Diff Generation
              </span>
              <p className="text-[13px] text-[#59627E]">
                Drafts unified git diffs for verified code injection and outdated package findings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoDiffGeneration}
              onChange={(e) => setAutoDiffGeneration(e.target.checked)}
              className="h-5 w-5 rounded border-[#CED5E0] text-[#0F1B31]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#0F1B31] px-6 py-2.5 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors cursor-pointer shadow-sm"
          >
            {saved ? (
              <>
                <Check size={16} />
                <span>Saved Changes</span>
              </>
            ) : (
              <span>Save Policy Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
