import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Layers
} from 'lucide-react';
import api from '../services/api';
import type { Task, Project } from '../types';
import CreateIssueModal from '../components/CreateIssueModal';
import TaskDetailModal from '../components/TaskDetailModal';

const RoadmapPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Timeline State
  const [viewDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getTimelineMonths = () => {
    const res = [];
    const start = new Date(viewDate);
    start.setMonth(start.getMonth() - 2);
    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      res.push(d);
    }
    return res;
  };

  const timelineMonths = getTimelineMonths();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (error) {
      console.error("Error fetching roadmap data", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (taskId: number) => {
    setActiveTaskId(taskId);
    setIsDetailModalOpen(true);
  };

  const getTaskPosition = (task: Task) => {
    const start = new Date(task.createdAt || new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 14); 

    const startOfTimeline = timelineMonths[0];

    const getPos = (date: Date) => {
      const monthDiff = (date.getFullYear() - startOfTimeline.getFullYear()) * 12 + (date.getMonth() - startOfTimeline.getMonth());
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const dayOffset = (date.getDate() / daysInMonth) * 300;
      return (monthDiff * 300) + dayOffset;
    };

    const left = getPos(start);
    const right = getPos(end);

    return {
      left: Math.max(0, left),
      width: Math.max(40, right - left)
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      {/* Roadmap Header */}
      <div className="px-8 py-6 border-b border-[#DFE1E6] shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#5E6C84] mb-2 uppercase font-bold tracking-wider">
          <Layers size={14} /> Projects / {project?.name} / Roadmap
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">Roadmap</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCreateModalOpen(true)} className="jira-button-primary gap-2 bg-[#0052CC] text-white px-4 py-1.5 rounded-[3px] font-bold text-sm shadow-lg shadow-blue-500/20"><Plus size={14} /> Create epic</button>
          </div>
        </div>
      </div>

      {/* Timeline Workbench */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Task List */}
        <div className="w-[300px] border-r border-[#DFE1E6] flex flex-col shrink-0">
          <div className="h-12 flex items-center px-4 border-b border-[#DFE1E6] bg-[#F4F5F7]/30 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">
            Epic / Task
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => openDetail(task.id)}
                className="h-12 flex items-center px-4 border-b border-[#F4F5F7] hover:bg-[#F4F5F7] cursor-pointer group transition-colors"
              >
                <div className={`w-3 h-3 rounded-[2px] mr-3 shrink-0 ${task.status === 'DONE' ? 'bg-[#36B37E]' : 'bg-[#0052CC]'}`} />
                <span className="text-sm text-[#172B4D] truncate font-semibold">{task.title}</span>
              </div>
            ))}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full h-12 flex items-center px-4 text-[#0052CC] hover:bg-[#DEEBFF] text-sm font-black transition-all group"
            >
              <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" /> Create issue
            </button>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Timeline Months Ruler */}
          <div className="h-12 border-b border-[#DFE1E6] bg-[#F4F5F7]/30 flex shrink-0 sticky top-0 z-10">
            {timelineMonths.map((m, i) => (
              <div key={i} className="w-[300px] border-r border-[#DFE1E6] flex flex-col justify-center px-4 shrink-0">
                <span className="text-[11px] font-black text-[#172B4D] uppercase tracking-widest leading-none">{months[m.getMonth()]}</span>
                <span className="text-[9px] font-bold text-[#5E6C84] mt-1">{m.getFullYear()}</span>
              </div>
            ))}
          </div>

          {/* Timeline Scrollable Grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar-wide bg-slate-50/20" ref={timelineRef}>
            <div className="min-w-full relative py-2" style={{ width: `${6 * 300}px` }}>
              {/* Vertical Month Grid Lines */}
              <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
                {timelineMonths.map((_, i) => (
                  <div key={i} className="w-[300px] border-r border-[#DFE1E6]/50 h-full shrink-0" />
                ))}
              </div>

              {/* Task Bars */}
              <div className="relative z-10">
                {tasks.map((task) => {
                  const pos = getTaskPosition(task);
                  return (
                    <div key={task.id} className="h-12 flex items-center relative group">
                      <div className="absolute inset-x-0 h-full bg-[#0052CC]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div
                        onClick={() => openDetail(task.id)}
                        className={`h-6 rounded-[3px] absolute flex items-center px-2 cursor-pointer transition-all shadow-sm ${task.status === 'DONE' ? 'bg-[#36B37E]' : 'bg-[#0052CC]'
                          } hover:shadow-md hover:brightness-110`}
                        style={{ left: `${pos.left}px`, width: `${pos.width}px` }}
                        title={task.title}
                      >
                        <div className="h-1 bg-white/30 absolute bottom-0 left-0 rounded-b-[3px]" style={{ width: task.status === 'DONE' ? '100%' : '30%' }} />
                        <span className="text-[10px] text-white font-black truncate">{task.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today Marker */}
          {(() => {
            const today = new Date();
            const startOfTimeline = timelineMonths[0];
            
            // Calculate total months difference
            const monthDiff = (today.getFullYear() - startOfTimeline.getFullYear()) * 12 + (today.getMonth() - startOfTimeline.getMonth());
            
            // Calculate day offset within the current month
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const dayOffset = (today.getDate() / daysInMonth) * 300;
            
            const totalLeft = (monthDiff * 300) + dayOffset;
            
            return (
              <div className="absolute inset-y-0 w-0.5 bg-[#FF5630] z-20 pointer-events-none shadow-[0_0_10px_rgba(255,86,48,0.5)]" style={{ left: `${totalLeft}px` }}>
                <div className="bg-[#FF5630] text-white text-[9px] font-black px-2 py-0.5 rounded-full absolute -top-1 -left-4 shadow-lg">TODAY</div>
              </div>
            );
          })()}
        </div>
      </div>

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={Number(id)}
        onSuccess={fetchData}
      />

      {isDetailModalOpen && activeTaskId && (
        <TaskDetailModal
          taskId={activeTaskId}
          projectId={Number(id)}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdate={fetchData}
          onDelete={fetchData}
        />
      )}
    </div>
  );
};

export default RoadmapPage;
