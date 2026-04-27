import React, { useState, useEffect, useRef } from 'react';
import {
   BarChart2,
   ChevronDown,
   Search,
   Layout,
   Layers,
   Zap,
   Map,
   LogOut,
   ExternalLink,
   Settings,
   Menu,
   Bell,
   Plus,
   Grid,
   PlusCircle,
   MessageSquare,
   GitBranch
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Project, Task } from '../types';
import CreateIssueModal from '../components/CreateIssueModal';
import ManagementConsole from '../components/ManagementConsole';

import projectLogo from '../assets/image copy.png';

const DashboardLayout: React.FC = () => {
   const { user: authUser, logout } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const params = useParams();

   const [projects, setProjects] = useState<Project[]>([]);
   const [recentTasks, setRecentTasks] = useState<Task[]>([]);
   const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   const handleSearch = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && searchTerm.trim()) {
         navigate(`/dashboard/issues?query=${encodeURIComponent(searchTerm.trim())}`);
         setSearchTerm('');
      }
   };

   // notifications removed as it was unused

   const leftNavRef = useRef<HTMLDivElement>(null);
   const rightNavRef = useRef<HTMLDivElement>(null);
   const sidebarRef = useRef<HTMLElement>(null);

   useEffect(() => {
      fetchData();
      const handleClickOutside = (event: MouseEvent) => {
         const isOutsideLeft = leftNavRef.current && !leftNavRef.current.contains(event.target as Node);
         const isOutsideRight = rightNavRef.current && !rightNavRef.current.contains(event.target as Node);
         const isOutsideSidebar = sidebarRef.current && !sidebarRef.current.contains(event.target as Node);

         if (isOutsideLeft && isOutsideRight && isOutsideSidebar) setActiveDropdown(null);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const fetchData = async () => {
      try {
         const [projRes, taskRes] = await Promise.all([
            api.get('/projects'),
            api.get('/tasks')
         ]);
         setProjects(projRes.data);
         setRecentTasks(taskRes.data.slice(0, 5));
      } catch (err) { console.error(err); }
   };

   const currentProjectId = params.id || null;
   const currentProject = projects.find(p => p.id === Number(currentProjectId));

   const navItems = [
      { name: 'Your work', id: 'work', sub: recentTasks.map(t => ({ name: t.title, path: `/dashboard/project/${t.project?.id || t.projectId}` })) },
      {
         name: 'Projects',
         id: 'projects',
         sub: [
            ...projects.map(p => ({ name: p.name, path: `/dashboard/project/${p.id}` })),
            { divider: true },
            { name: 'Create Project', path: '/dashboard/projects', icon: <PlusCircle size={14} />, special: true },
            { name: 'View All Projects', path: '/dashboard/projects', icon: <ExternalLink size={14} /> }
         ]
      },
      {
         name: 'Filters',
         id: 'filters',
         sub: [
            { name: 'Assigned to me', path: `/dashboard/issues?assigneeId=${authUser?.id}` }
         ]
      },
      { name: 'Dashboards', id: 'dashboards', sub: [{ name: 'System Overview', path: '/dashboard' }] },
   ];

   const sidebarGroups = [
      {
         title: 'Planning',
         links: [
            { name: 'Roadmap', key: 'roadmap', icon: <Map size={18} />, path: (id: string) => `/dashboard/roadmap/${id}` },
            { name: 'Backlog', key: 'backlog', icon: <Layers size={18} />, path: (id: string) => `/dashboard/backlog/${id}` },
            { name: 'Board', key: 'project', icon: <Layout size={18} />, path: (id: string) => `/dashboard/project/${id}` },
            { name: 'Active Sprint', key: 'sprint-board', icon: <Zap size={18} />, path: (id: string) => `/dashboard/sprint-board/${id}` },
         ]
      },
      ...(authUser?.role === 'MANAGER' ? [
         {
            title: 'Reporting',
            links: [
               { name: 'Insights', key: 'insights', icon: <BarChart2 size={18} />, path: (id: string) => `/dashboard/insights/${id}` }
            ]
         },
         {
            title: 'Administration',
            links: [
               { name: 'Management Console', key: 'management-console', icon: <Settings size={18} />, path: () => '/dashboard/management-console', isGlobal: true }
            ]
         }
      ] : [])
   ];

   return (
      <div className="flex flex-col h-screen overflow-hidden font-sans bg-white">
         {/* Global Top Navigation */}
         <header className="top-navigation flex items-center justify-between px-4 bg-[#0747A6] h-[48px] shrink-0 z-50 border-b border-[#ffffff1a]" style={{ backgroundColor: '#0747A6' }}>
            <div className="flex items-center gap-2">
               <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white lg:hidden">
                  <Menu size={18} />
               </button>
               <Link to="/dashboard" className="flex items-center gap-2 px-2 hover:bg-white/10 rounded-md transition-colors py-1 group">
                  <img src={projectLogo} alt="Logo" className="h-5 w-auto" />
                  <span className="text-white font-bold text-[16px] tracking-tight">FlowTrack</span>
               </Link>
            </div>

            <div className="hidden lg:flex items-center gap-0.5 flex-1 px-4" ref={leftNavRef}>
               {navItems.map(item => (
                  <div key={item.id} className="relative">
                     <button
                        onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                        className={`px-2.5 py-1.5 flex items-center gap-1 text-[13px] font-semibold transition-colors rounded-md ${activeDropdown === item.id ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                     >
                        {item.name} <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                     </button>

                     {item.sub && activeDropdown === item.id && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-64 bg-white border border-[#DFE1E6] rounded-md shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="px-3 py-1 mb-1">
                              <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Explore {item.name}</p>
                           </div>
                           {item.sub.map((sub: any, i: number) => (
                              sub.divider ? <div key={i} className="my-1 border-t border-[#F4F5F7]" /> :
                                 <Link
                                    key={i}
                                    to={sub.path}
                                    onClick={() => setActiveDropdown(null)}
                                    className={`flex items-center gap-3 px-4 py-1.5 text-[13px] ${sub.special ? 'text-[#0052CC] font-bold' : 'text-[#172B4D]'} hover:bg-[#F4F5F7] transition-colors`}
                                 >
                                    {sub.icon && <span className="text-[#42526E]">{sub.icon}</span>} {sub.name}
                                 </Link>
                           ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>

            <div className="flex items-center gap-2" ref={rightNavRef}>
               <div className="relative hidden md:flex items-center group">
                  <Search size={14} className="absolute left-3 text-white/50 group-focus-within:text-white transition-colors" />
                  <input
                     className="bg-white/10 border-2 border-transparent focus:bg-white/20 focus:border-white/30 rounded-md py-1 pl-9 pr-4 text-[13px] w-48 lg:w-64 text-white placeholder:text-white/50 transition-all outline-none"
                     placeholder="Search issues..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onKeyDown={handleSearch}
                  />
               </div>

               <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-white text-[#0747A6] px-3 py-1 rounded-[3px] font-bold text-[13px] hover:bg-white/90 transition-all flex items-center gap-1 shadow-md active:scale-95 ml-2"
               >
                  Create
               </button>

               <div className="relative">
                  <button
                     onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
                     className={`p-1.5 rounded-md transition-colors text-white relative ml-1 ${activeDropdown === 'notifications' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                     <Bell size={18} />
                     <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#DE350B] rounded-full border border-[#0747A6]"></span>
                  </button>

                  {activeDropdown === 'notifications' && (
                     <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-[#DFE1E6] rounded-md shadow-2xl py-0 z-[110] animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#F4F5F7] bg-[#F4F5F7]/50 flex justify-between items-center">
                           <h3 className="text-[14px] font-bold text-[#172B4D]">Notifications</h3>
                           <button className="text-[11px] font-bold text-[#0052CC] hover:underline">Mark all as read</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                           {[
                              { title: 'Task Completed', desc: 'FT-4 was moved to DONE', time: '2m ago', icon: <Zap size={14} className="text-green-500" /> },
                              { title: 'New Comment', desc: 'John commented on FT-2', time: '1h ago', icon: <MessageSquare size={14} className="text-blue-500" /> },
                              { title: 'Sprint Started', desc: 'Sprint 3 is now active', time: '3h ago', icon: <GitBranch size={14} className="text-purple-500" /> }
                           ].map((notif, i) => (
                              <div key={i} className="px-4 py-3 border-b border-[#F4F5F7] hover:bg-[#F4F5F7] transition-colors cursor-pointer group">
                                 <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white border border-[#DFE1E6] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#0052CC] transition-colors">
                                       {notif.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-baseline mb-0.5">
                                          <p className="text-[13px] font-bold text-[#172B4D] truncate">{notif.title}</p>
                                          <span className="text-[10px] text-[#5E6C84] shrink-0">{notif.time}</span>
                                       </div>
                                       <p className="text-[12px] text-[#42526E] line-clamp-2 leading-snug">{notif.desc}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="p-3 text-center border-t border-[#DFE1E6]">
                           <button className="text-[12px] font-bold text-[#42526E] hover:text-[#172B4D]">View all notifications</button>
                        </div>
                     </div>
                  )}
               </div>

               <div className="relative ml-1">
                  <button
                     onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                     className="w-7 h-7 rounded-full bg-[#00A3BF] flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-1 ring-white/20 hover:ring-white/40 transition-all"
                  >
                     {authUser?.name?.charAt(0) || 'U'}
                  </button>

                  {activeDropdown === 'profile' && (
                     <div className="absolute top-[calc(100%+8px)] right-0 w-60 bg-white border border-[#DFE1E6] rounded-md shadow-2xl py-2 z-[110] animate-in zoom-in-95 duration-200">
                        <div className="px-4 py-2.5 border-b border-[#F4F5F7] mb-1">
                           <p className="text-[13px] font-bold text-[#172B4D] truncate">{authUser?.name}</p>
                           <p className="text-[11px] text-[#5E6C84] truncate">{authUser?.email}</p>
                        </div>
                        <Link to="/dashboard/profile" onClick={() => setActiveDropdown(null)} className="block px-4 py-1.5 text-[13px] text-[#42526E] hover:bg-[#F4F5F7]">Profile</Link>
                        <Link to="/dashboard/settings" onClick={() => setActiveDropdown(null)} className="block px-4 py-1.5 text-[13px] text-[#42526E] hover:bg-[#F4F5F7]">Settings</Link>
                        <div className="border-t border-[#DFE1E6] my-1" />
                        <button onClick={logout} className="w-full text-left px-4 py-1.5 text-[13px] text-[#BF2600] hover:bg-[#FFEBE6] flex items-center gap-2"><LogOut size={14} /> Log out</button>
                     </div>
                  )}
               </div>
            </div>
         </header>

         <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Node */}
            <aside ref={sidebarRef} className="sidebar-node flex flex-col overflow-hidden">


               <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                  {/* Interactive Project Identity Selector */}
                  <div className="relative mb-6">
                     <button
                        onClick={() => setActiveDropdown(activeDropdown === 'sidebar-switch' ? null : 'sidebar-switch')}
                        className="w-full text-left p-2 bg-[#F4F5F7] rounded-lg border border-[#DFE1E6] hover:bg-[#EBECF0] transition-colors group"
                     >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded bg-white border border-[#DFE1E6] flex items-center justify-center shadow-sm shrink-0">
                                 <img src={projectLogo} alt="P" className="w-5 h-5 object-contain" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                 <span className="text-[13px] font-bold text-[#172B4D] truncate">{currentProject?.name || 'Select Project'}</span>
                                 <span className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-widest leading-none">Software Project</span>
                              </div>
                           </div>
                           <ChevronDown size={14} className={`text-[#5E6C84] transition-transform ${activeDropdown === 'sidebar-switch' ? 'rotate-180' : ''}`} />
                        </div>
                     </button>

                     {activeDropdown === 'sidebar-switch' && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#DFE1E6] rounded shadow-2xl py-1 z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                           <p className="px-3 py-1.5 text-[9px] font-bold text-[#6B778C] uppercase tracking-widest border-b border-[#F4F5F7]">Recent Projects</p>
                           {projects.map(p => (
                              <button
                                 key={p.id}
                                 onClick={() => { navigate(`/dashboard/project/${p.id}`); setActiveDropdown(null); }}
                                 className="w-full text-left px-3 py-2 text-[13px] text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-2"
                              >
                                 <div className="w-4 h-4 rounded bg-[#DEEBFF] flex items-center justify-center shrink-0"><Layout size={10} className="text-[#0052CC]" /></div>
                                 <span className="truncate">{p.name}</span>
                              </button>
                           ))}
                           <Link
                              to="/dashboard/projects"
                              onClick={() => setActiveDropdown(null)}
                              className="block px-3 py-2 text-[12px] font-black text-[#5E6C84] hover:bg-[#F4F5F7] border-t border-[#F4F5F7] text-center"
                           >
                              View All
                           </Link>
                        </div>
                     )}
                  </div>

                  <div className="space-y-6">
                     {sidebarGroups.map(group => (
                        <div key={group.title}>
                           <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest mb-2 px-2">{group.title}</p>
                           <div className="space-y-0.5">
                              {group.links.map(link => {
                                 const isActive = location.pathname.includes(link.key);
                                 const fallbackProjectId = projects.length > 0 ? String(projects[0].id) : null;
                                 const activeProjectId = currentProjectId || fallbackProjectId;
                                 const projectPath = link.isGlobal ? (link.path as any)() : (activeProjectId ? (link.path as any)(activeProjectId) : null);

                                 return projectPath ? (
                                    <Link
                                       key={link.name}
                                       to={projectPath}
                                       className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-all ${isActive ? 'bg-[#EBECF0] text-[#0052CC] font-bold shadow-sm' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                                    >
                                       {link.icon} {link.name}
                                    </Link>
                                 ) : (
                                    <div key={link.name} className="flex items-center gap-3 px-3 py-2 rounded text-[13px] text-[#A5ADBA] cursor-not-allowed opacity-60">
                                       {link.icon} {link.name}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="main-viewport flex-1 overflow-y-auto custom-scrollbar bg-white">
               <Outlet />
            </main>
         </div>

         <CreateIssueModal
            isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
            projectId={Number(currentProjectId || 1)} onSuccess={() => fetchData()}
         />
      </div>
   );
};

export default DashboardLayout;
