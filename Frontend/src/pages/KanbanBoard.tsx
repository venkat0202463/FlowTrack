import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Layout,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import type { Task, BoardColumn, Sprint } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import TaskDetailModal from '../components/TaskDetailModal';

const KanbanBoard = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const isManager = user?.role?.toUpperCase() === 'MANAGER';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showActiveSprintOnly, setShowActiveSprintOnly] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<number | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState('');

  const normalizeStatus = (status?: string, colNames: string[] = []) => {
    if (!status) return colNames[0] || 'Todo';
    const normalized = status.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const exactMatch = colNames.find(c => c.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
    return exactMatch || status;
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const fetchData = async () => {
    try {
      const [tasksRes, sprintsRes, colRes, projRes] = await Promise.all([
        api.get(`/tasks?projectId=${projectId}`),
        api.get(`/projects/${projectId}/sprints`),
        api.get(`/columns?projectId=${projectId}`),
        api.get(`/projects/${projectId}`)
      ]);
      setTasks(tasksRes.data);
      setSprints(sprintsRes.data);
      setProject(projRes.data);
      setColumns(colRes.data?.length > 0 ? colRes.data : [
        { id: 1, name: 'TO DO' }, { id: 2, name: 'IN PROGRESS' }, { id: 4, name: 'DONE' }
      ]);
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
        sprintId: task.sprintId || task.sprint?.id || null,
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

    setColumns(newColumns);

    try {
      await Promise.all(newColumns.map((col, idx) =>
        api.put(`/columns/${col.id}`, { orderIndex: idx })
      ));
      addNotification('Success', 'Kanban layout saved', 'success');
    } catch (err) {
      addNotification('Warning', 'Saved locally, sync failed', 'warning');
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

  const activeKanban = sprints.find(s => s.status === 'ACTIVE' && (s.name || '').toLowerCase().includes('kanban'));
  const displayedTasks = tasks.filter(t => {
    const isInActiveSprint = activeKanban && (t.sprint?.id === activeKanban.id);
    if (showActiveSprintOnly) {
      return isInActiveSprint;
    }
    return t.environment !== 'BACKLOG' || isInActiveSprint;
  });

  if (loading) return <div className="p-10 font-bold text-[#5E6C84]">Loading Workflow...</div>;

  if (!activeKanban) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="w-24 h-24 bg-[#F4F5F7] rounded-[24px] flex items-center justify-center mb-8 shadow-sm">
          <Layout size={48} className="text-[#A5ADBA]" strokeWidth={2} />
        </div>
        <h2 className="text-[24px] font-semibold text-[#172B4D] mb-3 tracking-tighter">No Active Kanban</h2>
        <p className="text-[#5E6C84] text-[14px] font-medium mb-8">Start a kanban flow from the backlog to begin.</p>
        <button
          onClick={() => window.location.href = `/dashboard/backlog/${projectId}`}
          className="bg-[#0052CC] text-white text-[14px] font-bold px-6 py-2.5 rounded hover:bg-[#003484] transition-colors shadow-md shadow-blue-500/20"
        >
          Go to Backlog
        </button>
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-header border-b border-[#DFE1E6] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest mb-1">Global Workflow</p>
            <h1 className="text-xl font-bold text-[#172B4D] flex items-center gap-2">
              <Layout className="text-[#0052CC]" size={20} /> Kanban Board
              {isManager && <span className="ml-2 px-2 py-0.5 bg-[#E6F0FF] text-[#0052CC] text-[10px] rounded font-bold border border-[#CCE0FF]">MANAGER ACCESS</span>}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {(project?.teamMembers || []).map((member: any) => (
                <div key={member.id} title={member.name} className="w-8 h-8 rounded-full bg-[#0052CC] border-2 border-white flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm cursor-help">
                  {member.name.charAt(0)}
                </div>
              ))}
              {project?.createdBy && (
                <div title={`${project.createdBy.name} (Lead)`} className="w-8 h-8 rounded-full bg-[#6554C0] border-2 border-white flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm cursor-help ring-2 ring-[#6554C0]/20">
                  {project.createdBy.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[#F4F5F7] p-1 rounded-lg border border-[#DFE1E6]">
              <button
                onClick={() => setShowActiveSprintOnly(false)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${!showActiveSprintOnly ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84]'}`}
              >
                All Issues
              </button>
              <button
                onClick={() => setShowActiveSprintOnly(true)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${showActiveSprintOnly ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84]'}`}
              >
                Active Sprint
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="board-content custom-scrollbar-wide">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(col => (
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
              <div className={`flex items-center justify-between px-3 py-2 bg-white/60 border border-[#DFE1E6] rounded-t-lg group ${isManager ? 'cursor-move' : ''}`}>
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
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={() => { setEditingColumnId(col.id); setEditColumnName(col.name); }} className="text-[#6B778C] hover:text-[#0052CC]"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteColumn(col.id)} className="text-[#6B778C] hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#172B4D] bg-[#EBECF0] px-2 py-0.5 rounded">
                      {displayedTasks.filter(t => normalizeStatus(t.status, columns.map(c => c.name)) === col.name).length}
                    </span>
                  </>
                )}
              </div>
              <div className="flex-1 bg-white border border-[#DFE1E6] border-t-0 rounded-b-lg p-3 space-y-3 min-h-[80vh]">
                {displayedTasks.filter(t => normalizeStatus(t.status, columns.map(c => c.name)) === col.name).map(task => (
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
                    <span className="text-[9px] font-bold text-[#6B778C] uppercase mb-1 block">FT-{task.id}</span>
                    <p className="text-sm font-semibold text-[#172B4D] mb-3 group-hover:text-[#0052CC] line-clamp-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${task.priority === 'HIGH' ? 'bg-[#FFEBE6] text-[#BF2600]' : 'bg-[#E3FCEF] text-[#006644]'}`}>
                        {task.priority || 'MEDIUM'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">{task.assignee?.name.charAt(0) || '?'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="w-72 flex flex-col pt-0 shrink-0">
            {!isAddingColumn ? (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/60 border border-dashed border-[#DFE1E6] rounded-lg text-[#5E6C84] hover:bg-[#EBECF0] hover:text-[#172B4D] transition-colors"
              >
                <Plus size={16} /> <span className="text-sm font-bold">Add Column</span>
              </button>
            ) : (
              <div className="p-3 bg-white border border-[#DFE1E6] rounded-lg shadow-sm">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  placeholder="Column name..."
                  className="w-full px-3 py-2 text-sm border border-[#DFE1E6] rounded mb-3 focus:outline-none focus:border-[#0052CC]"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                />
                <div className="flex items-center gap-3">
                  <button onClick={handleAddColumn} className="jira-button-primary px-3 py-1 text-xs">Add</button>
                  <button onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }} className="text-[#5E6C84] hover:text-[#172B4D] text-xs font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
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

export default KanbanBoard;
