import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Radiation,
  Wrench,
  ShieldCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  User,
  AlertTriangle
} from 'lucide-react';
import { useDosimetryStore } from '@/store/dosimetryStore';
import { getSeverityColor } from '@/utils/format';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '大修计划', icon: LayoutDashboard },
  { path: '/schedule', label: '工序排程', icon: Calendar },
  { path: '/access', label: '人员准入', icon: Users },
  { path: '/dosimetry', label: '辐射剂量', icon: Radiation },
  { path: '/maintenance', label: '设备检修', icon: Wrench },
  { path: '/quality', label: '质量验收', icon: ShieldCheck },
  { path: '/experience', label: '经验反馈', icon: BookOpen },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { alerts, markAlertRead } = useDosimetryStore();

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`bg-[#0D47A1] text-white transition-all duration-300 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Radiation className="text-[#0D47A1]" size={24} />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg">换料大修</h1>
                <p className="text-xs text-blue-200">管理系统</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-700 border-r-4 border-orange-500'
                    : 'hover:bg-blue-800'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 border-t border-blue-800 hover:bg-blue-800 transition-colors flex justify-center"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(n => n.path === location.pathname)?.label || '系统'}
            </h2>
            <p className="text-xs text-gray-500">2026年#1机组第8次换料大修</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">通知中心</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        暂无通知
                      </div>
                    ) : (
                      alerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !alert.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markAlertRead(alert.id)}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              size={16}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: getSeverityColor(alert.severity) }}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">{alert.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings size={20} className="text-gray-600" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 bg-[#0D47A1] rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">管理员</p>
                <p className="text-xs text-gray-500">大修经理</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
