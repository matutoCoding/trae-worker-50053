import React, { useState, useMemo } from 'react';
import { useOutageStore } from '@/store/outageStore';
import { DataCard } from '@/components/DataCard';
import { GanttChart } from '@/components/GanttChart';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Task } from '@/types';
import {
  Calendar,
  Clock,
  Filter,
  Search,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Link2,
  Settings,
  BarChart3,
  ListTodo,
  GitBranch
} from 'lucide-react';
import { formatDate, getDaysDiff } from '@/utils/date';
import { getCategoryLabel, getStatusLabel } from '@/utils/format';

type ViewMode = 'list' | 'gantt' | 'resource';
type FilterCategory = 'all' | 'mechanical' | 'electrical' | 'instrument' | 'radiation' | 'other';
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'delayed';

export const Schedule: React.FC = () => {
  const { currentOutage, tasks, updateTask, getTasksByCategory, getCriticalPath } = useOutageStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [dateError, setDateError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [impactAnalysis, setImpactAnalysis] = useState<{
    visible: boolean;
    affectedTasks: Task[];
    newOutageEnd: string;
    daysShift: number;
  } | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchSearch = searchQuery === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchStatus && matchSearch;
    });
  }, [tasks, categoryFilter, statusFilter, searchQuery]);

  const criticalTasks = getCriticalPath();
  const delayedTasks = tasks.filter(t => t.status === 'delayed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      name: task.name,
      startDate: task.startDate,
      endDate: task.endDate,
      description: task.description
    });
    setDateError(null);
  };

  const validateDates = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) {
      return '请填写完整的开始和结束日期';
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return '结束日期不能早于开始日期';
    }
    return null;
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      const error = validateDates(editForm.startDate, editForm.endDate);
      if (error) {
        setDateError(error);
        return;
      }
      const duration = getDaysDiff(editForm.startDate, editForm.endDate) + 1;
      if (duration < 1) {
        setDateError('工期至少为1天');
        return;
      }

      const oldStartDate = new Date(editingTask.startDate);
      const newStartDate = new Date(editForm.startDate);
      const daysShift = Math.round((newStartDate.getTime() - oldStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const durationChange = duration - editingTask.duration;
      const hasDateChange = daysShift !== 0 || durationChange !== 0;

      if (hasDateChange) {
        const affectedTasks: Task[] = [];
        const visited = new Set<string>();
        
        const findAffected = (taskId: string) => {
          if (visited.has(taskId)) return;
          visited.add(taskId);
          const downstream = tasks.filter(t => t.dependencies.includes(taskId));
          for (const dep of downstream) {
            if (!visited.has(dep.id)) {
              affectedTasks.push(dep);
              findAffected(dep.id);
            }
          }
        };
        findAffected(editingTask.id);

        let newOutageEnd = currentOutage.endDate;
        if (editingTask.isCritical && (daysShift > 0 || durationChange > 0)) {
          const totalShift = daysShift > 0 ? daysShift : durationChange;
          const endDate = new Date(currentOutage.endDate);
          endDate.setDate(endDate.getDate() + totalShift);
          newOutageEnd = endDate.toISOString().split('T')[0];
        }

        setImpactAnalysis({
          visible: true,
          affectedTasks,
          newOutageEnd,
          daysShift: (editingTask.isCritical && (daysShift > 0 || durationChange > 0))
            ? (daysShift > 0 ? daysShift : durationChange) : 0,
        });
      } else {
        updateTask(editingTask.id, { ...editForm, duration });
        setEditingTask(null);
        setDateError(null);
      }
    }
  };

  const handleConfirmImpact = () => {
    if (editingTask) {
      const duration = getDaysDiff(editForm.startDate, editForm.endDate) + 1;
      updateTask(editingTask.id, { ...editForm, duration });
      setEditingTask(null);
      setDateError(null);
      setImpactAnalysis(null);
    }
  };

  const handleCancelImpact = () => {
    setImpactAnalysis(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setDateError(null);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newForm = { ...editForm, [field]: value };
    setEditForm(newForm);
    const error = validateDates(
      field === 'startDate' ? value : editForm.startDate,
      field === 'endDate' ? value : editForm.endDate
    );
    setDateError(error);
  };

  const toggleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getDependentTasks = (taskId: string) => {
    return tasks.filter(t => t.dependencies.includes(taskId));
  };

  const getDependencyTasks = (taskIds: string[]) => {
    return tasks.filter(t => taskIds.includes(t.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工序排程管理</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(currentOutage.startDate)} ~ {formatDate(currentOutage.endDate)}
            </span>
            <StatusBadge status={currentOutage.status} />
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'list', label: '任务列表', icon: ListTodo },
            { key: 'gantt', label: '甘特图', icon: BarChart3 },
            { key: 'resource', label: '资源负载', icon: Users },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setViewMode(item.key as ViewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === item.key
                    ? 'bg-white text-[#0D47A1] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="总工序数"
          value={tasks.length}
          icon={ListTodo}
          color="#0D47A1"
        />
        <DataCard
          title="关键路径"
          value={criticalTasks.length}
          icon={GitBranch}
          color="#E65100"
        />
        <DataCard
          title="进行中"
          value={inProgressTasks.length}
          icon={Clock}
          color="#10B981"
        />
        <DataCard
          title="已延期"
          value={delayedTasks.length}
          icon={AlertCircle}
          color="#EF4444"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工序名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
            >
              <option value="all">全部专业</option>
              <option value="mechanical">机械</option>
              <option value="electrical">电气</option>
              <option value="instrument">仪控</option>
              <option value="radiation">辐射防护</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
            >
              <option value="all">全部状态</option>
              <option value="pending">待开始</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="delayed">已延期</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工序名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">专业</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关键路径</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map(task => (
                  <React.Fragment key={task.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {task.dependencies.length > 0 && (
                          <button
                            onClick={() => toggleTaskExpand(task.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedTasks.has(task.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingTask?.id === task.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                          />
                        ) : (
                          <span className="font-medium text-gray-800">{task.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{getCategoryLabel(task.category)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        {editingTask?.id === task.id ? (
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={editForm.startDate}
                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#0D47A1] text-sm ${dateError ? 'border-red-500' : 'border-gray-200'}`}
                              />
                              <input
                                type="date"
                                value={editForm.endDate}
                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#0D47A1] text-sm ${dateError ? 'border-red-500' : 'border-gray-200'}`}
                              />
                            </div>
                            {dateError && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle size={12} />
                                {dateError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {task.startDate} ~ {task.endDate}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{task.duration} 天</span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <ProgressBar value={task.progress} height="6px" showLabel={false} />
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{task.assignees.length} 人</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {task.isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                            <AlertCircle size={12} />
                            是
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">否</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingTask?.id === task.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(task)}
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="编辑"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="查看详情"
                            >
                              <Settings size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedTasks.has(task.id) && task.dependencies.length > 0 && (
                      <tr className="bg-blue-50">
                        <td colSpan={10} className="px-8 py-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Link2 size={14} />
                              <span className="font-medium">前置依赖：</span>
                              {getDependencyTasks(task.dependencies).map(dep => (
                                <span key={dep.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                                  {dep.name}
                                  <StatusBadge status={dep.status} />
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <GitBranch size={14} />
                              <span className="font-medium">后续工序：</span>
                              {getDependentTasks(task.id).map(dep => (
                                <span key={dep.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                                  {dep.name}
                                  <StatusBadge status={dep.status} />
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTasks.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>没有找到匹配的工序</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'gantt' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">工序甘特图</h3>
          <GanttChart
            tasks={filteredTasks}
            startDate={currentOutage.startDate}
            endDate={currentOutage.endDate}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </div>
      )}

      {viewMode === 'resource' && (
        <div className="space-y-4">
          {['mechanical', 'electrical', 'instrument', 'radiation', 'other'].map(category => {
            const categoryTasks = getTasksByCategory(category);
            const assignedWorkers = new Set<string>();
            categoryTasks.forEach(t => t.assignees.forEach(a => assignedWorkers.add(a)));
            
            return (
              <div key={category} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{getCategoryLabel(category)}专业</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      <Users size={14} className="inline mr-1" />
                      {assignedWorkers.size} 人
                    </span>
                    <span className="text-gray-500">
                      <ListTodo size={14} className="inline mr-1" />
                      {categoryTasks.length} 项任务
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {categoryTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-[#0D47A1] transition-colors cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-800">{task.name}</span>
                        {task.isCritical && (
                          <AlertCircle size={14} className="text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={task.progress} height="4px" showLabel={false} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{task.startDate}</span>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">{selectedTask.name}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">专业分类</p>
                  <p className="text-sm font-medium text-gray-800">{getCategoryLabel(selectedTask.category)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">关键路径</p>
                  <p className="text-sm font-medium text-gray-800">{selectedTask.isCritical ? '是' : '否'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">进度</p>
                <ProgressBar value={selectedTask.progress} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">计划工期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedTask.duration} 天</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">计划时间</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedTask.startDate} ~ {selectedTask.endDate}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">工作内容</p>
                <p className="text-sm text-gray-800 mt-1">{selectedTask.description}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">前置依赖</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.dependencies.length > 0 ? (
                    getDependencyTasks(selectedTask.dependencies).map(dep => (
                      <span key={dep.id} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded text-sm">
                        {dep.name}
                        <StatusBadge status={dep.status} />
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">无</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">后续工序</p>
                <div className="flex flex-wrap gap-2">
                  {getDependentTasks(selectedTask.id).length > 0 ? (
                    getDependentTasks(selectedTask.id).map(dep => (
                      <span key={dep.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 rounded text-sm">
                        {dep.name}
                        <StatusBadge status={dep.status} />
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">无</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">负责人</p>
                <div className="flex gap-2">
                  {selectedTask.assignees.map((id, idx) => (
                    <span key={id} className="text-sm bg-gray-100 px-3 py-1 rounded">
                      人员 {idx + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {impactAnalysis && impactAnalysis.visible && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-500" />
                <h3 className="font-semibold text-gray-800">工序时间变更影响分析</h3>
              </div>
              <button
                onClick={handleCancelImpact}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800">变更工序</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{editingTask.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-blue-700">
                    原计划：{editingTask.startDate} ~ {editingTask.endDate}（{editingTask.duration}天）
                  </span>
                  <span className="text-blue-500">→</span>
                  <span className="text-blue-700 font-medium">
                    新计划：{editForm.startDate} ~ {editForm.endDate}（{getDaysDiff(editForm.startDate, editForm.endDate) + 1}天）
                  </span>
                </div>
                {editingTask.isCritical && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    <AlertCircle size={12} />
                    关键路径工序
                  </span>
                )}
              </div>

              {impactAnalysis.daysShift > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-600" />
                    <p className="text-sm font-medium text-red-800">
                      大修结束日期可能延后 {impactAnalysis.daysShift} 天
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-red-700">
                    <span>原结束日期：{currentOutage.endDate}</span>
                    <span>→</span>
                    <span className="font-medium">预计延后至：{impactAnalysis.newOutageEnd}</span>
                  </div>
                </div>
              )}

              {impactAnalysis.affectedTasks.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    受影响的后续工序（{impactAnalysis.affectedTasks.length} 项）
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {impactAnalysis.affectedTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {task.isCritical && (
                            <AlertCircle size={14} className="text-orange-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">{task.name}</p>
                            <p className="text-xs text-gray-500">
                              {task.startDate} ~ {task.endDate}（{task.duration}天）
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.isCritical && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">关键</span>
                          )}
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <p className="text-sm font-medium text-green-800">无下游工序受影响</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancelImpact}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消修改
              </button>
              <button
                onClick={handleConfirmImpact}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D47A1] text-white rounded-md hover:bg-[#0A3A87] transition-colors"
              >
                <Save size={16} />
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
