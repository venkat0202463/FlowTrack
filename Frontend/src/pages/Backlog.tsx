import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronRight, 
  Clock,
  Trash2,
  CheckCircle,
  HelpCircle,
  Search,
  Filter,
  Layout,
  Zap,
  Settings,
  Edit2,
  X,
  Users
} from 'lucide-react';
import api from '../services/api';
import type { Task, Sprint, Project } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import CreateIssueModal from '../components/CreateIssueModal';
import TaskDetailModal from '../components/TaskDetailModal';

const Backlog = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user: authUser } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const isLead = authUser?.id === project?.createdBy?.id || authUser?.role === 'MANAGER';
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [openSprintMenuId, setOpenSprintMenuId] = useState<number | null>(null);
  const [openFilterMenuId, setOpenFilterMenuId] = useState<number | null>(null);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [editingSprintId, setEditingSprintId] = useState<number | null>(null);
  const [editingAction, setEditingAction] = useState<'EDIT' | 'DATES'>('EDIT');
  const [editSprintData, setEditSprintData] = useState({ name: '', startDate: '', endDate: '' });
  const [showTipsDetails, setShowTipsDetails] = useState(false);
  const [expandedSprintIds, setExpandedSprintIds] = useState<Set<number>>(new Set());
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editProjectData, setEditProjectData] = useState({ name: '', description: '', deadline: '' });
  const sprintDurationDays = 6.8;

  useEffect(() => { 
    if (projectId) fetchData(); 
    const handleClickOutside = () => { 
      setOpenSprintMenuId(null); 
      setOpenFilterMenuId(null); 
      setShowHeaderMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, sprintsRes, usersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}`),
        api.get(`/projects/${projectId}/sprints`),
        api.get('/auth/users')
      ]);
      setProject(projRes.data);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : []);
      setAllUsers(usersRes.data);
    } catch (err) { 
      console.error('Fetch error:', err);
    } finally { 
      setLoading(false); 
    }
  };

  const moveToSprint = async (taskId: number, sprintId: number | null) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await api.put(`/tasks/${taskId}`, {
        projectId: Number(projectId),
        sprintId: sprintId,
        task: { 
          ...task, 
          environment: sprintId ? 'SPRINT' : 'BACKLOG' 
        },
        assigneeId: task?.assigneeId || task?.assignee?.id || null
      });
      fetchData();
    } catch (err) { fetchData(); }
  };

  const handleCreateSprint = async () => {
    try {
      const sprintCount = sprints.filter(s => !s.name.toLowerCase().includes('kanban')).length;
      await api.post(`/projects/${projectId}/sprints`, {
        name: `Sprint ${sprintCount + 1}`,
        status: 'PLANNED',
        projectId: Number(projectId)
      });
      addNotification('Success', 'New sprint cycle initialized', 'success');
      fetchData();
    } catch (err) { addNotification('Error', 'Failed to create sprint', 'error'); }
  };

  const handleCreateKanban = async () => {
    try {
      const kanbanCount = sprints.filter(s => s.name.toLowerCase().includes('kanban')).length;
      await api.post(`/projects/${projectId}/sprints`, {
        name: `Kanban ${kanbanCount + 1}`,
        status: 'PLANNED',
        projectId: Number(projectId)
      });
      addNotification('Success', 'New kanban cycle initialized', 'success');
      fetchData();
    } catch (err) { addNotification('Error', 'Failed to create kanban', 'error'); }
  };

  const handleEditSprintSubmit = async () => {
    try {
      await api.put(`/projects/${projectId}/sprints/${editingSprintId}`, {
        name: editSprintData.name,
        startDate: editSprintData.startDate || null,
        endDate: editSprintData.endDate || null
      });
      addNotification('Success', 'Sprint updated', 'success');
      setEditingSprintId(null);
      fetchData();
    } catch (err) {
      addNotification('Error', 'Failed to update sprint', 'error');
    }
  };

  const deleteSprint = async (sprintId: number) => {
    if (!window.confirm('Delete this cycle? Issues will return to backlog.')) return;
    try {
      await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
      addNotification('Deleted', 'Cycle removed', 'info');
      fetchData();
    } catch (err) { addNotification('Error', 'Failed to delete cycle', 'error'); }
  };
  
  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      addNotification('Success', 'Project moved to trash', 'success');
      navigate('/dashboard/projects');
    } catch (err) {
      addNotification('Error', 'Failed to delete project', 'error');
    }
  };

  const handleEditProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${projectId}`, {
        ...project,
        name: editProjectData.name,
        description: editProjectData.description,
        deadline: editProjectData.deadline
      });
      addNotification('Success', 'Project configuration updated', 'success');
      setIsEditProjectModalOpen(false);
      fetchData();
    } catch (err) {
      addNotification('Error', 'Failed to update project', 'error');
    }
  };

  const toggleMember = async (userId: number) => {
     try {
        const isMember = project?.teamMembers?.some((m: any) => m.id === userId);
        const updatedMembers = isMember 
           ? project.teamMembers.filter((m: any) => m.id !== userId)
           : [...(project.teamMembers || []), allUsers.find(u => u.id === userId)];
        
        await api.put(`/projects/${projectId}`, {
           ...project,
           teamMembers: updatedMembers
        });
        fetchData();
        addNotification('Project Updated', isMember ? 'Member removed' : 'Member added', 'success');
     } catch (err) {
        addNotification('Error', 'Failed to update members', 'error');
     }
  };

  const startCycle = async (sprintId: number, isKanban: boolean) => {
    if (sprints.some(s => s.status?.toUpperCase() === 'ACTIVE')) {
      addNotification('Active Cycle Exists', 'Complete your current cycle before starting a new one.', 'warning');
      return;
    }
    try {
      await api.put(`/projects/${projectId}/sprints/${sprintId}`, {
        status: 'ACTIVE',
        name: sprints.find(s => s.id === sprintId)?.name
      });
      addNotification('Success', `${isKanban ? 'Kanban' : 'Sprint'} started`, 'success');
      navigate(isKanban ? `/dashboard/project/${projectId}` : `/dashboard/sprint-board/${projectId}`);
    } catch (err) { addNotification('Error', `Failed to start ${isKanban ? 'kanban' : 'sprint'}`, 'error'); }
  };

  const backlogTasks = tasks.filter(task => !task.sprintId && (!task.sprint || !task.sprint.id));
  const completedSprints = sprints.filter(s => s.status?.toUpperCase() === 'COMPLETED');

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-10 h-10 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderIssueRow = (task: Task) => (
    <div 
      key={task.id} 
      className="group flex items-center gap-4 px-4 py-2 bg-white border-b border-[#DFE1E6] hover:bg-[#F4F5F7] transition-all cursor-pointer"
      onClick={() => { setActiveTaskId(task.id); setIsDetailModalOpen(true); }}
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id.toString()); }}
      draggable
    >
      <input type="checkbox" className="w-4 h-4 rounded border-[#DFE1E6]" onClick={e => e.stopPropagation()} />
      <span className="text-[13px] font-semibold text-[#42526E] min-w-[100px] uppercase">FT-{task.id}</span>
      <span className="text-[14px] font-medium text-[#172B4D] flex-1 truncate">{task.title}</span>
      
      <div className="flex items-center gap-4">
        {task.priority === 'HIGH' && <span className="bg-[#FFEBE6] text-[#BF2600] text-[10px] font-black px-2 py-0.5 rounded uppercase">High</span>}
        {task.priority === 'MEDIUM' && <span className="bg-[#FFF0B3] text-[#172B4D] text-[10px] font-black px-2 py-0.5 rounded uppercase">Medium</span>}
        
        <div className="flex -space-x-2">
           <div className="w-6 h-6 rounded-full bg-[#00A3BF] border-2 border-white flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">
             {task.assignee?.name.charAt(0) || 'U'}
           </div>
        </div>
        
        {task.status === 'DONE' && <span className="text-[10px] font-black text-[#006644] uppercase tracking-tighter bg-[#E3FCEF] px-2 py-0.5 rounded">Done</span>}
        
        <div className="bg-[#F4F5F7] px-2 py-0.5 rounded text-[13px] font-semibold text-[#42526E] min-w-[20px] text-center">
          {task.storyPoints || 0}
        </div>
        
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EBECF0] rounded text-[#BF2600] transition-opacity" onClick={e => { e.stopPropagation(); /* delete logic */ }}>
           <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  const renderSprintCluster = (sprint: Sprint) => {
    const sprintTasksUnfiltered = tasks.filter(t => t.sprintId === sprint.id || (t.sprint && t.sprint.id === sprint.id));
    const sprintTasks = sprintTasksUnfiltered.filter(t => {
       if (activeFilterId === 'high-priority') return t.priority === 'HIGH';
       if (activeFilterId === 'medium-priority') return t.priority === 'MEDIUM';
       return true;
    });
    const totalSP = sprintTasksUnfiltered.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    return (
      <div 
        key={sprint.id} 
        className="mb-10 border border-[#DFE1E6] rounded-md overflow-hidden bg-white shadow-sm"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
           const taskId = Number(e.dataTransfer.getData('taskId'));
           moveToSprint(taskId, sprint.id);
        }}
      >
        <div className="flex items-center justify-between px-4 py-4 bg-[#F4F5F7]/50 border-b border-[#DFE1E6]">
           <div className="flex items-center gap-4">
              <ChevronDown size={20} className="text-[#42526E]" />
              <h3 className="text-[14px] font-semibold text-[#172B4D]">{sprint.name}</h3>
              <div className="flex -space-x-2">
                 {(project?.teamMembers || []).map(member => (
                   <div key={member.id} title={member.name} className="w-6 h-6 rounded-full bg-[#0052CC] border-2 border-white flex items-center justify-center text-[8px] font-black uppercase shadow-sm text-white">{member.name.charAt(0)}</div>
                 ))}
              </div>
              <div className="flex items-center gap-2 relative">
                 <button onClick={(e) => { e.stopPropagation(); setOpenFilterMenuId(openFilterMenuId === sprint.id ? null : sprint.id); }} className={`jira-button-subtle text-[11px] font-bold h-7 px-3 ${activeFilterId ? 'bg-[#E6EFFC] text-[#0052CC]' : ''}`}>
                    Quick filters <ChevronDown size={12} />
                 </button>
                 {openFilterMenuId === sprint.id && (
                   <div className="absolute top-8 left-0 w-40 bg-white border border-[#DFE1E6] rounded shadow-xl py-1 z-50">
                      <button onClick={(e) => { e.stopPropagation(); setActiveFilterId(activeFilterId === 'high-priority' ? null : 'high-priority'); setOpenFilterMenuId(null); }} className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-[#F4F5F7] ${activeFilterId === 'high-priority' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#172B4D]'}`}>High Priority {activeFilterId === 'high-priority' && <CheckCircle size={10} />}</button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveFilterId(activeFilterId === 'medium-priority' ? null : 'medium-priority'); setOpenFilterMenuId(null); }} className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-[#F4F5F7] ${activeFilterId === 'medium-priority' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#172B4D]'}`}>Medium Priority {activeFilterId === 'medium-priority' && <CheckCircle size={10} />}</button>
                   </div>
                 )}
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => { setEditingAction('DATES'); setEditingSprintId(sprint.id); setEditSprintData({ name: sprint.name || '', startDate: sprint.startDate || '', endDate: sprint.endDate || '' }); }} className="jira-button-subtle text-[11px] font-bold h-7 px-3 flex items-center gap-1"><Clock size={12}/>{sprint.startDate && sprint.endDate ? `${sprint.startDate} - ${sprint.endDate}` : 'Add dates'}</button>
              <button onClick={() => { setEditingAction('EDIT'); setEditingSprintId(sprint.id); setEditSprintData({ name: sprint.name || '', startDate: sprint.startDate || '', endDate: sprint.endDate || '' }); }} className="jira-button-subtle text-[11px] font-bold h-7 px-3">Edit sprint</button>
              
              {editingSprintId === sprint.id && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42]/20" onClick={() => setEditingSprintId(null)}>
                   <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 border border-[#DFE1E6]" onClick={e => e.stopPropagation()}>
                      <h3 className="text-base font-semibold text-[#172B4D] mb-6">{editingAction === 'DATES' ? 'Set Sprint Lifecycle' : 'Edit Sprint Configuration'}</h3>
                      <div className="space-y-4">
                         {editingAction === 'EDIT' && (
                           <div>
                              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Sprint name *</label>
                              <input type="text" value={editSprintData.name} onChange={e => setEditSprintData({...editSprintData, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                           </div>
                         )}
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Start date</label>
                              <input type="date" value={editSprintData.startDate} onChange={e => setEditSprintData({...editSprintData, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#5E6C84] mb-1">End date</label>
                              <input type="date" value={editSprintData.endDate} onChange={e => setEditSprintData({...editSprintData, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-8">
                         <button onClick={() => setEditingSprintId(null)} className="jira-button-subtle text-sm font-semibold h-8 px-3">Cancel</button>
                         <button onClick={handleEditSprintSubmit} className="jira-button-primary px-4 py-1.5 text-sm h-8">{editingAction === 'DATES' ? 'Save Dates' : 'Apply Pipeline'}</button>
                      </div>
                   </div>
                </div>
              )}
              {isLead && (
                <button onClick={() => startCycle(sprint.id, (sprint.name || '').toLowerCase().includes('kanban'))} className="bg-[#0052CC] text-white text-[11px] font-black h-7 px-4 rounded hover:bg-[#003484] shadow-md shadow-blue-500/10">
                  {(sprint.name || '').toLowerCase().includes('kanban') ? 'Start kanban' : 'Start sprint'}
                </button>
              )}
              <button 
                 onClick={(e) => { e.stopPropagation(); setOpenSprintMenuId(openSprintMenuId === sprint.id ? null : sprint.id); }}
                 className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]"
              >
                 <MoreHorizontal size={18} />
              </button>
              {openSprintMenuId === sprint.id && (
                <div className="absolute right-6 mt-8 w-40 bg-white border border-[#DFE1E6] rounded shadow-xl py-1 z-50">
                   <button onClick={() => deleteSprint(sprint.id)} className="w-full text-left px-4 py-2 text-xs text-[#BF2600] flex items-center gap-2 hover:bg-[#FFEBE6]"><Trash2 size={12} /> Delete</button>
                </div>
              )}
           </div>
        </div>
        
        <div className="px-4 py-2 border-b border-[#DFE1E6] bg-[#F4F5F7]/30 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">
              <CheckCircle size={14} className="text-[#36B37E]" /> {sprint.name} · Total {sprintTasks.length} Issues · {totalSP} SP
           </div>
           <div className="flex items-center gap-3">
              <Search size={14} className="text-[#A5ADBA]" />
              <Filter size={14} className="text-[#A5ADBA]" />
           </div>
        </div>

        <div className="min-h-[40px]">
           {sprintTasks.map(renderIssueRow)}
           {sprintTasks.length === 0 && (
             <div className="p-10 text-center text-sm text-[#5E6C84] italic border-b border-dashed border-[#DFE1E6]">
               Drag issues here to plan your sprint cycle.
             </div>
           )}
        </div>
        
        <div className="px-4 py-3 bg-white hover:bg-[#F4F5F7] border-t border-[#DFE1E6] group">
          <button onClick={() => { setSelectedSprintId(sprint.id); setIsCreateModalOpen(true); }} className="flex items-center gap-2 text-sm font-semibold text-[#42526E] group-hover:text-[#0052CC] transition-colors">
            <Plus size={18} className="text-[#0052CC]" /> Create issue
          </button>
        </div>
      </div>
    );
  };

  
  return (
    <div className="flex flex-col h-full bg-white font-sans text-sm overflow-y-auto custom-scrollbar-wide">
      <div className="px-10 pb-20 pt-8">
        {/* Breadcrumbs Cluster */}
        <div className="flex items-center gap-2 text-[11px] text-[#5E6C84] mb-3 uppercase font-bold tracking-widest">
          <Link to="/dashboard/projects" className="hover:text-[#172B4D]">Projects</Link>
          <ChevronRight size={14} />
          <Link to={`/dashboard/project/${projectId}`} className="hover:text-[#172B4D]">{project?.name || 'Loading Project...'}</Link>
          <ChevronRight size={14} />
          <span className="text-[#172B4D]">Backlog</span>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[24px] font-semibold text-[#172B4D] tracking-tighter">Backlog</h1>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[13px] font-semibold text-[#42526E]">
                <Clock size={16} className="text-[#5E6C84]" /> 4 days remaining
             </div>
             <div className="relative">
                <MoreHorizontal 
                   className={`text-[#42526E] cursor-pointer hover:bg-[#EBECF0] rounded p-1 transition-colors ${showHeaderMenu ? 'bg-[#EBECF0] text-[#0052CC]' : ''}`} 
                   size={26} 
                   onClick={(e) => { e.stopPropagation(); setShowHeaderMenu(!showHeaderMenu); }}
                />
                {showHeaderMenu && (
                   <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DFE1E6] rounded-md shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-[#F4F5F7] mb-1">
                         <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Project Actions</p>
                      </div>
                      <button onClick={() => { setIsBoardSettingsOpen(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-3"><Settings size={14} className="text-[#42526E]" /> Board settings</button>
                      <button onClick={() => { setEditProjectData({ name: project?.name || '', description: project?.description || '', deadline: project?.deadline || '' }); setIsEditProjectModalOpen(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-3"><Edit2 size={14} className="text-[#42526E]" /> Edit project</button>
                      <button onClick={() => navigate(`/dashboard/project/${projectId}`)} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-3"><Layout size={14} className="text-[#42526E]" /> View workflow</button>
                      <div className="my-1 border-t border-[#F4F5F7]" />
                      <button onClick={handleDeleteProject} className="w-full text-left px-4 py-2 text-sm text-[#DE350B] hover:bg-[#FFEBE6] flex items-center gap-3 font-medium"><Trash2 size={14} /> Move to trash</button>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Intel Tips Banner */}
        <div className="bg-[#DEEBFF] border border-[#0052CC]/10 rounded-lg p-5 flex flex-col gap-5 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#0052CC] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-white">
                  <Clock size={20} className="text-white" />
              </div>
              <div>
                  <p className="text-sm font-semibold text-[#172B4D]">
                    The average number of days in Sprint 1 is <span className="text-[#0052CC] font-black">{sprintDurationDays}</span>. Keep your sprints short to reduce time between cycles.
                    <button onClick={() => setShowTipsDetails(!showTipsDetails)} className="text-[#0052CC] ml-2 hover:underline font-black">Learn more ↗</button>
                  </p>
              </div>
            </div>
            <button 
              onClick={() => setShowTipsDetails(!showTipsDetails)}
              className={`px-4 py-2 border rounded-[3px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${showTipsDetails ? 'bg-[#0052CC] text-white border-transparent' : 'bg-white text-[#0052CC] border-[#0052CC]/20 hover:bg-[#F4F5F7]'}`}
            >
              {showTipsDetails ? 'Close Intel' : 'Tips'}
            </button>
          </div>

          {showTipsDetails && (
            <div className="grid grid-cols-3 gap-6 pt-5 border-t border-[#0052CC]/10 animate-in slide-in-from-top-2 duration-300">
               <div className="bg-white/50 p-4 rounded-xl border border-white">
                  <span className="text-[9px] font-black text-[#0052CC] uppercase tracking-widest block mb-2">Cycle Velocity</span>
                  <p className="text-[11px] font-semibold text-[#42526E] leading-relaxed">Sprints under 14 days increase feedback loops by 40%.</p>
               </div>
               <div className="bg-white/50 p-4 rounded-xl border border-white">
                  <span className="text-[9px] font-black text-[#0052CC] uppercase tracking-widest block mb-2">WIP Management</span>
                  <p className="text-[11px] font-semibold text-[#42526E] leading-relaxed">Limit 'In Progress' tickets to 3 per developer for maximum flow.</p>
               </div>
               <div className="bg-white/50 p-4 rounded-xl border border-white">
                  <span className="text-[9px] font-black text-[#0052CC] uppercase tracking-widest block mb-2">Backlog Health</span>
                  <p className="text-[11px] font-semibold text-[#42526E] leading-relaxed">Estimation accuracy improves when issues have clear acceptance criteria.</p>
               </div>
            </div>
          )}
        </div>

        {sprints.filter(s => s.status?.toUpperCase() !== 'ACTIVE' && s.status?.toUpperCase() !== 'COMPLETED').map(renderSprintCluster)}
        
        {/* Backlog Reservoir */}
        <div 
           className="mt-6 border border-[#DFE1E6] rounded-md overflow-hidden bg-white shadow-sm"
           onDragOver={e => e.preventDefault()}
           onDrop={e => {
              const taskId = Number(e.dataTransfer.getData('taskId'));
              moveToSprint(taskId, null);
           }}
        >
           <div className="px-4 py-3 bg-[#F4F5F7]/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-[14px] font-semibold text-[#172B4D] uppercase tracking-widest bg-white border border-[#DFE1E6] px-3 py-1 rounded">Backlog</h3>
                 <span className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-widest">{backlogTasks.length} Issues Ready</span>
              </div>
              <div className="flex gap-2">
                 {isLead && (
                   <>
                     <button onClick={handleCreateKanban} className="jira-button-subtle text-[11px] font-bold h-8 px-4 border border-[#DFE1E6] bg-white">Create kanban</button>
                     <button onClick={handleCreateSprint} className="jira-button-subtle text-[11px] font-bold h-8 px-4 border border-[#DFE1E6] bg-white">Create sprint</button>
                   </>
                 )}
              </div>
           </div>
           
           <div className="min-h-[100px]">
              {backlogTasks.map(renderIssueRow)}
              {backlogTasks.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-[#5E6C84] bg-white text-sm italic">
                   <div className="w-12 h-12 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4">
                      <HelpCircle size={24} className="text-[#C1C7D0]" />
                   </div>
                   Strategic backlog is currently empty.
                </div>
              )}
           </div>
           
           <div className="px-4 py-3 bg-white hover:bg-[#F4F5F7] border-t border-[#DFE1E6] group">
             <button onClick={() => { setSelectedSprintId(null); setIsCreateModalOpen(true); }} className="flex items-center gap-2 text-sm font-semibold text-[#42526E] group-hover:text-[#0052CC] transition-colors">
               <Plus size={18} className="text-[#0052CC]" /> Create issue
             </button>
           </div>
        </div>

         {/* Cycle History */}
         {completedSprints.length > 0 && (
           <div className="mt-12 pt-8 border-t border-dashed border-[#DFE1E6]">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2 text-[#172B4D]">
                 <CheckCircle size={20} className="text-[#36B37E]" />
                 <h2 className="text-[18px] font-semibold tracking-tight">Cycle History</h2>
               </div>
               <span className="bg-[#E3FCEF] text-[#006644] text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#36B37E]/20">
                 {completedSprints.length} ARCHIVED CYCLES
               </span>
             </div>
             <div className="space-y-4">
               {completedSprints.map(sprint => {
                 const isExpanded = expandedSprintIds.has(sprint.id);
                 const sprintTasks = tasks.filter(t => t.sprintId === sprint.id || (t.sprint && t.sprint.id === sprint.id));
                 
                 return (
                   <div key={sprint.id} className="relative mb-4">
                     <div 
                       onClick={() => {
                         const next = new Set(expandedSprintIds);
                         if (next.has(sprint.id)) next.delete(sprint.id);
                         else next.add(sprint.id);
                         setExpandedSprintIds(next);
                       }}
                       className="flex items-center justify-between px-6 py-4 bg-white border border-[#DFE1E6] rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     >
                       <div className="flex items-center gap-4">
                         <ChevronRight size={18} className={`text-[#42526E] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                         <h3 className="text-[14px] font-semibold text-[#172B4D]">{sprint.name}</h3>
                         <span className="bg-[#E3FCEF] text-[#006644] text-[10px] font-black px-2 py-0.5 rounded uppercase border border-[#36B37E]/20">Completed</span>
                         <div className="flex -space-x-2 ml-4">
                            {(project?.teamMembers || []).map(member => (
                              <div key={member.id} title={member.name} className="w-6 h-6 rounded-full bg-[#0052CC] border-2 border-white flex items-center justify-center text-[8px] font-black uppercase shadow-sm text-white">{member.name.charAt(0)}</div>
                            ))}
                         </div>
                         <div className="relative">
                            <button 
                               onClick={(e) => { e.stopPropagation(); setOpenFilterMenuId(openFilterMenuId === sprint.id ? null : sprint.id); }}
                               className="ml-4 text-[11px] font-bold text-[#5E6C84] flex items-center gap-1 hover:text-[#172B4D]"
                            >
                               Quick filters <ChevronDown size={12} />
                            </button>
                            {openFilterMenuId === sprint.id && (
                              <div className="absolute top-8 left-4 w-40 bg-white border border-[#DFE1E6] rounded shadow-xl py-1 z-50">
                                 <button onClick={(e) => { e.stopPropagation(); setActiveFilterId(activeFilterId === 'high-priority' ? null : 'high-priority'); setOpenFilterMenuId(null); }} className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-[#F4F5F7] ${activeFilterId === 'high-priority' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#172B4D]'}`}>High Priority {activeFilterId === 'high-priority' && <CheckCircle size={10} />}</button>
                                 <button onClick={(e) => { e.stopPropagation(); setActiveFilterId(activeFilterId === 'medium-priority' ? null : 'medium-priority'); setOpenFilterMenuId(null); }} className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-[#F4F5F7] ${activeFilterId === 'medium-priority' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#172B4D]'}`}>Medium Priority {activeFilterId === 'medium-priority' && <CheckCircle size={10} />}</button>
                              </div>
                            )}
                         </div>
                       </div>
                       <div className="flex items-center gap-6">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setEditingAction('DATES'); setEditingSprintId(sprint.id); setEditSprintData({ name: sprint.name || '', startDate: sprint.startDate || '', endDate: sprint.endDate || '' }); }}
                            className="text-[11px] font-bold text-[#5E6C84] flex items-center gap-1 hover:text-[#172B4D]"
                         >
                           <Clock size={12} /> {sprint.startDate && sprint.endDate ? `${sprint.startDate} - ${sprint.endDate}` : 'Add dates'}
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setEditingAction('EDIT'); setEditingSprintId(sprint.id); setEditSprintData({ name: sprint.name || '', startDate: sprint.startDate || '', endDate: sprint.endDate || '' }); }}
                            className="text-[12px] font-bold text-[#42526E] hover:underline"
                         >
                            Edit sprint
                         </button>
                         <div className="relative">
                            <MoreHorizontal 
                               size={18} 
                               className="text-[#42526E] cursor-pointer hover:text-[#172B4D]" 
                               onClick={(e) => { e.stopPropagation(); setOpenSprintMenuId(openSprintMenuId === sprint.id ? null : sprint.id); }}
                            />
                            {openSprintMenuId === sprint.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-[#DFE1E6] rounded shadow-xl py-1 z-50">
                                 <button onClick={() => deleteSprint(sprint.id)} className="w-full text-left px-4 py-2 text-xs text-[#BF2600] flex items-center gap-2 hover:bg-[#FFEBE6]"><Trash2 size={12} /> Delete</button>
                              </div>
                            )}
                         </div>
                       </div>
                     </div>
                     
                     {isExpanded && (
                       <div className="mt-[-1px] border border-[#DFE1E6] border-t-0 rounded-b-md bg-[#F4F5F7]/10 animate-in slide-in-from-top-1 duration-200">
                         <div className="px-4 py-2 bg-[#F4F5F7]/30 border-b border-[#DFE1E6] flex items-center justify-between">
                            <div className="text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">
                               ARCHIVED ISSUES ({sprintTasks.length})
                            </div>
                         </div>
                         <div className="min-h-[20px]">
                            {sprintTasks.map(renderIssueRow)}
                            {sprintTasks.length === 0 && (
                              <div className="p-6 text-center text-xs text-[#5E6C84] italic">
                                No issues were recorded in this cycle.
                              </div>
                            )}
                         </div>
                       </div>
                     )}

                     {editingSprintId === sprint.id && (
                       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42]/20" onClick={() => setEditingSprintId(null)}>
                          <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 border border-[#DFE1E6]" onClick={e => e.stopPropagation()}>
                             <h3 className="text-base font-semibold text-[#172B4D] mb-6">{editingAction === 'DATES' ? 'Set Sprint Lifecycle' : 'Edit Sprint Configuration'}</h3>
                             <div className="space-y-4">
                                {editingAction === 'EDIT' && (
                                  <div>
                                     <label className="block text-xs font-bold text-[#5E6C84] mb-1">Sprint name *</label>
                                     <input type="text" value={editSprintData.name} onChange={e => setEditSprintData({...editSprintData, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                     <label className="block text-xs font-bold text-[#5E6C84] mb-1">Start date</label>
                                     <input type="date" value={editSprintData.startDate} onChange={e => setEditSprintData({...editSprintData, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                                   </div>
                                   <div>
                                     <label className="block text-xs font-bold text-[#5E6C84] mb-1">End date</label>
                                     <input type="date" value={editSprintData.endDate} onChange={e => setEditSprintData({...editSprintData, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded hover:bg-[#F4F5F7] focus:bg-white focus:outline-none focus:border-[#0052CC] transition-colors" />
                                   </div>
                                </div>
                             </div>
                             <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setEditingSprintId(null)} className="jira-button-subtle text-sm font-semibold h-8 px-3">Cancel</button>
                                <button onClick={handleEditSprintSubmit} className="jira-button-primary px-4 py-1.5 text-sm h-8">{editingAction === 'DATES' ? 'Save Dates' : 'Apply Pipeline'}</button>
                             </div>
                          </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
         )}
      </div>

      <CreateIssueModal 
        isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        projectId={Number(projectId)} initialSprintId={selectedSprintId}
        onSuccess={fetchData}
      />

      {isDetailModalOpen && activeTaskId && (
        <TaskDetailModal 
          taskId={activeTaskId} projectId={Number(projectId)}
          isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
          onUpdate={fetchData} onDelete={fetchData}
        />
      )}
      {isEditProjectModalOpen && (
        <div className="fixed inset-0 bg-[#091E42]/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
           <div className="bg-white rounded-[3px] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between">
                 <h2 className="text-xl font-semibold text-[#172B4D]">Edit Project</h2>
                 <button onClick={() => setIsEditProjectModalOpen(false)} className="p-1 hover:bg-[#F4F5F7] rounded-[3px] text-[#42526E] transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditProjectSubmit} className="p-6 space-y-6">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5E6C84]">Project name</label>
                    <input 
                       type="text" 
                       className="w-full bg-white border-2 border-[#DFE1E6] focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none transition-all"
                       value={editProjectData.name}
                       onChange={e => setEditProjectData({...editProjectData, name: e.target.value})}
                       required
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5E6C84]">Description</label>
                    <textarea 
                       className="w-full bg-white border-2 border-[#DFE1E6] focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none transition-all h-24 resize-none"
                       value={editProjectData.description}
                       onChange={e => setEditProjectData({...editProjectData, description: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5E6C84]">Target Deadline</label>
                    <input 
                       type="date" 
                       className="w-full bg-white border-2 border-[#DFE1E6] focus:border-[#4C9AFF] rounded-[3px] py-2 px-3 text-sm outline-none transition-all"
                       value={editProjectData.deadline}
                       onChange={e => setEditProjectData({...editProjectData, deadline: e.target.value})}
                    />
                 </div>
                 <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFE1E6]">
                    <button type="button" onClick={() => setIsEditProjectModalOpen(false)} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7] rounded-[3px]">Cancel</button>
                    <button type="submit" className="bg-[#0052CC] text-white px-5 py-2 rounded-[3px] text-sm font-bold hover:bg-[#003484] transition-all">Save Changes</button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {isBoardSettingsOpen && (
        <div className="fixed inset-0 bg-[#091E42]/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
           <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#F4F5F7]/50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0052CC] text-white rounded-md flex items-center justify-center"><Settings size={18} /></div>
                    <h2 className="text-lg font-bold text-[#172B4D]">Board Settings & Access</h2>
                 </div>
                 <button onClick={() => setIsBoardSettingsOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar-wide">
                 <div className="mb-8">
                    <h3 className="text-xs font-black text-[#5E6C84] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Users size={14} /> Team Access Management
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                       {allUsers.filter(u => u.id !== project?.createdBy?.id).map(u => {
                          const isMember = project?.teamMembers?.some((m: any) => m.id === u.id);
                          return (
                             <button 
                                key={u.id}
                                onClick={() => toggleMember(u.id)}
                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isMember ? 'border-[#0052CC] bg-[#E6EFFC]' : 'border-[#DFE1E6] bg-white hover:border-[#4C9AFF]'}`}
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase ${isMember ? 'bg-[#0052CC]' : 'bg-[#6B778C]'}`}>{u.name.charAt(0)}</div>
                                   <div className="text-left">
                                      <p className={`text-sm font-bold ${isMember ? 'text-[#0052CC]' : 'text-[#172B4D]'}`}>{u.name}</p>
                                      <p className="text-[10px] text-[#5E6C84] truncate w-24">{u.role}</p>
                                   </div>
                                </div>
                                {isMember ? <div className="w-5 h-5 bg-[#0052CC] text-white rounded-full flex items-center justify-center shadow-sm"><CheckCircle size={12} /></div> : <Plus size={14} className="text-[#5E6C84]" />}
                             </button>
                          );
                       })}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-black text-[#5E6C84] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Layout size={14} /> Board Metadata
                    </h3>
                    <div className="p-4 bg-[#F4F5F7] rounded-lg border border-[#DFE1E6] space-y-2">
                       <div className="flex justify-between text-xs">
                          <span className="text-[#6B778C] font-bold">Project Lead:</span>
                          <span className="text-[#172B4D] font-bold">{project?.createdBy?.name}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-[#6B778C] font-bold">Active Members:</span>
                          <span className="text-[#172B4D] font-bold">{project?.teamMembers?.length || 0} collaborators</span>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="px-6 py-4 bg-[#F4F5F7]/50 border-t border-[#DFE1E6] flex justify-end">
                 <button onClick={() => setIsBoardSettingsOpen(false)} className="bg-[#0052CC] text-white px-6 py-2 rounded text-sm font-bold hover:bg-[#003484] shadow-md shadow-blue-500/20 transition-all">Done</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Backlog;
