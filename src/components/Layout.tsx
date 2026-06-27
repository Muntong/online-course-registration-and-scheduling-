import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, Calendar, Users, LogOut, LayoutDashboard, FileEdit, School, Clock, BarChart3, Key, BarChart2 } from 'lucide-react';
import { Notifications } from './Notifications';
import { Chatbot } from './Chatbot';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: user?.role === 'admin' ? 'Overview' : 'Dashboard', icon: user?.role === 'admin' ? BarChart2 : LayoutDashboard, roles: ['admin', 'student', 'lecturer'] },
    { path: '/courses', label: user?.role === 'admin' ? 'Manage Courses' : 'Courses', icon: BookOpen, roles: ['admin', 'student', 'lecturer'] },
    { path: '/enrollments', label: 'Enrollment Management', icon: FileEdit, roles: ['admin'] },
    { path: '/users', label: 'Manage Users', icon: Users, roles: ['admin'] },
    { path: '/faculties', label: 'Faculties & Departments', icon: School, roles: ['admin'] },
    { path: '/schedule', label: user?.role === 'admin' ? 'Full Scheduling System' : 'Schedule', icon: user?.role === 'admin' ? Clock : Calendar, roles: ['admin', 'student', 'lecturer'] },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin'] },
    { path: '/password', label: 'Change Password', icon: Key, roles: ['admin', 'student', 'lecturer'] },
  ];

  return (
    <div className="flex h-screen bg-paypal-bg">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-paypal-dark text-white flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-paypal-light" />
          <span className="text-xl font-bold tracking-tight">EduSync</span>
        </div>
        
        <div className="px-6 py-4 border-b border-paypal-accent/50">
          <p className="text-sm text-gray-300">Welcome,</p>
          <p className="font-semibold truncate">{user?.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-paypal-light/20 text-paypal-light rounded text-xs uppercase tracking-wider font-medium">
            {user?.role}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(user?.role || '')).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-paypal-light text-white' 
                    : 'text-gray-300 hover:bg-paypal-accent hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-paypal-accent/50">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
          <h2 className="text-xl font-bold text-gray-800">
            {navItems.find(item => item.path === location.pathname)?.label || 'EduSync'}
          </h2>
          <div className="flex items-center space-x-4">
            <Notifications />
            <div className="w-10 h-10 rounded-full bg-paypal-light/10 flex items-center justify-center text-paypal-dark font-bold border border-paypal-light/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
        <Chatbot />
      </main>
    </div>
  );
};
