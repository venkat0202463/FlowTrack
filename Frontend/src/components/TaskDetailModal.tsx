import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Trash2,
  Paperclip
} from 'lucide-react';
import api from '../services/api';
import type { User as UserType, Sprint, Task } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface TaskDetailModalProps {
  taskId: number;
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

const TaskDetailModal = ({ taskId, projectId, isOpen, onClose, onUpdate, onDelete }: TaskDetailModalProps) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      fetchInitialData();
    }
  }, [isOpen, taskId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [taskRes, usersRes, sprintsRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get('/auth/users'),
        api.get(`/projects/${projectId}/sprints`)
      ]);
      setTask(taskRes.data);
      setUsers(usersRes.data);
      setSprints(sprintsRes.data);
    } catch (err) {
      addNotification('Error', 'Failed to retrieve issue data', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Task> | any) => {
    if (!task) return;
    try {
      const payload = {
        task: { ...task, ...updates },
        projectId: projectId,
        assigneeId: updates.assigneeId !== undefined ? updates.assigneeId : (task.assignee?.id || null),
        sprintId: updates.sprintId !== undefined ? updates.sprintId : (task.sprint?.id || null)
      };

      if (updates.sprintId !== undefined) {
        payload.task.environment = updates.sprintId ? 'SPRINT' : 'BACKLOG';
      }

      const res = await api.put(`/tasks/${taskId}`, payload);
      setTask(res.data);
      onUpdate(res.data);
      addNotification('Success', 'Issue updated', 'success');
    } catch (err) {
      addNotification('Error', 'Failed to update issue', 'error');
    } finally {
      // Logic for finishing update
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      onDelete(taskId);
      addNotification('Deleted', 'Issue removed', 'info');
      onClose();
    } catch (err) {
      addNotification('Error', 'Failed to delete issue', 'error');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const currentTags = task?.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        const updatedTags = [...currentTags, newTag.trim()];
        handleUpdate({ tags: updatedTags });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!task) return;
    const updatedTags = (task.tags || []).filter(t => t !== tagToRemove);
    handleUpdate({ tags: updatedTags });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#091E42]/50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3px] shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#DFE1E6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-[#5E6C84] font-medium uppercase">FT-{taskId}</span>
              <h2 className="text-xl font-semibold text-[#172B4D]">{task?.title || 'Loading...'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="p-2 hover:bg-[#FFEBE6] text-[#DE350B] rounded-[3px] transition-colors"><Trash2 size={20} /></button>
            <button onClick={onClose} className="p-2 hover:bg-[#F4F5F7] rounded-[3px] text-[#42526E]"><X size={20} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-[7] overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5E6C84]">Description</label>
                <textarea
                  className="w-full p-3 border border-[#DFE1E6] rounded-[3px] text-sm text-[#172B4D] outline-none focus:border-[#4C9AFF] min-h-[150px] resize-none"
                  value={task?.description || ''}
                  onChange={(e) => setTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                  onBlur={() => handleUpdate({ description: task?.description })}
                  placeholder="Add a description..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5E6C84]">Labels</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(task?.tags || []).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#EBECF0] text-xs font-medium text-[#172B4D] rounded-[3px]">
                      {tag}
                      <X size={12} className="cursor-pointer hover:text-[#DE350B]" onClick={() => handleRemoveTag(tag)} />
                    </span>
                  ))}
                  <input
                    className="text-xs font-medium outline-none bg-transparent"
                    placeholder="Add label..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5E6C84]">Attachments</label>
                <div className="p-8 border-2 border-dashed border-[#DFE1E6] rounded-[3px] flex flex-col items-center justify-center gap-2 bg-[#F4F5F7]/30 group hover:border-[#4C9AFF] transition-all cursor-pointer">
                  <Paperclip size={24} className="text-[#5E6C84]" />
                  <span className="text-xs text-[#5E6C84]">Drop files to attach, or browse</span>
                </div>
              </div>
            </div>

            <div className="flex-[5] bg-[#F4F5F7]/30 overflow-y-auto p-8 space-y-8 border-l border-[#DFE1E6]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5E6C84]">Status</label>
                <div className="relative">
                  <select
                    className="w-full p-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm font-bold text-[#172B4D] appearance-none outline-none focus:border-[#4C9AFF]"
                    value={task?.status || ''}
                    onChange={(e) => handleUpdate({ status: e.target.value })}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5E6C84]">Assignee</label>
                <div className="relative">
                  <select
                    className="w-full p-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm font-bold text-[#172B4D] appearance-none outline-none focus:border-[#4C9AFF]"
                    value={task?.assignee?.id || ''}
                    onChange={(e) => handleUpdate({ assigneeId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5E6C84]">Sprint</label>
                <div className="relative">
                  <select
                    className="w-full p-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm font-bold text-[#172B4D] appearance-none outline-none focus:border-[#4C9AFF]"
                    value={task?.sprint?.id || ''}
                    onChange={(e) => handleUpdate({ sprintId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">None</option>
                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42526E]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5E6C84]">Priority</label>
                  <div className="relative">
                    <select
                      className="w-full p-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm font-bold text-[#172B4D] appearance-none outline-none focus:border-[#4C9AFF]"
                      value={task?.priority || ''}
                      onChange={(e) => handleUpdate({ priority: e.target.value })}
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5E6C84]">Story Points</label>
                  <input
                    type="number"
                    className="w-full p-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm font-bold text-[#172B4D] outline-none"
                    value={task?.storyPoints || 0}
                    onChange={(e) => setTask(prev => prev ? { ...prev, storyPoints: Number(e.target.value) } : null)}
                    onBlur={() => handleUpdate({ storyPoints: task?.storyPoints })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-[#DFE1E6] text-[11px] text-[#6B778C]">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-[#172B4D] font-medium">{task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="text-[#172B4D] font-medium">{task?.updatedAt ? new Date(task.updatedAt).toLocaleTimeString() : 'N/A'}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 mt-4 bg-[#0052CC] text-white rounded-[3px] text-sm font-bold hover:bg-[#003484] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
