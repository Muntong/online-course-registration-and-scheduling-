import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Plus, Trash2, Edit2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const Schedule = () => {
  const { user, token } = useAuthStore();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [realTimeWarning, setRealTimeWarning] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    course: '',
    lecturer: '',
    date: '',
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

  // Real-time conflict checking
  useEffect(() => {
    if (!showModal) {
      setRealTimeWarning('');
      return;
    }

    const hasConflict = schedules.find(s => {
      if (editingId && s._id === editingId) return false; // Ignore self when editing

      const sameDay = newSchedule.date ? s.date === newSchedule.date : s.dayOfWeek === newSchedule.dayOfWeek;
      if (!sameDay) return false;

      const start1 = newSchedule.startTime;
      const end1 = newSchedule.endTime;
      const start2 = s.startTime;
      const end2 = s.endTime;

      const overlaps = start1 < end2 && end1 > start2;
      if (!overlaps) return false;

      return s.room === newSchedule.room || (s.lecturer?._id === newSchedule.lecturer || s.lecturer === newSchedule.lecturer);
    });

    if (hasConflict) {
      const conflictType = hasConflict.room === newSchedule.room ? 'Room' : 'Lecturer';
      const courseTitle = hasConflict.course?.title || 'another course';
      setRealTimeWarning(`Warning: ${conflictType} is already booked for ${courseTitle} during this time.`);
    } else {
      setRealTimeWarning('');
    }
  }, [newSchedule, schedules, showModal, editingId]);

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (!selectedDate) {
      setNewSchedule({ ...newSchedule, date: '' });
      return;
    }
    const dateObj = new Date(selectedDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    setNewSchedule({ ...newSchedule, date: selectedDate, dayOfWeek });
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (realTimeWarning) return; // Prevent submission if there's a conflict
    setError('');
    try {
      const url = editingId ? `/api/schedules/${editingId}` : '/api/schedules';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSchedule)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        fetchSchedules();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleEditClick = (schedule: any) => {
    setNewSchedule({
      course: schedule.course?._id || schedule.course,
      lecturer: schedule.lecturer?._id || schedule.lecturer,
      date: schedule.date || '',
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room
    });
    setEditingId(schedule._id);
    setError('');
    setShowModal(true);
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getNextDateForDay = (dayOfWeek: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(dayOfWeek);
    const today = new Date();
    const currentDay = today.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) {
      distance += 7; // Get next occurrence if the day has passed this week
    }
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + distance);
    return targetDate.toISOString().split('T')[0];
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('schedule-grid');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape mode fits 7 columns better
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text("Weekly Class Schedule", 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save('weekly-schedule.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-paypal-dark">Class Schedule</h1>
          <p className="text-gray-500 mt-2">View your weekly timetable.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-paypal-dark px-4 py-3 rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Download PDF</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setNewSchedule({
                  course: '',
                  lecturer: '',
                  date: '',
                  dayOfWeek: 'Monday',
                  startTime: '09:00',
                  endTime: '10:30',
                  room: ''
                });
                setEditingId(null);
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
      </div>

      <div id="schedule-grid" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-paypal-bg">
          {days.map((day) => (
            <div key={day} className="p-4 text-center font-semibold text-paypal-dark border-r border-gray-100 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[600px] bg-white">
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
                          <div className="flex items-center ml-2 space-x-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditClick(schedule); }}
                              className="text-gray-400 hover:text-paypal-light transition-colors p-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule._id); }}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-paypal-light" />
                        {schedule.date || getNextDateForDay(schedule.dayOfWeek)}
                      </div>
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
            <h2 className="text-2xl font-bold text-paypal-dark mb-6">{editingId ? 'Edit Schedule' : 'Add Schedule'}</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            {realTimeWarning && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm">
                {realTimeWarning}
              </div>
            )}
            <form onSubmit={handleSubmitSchedule} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (Optional)</label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                />
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
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!realTimeWarning}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors shadow-md ${
                    realTimeWarning 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-paypal-light hover:bg-paypal-dark text-white'
                  }`}
                >
                  {editingId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
