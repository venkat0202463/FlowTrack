import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Clock,
  Camera,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="h-full overflow-y-auto px-10 py-10 bg-[#F4F5F7]/30 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight mb-1">Personal Profile</h1>
          <p className="text-sm text-[#5E6C84]">Manage your personal information and security credentials.</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* PROFILE CARD */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm relative">
               <div className="relative mb-6">
                 <div className="w-24 h-24 bg-[#0052CC] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto">
                    {user?.name.charAt(0)}
                 </div>
                 <button className="absolute bottom-0 right-1/2 translate-x-8 w-8 h-8 bg-white border border-[#DFE1E6] rounded-full flex items-center justify-center text-[#5E6C84] hover:text-[#0052CC] shadow-sm transition-all">
                    <Camera size={14} />
                 </button>
               </div>

               <div className="text-center">
                  <h2 className="text-lg font-bold text-[#172B4D]">{user?.name}</h2>
                  <p className="text-sm text-[#5E6C84] mt-1">Lead Architect</p>
               </div>

               <div className="mt-8 pt-6 border-t border-[#DFE1E6] space-y-4">
                  <div className="flex items-center gap-3 text-[#42526E]">
                     <Mail size={16} />
                     <span className="text-sm font-medium truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#42526E]">
                     <Briefcase size={16} />
                     <span className="text-sm font-medium text-[#42526E]">IT Department</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#42526E]">
                     <MapPin size={16} />
                     <span className="text-sm font-medium text-[#42526E]">San Francisco, CA</span>
                  </div>
               </div>
            </div>
          </div>

          {/* EDITABLE SETTINGS */}
          <div className="col-span-8 bg-white border border-[#DFE1E6] rounded-lg p-8 shadow-sm">
             <div className="flex flex-col gap-8">
                <section>
                   <div className="flex items-center gap-2 mb-6">
                      <User size={18} className="text-[#0052CC]" />
                      <h3 className="text-lg font-bold text-[#172B4D]">Personal Details</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 font-medium">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#5E6C84] uppercase">Full Name</label>
                         <input className="w-full p-2.5 bg-[#F4F5F7] border border-transparent focus:bg-white focus:border-[#0052CC] rounded text-sm outline-none transition-all" defaultValue={user?.name} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#5E6C84] uppercase">Email Address</label>
                         <input disabled className="w-full p-2.5 bg-[#F4F5F7] border border-transparent rounded text-sm opacity-60 cursor-not-allowed" defaultValue={user?.email} />
                      </div>
                      <div className="col-span-2 space-y-2">
                         <label className="text-xs font-bold text-[#5E6C84] uppercase">Bio</label>
                         <textarea className="w-full p-2.5 bg-[#F4F5F7] border border-transparent focus:bg-white focus:border-[#0052CC] rounded text-sm outline-none transition-all h-24 resize-none" defaultValue="Product strategy and software architecture." />
                      </div>
                   </div>
                </section>

                <section className="pt-8 border-t border-[#DFE1E6]">
                   <div className="flex items-center gap-2 mb-6">
                      <ShieldCheck size={18} className="text-[#0052CC]" />
                      <h3 className="text-lg font-bold text-[#172B4D]">Security</h3>
                   </div>
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-4 border border-[#DFE1E6] hover:bg-[#F4F5F7] rounded-lg transition-all group">
                         <div className="flex items-center gap-3">
                            <Lock size={18} className="text-[#5E6C84]" />
                            <span className="text-sm font-semibold text-[#172B4D]">Change Password</span>
                         </div>
                         <ChevronRight size={18} className="text-[#A5ADBA]" />
                      </button>
                      <button className="w-full flex items-center justify-between p-4 border border-[#DFE1E6] hover:bg-[#F4F5F7] rounded-lg transition-all group">
                         <div className="flex items-center gap-3">
                            <Clock size={18} className="text-[#5E6C84]" />
                            <span className="text-sm font-semibold text-[#172B4D]">Recent Activity</span>
                         </div>
                         <ChevronRight size={18} className="text-[#A5ADBA]" />
                      </button>
                   </div>
                </section>

                <div className="pt-8 flex justify-end gap-3 mt-auto border-t border-[#DFE1E6]">
                   <button className="px-6 py-2 text-sm font-bold text-[#5E6C84] hover:bg-[#F4F5F7] rounded transition-all">Cancel</button>
                   <button className="px-6 py-2 bg-[#0052CC] text-white rounded text-sm font-bold hover:bg-[#003484] transition-all">Save Profile</button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
