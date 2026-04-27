import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Search, ArrowRight, Layout, Users, Calendar, X, ChevronDown } from 'lucide-react';
import api from '../services/api';
import type { Project, User } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const ProjectList = () => {
   const [projects, setProjects] = useState<Project[]>([]);
   const [onboardedUsers, setOnboardedUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [showModal, setShowModal] = useState(false);
   const [newProject, setNewProject] = useState({
      name: '',
      description: '',
      objective: '',
      governance: '',
      teamSize: 1,
      deadline: '',
      projectKey: '',
      projectType: 'KANBAN',
      category: 'Software',
      visibility: 'PUBLIC',
      teamMembers: [] as User[]
   });
   const [createAnother, setCreateAnother] = useState(false);
   const [showMore, setShowMore] = useState(false);
   const { addNotification } = useNotifications();
   const { user: authUser } = useAuth();

   useEffect(() => {
      fetchProjects();
      fetchUsers();
   }, []);

   const fetchUsers = async () => {
      try {
         const { data } = await api.get('/auth/users');
         setOnboardedUsers(data);
      } catch (error) {
         console.error("Error fetching users", error);
      }
   };

   const fetchProjects = async () => {
      try {
         const { data } = await api.get('/projects');
         setProjects(data);
      } catch (error) {
         console.error("Error fetching projects", error);
      } finally {
         setLoading(false);
      }
   };

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         await api.post('/projects', {
            ...newProject,
            teamSize: newProject.teamMembers.length + 1 // +1 for the lead
         });
         addNotification('Project Created', `${newProject.name} is now ready.`, 'success');
         setShowModal(false);
         setNewProject({ name: '', description: '', objective: '', governance: '', teamSize: 1, deadline: '', projectKey: '', projectType: 'KANBAN', category: 'Software', visibility: 'PUBLIC', teamMembers: [] });
         fetchProjects();
      } catch (error) { console.error("Error", error); }
   };

   if (loading) return (
      <div className="flex items-center justify-center p-20">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
      </div>
   );

   return (
      <div className="content-container">
         {/* Search and Action Cluster */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-1">
               <h1 className="text-2xl font-bold text-[#172B4D]">Project Portfolio</h1>
               <p className="text-sm text-[#5E6C84]">Track and manage your architectural resource allocations.</p>
            </div>

            <div className="flex items-center gap-4">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={14} />
                  <input type="text" placeholder="Search projects" className="bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-1.5 pl-9 pr-4 text-sm w-full md:w-64 outline-none transition-all" />
               </div>
               {authUser?.role?.toUpperCase() === 'MANAGER' && (
                  <button
                     onClick={() => setShowModal(true)}
                     className="bg-[#0052CC] text-white px-4 py-2 rounded-[3px] text-sm font-bold hover:bg-[#003484] flex items-center gap-2 whitespace-nowrap"
                  >
                     <Plus size={16} /> New Project
                  </button>
               )}
            </div>
         </div>

         {/* Responsive Grid Cluster */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
               <Link key={project.id} to={`/dashboard/project/${project.id}`}>
                  <div className="premium-card p-6 h-full flex flex-col hover:translate-y-[-2px] hover:shadow-lg transition-all">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-[#DEEBFF] text-[#0052CC] rounded flex items-center justify-center shrink-0">
                           <Layout size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-[#172B4D] truncate">{project.name}</h2>
                     </div>

                     <p className="text-sm text-[#5E6C84] leading-relaxed mb-8 flex-grow line-clamp-2">
                        {project.description || 'Enterprise architecture workspace.'}
                     </p>

                     <div className="flex items-center justify-between pt-4 border-t border-[#DFE1E6]">
                        <div className="flex items-center gap-4 text-[11px] font-bold text-[#5E6C84] uppercase tracking-tighter">
                           <div className="flex items-center gap-1"><Users size={12} /> {project.teamSize || 0}</div>
                           <div className="flex items-center gap-1"><Calendar size={12} /> {project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Target'}</div>
                        </div>
                        <ArrowRight size={16} className="text-[#0052CC] opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
               </Link>
            ))}
         </div>

         {projects.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
               <Folder size={64} className="text-[#DFE1E6] mb-4" />
               <h3 className="text-lg font-bold text-[#172B4D]">Node Environment Empty</h3>
               <p className="text-sm text-[#5E6C84] mt-1">Initiate your first project to begin tracking.</p>
            </div>
         )}

         {showModal && (
            <div className="fixed inset-0 bg-[#091E42]/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
               <div className="bg-white rounded-[3px] max-w-xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between">
                     <h2 className="text-xl font-semibold text-[#172B4D]">Create project</h2>
                     <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F4F5F7] rounded-[3px] text-[#42526E] transition-colors"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                     {/* Template Section */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5E6C84]">Template</label>
                        <div className="relative">
                           <select
                              className="w-full bg-white border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-3 px-3 text-sm outline-none appearance-none cursor-pointer font-bold text-[#172B4D]"
                              value={newProject.projectType}
                              onChange={e => setNewProject({ ...newProject, projectType: e.target.value })}
                           >
                              <option value="KANBAN">Kanban</option>
                              <option value="SPRINT">Sprint</option>
                           </select>
                           <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none hidden">
                              {/* We can add icons here if we want to get fancy with a custom component, 
                             but a clean select is safer for now to avoid breaking layout */}
                           </div>
                           <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-[#5E6C84]">
                           {newProject.projectType === 'KANBAN'
                              ? 'Visualize and advance your project forward using issues on a kanban board.'
                              : 'Plan and deliver work in cycles (sprints) to improve team velocity and focus.'}
                        </p>
                     </div>

                     <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84]">Project name <span className="text-[#DE350B]">*</span></label>
                        <input
                           type="text"
                           className="w-full bg-white border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none transition-all"
                           placeholder="e.g. My project"
                           value={newProject.name}
                           onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84]">Description</label>
                        <textarea
                           className="w-full bg-white border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none transition-all h-24 resize-none"
                           placeholder="Add a description (optional)"
                           value={newProject.description}
                           onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                        />
                     </div>

                     {/* People Section */}
                     <div className="pt-4 border-t border-[#DFE1E6] space-y-6">
                        <h3 className="text-sm font-bold text-[#172B4D]">People</h3>

                        <div className="space-y-1">
                           <label className="text-xs font-bold text-[#5E6C84]">Project lead <span className="text-[#DE350B]">*</span></label>
                           <div className="relative">
                              <div className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-1.5 px-2 flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[#6554C0] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                    {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'A'}
                                 </div>
                                 <span className="text-sm text-[#172B4D]">{authUser?.name || 'User'} (you)</span>
                                 <X size={14} className="ml-auto text-[#42526E] cursor-pointer hover:text-[#DE350B]" />
                              </div>
                           </div>
                           <p className="text-[11px] text-[#5E6C84] mt-1">The project lead will be the default admin for this project.</p>
                        </div>

                        <div className="space-y-1">
                           <label className="text-xs font-bold text-[#5E6C84]">Team members</label>
                           <div className="relative">
                              <select
                                 className="w-full bg-white border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none appearance-none text-[#172B4D]"
                                 onChange={e => {
                                    const selectedUserId = parseInt(e.target.value);
                                    if (selectedUserId && !newProject.teamMembers.find(u => u.id === selectedUserId)) {
                                       const user = onboardedUsers.find(u => u.id === selectedUserId);
                                       if (user) {
                                          setNewProject({
                                             ...newProject,
                                             teamMembers: [...newProject.teamMembers, user]
                                          });
                                       }
                                    }
                                 }}
                              >
                                 <option value="">Select people</option>
                                 {onboardedUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                 ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                           </div>

                           {newProject.teamMembers.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                 {newProject.teamMembers.map(member => (
                                    <div key={member.id} className="bg-[#F4F5F7] border border-[#DFE1E6] rounded-[3px] px-2 py-1 flex items-center gap-2 group transition-all hover:bg-[#EBECF0]">
                                       <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-[8px] font-bold text-white uppercase">
                                          {member.name.charAt(0)}
                                       </div>
                                       <span className="text-[11px] font-semibold text-[#172B4D]">{member.name}</span>
                                       <X
                                          size={12}
                                          className="text-[#42526E] cursor-pointer hover:text-[#DE350B]"
                                          onClick={() => setNewProject({
                                             ...newProject,
                                             teamMembers: newProject.teamMembers.filter(m => m.id !== member.id)
                                          })}
                                       />
                                    </div>
                                 ))}
                              </div>
                           )}
                           <p className="text-[11px] text-[#5E6C84] mt-1">Add people to your project. Members can view the board and create issues.</p>
                        </div>
                     </div>

                     <div
                        onClick={() => setShowMore(!showMore)}
                        className="pt-4 flex items-center gap-2 text-[#0052CC] font-bold text-xs cursor-pointer hover:underline group"
                     >
                        <ArrowRight size={14} className={`transition-transform ${showMore ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                        {showMore ? 'Hide advanced settings' : 'More settings'}
                     </div>

                     {showMore && (
                        <div className="pt-4 space-y-6 animate-in slide-in-from-top-4 duration-300">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-xs font-bold text-[#5E6C84]">Category</label>
                                 <select
                                    className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-2 px-3 text-sm outline-none"
                                    value={newProject.category}
                                    onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                                 >
                                    <option value="Software">Software</option>
                                    <option value="Business">Business</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Operations">Operations</option>
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs font-bold text-[#5E6C84]">Visibility</label>
                                 <select
                                    className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-2 px-3 text-sm outline-none"
                                    value={newProject.visibility}
                                    onChange={e => setNewProject({ ...newProject, visibility: e.target.value })}
                                 >
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private</option>
                                 </select>
                              </div>
                           </div>

                           <div className="space-y-1">
                              <label className="text-xs font-bold text-[#5E6C84]">Target Deadline</label>
                              <input
                                 type="date"
                                 className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-2 px-3 text-sm outline-none"
                                 value={newProject.deadline}
                                 onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                              />
                           </div>

                           <div className="space-y-1">
                              <label className="text-xs font-bold text-[#5E6C84]">Strategic Objective</label>
                              <textarea
                                 className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-2 px-3 text-sm outline-none h-20 resize-none"
                                 placeholder="What is the primary goal of this project?"
                                 value={newProject.objective}
                                 onChange={e => setNewProject({ ...newProject, objective: e.target.value })}
                              />
                           </div>

                           <div className="space-y-1">
                              <label className="text-xs font-bold text-[#5E6C84]">Governance Model</label>
                              <textarea
                                 className="w-full bg-white border-2 border-[#DFE1E6] rounded-[3px] py-2 px-3 text-sm outline-none h-20 resize-none"
                                 placeholder="Define the decision-making framework..."
                                 value={newProject.governance}
                                 onChange={e => setNewProject({ ...newProject, governance: e.target.value })}
                              />
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="px-6 py-4 bg-white border-t border-[#DFE1E6] flex items-center justify-between shrink-0">
                     <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                           type="checkbox"
                           className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                           checked={createAnother}
                           onChange={e => setCreateAnother(e.target.checked)}
                        />
                        <span className="text-xs text-[#42526E] font-medium group-hover:text-[#172B4D]">Create another project</span>
                     </label>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7] rounded-[3px]">Cancel</button>
                        <button
                           onClick={handleCreate}
                           disabled={!newProject.name}
                           className="bg-[#0052CC] text-white px-5 py-2 rounded-[3px] text-sm font-bold shadow-md hover:bg-[#003484] transition-all active:scale-95 disabled:opacity-50"
                        >
                           Create
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ProjectList;
