import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Layout,
  Search,
  Users,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import type { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import TaskDetailModal from '../components/TaskDetailModal';

const GlobalIssues = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const assigneeId = searchParams.get('assigneeId');
  const searchQuery = searchParams.get('query') || '';
  const filterTitle = assigneeId ? 'Assigned to me' : (searchQuery ? `Search: ${searchQuery}` : 'All Issues');

  useEffect(() => {
    fetchTasks();
  }, [assigneeId, searchQuery]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = assigneeId ? `/tasks?assigneeId=${assigneeId}` : '/tasks';
      const { data } = await api.get(url);

      let filtered = data;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = data.filter((t: Task) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
        );
      }
      setTasks(filtered);
    } catch (error) {
      console.error("Error fetching global tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleLocalSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams);
      if (localSearch.trim()) {
        params.set('query', localSearch.trim());
      } else {
        params.delete('query');
      }
      navigate(`/dashboard/issues?${params.toString()}`);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-sm text-[#5E6C84] font-medium italic">
      Synchronizing your issues...
    </div>
  );

  return (
    <div className="bg-white min-h-full">
      <div className="content-container py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-8 border-b border-[#DFE1E6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">
              <Filter size={12} /> Filtered View
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">{filterTitle}</h1>
            <p className="text-sm text-[#5E6C84]">Total issues found: <span className="font-bold text-[#0052CC]">{tasks.length}</span></p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={14} />
              <input
                type="text"
                placeholder="Filter issues..."
                className="bg-[#F4F5F7] border-2 border-transparent focus:bg-white focus:border-[#4C9AFF] rounded-[3px] py-1.5 pl-9 pr-4 text-sm w-64 outline-none transition-all"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleLocalSearch}
              />
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-[#F4F5F7]/30 rounded-xl border border-dashed border-[#DFE1E6]">
            <CheckCircle2 size={48} className="text-[#36B37E] mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-[#172B4D]">Zero Backlog</h3>
            <p className="text-sm text-[#5E6C84] mt-1 max-w-xs">No issues match this filter. Take a moment to celebrate or check other projects.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-[#DFE1E6] rounded-lg shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Key</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Summary</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6]">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-[#F4F5F7] transition-colors cursor-pointer group"
                    onClick={() => { setActiveTaskId(task.id); setIsDetailModalOpen(true); }}
                  >
                    <td className="px-4 py-4">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${task.issueType === 'BUG' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                        <Layout size={10} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-[#5E6C84] whitespace-nowrap">FT-{task.id}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-[#172B4D] group-hover:text-[#0052CC] line-clamp-1">{task.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/dashboard/project/${task.project?.id || task.projectId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
                      >
                        {task.project?.name || 'Unknown Project'}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-[#EBECF0] text-[#172B4D] rounded text-[10px] font-bold uppercase tracking-tight">
                        {task.status || 'TODO'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5E6C84]">
                        <Calendar size={12} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailModalOpen && activeTaskId && (
        <TaskDetailModal
          taskId={activeTaskId}
          projectId={tasks.find(t => t.id === activeTaskId)?.project?.id || 0}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdate={fetchTasks}
          onDelete={fetchTasks}
        />
      )}
    </div>
  );
};

export default GlobalIssues;
