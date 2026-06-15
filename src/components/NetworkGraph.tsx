import React, { useState, useMemo } from 'react';
import { Task } from '@/types';
import { generateNetworkGraphPositions } from '@/utils/chart';
import { getStatusColor, getCategoryColor } from '@/utils/format';

interface NetworkGraphProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ tasks, onTaskClick }) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const positions = useMemo(() => generateNetworkGraphPositions(tasks), [tasks]);

  const maxX = Math.max(...Object.values(positions).map(p => p.x)) + 120;
  const maxY = Math.max(...Object.values(positions).map(p => p.y)) + 80;

  const renderDependencies = () => {
    return tasks.flatMap(task =>
      task.dependencies.map(depId => {
        const from = positions[depId];
        const to = positions[task.id];
        if (!from || !to) return null;

        const isCritical = task.isCritical && tasks.find(t => t.id === depId)?.isCritical;
        const isHighlighted = selectedTask === depId || selectedTask === task.id;

        return (
          <line
            key={`${depId}-${task.id}`}
            x1={from.x + 50}
            y1={from.y}
            x2={to.x - 10}
            y2={to.y}
            stroke={isCritical ? '#E65100' : isHighlighted ? '#0D47A1' : '#CBD5E1'}
            strokeWidth={isCritical || isHighlighted ? 2 : 1}
            markerEnd={`url(#arrowhead-${isCritical ? 'critical' : 'normal'})`}
            className="transition-all"
          />
        );
      })
    );
  };

  const renderNodes = () => {
    return tasks.map(task => {
      const pos = positions[task.id];
      if (!pos) return null;

      const statusColor = getStatusColor(task.status);
      const categoryColor = getCategoryColor(task.category);
      const isSelected = selectedTask === task.id;
      const isHovered = hoveredTask === task.id;

      return (
        <g
          key={task.id}
          transform={`translate(${pos.x}, ${pos.y})`}
          className="cursor-pointer"
          onMouseEnter={() => setHoveredTask(task.id)}
          onMouseLeave={() => setHoveredTask(null)}
          onClick={() => {
            setSelectedTask(task.id);
            onTaskClick?.(task);
          }}
        >
          <rect
            x="-50"
            y="-25"
            width="100"
            height="50"
            rx="4"
            fill="white"
            stroke={task.isCritical ? '#E65100' : isSelected ? '#0D47A1' : categoryColor}
            strokeWidth={isSelected || task.isCritical ? 3 : 2}
            className="transition-all"
            style={{
              filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : 'none'
            }}
          />

          <rect
            x="-50"
            y="-25"
            width="100"
            height="8"
            rx="4"
            fill={statusColor}
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          />

          {task.isCritical && (
            <circle
              cx="40"
              cy="-18"
              r="8"
              fill="#E65100"
            />
          )}

          <text
            x="0"
            y="5"
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700"
            style={{ fontSize: '10px' }}
          >
            {task.name.length > 10 ? task.name.substring(0, 10) + '...' : task.name}
          </text>

          <text
            x="0"
            y="18"
            textAnchor="middle"
            className="text-xs fill-gray-400"
            style={{ fontSize: '9px' }}
          >
            {task.duration}天 · {task.progress}%
          </text>
        </g>
      );
    });
  };

  return (
    <div className="overflow-auto bg-white border border-gray-200 rounded-lg">
      <svg
        width={maxX}
        height={maxY}
        className="min-w-full"
        style={{ minWidth: maxX }}
      >
        <defs>
          <marker
            id="arrowhead-normal"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#CBD5E1" />
          </marker>
          <marker
            id="arrowhead-critical"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#E65100" />
          </marker>
        </defs>

        {renderDependencies()}
        {renderNodes()}
      </svg>

      <div className="flex items-center gap-6 p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-[#E65100] bg-white" />
          <span className="text-xs text-gray-600">关键路径</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-xs text-gray-600">已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-xs text-gray-600">进行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded" />
          <span className="text-xs text-gray-600">待开始</span>
        </div>
      </div>
    </div>
  );
};
