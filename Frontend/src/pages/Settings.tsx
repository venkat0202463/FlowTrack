import { useEffect, useState } from 'react';
import {
  Lock,
  Moon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isSaving, setIsSaving] = useState(false);
  const [toggles, setToggles] = useState({
    twoFactor: true,
    emailAlerts: true
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof toggles] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      addNotification('System Updated', 'Your preferences have been successfully recorded.', 'success');
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="h-full overflow-y-auto bg-white font-sans px-10 py-10 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-[#DFE1E6] pb-8">
          <h1 className="text-3xl font-semibold text-[#172B4D] tracking-tight">Settings</h1>
          <p className="text-sm text-[#5E6C84] mt-2">Manage your account preferences and security settings.</p>
        </header>



        <div className="space-y-12">
          {/* Account Section */}
          <section>
            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest mb-6">Account Details</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#42526E] uppercase">Full Name</label>
                <input className="w-full p-3 bg-[#F4F5F7] border border-transparent focus:border-[#0052CC] rounded-lg text-sm outline-none transition-all font-medium" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#42526E] uppercase">Email Address</label>
                <input disabled className="w-full p-3 bg-[#F4F5F7] border border-transparent rounded-lg text-sm opacity-60 cursor-not-allowed font-medium" defaultValue={user?.email} />
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="pt-10 border-t border-[#F4F5F7]">
            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest mb-6">Security & Privacy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F4F5F7]/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <ShieldCheck size={20} className="text-[#0052CC]" />
                  <div>
                    <p className="text-sm font-semibold text-[#172B4D]">Two-factor authentication</p>
                    <p className="text-xs text-[#5E6C84]">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <button onClick={() => handleToggle('twoFactor')} className={`w-12 h-6 rounded-full relative transition-all ${toggles.twoFactor ? 'bg-[#36B37E]' : 'bg-[#DFE1E6]'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggles.twoFactor ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <button className="w-full flex items-center justify-between p-4 border border-[#DFE1E6] rounded-xl hover:bg-[#F4F5F7] transition-all group">
                <div className="flex items-center gap-4">
                  <Lock size={20} className="text-[#42526E]" />
                  <span className="text-sm font-semibold text-[#172B4D]">Change password</span>
                </div>
                <ChevronRight size={18} className="text-[#A5ADBA]" />
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="pt-10 border-t border-[#F4F5F7]">
            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest mb-6">Preferences</h3>
            <div className="flex items-center justify-between p-4 border border-[#DFE1E6] rounded-xl">
              <div className="flex items-center gap-4">
                <Moon size={20} className="text-[#42526E]" />
                <span className="text-sm font-semibold text-[#172B4D]">Appearance</span>
              </div>
              <div className="flex bg-[#F4F5F7] p-1 rounded-lg">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${theme === 'light' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84] hover:text-[#0052CC]'}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${theme === 'dark' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84] hover:text-[#0052CC]'}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-16 flex justify-end gap-3 pt-8 border-t border-[#DFE1E6]">
          <button className="px-6 py-2 text-sm font-bold text-[#5E6C84] hover:bg-[#F4F5F7] rounded-lg transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2 bg-[#0052CC] text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/10 hover:bg-[#003484] transition-all disabled:opacity-70 flex items-center justify-center min-w-[140px]"
          >
            {isSaving ? 'Saving Node...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
