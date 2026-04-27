import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, CheckCircle, PieChart, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Asset Imports
import customLogo from '../assets/image copy.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { id, name, role, passwordResetRequired } = response.data;
      login({ id, name, email, role, passwordResetRequired });
      navigate('/dashboard/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2b64f3] to-[#4089ff] font-sans relative overflow-hidden">

      {/* Floating Background Widgets */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left: Checkbox Widget */}
        <div className="absolute top-[20%] left-[10%] w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30 animate-bounce duration-[3000ms]">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="text-white" size={16} />
          </div>
        </div>

        {/* Bottom Left: Pie Chart Widget */}
        <div className="absolute bottom-[20%] left-[5%] w-52 h-36 bg-white/20 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-white/30 flex items-center gap-4 animate-pulse">
          <PieChart size={64} className="text-white/80" />
          <div className="space-y-2 flex-1">
            <div className="h-2 bg-white/40 rounded-full w-full" />
            <div className="h-2 bg-white/40 rounded-full w-2/3" />
            <div className="h-2 bg-white/20 rounded-full w-4/5" />
          </div>
        </div>

        {/* Top Right: Bar Chart Widget */}
        <div className="absolute top-[15%] right-[10%] w-44 h-28 bg-white/20 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-white/30 animate-pulse">
          <BarChart3 size={40} className="text-white/80 mb-2" />
          <div className="flex items-end gap-1 h-8">
            <div className="w-2 h-4 bg-white/40 rounded-full" />
            <div className="w-2 h-6 bg-white/60 rounded-full" />
            <div className="w-2 h-3 bg-white/30 rounded-full" />
            <div className="w-2 h-5 bg-white/50 rounded-full" />
          </div>
        </div>

        {/* Bottom Right: Task List Widget */}
        <div className="absolute bottom-[15%] right-[12%] w-40 h-44 bg-white/20 backdrop-blur-md rounded-[40px] p-6 shadow-xl border border-white/30 flex flex-col gap-4">
          <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Tasks</span>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-400" /><div className="h-1 bg-white/40 rounded-full flex-1" /></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white/40" /><div className="h-1 bg-white/40 rounded-full flex-1" /></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white/40" /><div className="h-1 bg-white/40 rounded-full flex-1" /></div>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] bg-[#dbe9ff] rounded-[60px] p-12 shadow-2xl relative z-10 border border-white/40 transform scale-90 md:scale-100">
        <div className="flex flex-col items-center mb-10">
          <img src={customLogo} alt="Logo" className="w-16 h-16 mb-4 drop-shadow-md" />
          <h1 className="text-[#2b64f3] font-black text-2xl italic tracking-widest uppercase">Flow Track</h1>
        </div>

        {error && (
          <div className="bg-red-100/80 text-red-700 px-4 py-2 rounded-xl text-[10px] font-bold text-center mb-6 uppercase tracking-widest border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#2b64f3]/60 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full h-14 bg-white/60 border-none rounded-2xl px-6 text-sm font-bold text-blue-900 placeholder:text-blue-300 focus:bg-white outline-none transition-all shadow-sm group-hover:shadow-md"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="manager@flowtrack.com"
              />
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#2b64f3]/60 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full h-14 bg-white/60 border-none rounded-2xl px-6 text-sm font-bold text-blue-900 placeholder:text-blue-300 focus:bg-white outline-none transition-all shadow-sm group-hover:shadow-md"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pr-1">
            <button type="button" className="text-[10px] font-black text-[#2b64f3] uppercase tracking-tighter hover:underline">Forgot Password?</button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 bg-white text-[#2b64f3] rounded-full font-black text-lg uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-blue-50 transition-all active:scale-[0.98] mt-4 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
