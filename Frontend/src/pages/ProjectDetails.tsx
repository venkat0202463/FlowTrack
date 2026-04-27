import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Target, 
  Check, 
  Activity,
  Monitor
} from 'lucide-react';
import api from '../services/api';
import type { Project } from '../types';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [activeObjective, setActiveObjective] = useState('');
  const [activeGovernance, setActiveGovernance] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get('/projects');
        const proj = data.find((p: Project) => p.id === Number(id));
        setProject(proj);
        if (proj) {
          setActiveObjective(proj.objective || 'Focusing on delivering high-quality user experiences and scalable backend services.');
          setActiveGovernance(proj.governance || 'Maintaining agile workflows and consistent peer reviews for reliable code delivery.');
        }
      } catch (error) {
        console.error("Project fetch failure:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const saveDetails = () => {
    setIsEditing(false);
    // Persist to infrastructure node via API
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
       <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-royal-600 border-t-transparent rounded-full animate-spin"></div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Project Details...</span>
       </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
       <div className="text-center">
           <h2 className="text-2xl font-black text-navy-900 mb-2">Project Not Found</h2>
           <p className="text-slate-500 mb-6">The requested project ID does not exist in your workspace.</p>
           <Link to="/dashboard/projects" className="btn-primary px-6 py-2">Return to Projects</Link>
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 selection:bg-royal-600 selection:text-white">
      {/* Header Intelligence */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               <Link to="/dashboard/projects" className="hover:text-royal-600 transition-colors">Workspace</Link>
               <span className="opacity-30">/</span>
               <span className="text-royal-600">ID {id}</span>
           </div>
          <h1 className="text-6xl font-black text-[#001F3F] tracking-tighter leading-none italic">
            {project.name}<span className="text-royal-600">.</span>
          </h1>
           <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl border-l-4 border-royal-600 pl-6 py-2">
            {project.description || 'A collaborative initiative designed to streamline productivity and achieve core project milestones through agile execution.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Core Intel Section */}
        <div className="lg:col-span-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`group p-8 rounded-[32px] border transition-all duration-500 overflow-hidden relative ${isEditing ? 'border-royal-600 bg-white shadow-2xl' : 'border-slate-100 bg-[#F8FAFC]'}`}>
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-royal-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Target size={24} />
                 </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">SCOPE & PURPOSE</span>
               </div>
               <h3 className="text-xl font-black text-navy-900 mb-4 tracking-tight">Key Objectives</h3>
               {isEditing ? (
                 <textarea 
                   className="w-full bg-slate-50 rounded-xl p-4 text-sm text-slate-600 font-bold focus:ring-2 focus:ring-royal-500 outline-none transition-all"
                   rows={4} value={activeObjective} onChange={e => setActiveObjective(e.target.value)}
                 />
               ) : (
                 <p className="text-sm text-slate-500 font-bold leading-relaxed pr-6">{activeObjective}</p>
               )}
            </div>

            <div className={`group p-8 rounded-[32px] border transition-all duration-500 overflow-hidden relative ${isEditing ? 'border-teal-600 bg-white shadow-2xl' : 'border-slate-100 bg-[#F8FAFC]'}`}>
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                 </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">TEAM WORKFLOW</span>
               </div>
               <h3 className="text-xl font-black text-navy-900 mb-4 tracking-tight">Operational Guidelines</h3>
               {isEditing ? (
                 <textarea 
                   className="w-full bg-slate-50 rounded-xl p-4 text-sm text-slate-600 font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                   rows={4} value={activeGovernance} onChange={e => setActiveGovernance(e.target.value)}
                 />
               ) : (
                 <p className="text-sm text-slate-500 font-bold leading-relaxed pr-6">{activeGovernance}</p>
               )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[40px] p-10 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-700">
             <div className="absolute top-0 right-0 w-64 h-64 bg-royal-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />
             
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-royal-600 text-white rounded-full flex items-center justify-center rotate-12 shadow-lg shadow-royal-600/20">
                       <Activity size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-navy-900 tracking-tight italic">Project Progress</h3>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-royal-50 text-royal-600 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-royal-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Currently Active</span>
                 </div>
             </div>

             <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                       <p className="text-xl font-bold text-navy-900 leading-tight">Deliver high-quality features and maintain platform stability.</p>
                    </div>
                    <div className="flex flex-col justify-end text-right">
                       <p className="text-[28px] font-black text-royal-600 leading-none">65%</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sprint Completion</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="w-full h-4 bg-slate-50 rounded-full border border-slate-100 p-1">
                      <div className="h-full bg-royal-600 rounded-full w-3/4 shadow-sm relative group">
                         <div className="absolute -right-2 -top-2 w-4 h-4 bg-white border-2 border-royal-600 rounded-full group-hover:scale-125 transition-transform" />
                      </div>
                   </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Monitor size={10} /> Started: Q1 2026</span>
                       <span className="flex items-center gap-1 text-royal-600"><Clock size={10} /> Goal: End of Year</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;
