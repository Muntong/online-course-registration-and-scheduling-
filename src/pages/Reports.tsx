import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { BarChart3, Users, BookOpen, Calendar } from 'lucide-react';

export const Reports = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, courses: 0, schedules: 0, departments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes, schedulesRes, deptsRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats({
        users: usersRes.ok ? (await usersRes.json()).length : 0,
        courses: coursesRes.ok ? (await coursesRes.json()).length : 0,
        schedules: schedulesRes.ok ? (await schedulesRes.json()).length : 0,
        departments: deptsRes.ok ? (await deptsRes.json()).length : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-paypal-dark">Reports & Analytics</h1>
        <p className="text-gray-500 mt-2">Overview of system statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.users}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Courses</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.courses}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Schedules</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.schedules}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Departments</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.departments}</h3>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
