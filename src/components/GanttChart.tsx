import React, { useState, useMemo } from 'react';
import { Task } from '@/types';
import { calculateTaskPosition } from '@/utils/chart';
import { getCategoryColor, getCategoryLabel, getStatusColor } from '@/utils/format';
import { getDateRange } from '@/utils/date';
import { Clock, AlertTriangle } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  startDate: string;
  endDate: string;
  onTaskClick?: (task: Task) => void;
  dayWidth?: number;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  startDate,
  endDate,
  onTaskClick,
  dayWidth = 40
}) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const dates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);
  const totalWidth = dates.length * dayWidth;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [tasks]);

  return (
    <div className="overflow-auto bg-white border border-gray-200 rounded-lg">
      <div className="min-w-[800px]">
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <div className="flex">
            <div className="w-64 min-w-[16rem] p-3 border-r border-gray-200 font-medium text-gray-700 text-sm">
              工序名称
            </div>
            <div className="flex" style={{ width: totalWidth }}>
              {dates.map((date, index) => {
                const d = new Date(date);
                const day = d.getDate();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={date}
                    className={`flex-shrink-0 p-2 text-center text-xs ${
                      isWeekend ? 'bg-gray-100' : ''
                    }`}
                    style={{ width: dayWidth }}
                  >
                    <div className={`font-medium ${isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                      {d.getMonth() + 1}/{day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          {sortedTasks.map((task) => {
            const { left, width } = calculateTaskPosition(task, startDate, dayWidth);
            const color = getCategoryColor(task.category);
            const statusColor = getStatusColor(task.status);

            return (
              <div
                key={task.id}
                className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-64 min-w-[16rem] p-3 border-r border-gray-200 cursor-pointer"
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-center gap-2">
                    {task.isCritical && (
                      <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-800 truncate">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {getCategoryLabel(task.category)}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {task.duration}天
                    </span>
                  </div>
                </div>

                <div
                  className="relative py-2"
                  style={{ width: totalWidth }}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  {dates.map((date, index) => {
                    const d = new Date(date);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <div
                        key={date}
                        className={`absolute top-0 bottom-0 border-l border-gray-100 ${
                          isWeekend ? 'bg-gray-50' : ''
                        }`}
                        style={{ left: index * dayWidth, width: dayWidth }}
                      />
                    );
                  })}

                  <div
                    className="absolute h-8 rounded cursor-pointer transition-all hover:h-9 hover:shadow-lg"
                    style={{
                      left,
                      width,
                      top: '8px',
                      backgroundColor: color,
                      opacity: task.status === 'completed' ? 0.7 : 0.9,
                      border: `2px solid ${task.isCritical ? '#E65100' : 'transparent'}`
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div
                      className="h-full rounded-l transition-all"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: statusColor,
                        opacity: 0.6
                      }}
                    />
                    {width > 80 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium drop-shadow">
                        {task.progress > 0 ? `${task.progress}%` : ''}
                      </span>
                    )}
                  </div>

                  {hoveredTask === task.id && (
                    <div
                      className="absolute z-20 bg-gray-800 text-white text-xs rounded p-2 shadow-xl pointer-events-none"
                      style={{ left: left + width / 2, top: '-40px', transform: 'translateX(-50%)' }}
                    >
                      <div className="font-medium">{task.name}</div>
                      <div className="text-gray-300">
                        {task.startDate} ~ {task.endDate}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
