import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'motion/react';
import { BookOpen, Users, Plus, Trash2, CheckCircle, Edit } from 'lucide-react';

export const Courses = () => {
  const { user, token } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', code: '', description: '', credits: 3, maxCapacity: 30, lecturer: '' });
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedCourseStudents, setSelectedCourseStudents] = useState<any[]>([]);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'admin') {
      fetchLecturers();
    }
  }, [user]);

  const fetchLecturers = async () => {
    try {
      const res = await fetch('/api/users/lecturers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLecturers(await res.json());
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCourseId ? `/api/courses/${editingCourseId}` : '/api/courses';
      const method = editingCourseId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCourse)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingCourseId(null);
        setNewCourse({ title: '', code: '', description: '', credits: 3, maxCapacity: 30, lecturer: '' });
        fetchCourses();
      }
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEditCourse = (course: any) => {
    setNewCourse({
      title: course.title,
      code: course.code,
      description: course.description,
      credits: course.credits,
      maxCapacity: course.maxCapacity,
      lecturer: course.lecturer?._id || ''
    });
    setEditingCourseId(course._id);
    setShowModal(true);
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const handleDrop = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/drop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error dropping:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const handleViewStudents = async (courseId: string, courseTitle: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourseStudents(data);
        setSelectedCourseTitle(courseTitle);
        setShowStudentsModal(true);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading courses...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-paypal-dark">Course Catalog</h1>
          <p className="text-gray-500 mt-2">Browse and manage your courses.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingCourseId(null);
              setNewCourse({ title: '', code: '', description: '', credits: 3, maxCapacity: 30, lecturer: '' });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-paypal-light hover:bg-paypal-dark text-white px-6 py-3 rounded-xl transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Course</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isEnrolled = course.studentsEnrolled?.includes(user?.id);
          const isFull = course.studentsEnrolled?.length >= course.maxCapacity;

          return (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-paypal-bg rounded-xl flex items-center justify-center text-paypal-light">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold tracking-wider">
                    {course.code}
                  </span>
                  {user?.role === 'admin' && (
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditCourse(course)}
                        className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course._id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-paypal-dark mb-2">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-3">{course.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6 pt-4 border-t border-gray-50">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{course.studentsEnrolled?.length || 0} / {course.maxCapacity}</span>
                </div>
                <div className="font-medium text-paypal-dark">{course.credits} Credits</div>
              </div>

              {user?.role === 'lecturer' && course.lecturer?._id === user?.id && (
                <button
                  onClick={() => handleViewStudents(course._id, course.title)}
                  className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 bg-paypal-light/10 text-paypal-dark hover:bg-paypal-light/20 border border-paypal-light/20"
                >
                  <Users className="w-4 h-4" />
                  <span>View Students</span>
                </button>
              )}

              {user?.role === 'student' && (
                <button
                  onClick={() => isEnrolled ? handleDrop(course._id) : handleEnroll(course._id)}
                  disabled={!isEnrolled && isFull}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                    isEnrolled
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                      : isFull
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-paypal-light hover:bg-paypal-dark text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Drop Course</span>
                    </>
                  ) : isFull ? (
                    <span>Course Full</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Enroll Now</span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-paypal-dark mb-6">
              {editingCourseId ? 'Edit Course' : 'Create New Course'}
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
                <select
                  required
                  value={newCourse.lecturer}
                  onChange={(e) => setNewCourse({ ...newCourse, lecturer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none bg-white"
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input
                    type="number"
                    required
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={newCourse.maxCapacity}
                    onChange={(e) => setNewCourse({ ...newCourse, maxCapacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-paypal-light outline-none"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourseId(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-paypal-light hover:bg-paypal-dark text-white rounded-xl font-semibold transition-colors shadow-md"
                >
                  {editingCourseId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-paypal-dark">
                Students in {selectedCourseTitle}
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {selectedCourseStudents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No students enrolled in this course yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourseStudents.map((student, idx) => (
                    <div key={student._id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-paypal-light/10 flex items-center justify-center text-paypal-dark font-bold">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowStudentsModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
