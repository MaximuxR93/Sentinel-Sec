import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  KeyRound,
  UserPlus,
  LogIn,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, dbStatus, connectAtlas, refreshDbStatus } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('analyst@sentinelflow.io');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior AppSec Analyst');
  const [department, setDepartment] = useState('Application Security');
  const [rememberSession, setRememberSession] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MongoDB Atlas configuration drawer
  const [showDbModal, setShowDbModal] = useState(false);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [dbConnecting, setDbConnecting] = useState(false);
  const [dbSuccessMsg, setDbSuccessMsg] = useState<string | null>(null);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  const returnPath = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          name: name.trim() || email.split('@')[0],
          role,
          department,
        });
      }
      navigate(returnPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnectAtlas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    setDbConnecting(true);
    setDbErrorMsg(null);
    setDbSuccessMsg(null);

    try {
      const res = await connectAtlas(mongoUriInput.trim());
      setDbSuccessMsg(res.message);
      setTimeout(() => {
        setShowDbModal(false);
      }, 1500);
    } catch (err: any) {
      setDbErrorMsg(err.message || 'Failed to connect to MongoDB Atlas');
    } finally {
      setDbConnecting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-8 px-4">
      {/* Database Connection Status Bar */}
      <div className="w-full max-w-lg mb-4">
        <div className="rounded-[16px] bg-white border border-[#DDE4EE] p-3.5 shadow-[0_1px_2px_rgba(28,52,92,0.04)] flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Database size={15} strokeWidth={1.7} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-[500] text-[#020C21]">
                <span>
                  {dbStatus?.connected ? 'MongoDB Atlas' : 'Database Buffer'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-[520] ${
                    dbStatus?.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {dbStatus?.connected ? 'Atlas Connected' : 'Standby / Local'}
                </span>
              </div>
              <div className="text-[11px] text-[#59627E] font-mono truncate max-w-[280px]">
                {dbStatus?.connected
                  ? `${dbStatus.cluster} (${dbStatus.lastPingMs}ms)`
                  : 'In-Memory Buffer Active · Connect Atlas URI'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => refreshDbStatus()}
              title="Refresh DB Status"
              className="p-1.5 rounded-full hover:bg-[#E6EDF6] text-[#59627E] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.7} />
            </button>
            <button
              onClick={() => setShowDbModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#CED5E0] bg-[#F4F7FB] hover:bg-[#E6EDF6] text-[11px] font-[500] text-[#0F1B31] transition-colors cursor-pointer"
            >
              <Sliders size={11} strokeWidth={1.7} />
              <span>Configure Atlas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg rounded-[20px] bg-white border border-[#DDE4EE] p-8 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1B31] text-white">
            <Shield size={24} strokeWidth={1.7} />
          </div>
          <h1 className="text-[26px] font-[500] text-[#020C21] tracking-tight">
            Analyst Authentication
          </h1>
          <p className="text-[14px] font-[425] text-[#59627E]">
            Token-based & session-backed security console with MongoDB Atlas verification.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-full bg-[#E6EDF6]/70 p-1 border border-[#DDE4EE]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[13px] font-[500] transition-colors duration-150 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#020C21] shadow-sm'
                : 'text-[#59627E] hover:text-[#020C21]'
            }`}
          >
            <LogIn size={13} strokeWidth={1.7} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[13px] font-[500] transition-colors duration-150 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#020C21] shadow-sm'
                : 'text-[#59627E] hover:text-[#020C21]'
            }`}
          >
            <UserPlus size={13} strokeWidth={1.7} />
            <span>Register Analyst</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-[12px] bg-[#FADADD] border border-[#A1121F]/30 p-3 text-[13px] text-[#A1121F] flex items-center gap-2">
            <AlertTriangle size={15} strokeWidth={1.7} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                    Analyst Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3 py-2 text-[13px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
                  >
                    <option value="Senior AppSec Analyst">Senior AppSec Analyst</option>
                    <option value="Lead Incident Commander">Lead Incident Commander</option>
                    <option value="SOC Security Engineer">SOC Security Engineer</option>
                    <option value="SecOps Auditor">SecOps Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Application Security"
                    className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[13px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Analyst Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@sentinelflow.io"
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-[470] text-[#59627E]">
                Password / Access Secret
              </label>
              {mode === 'login' && (
                <span className="text-[11px] text-[#59627E]">
                  Session lease: 24h
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#59627E] pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-[#CED5E0] text-[#0F1B31] focus:ring-[#2f5f9e]"
              />
              <span>Maintain persistent session token</span>
            </label>
            <span className="font-mono text-[11px] text-[#4A78B0]">
              Bearer SHA-256
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#0F1B31] py-3 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
          >
            <span>
              {loading
                ? 'Verifying Database Session...'
                : mode === 'login'
                ? 'Authenticate & Open Console'
                : 'Create Account & Authenticate'}
            </span>
            <ArrowRight size={15} strokeWidth={1.7} />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-2 border-t border-[#CED5E0] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#59627E]">
            <span className="font-[500] uppercase tracking-wider">Quick Fill Analyst Credentials:</span>
            <span>Mock or Atlas verified</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('analyst@sentinelflow.io', 'Password123!')}
              className="text-left p-2.5 rounded-[12px] border border-[#DDE4EE] hover:bg-[#F4F7FB] transition-colors cursor-pointer group"
            >
              <div className="text-[12px] font-[520] text-[#020C21] group-hover:text-[#2f5f9e]">
                Sarah Chen
              </div>
              <div className="text-[10px] text-[#59627E] font-mono">
                Senior AppSec Analyst
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('commander@sentinelflow.io', 'Commander2026!')}
              className="text-left p-2.5 rounded-[12px] border border-[#DDE4EE] hover:bg-[#F4F7FB] transition-colors cursor-pointer group"
            >
              <div className="text-[12px] font-[520] text-[#020C21] group-hover:text-[#2f5f9e]">
                Marcus Vance
              </div>
              <div className="text-[10px] text-[#59627E] font-mono">
                Incident Commander
              </div>
            </button>
          </div>
        </div>

        {/* Storage Architecture Guarantee */}
        <div className="pt-2 text-center text-[11px] text-[#59627E] space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-[470] text-[#020C21]">
            <Lock size={12} strokeWidth={1.7} className="text-[#4A78B0]" />
            <span>Dual-Tier Data Architecture Active</span>
          </div>
          <p>
            Authentication verified against <strong>MongoDB Atlas</strong> · Scans & reports remain secured in <strong>LocalStorage</strong>.
          </p>
        </div>
      </div>

      {/* MongoDB Atlas Configuration Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CED5E0]">
              <div className="flex items-center gap-2">
                <Database size={18} strokeWidth={1.7} className="text-[#2f5f9e]" />
                <h3 className="text-[16px] font-[500] text-[#020C21]">
                  MongoDB Atlas Connection Manager
                </h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="text-[#59627E] hover:text-[#020C21] text-[13px] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[13px] text-[#59627E] leading-relaxed">
              Connect SentinelFlow to your cloud <strong>MongoDB Atlas Cluster</strong> for persistent user records, active sessions, and tamper-evident SOC audit logs.
            </p>

            <form onSubmit={handleTestConnectAtlas} className="space-y-3">
              <div>
                <label className="block text-[12px] font-[470] text-[#59627E] mb-1">
                  Atlas Connection String (URI)
                </label>
                <input
                  type="text"
                  required
                  placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/sentinelflow?retryWrites=true&w=majority"
                  value={mongoUriInput}
                  onChange={(e) => setMongoUriInput(e.target.value)}
                  className="w-full font-mono text-[12px] rounded-[12px] bg-white border border-[#CED5E0] px-3 py-2 text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
                />
                <span className="text-[11px] text-[#59627E] block mt-1">
                  Credentials are authenticated over TLS 1.3. Passwords are never sent to the browser or logged.
                </span>
              </div>

              {dbSuccessMsg && (
                <div className="rounded-[10px] bg-emerald-50 border border-emerald-200 p-2.5 text-[12px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={14} strokeWidth={1.7} className="shrink-0 text-emerald-600" />
                  <span>{dbSuccessMsg}</span>
                </div>
              )}

              {dbErrorMsg && (
                <div className="rounded-[10px] bg-[#FADADD] border border-[#A1121F]/30 p-2.5 text-[12px] text-[#A1121F] flex items-center gap-2">
                  <AlertTriangle size={14} strokeWidth={1.7} className="shrink-0" />
                  <span>{dbErrorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="rounded-full bg-white border border-[#CED5E0] px-4 py-1.5 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dbConnecting || !mongoUriInput.trim()}
                  className="rounded-full bg-[#0F1B31] px-5 py-1.5 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {dbConnecting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Testing Atlas Ping...</span>
                    </>
                  ) : (
                    <>
                      <Database size={13} strokeWidth={1.7} />
                      <span>Connect & Verify</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
