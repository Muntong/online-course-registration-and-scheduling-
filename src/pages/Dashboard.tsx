import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const { user, token } = useAuthStore();
  const [statsData, setStatsData] = useState({ courses: 0, users: 0, schedules: 0 });
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, schedulesRes, activitiesRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/schedules', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/activities', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const schedulesData = schedulesRes.ok ? await schedulesRes.json() : [];
        const activitiesData = activitiesRes.ok ? await activitiesRes.json() : [];

        setStatsData({
          users: usersRes.ok ? (await usersRes.json()).length : 0,
          courses: coursesRes.ok ? (await coursesRes.json()).length : 0,
          schedules: schedulesData.length,
        });

        setRecentActivities(activitiesData.slice(0, 5));

        // Sort schedules to find the upcoming ones
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = daysOfWeek[new Date().getDay()];
        const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const sorted = schedulesData.sort((a: any, b: any) => {
          const todayIdx = daysOfWeek.indexOf(today);
          let dayA = daysOfWeek.indexOf(a.dayOfWeek) - todayIdx;
          if (dayA < 0) dayA += 7;
          let dayB = daysOfWeek.indexOf(b.dayOfWeek) - todayIdx;
          if (dayB < 0) dayB += 7;

          // If same day, check if it's already passed today
          if (dayA === 0 && a.startTime < nowTime) dayA += 7;
          if (dayB === 0 && b.startTime < nowTime) dayB += 7;

          if (dayA !== dayB) return dayA - dayB;
          return a.startTime.localeCompare(b.startTime);
        });

        setUpcomingSchedules(sorted.slice(0, 4));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [token]);

  const stats = [
    { title: 'Total Courses', value: statsData.courses.toString(), icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Total Users', value: statsData.users.toString(), icon: Users, color: 'bg-green-500' },
    { title: 'Total Schedules', value: statsData.schedules.toString(), icon: Calendar, color: 'bg-purple-500' },
    { title: 'Completion Rate', value: '94%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-paypal-dark">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back, {user?.name}. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"
            >
              <div className={`${stat.color} p-4 rounded-xl text-white shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-paypal-dark">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-paypal-dark mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-paypal-bg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-paypal-light" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.user?.name || 'Unknown User'} - {activity.action}
                    </p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent activity found.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-paypal-dark mb-6">Upcoming Schedule</h2>
          <div className="space-y-4">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule) => (
                <div key={schedule._id} className="p-4 rounded-xl bg-paypal-bg border border-paypal-light/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-paypal-dark">{schedule.course?.title || 'Unknown Course'}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-white rounded-md text-paypal-light shadow-sm whitespace-nowrap ml-2">
                      {schedule.date ? schedule.date : schedule.dayOfWeek.substring(0, 3)} {schedule.startTime}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {schedule.room}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No upcoming schedules found.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
