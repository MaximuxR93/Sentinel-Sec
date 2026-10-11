import React, { useState } from 'react';
import { Sliders, Shield, Key, GitBranch, Database, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [osvCacheEnabled, setOsvCacheEnabled] = useState(true);
  const [ssrfGuardrailStrict, setSsrfGuardrailStrict] = useState(true);
  const [autoDiffGeneration, setAutoDiffGeneration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Security Engine Settings
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Scan policies, network isolation constraints, OSV cache parameters, and GitHub OAuth integration.
        </p>
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
            <Database size={18} strokeWidth={1.7} className="text-[#4A78B0]" />
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
