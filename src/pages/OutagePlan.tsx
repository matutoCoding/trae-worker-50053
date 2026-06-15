import React, { useState } from 'react';
import { useOutageStore } from '@/store/outageStore';
import { DataCard } from '@/components/DataCard';
import { GanttChart } from '@/components/GanttChart';
import { NetworkGraph } from '@/components/NetworkGraph';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Task } from '@/types';
import {
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Map,
  Target
} from 'lucide-react';
import { getRemainingDays, formatDate } from '@/utils/date';
import { getCategoryLabel } from '@/utils/format';

type ViewMode = 'dashboard' | 'network' | 'critical';

export const OutagePlan: React.FC = () => {
  const { currentOutage, tasks, getCriticalPath, getMilestones } = useOutageStore();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const remainingDays = getRemainingDays(currentOutage.endDate);
  const criticalTasks = getCriticalPath();
  const milestones = getMilestones();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{currentOutage.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(currentOutage.startDate)} ~ {formatDate(currentOutage.endDate)}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={14} />
              剩余 {remainingDays} 天
            </span>
            <StatusBadge status={currentOutage.status} />
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'dashboard', label: '进度看板', icon: Activity },
            { key: 'network', label: '网络计划', icon: Map },
            { key: 'critical', label: '关键路径', icon: Target },
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

      {viewMode === 'dashboard' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <DataCard
              title="大修进度"
              value={currentOutage.progress}
              suffix="%"
              icon={TrendingUp}
              color="#0D47A1"
              trend={{ value: 5.2, isUp: true }}
            />
            <DataCard
              title="总工序数"
              value={currentOutage.totalTasks}
              icon={CheckCircle2}
              color="#10B981"
            />
            <DataCard
              title="已完成"
              value={currentOutage.completedTasks}
              icon={CheckCircle2}
              color="#0D47A1"
            />
            <DataCard
              title="延期工序"
              value={currentOutage.delayedTasks}
              icon={AlertTriangle}
              color="#EF4444"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">大修进度甘特图</h3>
              <GanttChart
                tasks={tasks}
                startDate={currentOutage.startDate}
                endDate={currentOutage.endDate}
                onTaskClick={handleTaskClick}
              />
            </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">里程碑节点</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-8 overflow-x-auto pb-2">
                    {milestones.map((milestone, index) => (
                      <div
                        key={milestone.id}
                        className="flex flex-col items-center relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                          milestone.status === 'completed'
                            ? 'bg-green-500 border-green-200'
                            : milestone.status === 'in_progress'
                            ? 'bg-blue-500 border-blue-200 animate-pulse'
                            : 'bg-gray-300 border-gray-100'
                        }`}>
                          {milestone.status === 'completed' ? (
                            <CheckCircle2 size={20} className="text-white" />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-sm font-medium text-gray-800">{milestone.milestone}</p>
                          <p className="text-xs text-gray-500">{milestone.endDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">各专业进度</h3>
                <div className="space-y-4">
                  {['mechanical', 'electrical', 'instrument', 'radiation', 'other'].map(category => {
                    const categoryTasks = tasks.filter(t => t.category === category);
                    const completed = categoryTasks.filter(t => t.status === 'completed').length;
                    const progress = categoryTasks.length > 0
                      ? (completed / categoryTasks.length) * 100
                      : 0;

                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{getCategoryLabel(category)}</span>
                          <span className="text-sm text-gray-500">{completed}/{categoryTasks.length}</span>
                        </div>
                        <ProgressBar
                          value={progress}
                          showLabel={false}
                          height="6px"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">工序状态分布</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.status === 'completed').length}
                    </p>
                    <p className="text-xs text-gray-500">已完成</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {tasks.filter(t => t.status === 'in_progress').length}
                    </p>
                    <p className="text-xs text-gray-500">进行中</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {tasks.filter(t => t.status === 'pending').length}
                    </p>
                    <p className="text-xs text-gray-500">待开始</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => t.status === 'delayed').length}
                    </p>
                    <p className="text-xs text-gray-500">已延期</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'network' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">大修网络计划图</h3>
          <NetworkGraph tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      )}

      {viewMode === 'critical' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">关键路径跟踪</h3>
            <p className="text-sm text-gray-500 mt-1">
              共 {criticalTasks.length} 项关键路径活动</p>
          </div>
          <div className="divide-y divide-gray-100">
            {criticalTasks.map(task => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500" />
                      <span className="font-medium text-gray-800">{task.name}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">计划工期</p>
                        <p className="text-sm font-medium text-gray-800">{task.duration} 天</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">进度</p>
                        <ProgressBar
                          value={task.progress}
                          showLabel={false}
                          className="w-24"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">时间</p>
                        <p className="text-sm text-gray-600">
                          {task.startDate} ~ {task.endDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">{selectedTask.name}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">专业分类</p>
                  <p className="text-sm font-medium text-gray-800">
                    {getCategoryLabel(selectedTask.category)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">是否关键路径</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedTask.isCritical ? '是' : '否'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">计划工期</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedTask.duration} 天
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedTask.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">计划时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedTask.startDate} ~ {selectedTask.endDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">工作内容</p>
                <p className="text-sm text-gray-800">{selectedTask.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">进度</p>
                <ProgressBar value={selectedTask.progress} />
              </div>
              <div>
                <p className="text-xs text-gray-500">负责人</p>
                <div className="flex gap-2 mt-1">
                  {selectedTask.assignees.map((id, idx) => (
                    <span
                      key={id}
                      className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
