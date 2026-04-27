import React, { useState, useEffect } from 'react';
import { X, Zap, ChevronDown, Users, Layout } from 'lucide-react';
import api from '../services/api';
import type { User as UserType, Sprint, Task } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface CreateIssueModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  initialSprintId?: number | null;
}

const CreateIssueModal = ({ projectId, isOpen, onClose, onSuccess, initialSprintId = null }: CreateIssueModalProps) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [createAnotherIssue, setCreateAnotherIssue] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issueType: 'TASK',
    priority: 'MEDIUM',
    assigneeId: '',
    sprintId: initialSprintId || '',
    storyPoints: 0,
    dueDate: '',
    labels: '',
    attachments: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setFormData(prev => ({ ...prev, sprintId: initialSprintId || '' }));
    }
  }, [isOpen, initialSprintId]);

  const fetchData = async () => {
    try {
      const [usersRes, sprintsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get(`/projects/${projectId}/sprints`)
      ]);
      setUsers(usersRes.data);
      setSprints(sprintsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/tasks', {
        task: {
          title: formData.title,
          description: formData.description,
          issueType: formData.issueType,
          priority: formData.priority,
          storyPoints: formData.storyPoints,
          dueDate: formData.dueDate,
          tags: formData.labels.split(',').map(s => s.trim()).filter(s => s),
          attachments: formData.attachments,
          status: 'Todo',
          environment: formData.sprintId ? 'SPRINT' : 'BACKLOG'
        },
        projectId: projectId,
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        sprintId: formData.sprintId ? Number(formData.sprintId) : null
      });
      addNotification('Success', 'Issue created', 'success');
      onSuccess(res.data);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        issueType: 'TASK',
        priority: 'MEDIUM',
        assigneeId: '',
        sprintId: '',
        storyPoints: 0,
        dueDate: '',
        labels: '',
        attachments: []
      });
    } catch (err) {
      addNotification('Error', 'Failed to create issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#091E42]/50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3px] shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-white shrink-0">
           <h2 className="text-xl font-semibold text-[#172B4D]">Create issue</h2>
           <div className="flex items-center gap-2">
              <button type="button" className="p-1 hover:bg-[#F4F5F7] rounded-[3px] text-[#42526E] transition-colors"><div className="w-4 h-0.5 bg-current rounded-full" /></button>
              <button type="button" onClick={onClose} className="p-1 hover:bg-[#F4F5F7] rounded-[3px] text-[#42526E] transition-colors"><X size={20} /></button>
           </div>
        </div>

        {/* Body */}
        <form id="create-issue-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
           <div className="space-y-1">
              <label className="text-xs font-bold text-[#5E6C84]">Project <span className="text-[#DE350B]">*</span></label>
              <div className="relative">
                 <div className="w-full p-2 border-2 border-[#DFE1E6] rounded-[3px] bg-[#F4F5F7] text-sm text-[#172B4D] font-medium flex items-center gap-2 cursor-not-allowed opacity-80">
                    <div className="w-5 h-5 bg-[#0052CC] rounded-[2px] flex items-center justify-center">
                       <Zap size={12} className="text-white" fill="white" />
                    </div>
                    Software Project <span className="text-[#5E6C84] font-normal">(FT)</span>
                 </div>
                 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E]" />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-[#5E6C84]">Issue type <span className="text-[#DE350B]">*</span></label>
              <div className="relative">
                 <div className="w-full p-2 border-2 border-[#DFE1E6] rounded-[3px] bg-white flex items-center gap-2 hover:bg-[#F4F5F7] cursor-pointer transition-colors">
                    <div className="w-5 h-5 bg-[#4C9AFF] rounded-[2px] flex items-center justify-center">
                       <Layout size={12} className="text-white" fill="white" />
                    </div>
                    <span className="text-sm text-[#172B4D]">{formData.issueType.charAt(0) + formData.issueType.slice(1).toLowerCase()}</span>
                    <ChevronDown size={14} className="ml-auto text-[#42526E]" />
                 </div>
                 <p className="text-[10px] text-[#5E6C84] mt-1 italic">Some issue types are unavailable due to incompatible field configuration and/or workflow associations.</p>
              </div>
           </div>

           <div className="pt-4 border-t border-[#DFE1E6] space-y-6">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Summary <span className="text-[#DE350B]">*</span></label>
                 <input 
                   autoFocus
                   required
                   className="w-full p-2 border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] text-sm text-[#172B4D] outline-none transition-all"
                   value={formData.title}
                   onChange={e => setFormData({...formData, title: e.target.value})}
                 />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Description</label>
                 <div className="border-2 border-[#DFE1E6] rounded-[3px] bg-white overflow-hidden focus-within:border-[#4C9AFF] transition-all">
                    {/* Toolbar Mockup */}
                    <div className="flex items-center gap-1 p-1.5 border-b border-[#DFE1E6] bg-[#F4F5F7]">
                       <select className="text-[11px] font-bold bg-transparent border-none outline-none text-[#42526E] px-1 hover:bg-white/50 rounded cursor-pointer"><option>Normal text</option></select>
                       <div className="w-px h-4 bg-[#DFE1E6] mx-1" />
                       <button type="button" className="p-1 hover:bg-white/50 rounded transition-colors text-[#42526E] font-bold text-xs">B</button>
                       <button type="button" className="p-1 hover:bg-white/50 rounded transition-colors text-[#42526E] italic text-xs font-serif">I</button>
                       <button type="button" className="p-1 hover:bg-white/50 rounded transition-colors text-[#42526E]"><ChevronDown size={12} /></button>
                       <div className="w-px h-4 bg-[#DFE1E6] mx-1" />
                       <button type="button" className="p-1 hover:bg-white/50 rounded transition-colors text-[#0052CC] font-bold text-xs underline decoration-blue-500">A</button>
                    </div>
                    <textarea 
                      className="w-full p-3 text-sm text-[#172B4D] outline-none min-h-[120px] resize-none placeholder:text-[#A5ADBA]"
                      placeholder="Add a description..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                    <div className="flex items-center gap-3 p-2 bg-white">
                       <Zap size={14} className="text-[#6554C0]" />
                       <div className="w-4 h-4 rounded border border-[#DFE1E6]" />
                       <div className="w-4 h-4 rounded-full border border-[#DFE1E6]" />
                    </div>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Assignee</label>
                 <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                       <select 
                         className="w-full p-2 border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] text-sm text-[#172B4D] appearance-none outline-none bg-white transition-all pl-8"
                         value={formData.assigneeId}
                         onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                       >
                          <option value="">Unassigned</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                       </select>
                       <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#EBECF0] flex items-center justify-center"><Users size={10} className="text-[#5E6C84]" /></div>
                       <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, assigneeId: String(users.find(u => u.name.includes('Ankitha'))?.id || '')})}
                      className="text-[#0052CC] font-bold text-xs hover:underline whitespace-nowrap"
                    >
                       Assign to me
                    </button>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Priority</label>
                 <div className="relative">
                    <select 
                      className="w-full p-2 border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] text-sm text-[#172B4D] appearance-none outline-none bg-white transition-all pl-8"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                       <option value="HIGH">High</option>
                       <option value="MEDIUM">Medium</option>
                       <option value="LOW">Low</option>
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#DE350B]">=</div>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Labels</label>
                 <div className="relative">
                    <select className="w-full p-2 border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] text-sm text-[#172B4D] appearance-none outline-none bg-white transition-all">
                       <option>None</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-[#5E6C84]">Sprint</label>
                 <div className="relative">
                    <select 
                      className="w-full p-2 border-2 border-[#DFE1E6] hover:bg-[#EBECF0] focus:bg-white focus:border-[#4C9AFF] rounded-[3px] text-sm text-[#172B4D] appearance-none outline-none bg-white transition-all"
                      value={formData.sprintId}
                      onChange={e => setFormData({...formData, sprintId: e.target.value})}
                    >
                       <option value="">None</option>
                       {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E] pointer-events-none" />
                 </div>
              </div>
           </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DFE1E6] flex items-center justify-between shrink-0 bg-white">
           <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                checked={createAnotherIssue}
                onChange={e => setCreateAnotherIssue(e.target.checked)}
              />
              <span className="text-xs text-[#42526E] font-medium group-hover:text-[#172B4D]">Create another issue</span>
           </label>
           <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7] rounded-[3px]">Cancel</button>
              <div className="flex items-center">
                 <button 
                   type="submit"
                   form="create-issue-form"
                   disabled={loading || !formData.title.trim()}
                   className="px-5 py-2 bg-[#0052CC] text-white text-sm font-bold rounded-l-[3px] hover:bg-[#003484] disabled:opacity-50 shadow-md transition-all active:scale-95"
                 >
                    {loading ? 'Creating...' : 'Create'}
                 </button>
                 <button type="button" className="px-2 py-2 bg-[#0052CC] text-white border-l border-white/20 rounded-r-[3px] hover:bg-[#003484]"><ChevronDown size={16} /></button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueModal;
