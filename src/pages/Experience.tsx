import React, { useState, useMemo } from 'react';
import { useExperienceStore } from '@/store/experienceStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { LessonLearned } from '@/types';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  X,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Shield,
  Target,
  DollarSign,
  Radio,
  ChevronRight
} from 'lucide-react';
import { formatDate } from '@/utils/date';

type TabMode = 'lessons' | 'comparison' | 'statistics';
type FilterCategory = 'all' | string;
type FilterSeverity = 'all' | string;
type FilterStatus = 'all' | string;

export const Experience: React.FC = () => {
  const {
    lessons,
    comparisonData,
    categoryStats,
    getFilteredLessons,
    getLessonsByOutage,
    updateLesson
  } = useExperienceStore();

  const [activeTab, setActiveTab] = useState<TabMode>('lessons');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonLearned | null>(null);
  const [selectedOutageId, setSelectedOutageId] = useState<string>('all');

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchCategory = categoryFilter === 'all' || lesson.category === categoryFilter;
      const matchSeverity = severityFilter === 'all' || lesson.severity === severityFilter;
      const matchStatus = statusFilter === 'all' || lesson.status === statusFilter;
      const matchOutage = selectedOutageId === 'all' || lesson.outageId === selectedOutageId;
      const matchSearch = searchQuery === '' ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSeverity && matchStatus && matchOutage && matchSearch;
    });
  }, [lessons, categoryFilter, severityFilter, statusFilter, searchQuery, selectedOutageId]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      schedule: '进度管理',
      safety: '安全管理',
      quality: '质量管理',
      cost: '成本管理',
      radiation: '辐射防护'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      schedule: 'bg-blue-100 text-blue-700',
      safety: 'bg-red-100 text-red-700',
      quality: 'bg-green-100 text-green-700',
      cost: 'bg-yellow-100 text-yellow-700',
      radiation: 'bg-purple-100 text-purple-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      schedule: <Target size={20} />,
      safety: <Shield size={20} />,
      quality: <CheckCircle size={20} />,
      cost: <DollarSign size={20} />,
      radiation: <Radio size={20} />
    };
    return icons[category] || <FileText size={20} />;
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重'
    };
    return labels[severity] || severity;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const statistics = useMemo(() => {
    const total = lessons.length;
    const verified = lessons.filter(l => l.status === 'verified').length;
    const inProgress = lessons.filter(l => l.status === 'in_progress').length;
    const closed = lessons.filter(l => l.status === 'closed').length;
    const critical = lessons.filter(l => l.severity === 'critical').length;
    const high = lessons.filter(l => l.severity === 'high').length;
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    return { total, verified, inProgress, closed, critical, high, verificationRate };
  }, [lessons]);

  const uniqueOutages = useMemo(() => {
    const outageMap = new Map<string, string>();
    lessons.forEach(l => outageMap.set(l.outageId, l.outageName));
    return Array.from(outageMap.entries()).map(([id, name]) => ({ id, name }));
  }, [lessons]);

  const maxDuration = Math.max(...comparisonData.map(d => d.duration), 1);
  const maxDose = Math.max(...comparisonData.map(d => d.totalDose), 1);
  const maxTasks = Math.max(...comparisonData.map(d => d.totalTasks), 1);
  const maxCost = Math.max(...comparisonData.map(d => d.cost), 1);

  const getTrendIcon = (index: number, dataKey: keyof typeof comparisonData[0], isBetterHigher: boolean) => {
    if (index === 0) return <Minus size={14} className="text-gray-400" />;
    const current = comparisonData[index][dataKey] as number;
    const previous = comparisonData[index - 1][dataKey] as number;
    const diff = current - previous;
    if (diff === 0) return <Minus size={14} className="text-gray-400" />;
    const isImproved = isBetterHigher ? diff > 0 : diff < 0;
    return isImproved 
      ? <TrendingUp size={14} className="text-green-500" /> 
      : <TrendingDown size={14} className="text-red-500" />;
  };

  const handleVerifyLesson = () => {
    if (selectedLesson) {
      updateLesson(selectedLesson.id, { status: 'verified', closedDate: new Date().toISOString().split('T')[0] });
      setSelectedLesson(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">经验反馈管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理历史大修经验教训，持续改进大修管理水平</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="经验总数"
          value={statistics.total}
          icon={BookOpen}
          color="#0D47A1"
        />
        <DataCard
          title="已验证"
          value={statistics.verified}
          icon={CheckCircle}
          color="#10B981"
          trend={{ value: statistics.verificationRate, isUp: true, suffix: '%' }}
        />
        <DataCard
          title="处理中"
          value={statistics.inProgress}
          icon={Clock}
          color="#E65100"
        />
        <DataCard
          title="严重问题"
          value={statistics.critical}
          icon={AlertTriangle}
          color="#EF4444"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'lessons', label: '经验库', icon: Lightbulb },
            { key: 'comparison', label: '大修对比', icon: BarChart3 },
            { key: 'statistics', label: '分类统计', icon: PieChartIcon }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as TabMode)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === item.key
                    ? 'border-[#0D47A1] text-[#0D47A1] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索经验标题或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={selectedOutageId}
                    onChange={(e) => setSelectedOutageId(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部大修</option>
                    {uniqueOutages.map(outage => (
                      <option key={outage.id} value={outage.id}>{outage.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部分类</option>
                    <option value="schedule">进度管理</option>
                    <option value="safety">安全管理</option>
                    <option value="quality">质量管理</option>
                    <option value="cost">成本管理</option>
                    <option value="radiation">辐射防护</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部严重程度</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部状态</option>
                    <option value="open">待处理</option>
                    <option value="in_progress">处理中</option>
                    <option value="closed">已关闭</option>
                    <option value="verified">已验证</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所属大修</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报告人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报告日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLessons.map(lesson => (
                      <tr key={lesson.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(lesson.severity)}`}>
                            {getSeverityLabel(lesson.severity)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{lesson.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(lesson.category)}`}>
                            {getCategoryLabel(lesson.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lesson.outageName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lesson.reportedBy}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(lesson.reportDate)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lesson.status} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLesson(lesson)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="查看详情"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-6">历次大修关键指标对比</h3>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-3">大修工期（天）</p>
                    <div className="space-y-4">
                      {comparisonData.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.outageName}</span>
                            <span className="flex items-center gap-1">
                              {item.duration}天
                              {getTrendIcon(index, 'duration', false)}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0D47A1] rounded-full transition-all"
                              style={{ width: `${(item.duration / maxDuration) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3">集体剂量（人·mSv）</p>
                    <div className="space-y-4">
                      {comparisonData.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.outageName}</span>
                            <span className="flex items-center gap-1">
                              {item.totalDose}
                              {getTrendIcon(index, 'totalDose', false)}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${(item.totalDose / maxDose) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3">任务总数</p>
                    <div className="space-y-4">
                      {comparisonData.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.outageName}</span>
                            <span className="flex items-center gap-1">
                              {item.totalTasks}
                              {getTrendIcon(index, 'totalTasks', true)}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${(item.totalTasks / maxTasks) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3">大修成本（万元）</p>
                    <div className="space-y-4">
                      {comparisonData.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.outageName}</span>
                            <span className="flex items-center gap-1">
                              {item.cost}
                              {getTrendIcon(index, 'cost', false)}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-full transition-all"
                              style={{ width: `${(item.cost / maxCost) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大修名称</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">工期（天）</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">集体剂量</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">任务总数</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">延误任务</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">质量合格率</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">成本（万元）</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">经验数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comparisonData.map((item, index) => {
                      const outageLessons = uniqueOutages.find(o => item.outageName.includes(o.name.split('年')[1])) 
                        ? getLessonsByOutage(uniqueOutages.find(o => item.outageName.includes(o.name.split('年')[1]))!.id)
                        : [];
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.outageName}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.duration}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.totalDose}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.totalTasks}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              item.delayedTasks === 0 ? 'bg-green-100 text-green-700' :
                              item.delayedTasks <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.delayedTasks}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.qualityPassRate}%</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.cost}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{outageLessons.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-5 gap-4">
                {categoryStats.map(stat => (
                  <div key={stat.category} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(stat.category)}`}>
                        {getCategoryIcon(stat.category)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">分类占比</h3>
                  <div className="space-y-4">
                    {categoryStats.map(stat => {
                      const total = categoryStats.reduce((sum, s) => sum + s.count, 0);
                      const percentage = Math.round((stat.count / total) * 100);
                      return (
                        <div key={stat.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getCategoryColor(stat.category).replace('text-', 'bg-').split(' ')[0]}`} />
                              <span className="text-sm text-gray-700">{stat.label}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800">{stat.count} ({percentage}%)</span>
                          </div>
                          <ProgressBar
                            value={percentage}
                            color={stat.category === 'schedule' ? '#0D47A1' :
                                   stat.category === 'safety' ? '#EF4444' :
                                   stat.category === 'quality' ? '#10B981' :
                                   stat.category === 'cost' ? '#F59E0B' : '#8B5CF6'}
                            height="8px"
                            showLabel={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">严重程度分布</h3>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(severity => {
                      const count = lessons.filter(l => l.severity === severity).length;
                      const total = lessons.length;
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={severity} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity).replace('text-', 'bg-').split(' ')[0]}`} />
                              <span className="text-sm text-gray-700">{getSeverityLabel(severity)}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800">{count} ({percentage}%)</span>
                          </div>
                          <ProgressBar
                            value={percentage}
                            color={severity === 'critical' ? '#EF4444' :
                                   severity === 'high' ? '#E65100' :
                                   severity === 'medium' ? '#F59E0B' : '#6B7280'}
                            height="8px"
                            showLabel={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">按大修分类统计</h3>
                <div className="grid grid-cols-3 gap-4">
                  {uniqueOutages.map(outage => {
                    const outageLessons = getLessonsByOutage(outage.id);
                    const verifiedCount = outageLessons.filter(l => l.status === 'verified').length;
                    const rate = outageLessons.length > 0 ? Math.round((verifiedCount / outageLessons.length) * 100) : 0;
                    return (
                      <div key={outage.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-800">{outage.name}</h4>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">经验数</p>
                            <p className="text-xl font-bold text-gray-800">{outageLessons.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">已验证</p>
                            <p className="text-xl font-bold text-green-600">{verifiedCount}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">验证率</span>
                            <span className="font-medium text-gray-800">{rate}%</span>
                          </div>
                          <ProgressBar
                            value={rate}
                            color={rate >= 90 ? '#10B981' : rate >= 70 ? '#F59E0B' : '#EF4444'}
                            height="6px"
                            showLabel={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(selectedLesson.category)}`}>
                  {getCategoryIcon(selectedLesson.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedLesson.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(selectedLesson.category)}`}>
                      {getCategoryLabel(selectedLesson.category)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(selectedLesson.severity)}`}>
                      {getSeverityLabel(selectedLesson.severity)}
                    </span>
                    <StatusBadge status={selectedLesson.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">所属大修</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLesson.outageName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">报告人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLesson.reportedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">报告日期</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(selectedLesson.reportDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">关闭日期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLesson.closedDate ? formatDate(selectedLesson.closedDate) : '-'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">问题描述</p>
                <p className="text-sm text-gray-800">{selectedLesson.description}</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="text-xs font-medium text-red-700">根本原因分析</p>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{selectedLesson.rootCause}</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <p className="text-xs font-medium text-yellow-700">纠正措施</p>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{selectedLesson.correctiveAction}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={16} className="text-green-600" />
                  <p className="text-xs font-medium text-green-700">预防措施</p>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{selectedLesson.preventiveAction}</p>
              </div>

              {selectedLesson.status === 'in_progress' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleVerifyLesson}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    标记为已验证
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function PieChartIcon(props: { size?: number }) {
  return <BarChart3 size={props.size || 16} />;
}
