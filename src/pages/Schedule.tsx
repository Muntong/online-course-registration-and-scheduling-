import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Plus, Trash2 } from 'lucide-react';

export const Schedule = () => {
  const { user, token } = useAuthStore();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    course: '',
    lecturer: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedules();
    if (user?.role === 'admin') {
      fetchCoursesAndLecturers();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesAndLecturers = async () => {
    try {
      const [coursesRes, lecturersRes] = await Promise.all([
        fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users/lecturers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (coursesRes.ok && lecturersRes.ok) {
        setCourses(await coursesRes.json());
        setLecturers(await lecturersRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSchedule)
      });
      if (res.ok) {
        setShowModal(false);
        fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-paypal-dark">Class Schedule</h1>
          <p className="text-gray-500 mt-2">View your weekly timetable.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setError('');
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-paypal-light hover:bg-paypal-dark text-white px-6 py-3 rounded-xl transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Schedule</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-5 border-b border-gray-100 bg-paypal-bg">
          {days.map((day) => (
            <div key={day} className="p-4 text-center font-semibold text-paypal-dark border-r border-gray-100 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-5 min-h-[600px] bg-white">
          {days.map((day) => (
            <div key={day} className="border-r border-gray-100 last:border-0 p-4 space-y-4">
              {schedules
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((schedule) => (
                  <motion.div
                    key={schedule._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-paypal-bg p-4 rounded-xl border border-paypal-light/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-paypal-dark text-sm leading-tight">
                        {schedule.course?.title || 'Unknown Course'}
                      </h3>
                      <div className="flex items-center">
                        <span className="text-[10px] font-bold px-2 py-1 bg-white text-paypal-light rounded-md shadow-sm whitespace-nowrap ml-2">
                          {schedule.course?.code}
                        </span>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule._id); }}
                            className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-paypal-light" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-paypal-light" />
                        {schedule.room}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <UserIcon className="w-3.5 h-3.5 mr-1.5 text-paypal-light" />
                        {schedule.lecturer?.name || 'TBA'}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-paypal-dark mb-6">Add Schedule</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  required
                  value={newSchedule.course}
                  onChange={(e) => setNewSchedule({ ...newSchedule, course: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none bg-white"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
                <select
                  required
                  value={newSchedule.lecturer}
                  onChange={(e) => setNewSchedule({ ...newSchedule, lecturer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none bg-white"
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  required
                  value={newSchedule.dayOfWeek}
                  onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none bg-white"
                >
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  required
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  placeholder="e.g. Room 101"
                />
              </div>
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-paypal-light hover:bg-paypal-dark text-white rounded-xl font-semibold transition-colors shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
