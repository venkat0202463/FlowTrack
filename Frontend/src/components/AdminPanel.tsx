import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  UserPlus,
  Settings,
  Info,
  Key,
  Briefcase,
  Hash,
  Contact
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import type { User } from '../types';

const AdminPanel = () => {
  const { user: authUser } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Onboarding State
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    email: '',
    empId: '',
    role: 'DEVELOPER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      await api.post('/auth/onboard', onboardingData);
      addNotification('Success', 'User onboarded and credentials sent successfully.', 'success');
      setOnboardingData({ name: '', email: '', empId: '', role: 'DEVELOPER' });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to onboard user.';
      setFormError(msg);
      addNotification('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!window.confirm(`Remove ${userEmail} from the system?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      addNotification('User Removed', `${userEmail} has been removed.`, 'success');
      fetchUsers();
    } catch (err) {
      addNotification('Error', 'Failed to remove user.', 'error');
    }
  };

  return (
    <div className="h-full bg-[#f8fafc] flex flex-col font-sans animate-in fade-in duration-500 overflow-hidden">
      <header className="px-8 py-8 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#0052CC] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#0052CC]/20">
                        <Settings size={22} />
                    </div>
                    <h1 className="text-2xl font-black text-[#1e293b] tracking-tight">Admin Console</h1>
                </div>
                <p className="text-sm text-[#64748b] font-medium">Enterprise User Onboarding & Management Workspace</p>
            </div>
            <div className="bg-[#eff6ff] px-4 py-2 rounded-full border border-[#dbeafe]">
                <span className="text-xs font-bold text-[#1d4ed8] flex items-center gap-2">
                    <ShieldCheck size={14} /> Active {authUser?.role === 'ADMIN' ? 'Admin' : 'Manager'} Session
                </span>
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
          
          {/* ONBOARDING FORM SECTION */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white p-8 rounded-[24px] border border-[#e2e8f0] shadow-sm sticky top-0">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#f1f5f9] text-[#475569] rounded-xl flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#1e293b]">User Onboarding</h3>
                    <p className="text-xs text-[#64748b]">Configure access for new specialists</p>
                </div>
              </div>
              
              <form onSubmit={handleOnboard} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-[#475569] uppercase tracking-wider pl-1">
                    <Contact size={14} className="text-[#0052CC]" /> Full Name
                  </label>
                  <input 
                    required
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 rounded-xl text-sm outline-none transition-all placeholder:text-[#94a3b8]"
                    value={onboardingData.name}
                    onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-[#475569] uppercase tracking-wider pl-1">
                    <Hash size={14} className="text-[#0052CC]" /> Employee ID
                  </label>
                  <input 
                    required
                    placeholder="e.g., M123 or R456"
                    className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 rounded-xl text-sm outline-none transition-all placeholder:text-[#94a3b8]"
                    value={onboardingData.empId}
                    onChange={e => setOnboardingData({...onboardingData, empId: e.target.value})}
                  />
                  <p className="flex items-center gap-1.5 text-[10px] text-[#64748b] pl-1 font-medium">
                    <Info size={12} /> Format: One letter followed by numbers
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-[#475569] uppercase tracking-wider pl-1">
                    <Mail size={14} className="text-[#0052CC]" /> Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="user@company.com"
                    className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 rounded-xl text-sm outline-none transition-all placeholder:text-[#94a3b8]"
                    value={onboardingData.email}
                    onChange={e => setOnboardingData({...onboardingData, email: e.target.value})}
                  />
                  <p className="flex items-center gap-1.5 text-[10px] text-[#64748b] pl-1 font-medium italic">
                    🚀 Login credentials will be sent to this email
                  </p>
                </div>

                {/* System Role */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-[#475569] uppercase tracking-wider pl-1">
                    <Briefcase size={14} className="text-[#0052CC]" /> System Role
                  </label>
                  <div className="relative">
                    <select 
                        className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/5 rounded-xl text-sm outline-none appearance-none transition-all"
                        value={onboardingData.role}
                        onChange={e => setOnboardingData({...onboardingData, role: e.target.value})}
                    >
                        <option value="DEVELOPER">👨‍💻 Developer</option>
                        <option value="MANAGER">👔 Manager</option>
                        <option value="ADMIN">🛡️ Admin</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                        <Users size={16} />
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-[10px] text-[#64748b] pl-1 font-medium">
                    <ShieldCheck size={12} /> Determines access permissions in the system
                  </p>
                </div>

                {/* Auto-gen Password Info */}
                <div className="p-4 bg-[#fff7ed] rounded-xl border border-[#ffedd5] flex gap-3">
                    <Key size={18} className="text-[#f97316] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#9a3412] leading-relaxed font-medium">
                        <strong>Auto-Generated Password:</strong> A secure temporary password will be automatically generated and sent via email. The user must change it on first login.
                    </p>
                </div>

                {/* Explicit Error Display */}
                {formError && (
                  <div className="p-4 bg-[#fef2f2] rounded-xl border border-[#fee2e2] flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0 mt-0.5">
                         <Trash2 size={12} />
                      </div>
                      <p className="text-[11px] text-[#991b1b] leading-relaxed font-bold">
                          {formError}
                      </p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-[#2f9e9e] text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#2f9e9e]/20 hover:bg-[#267e7e] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                >
                  <UserPlus size={18} />
                  {loading ? 'Processing Onboarding...' : 'Create User & Send Credentials'}
                </button>
              </form>
            </div>
          </div>

          {/* USER LIST SECTION */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#e2e8f0] rounded-[24px] overflow-hidden shadow-sm">
               <div className="px-6 py-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">Active Workspace Personnel</h3>
                    <p className="text-[10px] text-[#64748b] font-bold">CURRENT NODES: {users.length}</p>
                  </div>
                  <span className="bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-black px-3 py-1 rounded-full border border-[#dbeafe]">LIVE ACCESS</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white text-[10px] font-black text-[#64748b] uppercase tracking-[0.15em] border-b border-[#f1f5f9]">
                         <th className="px-6 py-4">Collaborator</th>
                         <th className="px-6 py-4">Node ID</th>
                         <th className="px-6 py-4">Permissions</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Control</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[#f8fafc] transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#00A3BF] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#0052CC]/10 uppercase transition-transform group-hover:scale-110">{u.name.charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-bold text-[#1e293b]">{u.name}</p>
                                  <p className="text-[11px] text-[#64748b] font-medium">{u.email}</p>
                                </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-[#475569]">
                             {u.empId || 'FT-NULL'}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider ${
                                u.role === 'ADMIN' ? 'bg-[#f5f3ff] text-[#7c3aed]' : 
                                u.role === 'MANAGER' ? 'bg-[#fff7ed] text-[#c2410c]' :
                                'bg-[#f0f9ff] text-[#0369a1]'
                             }`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-[#059669]">Sync'd</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button
                               onClick={() => handleDeleteUser(u.id, u.email)}
                               className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#ef4444] rounded-lg transition-all"
                               title="Revoke access"
                             >
                               <Trash2 size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
