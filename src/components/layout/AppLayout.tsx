import React from 'react';
import { Navbar } from './Navbar';
import { ShieldCheck, Server, Lock } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#E6EDF6] text-[#020C21] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 pb-16 w-full">
        {children}
      </main>
      <footer className="border-t border-[#CED5E0] bg-[#E6EDF6] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] font-[470] text-[#59627E]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} strokeWidth={1.7} className="text-[#4A78B0]" />
              <span>SentinelFlow Security Engine</span>
            </span>
            <span className="h-3 w-px bg-[#CED5E0]" />
            <span className="flex items-center gap-1.5">
              <Server size={14} strokeWidth={1.7} />
              <span>FastAPI Gateway v1.0</span>
            </span>
            <span className="h-3 w-px bg-[#CED5E0]" />
            <span className="flex items-center gap-1.5">
              <Lock size={14} strokeWidth={1.7} />
              <span>OSV & SAST Grounded</span>
            </span>
          </div>
          <div>
            <span>Read-only evidence verification mode active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
