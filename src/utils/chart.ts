import { Task } from '@/types';

export const calculateTaskPosition = (
  task: Task,
  startDate: string,
  dayWidth: number = 40
): { left: number; width: number } => {
  const start = new Date(startDate).getTime();
  const taskStart = new Date(task.startDate).getTime();
  const taskEnd = new Date(task.endDate).getTime();
  
  const left = ((taskStart - start) / (1000 * 60 * 60 * 24)) * dayWidth;
  const width = Math.max(dayWidth, ((taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1) * dayWidth);
  
  return { left: Math.max(0, left), width };
};

export const generateNetworkGraphPositions = (tasks: Task[]) => {
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<number, string[]> = {};
  
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const visited = new Set<string>();
  
  const getLevel = (taskId: string): number => {
    if (visited.has(taskId)) return 0;
    visited.add(taskId);
    
    const task = taskMap.get(taskId);
    if (!task || task.dependencies.length === 0) return 0;
    
    let maxLevel = 0;
    for (const depId of task.dependencies) {
      maxLevel = Math.max(maxLevel, getLevel(depId) + 1);
    }
    return maxLevel;
  };
  
  for (const task of tasks) {
    visited.clear();
    const level = getLevel(task.id);
    if (!levels[level]) levels[level] = [];
    levels[level].push(task.id);
  }
  
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
  const maxLevelSize = Math.max(...levelKeys.map(l => levels[l].length));
  
  const levelWidth = 120;
  const verticalSpacing = 80;
  const startX = 60;
  const startY = 40;
  
  for (const level of levelKeys) {
    const taskIds = levels[level];
    const levelSize = taskIds.length;
    const totalHeight = (levelSize - 1) * verticalSpacing;
    const offsetY = startY + (maxLevelSize * verticalSpacing - totalHeight) / 2;
    
    taskIds.forEach((taskId, index) => {
      positions[taskId] = {
        x: startX + level * levelWidth,
        y: offsetY + index * verticalSpacing
      };
    });
  }
  
  return positions;
};

export const generateGaugePath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
};

export const calculateGaugeRotation = (value: number, max: number, startAngle: number = -135, endAngle: number = 135): number => {
  const ratio = Math.min(1, Math.max(0, value / max));
  return startAngle + (endAngle - startAngle) * ratio;
};
