import React, { useState, useMemo } from 'react';
import { useDosimetryStore } from '@/store/dosimetryStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DoseGauge } from '@/components/DoseGauge';
import { ProgressBar } from '@/components/ProgressBar';
import { RadiationPermit, DoseRecord, Alert } from '@/types';
import {
  Radio,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MapPin,
  Clock,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Activity,
  AlertCircle,
  Bell,
  Layers
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { formatDose, getPermitTypeLabel, getPermitTypeColor, getStatusLabel
} from '@/utils/format';

type TabMode = 'monitoring' | 'permits' | 'alerts' | 'areas';

export const Dosimetry: React.FC = () => {
  const {
    doseRecords,
    permits,
    alerts,
    areaDoseData,
    doseTrendData,
    updatePermitStatus,
    markAlertRead,
    getActivePermits
  } = useDosimetryStore();

  const [activeTab, setActiveTab] = useState<TabMode>('monitoring');
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<RadiationPermit | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const activePermits = getActivePermits();
  const unreadAlerts = alerts.filter(a => !a.read);
  const highDoseWorkers = useMemo(() => {
    const workerDoses = new Map<string, { name: string; cumulative: number; daily: number; }>();
    doseRecords.forEach(record => {
      const existing = workerDoses.get(record.workerId);
      if (!existing || record.cumulativeDose > existing.cumulative) {
        workerDoses.set(record.workerId, {
          name: record.workerName,
          cumulative: record.cumulativeDose,
          daily: record.dailyDose
        });
      }
    });
    return Array.from(workerDoses.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cumulative - a.cumulative);
  }, [doseRecords]);

  const totalDoseToday = useMemo(() => {
    const todayRecords = doseRecords.filter(r => r.date === '2026-06-15');
    return todayRecords.reduce((sum, r) => sum + r.dailyDose, 0);
  }, [doseRecords]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-red-500" />;
      case 'down':
        return <TrendingDown size={14} className="text-green-500" />;
      default:
        return <Minus size={14} className="text-gray-500" />;
    }
  };

  const handleApprovePermit = (permitId: string) => {
    updatePermitStatus(permitId, 'approved', '当前用户');
  };

  const handleRevokePermit = (permitId: string) => {
    updatePermitStatus(permitId, 'revoked', '当前用户');
  };

  const workerDoseHistory = useMemo(() => {
    if (!selectedWorker) return [];
    return doseRecords
      .filter(r => r.workerId === selectedWorker)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedWorker, doseRecords]);

  const selectedWorkerData = useMemo(() => {
    if (!selectedWorker) return null;
    return highDoseWorkers.find(w => w.id === selectedWorker);
  }, [selectedWorker, highDoseWorkers]);

  const maxTrendDose = Math.max(...doseTrendData.map(d => d.totalDose));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">辐射剂量管理</h1>
          <p className="text-sm text-gray-500 mt-1">监控个人剂量、管理辐射工作许可</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="今日总剂量"
          value={formatDose(totalDoseToday)}
          icon={Radio}
          color="#0D47A1"
          trend={{ value: 8.5, isUp: false }}
        />
        <DataCard
          title="工作人员"
          value={highDoseWorkers.length}
          icon={Users}
          color="#10B981"
        />
        <DataCard
          title="有效许可"
          value={activePermits.length}
          icon={FileCheck}
          color="#8B5CF6"
        />
        <DataCard
          title="未读告警"
          value={unreadAlerts.length}
          icon={Bell}
          color="#EF4444"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'monitoring', label: '剂量监控', icon: Activity },
            { key: 'permits', label: '工作许可', icon: FileCheck },
            { key: 'alerts', label: '告警中心', icon: AlertCircle },
            { key: 'areas', label: '区域监测', icon: MapPin }
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
                {item.key === 'alerts' && unreadAlerts.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {highDoseWorkers.slice(0, 3).map((worker, index) => (
                  <div
                    key={worker.id}
                    className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                      selectedWorker === worker.id
                        ? 'border-[#0D47A1] bg-blue-50'
                        : 'border-gray-200 hover:border-[#0D47A1]'
                    }`}
                    onClick={() => setSelectedWorker(selectedWorker === worker.id ? null : worker.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-800">{worker.name}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                              最高
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">累计剂量排名 #{index + 1}</p>
                      </div>
                      <DoseGauge
                        value={worker.cumulative}
                        max={20}
                        size={80}
                        warningThreshold={10}
                        dangerThreshold={15}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">日剂量</p>
                        <p className="text-sm font-semibold text-gray-800">{formatDose(worker.daily)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">年限值</p>
                        <p className="text-sm font-semibold text-gray-800">20 mSv</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        value={(worker.cumulative / 20) * 100}
                        color={worker.cumulative > 15 ? '#EF4444' : worker.cumulative > 10 ? '#E65100' : '#10B981'}
                        height="6px"
                        showLabel={false}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>已使用 {((worker.cumulative / 20) * 100).toFixed(1)}%</span>
                        <span>剩余 {(20 - worker.cumulative).toFixed(2)} mSv</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedWorker && selectedWorkerData && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    {selectedWorkerData.name} - 剂量历史记录
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日剂量</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累计剂量</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作区域</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作类型</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {workerDoseHistory.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{record.date}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${
                                record.dailyDose > 0.7 ? 'text-red-600' : 'text-gray-800'
                              }`}>
                                {formatDose(record.dailyDose)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${
                                record.cumulativeDose > 15 ? 'text-red-600' : record.cumulativeDose > 10 ? 'text-orange-600' : 'text-gray-800'
                              }`}>
                                {formatDose(record.cumulativeDose)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{record.area}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{record.workType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-800 mb-4">剂量趋势</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-end gap-2 h-48">
                    {doseTrendData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-[#0D47A1] rounded-t transition-all hover:bg-[#1565C0]"
                          style={{ height: `${(item.totalDose / maxTrendDose) * 100}%` }}
                          title={`${item.date}: ${formatDose(item.totalDose)}, ${item.workerCount}人`}
                        />
                        <span className="text-xs text-gray-500 mt-2">{item.date}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-sm text-gray-500">
                    <span>总集体剂量: {formatDose(doseTrendData.reduce((sum, d) => sum + d.totalDose, 0))}</span>
                    <span>今日: {formatDose(totalDoseToday)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-4">所有人员剂量</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日剂量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累计剂量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年限值</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用比例</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {highDoseWorkers.map((worker, index) => (
                        <tr
                          key={worker.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedWorker(selectedWorker === worker.id ? null : worker.id)}
                        >
                          <td className="px-4 py-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              index === 0 ? 'bg-red-100 text-red-700' :
                              index === 1 ? 'bg-orange-100 text-orange-700' :
                              index === 2 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{worker.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDose(worker.daily)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${
                              worker.cumulative > 15 ? 'text-red-600' :
                              worker.cumulative > 10 ? 'text-orange-600' : 'text-gray-800'
                            }`}>
                              {formatDose(worker.cumulative)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">20 mSv</td>
                          <td className="px-4 py-3 w-40">
                            <ProgressBar
                              value={(worker.cumulative / 20) * 100}
                              color={worker.cumulative > 15 ? '#EF4444' : worker.cumulative > 10 ? '#E65100' : '#10B981'}
                              height="6px"
                              showLabel={false}
                            />
                            <span className="text-xs text-gray-500">{((worker.cumulative / 20) * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3">
                            {worker.cumulative > 15 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                <AlertTriangle size={12} /> 超限预警
                              </span>
                            ) : worker.cumulative > 10 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                <AlertCircle size={12} /> 接近限值
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                <CheckCircle size={12} /> 正常
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permits' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">许可证号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作区域</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作内容</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剂量限值</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审批人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {permits.map(permit => (
                      <tr key={permit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{permit.permitNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{permit.workerName}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 text-xs font-medium text-white rounded"
                            style={{ backgroundColor: getPermitTypeColor(permit.type) }}
                          >
                            {getPermitTypeLabel(permit.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{permit.area}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{permit.workContent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{permit.doseLimit} mSv</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {permit.issueDate} ~ {permit.expireDate}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={permit.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{permit.approver || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {permit.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprovePermit(permit.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="批准"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleRevokePermit(permit.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="拒绝"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            {permit.status === 'active' && (
                              <button
                                onClick={() => handleRevokePermit(permit.id)}
                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                title="撤销"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedPermit(permit)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="查看详情"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>暂无告警信息</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      !alert.read ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => {
                      if (!alert.read) markAlertRead(alert.id);
                      setSelectedAlert(alert);
                    }}
                  >
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {alert.severity === 'danger' ? (
                        <ShieldAlert size={20} className="text-red-600" />
                      ) : (
                        <AlertTriangle size={20} className="text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          alert.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.severity === 'danger' ? '严重' : '警告'}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-800 mt-2">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{alert.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'areas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {areaDoseData.map(area => (
                  <div key={area.area} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-[#0D47A1]" />
                        <span className="font-medium text-gray-800">{area.area}</span>
                      </div>
                      {getTrendIcon(area.trend)}
                    </div>
                    <div className="flex items-center gap-4">
                      <DoseGauge
                        value={area.currentDose}
                        max={area.limit}
                        size={70}
                        warningThreshold={area.limit * 0.6}
                        dangerThreshold={area.limit * 0.8}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">当前剂量率</span>
                          <span className="font-medium text-gray-800">{area.currentDose} μSv/h</span>
                        </div>
                        <ProgressBar
                          value={(area.currentDose / area.limit) * 100}
                          color={area.currentDose > area.limit * 0.8 ? '#EF4444' : area.currentDose > area.limit * 0.6 ? '#E65100' : '#10B981'}
                          height="6px"
                          showLabel={false}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>限值: {area.limit} μSv/h</span>
                          <span>{((area.currentDose / area.limit) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">辐射工作许可详情</h3>
              <button
                onClick={() => setSelectedPermit(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800">{selectedPermit.permitNumber}</span>
                <span
                  className="px-3 py-1 text-sm font-medium text-white rounded"
                  style={{ backgroundColor: getPermitTypeColor(selectedPermit.type) }}
                >
                  {getPermitTypeLabel(selectedPermit.type)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">申请人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.workerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedPermit.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">工作区域</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.area}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">剂量限值</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.doseLimit} mSv</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">工作内容</p>
                <p className="text-sm text-gray-800 mt-1">{selectedPermit.workContent}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">颁发日期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.issueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">有效期至</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.expireDate}</p>
                </div>
              </div>
              {selectedPermit.approver && (
                <div>
                  <p className="text-xs text-gray-500">审批人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedPermit.approver}</p>
                </div>
              )}
              {selectedPermit.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleApprovePermit(selectedPermit.id);
                      setSelectedPermit(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    批准
                  </button>
                  <button
                    onClick={() => {
                      handleRevokePermit(selectedPermit.id);
                      setSelectedPermit(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} />
                    拒绝
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">告警详情</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  selectedAlert.severity === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {selectedAlert.severity === 'danger' ? (
                    <ShieldAlert size={24} className="text-red-600" />
                  ) : (
                    <AlertTriangle size={24} className="text-yellow-600" />
                  )}
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                    selectedAlert.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedAlert.severity === 'danger' ? '严重告警' : '警告'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{selectedAlert.timestamp}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800">{selectedAlert.message}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    markAlertRead(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-[#0D47A1] text-white rounded-md hover:bg-[#1565C0] transition-colors"
                >
                  标记已读
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
