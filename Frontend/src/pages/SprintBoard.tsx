import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Plus,
  ShieldCheck,
  Target,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import type { Task, BoardColumn, User, Sprint } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import TaskDetailModal from '../components/TaskDetailModal';

const SprintBoard = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const isManager = user?.role?.toUpperCase() === 'MANAGER';

  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<number | null>(null);

  const normalizeStatus = (status?: string, colNames: string[] = []) => {
    if (!status) return colNames[0] || 'Todo';
    const normalized = status.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const exactMatch = colNames.find(c => c.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
    return exactMatch || status;
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const fetchData = async () => {
    try {
      const [sprintsRes, colRes, projRes] = await Promise.all([
        api.get(`/projects/${projectId}/sprints`),
        api.get(`/columns?projectId=${projectId}`),
        api.get(`/projects/${projectId}`)
      ]);
      const active = (sprintsRes.data || []).find((s: Sprint) => s.status?.toUpperCase() === 'ACTIVE');
      setActiveSprint(active || null);
      setProject(projRes.data);
      
      setColumns(colRes.data?.length > 0 ? colRes.data : [
        { id: 1, name: 'TO DO' }, { id: 2, name: 'IN PROGRESS' }, { id: 4, name: 'DONE' }
      ]);

      if (active) {
        const tasksRes = await api.get(`/tasks?sprintId=${active.id}`);
        setTasks(tasksRes.data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      addNotification('Error', 'Sync Failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, status: newStatus };
    setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    try {
      await api.put(`/tasks/${taskId}`, {
        task: updatedTask,
        projectId: Number(projectId),
        sprintId: activeSprint?.id || task.sprintId || task.sprint?.id || null,
        assigneeId: task.assigneeId || task.assignee?.id || null
      });
    } catch (err) { fetchData(); }
  };
  
  const handleSwapColumns = async (sourceId: number, targetId: number) => {
    if (!isManager || sourceId === targetId) return;
    const sourceIndex = columns.findIndex(c => c.id === sourceId);
    const targetIndex = columns.findIndex(c => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const newColumns = [...columns];
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(targetIndex, 0, removed);
    
    // Optimistic update
    setColumns(newColumns);
    
    try {
      // Update each column's orderIndex in the backend
      await Promise.all(newColumns.map((col, idx) => 
        api.put(`/columns/${col.id}`, { orderIndex: idx })
      ));
      addNotification('Success', 'Board layout saved', 'success');
    } catch (err) { 
      console.error("Persistence failure", err);
      addNotification('Warning', 'Layout saved locally but failed to sync with server', 'warning');
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await api.post('/columns', {
        projectId: Number(projectId),
        name: newColumnName.trim(),
        orderIndex: columns.length + 1
      });
      setNewColumnName('');
      setIsAddingColumn(false);
      fetchData();
      addNotification('Success', 'Column created', 'success');
    } catch (err) {
      addNotification('Error', 'Failed to create column', 'error');
    }
  };

  const handleEditColumn = async (colId: number) => {
    if (!editColumnName.trim()) {
      setEditingColumnId(null);
      return;
    }
    try {
      await api.put(`/columns/${colId}`, { name: editColumnName.trim() });
      setEditingColumnId(null);
      fetchData();
      addNotification('Success', 'Column updated', 'success');
    } catch (err) {
      addNotification('Error', 'Failed to update. It may be a default placeholder.', 'error');
      setEditingColumnId(null);
    }
  };

  const handleDeleteColumn = async (colId: number) => {
    if (!window.confirm("Are you sure you want to delete this column?")) return;
    try {
      await api.delete(`/columns/${colId}`);
      fetchData();
      addNotification('Success', 'Column deleted', 'success');
    } catch (err) {
      addNotification('Error', 'Failed to delete column', 'error');
    }
  };

  const completeSprint = async () => {
    if (!activeSprint) return;
    try {
      await api.put(`/projects/${projectId}/sprints/${activeSprint.id}`, { ...activeSprint, status: 'COMPLETED' });
      addNotification('Success', 'Sprint Closed', 'success');
      fetchData();
    } catch (err) { addNotification('Error', 'Failure', 'error'); }
  };

  if (loading) return <div className="p-10 font-bold text-[#5E6C84]">Syncing Board...</div>;

  if (!activeSprint) {
    return (
      <div className="board-container h-full flex flex-col items-center justify-center text-center p-20 bg-white">
        <div className="w-24 h-24 bg-[#F4F5F7] rounded-3xl flex items-center justify-center text-[#C1C7D0] mb-6"><Target size={48} /></div>
        <h2 className="text-2xl font-bold text-[#172B4D] mb-2">No Active Sprint</h2>
        <p className="text-[#5E6C84] mb-6">Start a sprint from the backlog to begin.</p>
        <Link to={`/dashboard/backlog/${projectId}`} className="jira-button-primary scale-110">Go to Backlog</Link>
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-header border-b border-[#DFE1E6] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-[0.2em] mb-1">Active Sprint</p>
            <h1 className="text-xl font-bold text-[#172B4D] flex items-center gap-2">
              <ShieldCheck className="text-[#0052CC]" size={20} /> {activeSprint.name}
              {isManager && <span className="ml-2 px-2 py-0.5 bg-[#E6F0FF] text-[#0052CC] text-[10px] rounded font-bold border border-[#CCE0FF]">MANAGER ACCESS</span>}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1">
               {(project?.teamMembers || []).map((member: any) => (
                 <div key={member.id} title={member.name} className="w-8 h-8 rounded-full border-2 border-white bg-[#00A3BF] flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm cursor-help">{member.name.charAt(0)}</div>
               ))}
               {project?.createdBy && (
                 <div title={`${project.createdBy.name} (Lead)`} className="w-8 h-8 rounded-full border-2 border-white bg-[#6554C0] flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm cursor-help ring-2 ring-[#6554C0]/20">{project.createdBy.name.charAt(0)}</div>
               )}
            </div>
            {isManager && <button onClick={completeSprint} className="jira-button-primary px-4">Complete Sprint</button>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F4F5F7] rounded-full text-[11px] font-bold text-[#42526E] border border-[#DFE1E6]">
            <Clock size={14} /> {activeSprint.startDate} - {activeSprint.endDate || 'Ongoing'}
          </div>
          {(() => {
            const total = tasks.length || 1;
            const done = tasks.filter(t => t.status?.toUpperCase() === 'DONE').length;
            const progress = Math.round((done / total) * 100);
            return (
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#36B37E]" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[11px] font-bold text-[#5E6C84]">{progress}% Done</span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="board-content custom-scrollbar-wide">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(col => {
            const colTasks = tasks.filter(t => normalizeStatus(t.status, columns.map(c => c.name)) === col.name);
            return (
              <div
                key={col.id}
                draggable={isManager}
                onDragStart={e => {
                  if (isManager) {
                    setDraggingColumnId(col.id);
                    e.dataTransfer.setData('columnId', col.id.toString());
                  }
                }}
                onDragEnd={() => {
                  setDraggingColumnId(null);
                  setDragOverColumn(null);
                }}
                className={`w-72 flex flex-col transition-all duration-300 ${dragOverColumn === col.id ? 'scale-[1.02] bg-[#F4F7FB] ring-2 ring-[#0052CC] ring-inset rounded-lg z-10' : ''} ${draggingColumnId === col.id ? 'opacity-40 grayscale' : ''}`}
                onDragOver={e => {
                  if (isManager) {
                    e.preventDefault();
                    setDragOverColumn(col.id);
                  }
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={e => {
                  const droppedColumnId = e.dataTransfer.getData('columnId');
                  const droppedTaskId = e.dataTransfer.getData('taskId');
                  
                  setDragOverColumn(null);
                  if (!isManager) return;
                  
                  if (droppedColumnId) {
                    handleSwapColumns(Number(droppedColumnId), col.id);
                  } else if (droppedTaskId) {
                    handleUpdateTaskStatus(Number(droppedTaskId), col.name);
                  }
                }}
              >
                <div className={`flex items-center justify-between px-3 py-2 bg-white/60 border border-[#DFE1E6] rounded-t-lg group border-b-0 ${isManager ? 'cursor-move' : ''}`}>
                  {editingColumnId === col.id ? (
                    <input
                      type="text"
                      value={editColumnName}
                      onChange={e => setEditColumnName(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[10px] font-bold uppercase border border-[#0052CC] rounded outline-none w-full mr-2"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEditColumn(col.id);
                        if (e.key === 'Escape') setEditingColumnId(null);
                      }}
                      onBlur={() => handleEditColumn(col.id)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">{col.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#172B4D] bg-[#EBECF0] px-2 py-0.5 rounded">
                        {colTasks.length}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex-1 bg-white border border-[#DFE1E6] rounded-b-lg p-3 space-y-3 min-h-[80vh]">
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable={isManager}
                      onDragStart={e => {
                        if (!isManager) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData('taskId', task.id.toString());
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => { setActiveTaskId(task.id); setIsDetailModalOpen(true); }}
                      className={`p-3 bg-white border border-[#DFE1E6] rounded-lg shadow-sm hover:border-[#0052CC] transition-all group ${isManager ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                    >
                      <p className="text-sm font-semibold text-[#172B4D] mb-3 group-hover:text-[#0052CC] line-clamp-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#5E6C84]">FT-{task.id}</span>
                        <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">{task.assignee?.name.charAt(0) || '?'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isDetailModalOpen && activeTaskId && (
        <TaskDetailModal
          taskId={activeTaskId} projectId={Number(projectId)}
          isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
          onUpdate={fetchData} onDelete={fetchData}
        />
      )}
    </div>
  );
};

export default SprintBoard;
