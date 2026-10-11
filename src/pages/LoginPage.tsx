import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { api } from '../lib/api-client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@sentinelflow.io');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.login(email);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md rounded-[20px] bg-white border border-[#DDE4EE] p-8 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1B31] text-white">
            <Shield size={24} strokeWidth={1.7} />
          </div>
          <h1 className="text-[24px] font-[500] text-[#020C21]">Analyst Authentication</h1>
          <p className="text-[14px] font-[425] text-[#59627E]">
            Sign in to access SentinelFlow security intelligence console.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Access Token / Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#0F1B31] py-2.5 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={15} strokeWidth={1.7} />
          </button>
        </form>

        <div className="pt-4 border-t border-[#CED5E0] text-center text-[12px] text-[#59627E]">
          Session verified via hardware token & RBAC scopes
        </div>
      </div>
    </div>
  );
};
