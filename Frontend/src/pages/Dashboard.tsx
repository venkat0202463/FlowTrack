import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, CheckCircle2, Users, Zap, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
   const { user } = useAuth();
   const [statsData, setStatsData] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const { data } = await api.get('/stats/summary');
            setStatsData(data);
         } catch (error) {
            console.error("Error fetching dashboard stats", error);
         } finally {
            setLoading(false);
         }
      };
      fetchStats();
   }, []);

   if (loading) return (
      <div className="flex items-center justify-center h-full text-sm text-[#5E6C84]">
         Hydrating system metrics...
      </div>
   );

   return (
      <div className="flex-1 bg-white pt-6 pb-20">
         <div className="content-container">
            {/* Workspace Banner */}
            <div className="mb-10 flex items-end justify-between">
               <div>
                  <h1 className="text-xl font-semibold text-[#172B4D] tracking-tight">System Overview</h1>
                  <p className="text-xs text-[#5E6C84] mt-1">Hello, <span className="font-bold text-[#0052CC]">{user?.name}</span>. Your workspace node is stable and healthy.</p>
               </div>
            </div>

            {/* Tactical Gadgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
               {[
                  { label: 'Open Ingress', value: statsData?.totalTasks || '0', icon: Layout, color: 'text-[#0052CC]', bg: 'bg-[#DEEBFF]' },
                  { label: 'Completed Segments', value: statsData?.tasksCompleted || '0', icon: CheckCircle2, color: 'text-[#006644]', bg: 'bg-[#E3FCEF]' },
                  { label: 'Active Teams', value: statsData?.teamMembers || '1', icon: Users, color: 'text-[#403294]', bg: 'bg-[#EAE6FF]' },
                  { label: 'Node Uptime', value: '99.9%', icon: Zap, color: 'text-[#BF2600]', bg: 'bg-[#FFEBE6]' },
               ].map((stat, i) => (
                  <div key={i} className="bg-white border border-[#DFE1E6] rounded-[3px] p-6 hover:shadow-md transition-all cursor-default">
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded flex items-center justify-center shrink-0`}>
                           <stat.icon size={18} />
                        </div>
                        <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">{stat.label}</span>
                     </div>
                     <h3 className="text-xl font-bold text-[#172B4D]">{stat.value}</h3>
                  </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Recent Activity Gadget */}
               <div className="lg:col-span-2 bg-white border border-[#DFE1E6] rounded-[3px] p-8">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-bold text-[#172B4D]">Work Stream Analytics</h3>
                     <span className="text-xs font-bold text-[#006644] bg-[#E3FCEF] px-2 py-1 rounded">LIVE HUB</span>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                     {(statsData?.activity || [30, 60, 40, 80, 50, 70, 45, 90, 65, 30]).map((h: number, i: number) => (
                        <div
                           key={i}
                           className="flex-1 bg-[#0052CC] opacity-20 hover:opacity-100 rounded-t-[2px] transition-all cursor-pointer relative group"
                           style={{ height: `${h}%` }}
                        >
                           <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#172B4D] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {h}%
                           </div>
                        </div>
                     ))}
                  </div>
                  <p className="text-xs text-[#5E6C84] mt-6 text-center italic font-bold uppercase tracking-widest">Active resource allocation over last 10 segments</p>
               </div>

               {/* Quick Actions Gadget */}
               <div className="space-y-6">
                  <div className="bg-white border border-[#DFE1E6] rounded-[3px] p-6">
                     <h3 className="text-base font-bold text-[#172B4D] mb-6 border-b border-[#DFE1E6] pb-2">Jump In</h3>
                     <div className="space-y-3">
                        <Link to="/dashboard/projects" className="flex items-center justify-between p-3 hover:bg-[#F4F5F7] rounded-sm transition-colors group">
                           <span className="text-sm font-medium text-[#42526E]">Project Portfolio</span>
                           <Zap size={14} className="text-[#DEEBFF] group-hover:text-[#0052CC] transition-colors" />
                        </Link>
                        <Link to="/dashboard/projects" className="flex items-center justify-between p-3 hover:bg-[#E3F2FD] rounded-sm transition-colors group">
                           <span className="text-sm font-bold text-[#0052CC]">Create New Project</span>
                           <Plus size={14} className="text-[#0052CC]" />
                        </Link>
                        <Link to="/dashboard/project/1" className="flex items-center justify-between p-3 hover:bg-[#F4F5F7] rounded-sm transition-colors group">
                           <span className="text-sm font-medium text-[#42526E]">Last Project Board</span>
                           <Layout size={14} className="text-[#DEEBFF] group-hover:text-[#0052CC] transition-colors" />
                        </Link>
                     </div>
                  </div>

                  <div className="bg-[#0747A6] rounded-[3px] p-6 text-white relative overflow-hidden group">
                     <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={120} />
                     </div>
                     <h3 className="text-lg font-bold mb-2">FlowTrack Cloud</h3>
                     <p className="text-sm text-white/80 mb-6">Upgrade to Enterprise tier for advanced multi-node synchronization.</p>
                     <button className="px-4 py-2 bg-white text-[#0747A6] rounded text-sm font-bold hover:bg-[#F4F5F7] transition-colors">
                        Learn More
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Dashboard;
