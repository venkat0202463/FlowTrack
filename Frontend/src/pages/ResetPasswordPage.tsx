import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', {
                email: user?.email,
                newPassword: newPassword
            });
            
            setIsSuccess(true);
            // Update local user state to reflect that reset is no longer required
            if (user) {
                login({ ...user, passwordResetRequired: false });
            }
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans selection:bg-royal-600 selection:text-white p-6">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
                <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-royal-600/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-royal-50 text-royal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-navy-900 tracking-tight italic mb-2">Initialize Security</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Establish Permanent Access Key</p>
                    </div>

                    {isSuccess ? (
                        <div className="text-center py-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-xl font-black text-navy-900">Key Established</h2>
                            <p className="text-sm text-slate-500 font-medium">Your security context has been updated. Accessing dashboard node...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100">
                                    <ShieldAlert size={16} /> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-royal-600/5 focus:border-royal-600 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-royal-600/5 focus:border-royal-600 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-4 bg-royal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-royal-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Encrypting...' : <>Initialize Node Access <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    )}

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-4 italic">
                            By initializing your permanent key, you agree to comply with Sector 7 security protocols.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
